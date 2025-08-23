const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Serve React build
// app.use(express.static(path.join(__dirname, "client", "build")));

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// Job Schema
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
    enum: ["job", "internship"], // ✅ Only allow Job or Internship
    default: "job"
  },
  postedAt: { type: Date, default: Date.now },
});

const Job = mongoose.model("Job", jobSchema);


// Routes
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

// Fallback for React frontend routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

// Start server
app.listen(5000, () =>
  console.log("🚀 Server is running on http://localhost:5000")
);
