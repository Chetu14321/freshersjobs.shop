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
const jwt = require("jsonwebtoken");
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

const Job = mongoose.model("Job", jobSchema);

// ================== AI ==================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "text-bison-001" });

// ================== Auth Routes ==================
app.use("/auth", authRoutes);

// ================== Health ==================
app.get("/api/ping", (_, res) => res.send("Server is running"));

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
    if (cached) return res.json(cached);

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
    res.json(response);
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================== SINGLE JOB ==================
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false });
    res.json({ success: true, job });
  } catch {
    res.status(400).json({ success: false });
  }
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
