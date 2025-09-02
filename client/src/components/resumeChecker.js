import React, { useState } from "react";
import axios from "axios";
import { AlertCircle, Lightbulb } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

function ResumeChecker() {
  const [jobDesc, setJobDesc] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => setResume(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume || !jobDesc) return setError("⚠️ Upload resume and enter job description.");

    setError(""); 
    setLoading(true); 
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDesc", jobDesc);

      const response = await axios.post("/api/resume-checker", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(response.data);
    } catch (err) {
      setError("❌ Something went wrong!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (score) =>
    score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-danger";

  return (
    <div className="container mt-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold display-6">📄 ATS Resume Checker</h2>
        <p className="text-muted">Optimize your resume for Applicant Tracking Systems (ATS)</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-4 shadow-lg border-0">
        <div className="mb-3">
          <label className="form-label fw-semibold">Upload Resume (PDF):</label>
          <input type="file" accept="application/pdf" className="form-control" onChange={handleFileChange} />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Job Description:</label>
          <textarea
            rows="5"
            className="form-control"
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Analyzing Resume...
            </>
          ) : (
            "Check Resume"
          )}
        </button>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {loading && (
        <div className="text-center mt-4">
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }}></div>
          <p className="mt-2 text-muted">Checking your resume...</p>
        </div>
      )}

      {result && (
        <div className="mt-4 card p-4 shadow-lg border-0">
          <h4 className="fw-bold text-center mb-3">ATS Score</h4>
          <div className="progress mb-3" style={{ height: "28px" }}>
            <div
              className={`progress-bar progress-bar-striped progress-bar-animated fw-bold ${getProgressColor(result.score)}`}
              style={{ width: `${result.score}%`, boxShadow: "0 0 10px rgba(0,0,0,0.3)" }}
            >
              {result.score} / 100
            </div>
          </div>

          <h5 className="fw-bold mt-3 d-flex align-items-center gap-2">
            <AlertCircle className="text-danger" size={20} /> Issues Found
          </h5>
          {result.issues.length > 0 ? (
            <ul className="list-group list-group-flush mb-3">
              {result.issues.map((issue, i) => (
                <li key={i} className="list-group-item text-danger">
                  ❌ {issue}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-success">✅ No major issues found.</p>
          )}

          <h5 className="fw-bold mt-3 d-flex align-items-center gap-2">
            <Lightbulb className="text-warning" size={20} /> Suggestions
          </h5>
          {result.suggestions.length > 0 ? (
            <ul className="list-group list-group-flush">
              {result.suggestions.map((s, i) => (
                <li key={i} className="list-group-item text-warning">
                  💡 {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-success">🎉 Resume looks optimized!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ResumeChecker;
