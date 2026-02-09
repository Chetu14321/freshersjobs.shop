// ================== Imports ==================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { IncomingForm } = require("formidable");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const authRoutes = require("./auth");
const NodeCache = require("node-cache");

dotenv.config();

// ================== App ==================
const app = express();
app.set("trust proxy", 1);

// ================== Cache ==================
const jobCache = new NodeCache({ stdTTL: 60 });

// ================== CORS ==================
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://freshersjobs.shop",
  "https://www.freshersjobs.shop",
];

app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("CORS not allowed")),
    credentials: true,
  })
);

// ================== Middlewares ==================
app.use(express.json());
app.use(cookieParser());
app.use(compression());
app.use(passport.initialize());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

// ================== Helmet ==================
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "https://lh3.googleusercontent.com"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://accounts.google.com",
          "https://apis.google.com",
        ],
        "frame-src": ["'self'", "https://accounts.google.com"],
        "connect-src": [
          "'self'",
          "https://freshersjobs-shop.onrender.com",
          "https://accounts.google.com",
        ],
      },
    },
  })
);

// ================== MongoDB ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ================== Schema ==================
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

  slug: { type: String, unique: true, index: true },

  postedAt: { type: Date, default: Date.now },
  role: String,
  qualification: String,
  batch: String,
  experience: String,
  salary: String,
  lastDate: Date,
});

// ================== Indexes ==================
jobSchema.index({ postedAt: -1 });
jobSchema.index({ type: 1 });

// ================== Slug Generator ==================
jobSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();
  }
  next();
});

const Job = mongoose.model("Job", jobSchema);

// ================== Auth ==================
app.use("/auth", authRoutes);

// ================== Health ==================
app.get("/api/ping", (_, res) =>
  res.status(200).send("Server is running")
);

// ================== GET JOBS ==================
app.get("/api/jobs", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 9, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;

    const cacheKey = `jobs:${page}:${limit}:${req.query.type || "all"}`;
    const cached = jobCache.get(cacheKey);
    if (cached) return res.status(200).json(cached);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ postedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(filter),
    ]);

    const response = {
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      jobs,
    };

    jobCache.set(cacheKey, response);
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ================== SINGLE JOB (FIXED) ==================
app.get("/api/jobs/:slug", async (req, res) => {
  try {
    const job = await Job.findOne({ slug: req.params.slug }).lean();

    // ❌ Job not found
    if (!job) {
      return res.status(404).json({
        status: "not_found",
        message: "Job not found",
      });
    }

    // ⏳ Job expired
    if (job.lastDate && new Date(job.lastDate) < new Date()) {
      return res.status(410).json({
        status: "expired",
        message: "This job has expired",
      });
    }

    // ✅ Valid job
    return res.status(200).json({
      status: "success",
      job,
    });
  } catch (err) {
    console.error("Job fetch error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// ================== Resume ATS Checker ==================
app.post("/api/resume-checker", (req, res) => {
  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Invalid form data" });

      const resumeFile = Array.isArray(files.resume)
        ? files.resume[0]
        : files.resume;

      if (!resumeFile || !fields.jobDesc) {
        return res.status(400).json({
          error: "Resume and job description are required",
        });
      }

      const buffer = fs.readFileSync(resumeFile.filepath);
      const pdfData = await pdfParse(buffer);

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "models/gemini-1.0-pro",
      });

      const prompt = `
Return ONLY valid JSON:
{
  "ats_score": number,
  "ats_friendliness": "Poor | Average | Good | Excellent",
  "strengths": [string],
  "weaknesses": [string],
  "recommendations": [string]
}
Resume:
${pdfData.text}
Job Description:
${fields.jobDesc}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return res.status(500).json({ error: "AI parsing failed" });
      }

      res.status(200).json(JSON.parse(jsonMatch[0]));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Resume analysis failed" });
    }
  });
});

// ================== Job ID Redirect ==================
app.get("/api/job-by-id/:id", async (req, res) => {
  const job = await Job.findById(req.params.id).select("slug");
  if (!job) return res.status(404).end();
  res.redirect(301, `/jobs/${job.slug}`);
});

// ================== Sitemap (FIXED) ==================
app.get("/sitemap.xml", async (req, res) => {
  try {
    const jobs = await Job.find({
      $or: [
        { lastDate: { $exists: false } },
        { lastDate: { $gte: new Date() } },
      ],
    }).select("slug updatedAt");

    const urls = jobs
      .map(
        (job) => `
<url>
  <loc>https://freshersjobs.shop/jobs/${job.slug}</loc>
  <lastmod>${job.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>
</url>`
      )
      .join("");

    res.header("Content-Type", "application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
  } catch (err) {
    res.status(500).end();
  }
});

// ================== Admin ==================
app.get("/api/admin/clear-cache", (_, res) => {
  jobCache.flushAll();
  res.json({ success: true, message: "Cache cleared" });
});

// ================== Root ==================
app.get("/", (_, res) =>
  res.status(200).send("FreshersJobs Backend Running 🚀")
);

// ================== Start ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
