// ================== Imports ==================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { IncomingForm } = require("formidable");
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

// ================ Trust Proxy =================
app.set('trust proxy', 1); // Needed if behind proxy (Railway) for correct rate-limiting

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

// Get single job by ID
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
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

// ✅ Subscribe (without email)
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.status(400).json({ error: "Already subscribed" });

    await new Subscriber({ email }).save();

    // Email sending removed

    res.json({ message: "✅ Subscribed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Subscription failed" });
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
