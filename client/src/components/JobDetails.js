import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AdSlot from "./AdSlot";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    axios
      .get(`/api/jobs/${id}`)
      .then((res) => setJob(res.data));
  }, [id]);

  if (!job)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading job details...</p>
      </div>
    );

  const shortDescription =
    job.description?.length > 400
      ? job.description.substring(0, 400) + "..."
      : job.description;

  return (
    <div className="py-5" style={{ backgroundColor: "#f4f6f9", minHeight: "100%" }}>
      <div className="container">
        {/* Full Width Content */}
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-5">
            {/* Job Title & Company */}
            <h1 className="fw-bold text-dark">{job.title}</h1>
            <h4 className="text-muted mb-3">{job.company}</h4>

            {/* Location + Remote */}
            <p className="mb-3">
              <span className="badge bg-primary">{job.location}</span>
              {job.isWFH && (
                <span className="badge bg-success ms-2">Remote</span>
              )}
            </p>

            {/* Posted Date */}
            <p className="text-secondary small mb-4">
              📅 Posted on {new Date(job.postedAt).toLocaleDateString()}
            </p>

            <div className="p-3 bg-light rounded shadow-sm">
                    <h5 className="fw-bold mb-3">Promotions</h5>
                    <AdSlot height={120} width={728} /> {/* Leaderboard Banner */}
            </div>

            {/* Job Description */}
            <h5 className="fw-semibold mt-4 mb-3">Job Description</h5>
            <p className="text-secondary" style={{ lineHeight: "1.7" }}>
              {showFullDesc ? job.description : shortDescription}
            </p>

            {/* Show More / Less Button */}
            {job.description?.length > 400 && (
              <button
                className="btn btn-link p-0 fw-semibold"
                onClick={() => setShowFullDesc(!showFullDesc)}
              >
                {showFullDesc ? "Show Less ▲" : "Show More ▼"}
              </button>
            )}

            {/* Apply Button */}
            <div className="d-grid mt-5">
              <a
                href={job.applyUrl}
                className="btn btn-primary btn-lg rounded-pill"
                target="_blank"
                rel="noreferrer"
              >
                🚀 Apply Now
              </a>
            </div>
          </div>
        </div>

       <div className="p-3 bg-light rounded shadow-sm">
          <h5 className="fw-bold mb-3">Promotions</h5>
          <AdSlot height={120} width={300} /> {/* Leaderboard Banner */}
        </div>
      </div>
    </div>
  );
}
