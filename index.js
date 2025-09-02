const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { IncomingForm } = require("formidable");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PDFDocument = require("pdfkit");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ================== MongoDB Connection ==================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// ================== Job Schema ==================
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  description: String,
  location: String,
  isWFH: Boolean,
  tags: [String],
  applyUrl: String,
  type: {
    type: String,
    enum: ["job", "internship"],
    default: "job",
  },
  postedAt: { type: Date, default: Date.now },
});
const Job = mongoose.model("Job", jobSchema);

// ================== API Routes ==================
app.get("/api/jobs", async (req, res) => {
  const jobs = await Job.find().sort({ postedAt: -1 });
  res.json(jobs);
});

app.post("/api/jobs", async (req, res) => {
  const newJob = new Job(req.body);
  await newJob.save();
  res.json(newJob);
});

app.get("/api/jobs/:id", async (req, res) => {
  const job = await Job.findById(req.params.id);
  res.json(job);
});

app.post("/api/resume-checker", (req, res) => {
  const form = new IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "File upload failed" });

    const jobDesc = fields.jobDesc || "";
    let resumeText = "";

    try {
      if (files.resume) {
        const filePath = files.resume.filepath || files.resume[0]?.filepath;
        if (!filePath) throw new Error("Resume file not found");

        const buffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(buffer);
        resumeText = pdfData.text;
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are an ATS (Applicant Tracking System) expert.
        Analyze this resume for ATS-friendliness.

        Resume: ${resumeText}
        Job Description: ${jobDesc}

        Respond with only valid JSON.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let feedback;

      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        feedback = { score: 0, issues: ["AI did not return JSON"], suggestions: [] };
      }

      res.json(feedback);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "AI request failed" });
    }
  });
});
// Fallback for React frontend routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});




// ================== Start Server ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
