// ================== Imports ==================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { IncomingForm } = require("formidable");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const passport = require("passport");
const cookieParser = require("cookie-parser");
const authRoutes = require("./auth");

const prerender = require("prerender-node");
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

// ================== Prerender ==================
if (process.env.PRERENDER_TOKEN) {
  app.use(prerender.set("prerenderToken", process.env.PRERENDER_TOKEN));
}

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

// 🔥 Indexes for speed
jobSchema.index({ postedAt: -1 });
jobSchema.index({ type: 1 });

const Job = mongoose.model("Job", jobSchema);

// ================== Gemini AI ==================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "text-bison-001" });

// ================== Auth Routes ==================
app.use("/auth", authRoutes);

// ================== Health ==================
app.get("/api/ping", (_, res) => res.send("Server is running"));

// ================== Logged User ==================
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

// ================== GET JOBS (PAGINATION + CACHE) ==================
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

    res.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=300"
    );

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================== SINGLE JOB ==================
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job)
      return res.status(404).json({ success: false, message: "Not found" });

    res.set("Cache-Control", "public, max-age=300");
    res.json({ success: true, job });
  } catch {
    res.status(400).json({ success: false, message: "Invalid ID" });
  }
});

// ================== Resume ATS ==================
app.post("/api/resume-checker", (req, res) => {
  const form = new IncomingForm();

  form.parse(req, async (_, fields, files) => {
    try {
      const buffer = fs.readFileSync(files.resume.filepath);
      const pdfData = await pdfParse(buffer);

      const prompt = `
Analyze resume for ATS:
Resume: ${pdfData.text}
Job Description: ${fields.jobDesc}
`;

      const result = await aiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      res.json({ result: result.response.text() });
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

// ================== Robots ==================
app.get("/robots.txt", (_, res) => {
  res.type("text/plain").send(
    "User-agent: *\nAllow: /\nSitemap: https://freshersjobs.shop/sitemap.xml"
  );
});

// ================== Sitemap ==================
app.get("/sitemap.xml", async (_, res) => {
  const jobs = await Job.find().select("_id").lean();
  const urls = jobs
    .map((j) => `<url><loc>https://freshersjobs.shop/jobs/${j._id}</loc></url>`)
    .join("");

  res.type("application/xml").send(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
  );
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
