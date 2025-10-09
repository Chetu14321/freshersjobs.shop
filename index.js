// remove  ai configration  from this code // ================== Imports ==================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { IncomingForm } = require("formidable");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const path = require("path");

// ⚡ PERFORMANCE IMPORTS
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// ✅ Prerender.io middleware
const prerender = require("prerender-node");

// Load .env
dotenv.config();

// ================ Express App =================
const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(compression());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ================ Prerender.io Setup =================
if (!process.env.PRERENDER_TOKEN) {
  console.warn("⚠️ Prerender token not set in .env (PRERENDER_TOKEN)");
}
app.use(prerender.set("prerenderToken", process.env.PRERENDER_TOKEN));

// ================ MongoDB Setup =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ================ Mongoose Schemas =================
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  img: String,
  description: String,
  location: String,
  isWFH: Boolean,
  tags: [String],
  applyUrl: String,
  type: { type: String, enum: ["job", "internship"], default: "job" },
  postedAt: { type: Date, default: Date.now },
  role: String,
  qualification: String,
  batch: String,
  experience: String,
  salary: String,
  lastDate: Date,
});
const Job = mongoose.model("Job", jobSchema);

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
});
const Subscriber = mongoose.model("Subscriber", subscriberSchema);

// ================ Email Setup =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
transporter.verify((err) => {
  if (err) console.error("❌ SMTP Error:", err);
  else console.log("✅ SMTP Server ready");
});

// ================ Gemini AI Setup =================
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "text-bison-001" });

// ================ Routes =================

// Health check
app.get("/api/ping", (req, res) => res.send("✅ Server is running"));

// ✅ API to get jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ postedAt: -1 });
    res.set("Cache-Control", "public, max-age=60");
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Server-rendered HTML for SEO bots
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ postedAt: -1 });

    let jobsHtml = jobs
      .map(
        (job) => `
      <div class="job-card" itemscope itemtype="https://schema.org/JobPosting">
        <h3 itemprop="title">${job.title}</h3>
        <p>
          <span itemprop="hiringOrganization">${job.company}</span> | 
          <span itemprop="jobLocation">${job.location}</span> | 
          ${job.type} | WFH: ${job.isWFH ? "Yes" : "No"}
        </p>
        <p itemprop="description">${job.description || ""}</p>
        <a href="${job.applyUrl}" itemprop="url">Apply Now</a>
      </div>`
      )
      .join("");

    const noscriptFallback = `
      <noscript>
        <h2>Latest Fresher Jobs</h2>
        <ul>
          ${jobs
            .map(
              (job) =>
                `<li>${job.title} at ${job.company} - <a href="${job.applyUrl}">Apply</a></li>`
            )
            .join("")}
        </ul>
      </noscript>
    `;

    res.send(`
      <html>
        <head>
          <title>Freshers Jobs</title>
          <meta name="description" content="Latest Fresher Jobs & Internships">
          <meta name="robots" content="index, follow">
          <link rel="canonical" href="https://freshersjobs.shop/jobs" />
        </head>
        <body>
          <h1>FreshersJobs.shop - Latest Jobs</h1>
          ${jobsHtml}
          ${noscriptFallback}
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading jobs");
  }
});

// ✅ Subscribe
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.status(400).json({ error: "Already subscribed" });

    await new Subscriber({ email }).save();

    await transporter.sendMail({
      from: `"Freshers Jobs" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "🎉 Subscription Confirmed - Freshers Jobs",
      html: `
        <h2>Welcome to FreshersJobs.shop 🚀</h2>
        <p>Thanks for subscribing! You’ll receive daily job updates.</p>
      `,
    });

    res.json({ message: "✅ Subscribed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Subscription failed" });
  }
});

// ✅ Resume Checker
app.post("/api/resume-checker", (req, res) => {
  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "File upload failed" });

    const jobDesc = fields.jobDesc || "";
    let resumeText = "";

    try {
      const filePath = files.resume?.filepath || files.resume?.[0]?.filepath;
      if (!filePath) throw new Error("Resume file not found");

      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;

      const prompt = `
        Analyze this resume compared to the job description.
        Resume: ${resumeText}
        Job Description: ${jobDesc}

        Respond with valid JSON:
        {
          "ats_score": number (0-100),
          "ats_friendliness": "Excellent | Good | Average | Poor",
          "strengths": [list],
          "weaknesses": [list],
          "recommendations": [list]
        }
      `;

      const result = await aiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = result.response.text();
      const json = text.match(/\{[\s\S]*\}/);
      const parsed = json ? JSON.parse(json[0]) : { ats_score: 0, ats_friendliness: "Poor" };

      res.json(parsed);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Resume analysis failed" });
    }
  });
});

// ✅ AI Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    let prompt = Array.isArray(history)
      ? history
          .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
          .join("\n") + `\nUser: ${message}\nAssistant:`
      : `User: ${message}\nAssistant:`;

    const result = await aiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

// ✅ Daily Job Mail Cron
cron.schedule("25 10 * * *", async () => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const jobs = await Job.find({ postedAt: { $gte: since } });
    const subscribers = await Subscriber.find();

    if (!jobs.length || !subscribers.length) return;

    const jobList = jobs
      .map((j) => `<li><a href="${j.applyUrl}">${j.title} at ${j.company}</a></li>`)
      .join("");

    for (let sub of subscribers) {
      await transporter.sendMail({
        from: `"Freshers Jobs" <${process.env.MAIL_USER}>`,
        to: sub.email,
        subject: "🔥 Latest Jobs for Freshers",
        html: `<ul>${jobList}</ul><p>Visit <a href="https://freshersjobs.shop">freshersjobs.shop</a></p>`,
      });
    }

    console.log(`📧 Sent to ${subscribers.length} subscribers`);
  } catch (err) {
    console.error("Cron job error:", err);
  }
});

// ✅ Robots.txt and Sitemap
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *\nAllow: /\nSitemap: https://freshersjobs.shop/sitemap.xml`);
});

app.get("/sitemap.xml", async (req, res) => {
  const jobs = await Job.find().sort({ postedAt: -1 });
  const urls = jobs
    .map((j) => `<url><loc>https://freshersjobs.shop/jobs/${j._id}</loc></url>`)
    .join("");
  res.type("application/xml");
  res.send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("✅ FreshersJobs Backend is running...");
});

// ================ Start Server =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
