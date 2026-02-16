
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
const { redisClient } = require("./config/redis");

dotenv.config();

// ================== App ==================
const app = express();
app.set("trust proxy", 1);

// ================== CORS ==================
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5050",
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

jobSchema.index({ postedAt: -1 });
jobSchema.index({ type: 1 });

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

// ================== Gemini AI ==================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const aiModel = genAI.getGenerativeModel({
  model: "models/gemini-1.0-pro",
});

// ================== Auth Routes ==================
app.use("/auth", authRoutes);

// ================== Health ==================
app.get("/api/ping", (_, res) => res.send("Server is running"));

// ================== GET JOBS (REDIS CACHE) ==================
app.get("/api/jobs", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 9, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;

    const cacheKey = `jobs:${page}:${limit}:${req.query.type || "all"}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("⚡ Redis Cache HIT:", cacheKey);
      return res.json(JSON.parse(cached));
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ postedAt: -1 }).skip(skip).limit(limit).lean(),
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

    await redisClient.setEx(cacheKey, 600, JSON.stringify(response));
    console.log("💾 Redis Cache SET:", cacheKey);

    res.set("Cache-Control", "public, max-age=300");
    res.json(response);
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================== SINGLE JOB (REDIS CACHE) ==================
app.get("/api/jobs/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `job:${slug}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("⚡ Redis Cache HIT:", cacheKey);
      return res.json(JSON.parse(cached));
    }

    let job = await Job.findOne({ slug }).lean();

    if (!job && /^[0-9a-fA-F]{24}$/.test(slug)) {
      const jobById = await Job.findById(slug).select("slug").lean();
      if (jobById?.slug) {
        return res.redirect(301, `/jobs/${jobById.slug}`);
      }
    }

    if (!job) {
      return res.status(404).json({ success: false });
    }

    const response = { success: true, job };
    await redisClient.setEx(cacheKey, 600, JSON.stringify(response));

    res.json(response);
  } catch {
    res.status(400).json({ success: false });
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

      const jobDesc = fields.jobDesc;

      if (!resumeFile || !jobDesc || !resumeFile.filepath) {
        return res
          .status(400)
          .json({ error: "Resume and job description are required" });
      }

      const buffer = fs.readFileSync(resumeFile.filepath);
      const pdfData = await pdfParse(buffer);

      const prompt = `
You are an ATS resume analyzer.

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
${jobDesc}
`;

      const result = await aiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return res.status(500).json({ error: "AI parsing failed" });
      }

      res.json(JSON.parse(jsonMatch[0]));
    } catch (error) {
      console.error("ATS Error:", error);
      res.status(500).json({ error: "Resume analysis failed" });
    }
  });
});

// ================== CLEAR REDIS CACHE ==================
app.get("/api/admin/clear-cache", async (req, res) => {
  await redisClient.flushAll();
  res.json({ success: true, message: "Redis cache cleared" });
});

// ================== Root ==================
app.get("/", (_, res) =>
  res.send("FreshersJobs Backend Running 🚀")
);

// ================== Start ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

