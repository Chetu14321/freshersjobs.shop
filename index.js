// ================== Imports ==================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { IncomingForm } = require("formidable");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cron = require("node-cron");
const path = require("path");

const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const passport = require("passport");
const cookieParser = require("cookie-parser");
const authRoutes = require("./auth");

const prerender = require("prerender-node");
dotenv.config();

const jwt = require("jsonwebtoken");

// ================== Express App ==================
const app = express();
app.set("trust proxy", 1);   // 🔥 REQUIRED FOR COOKIES ON RENDER

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);


app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "https://lh3.googleusercontent.com"],
      },
    },
  })
);

app.use(compression());
app.use(cookieParser());
app.use(passport.initialize());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ================== Prerender.io ==================
if (!process.env.PRERENDER_TOKEN) {
  console.warn("⚠️ Prerender token not set in .env");
}
app.use(prerender.set("prerenderToken", process.env.PRERENDER_TOKEN));

// ================== MongoDB ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected.."))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ================== Schemas ==================
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

// ================ Subscribers ================
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
});

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

// ================== Gemini AI ==================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "text-bison-001" });

// ================== Google OAuth ==================
app.use("/auth", authRoutes);

// ================== API ROUTES ==================

// Health check
app.get("/api/ping", (req, res) => res.send("Server is running"));

// Return logged-in user from cookie
app.get("/api/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not logged in" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

// Get all jobs
app.get("/api/jobs", async (req, res) => {
  const jobs = await Job.find().sort({ postedAt: -1 });
  res.set("Cache-Control", "public, max-age=60");
  res.json(jobs);
});

// Get single job
app.get("/api/jobs/:id", async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// ================== Resume ATS ==================
app.post("/api/resume-checker", (req, res) => {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    try {
      const filePath = files.resume?.filepath || files.resume[0]?.filepath;
      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);

      const prompt = `
        Analyze this resume for ATS:
        Resume: ${pdfData.text}
        Job Description: ${fields.jobDesc}
      `;

      const result = await aiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const output = result.response.text();
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : {});
    } catch {
      res.status(500).json({ error: "Resume analysis failed" });
    }
  });
});

// ================== AI Chat ==================
app.post("/api/chat", async (req, res) => {
  try {
    const result = await aiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: req.body.message }] }],
    });

    res.json({ reply: result.response.text() });
  } catch {
    res.status(500).json({ error: "AI failed" });
  }
});

// ================== Robots & Sitemap ==================
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nSitemap: https://freshersjobs.shop/sitemap.xml`
  );
});

app.get("/sitemap.xml", async (req, res) => {
  const jobs = await Job.find().sort({ postedAt: -1 });

  const urls = jobs
    .map(
      (j) =>
        `<url><loc>https://freshersjobs.shop/jobs/${j._id}</loc></url>`
    )
    .join("");

  res.type("application/xml").send(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
  );
});

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send("FreshersJobs Backend Running with Google OAuth 🚀");
});

// ================== Start Server ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
