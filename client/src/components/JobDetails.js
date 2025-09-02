import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AdSlot from "./AdSlot";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(true); // ✅ always show full description

  useEffect(() => {
    axios.get(`/api/jobs/${id}`).then((res) => setJob(res.data));
  }, [id]);

  if (!job)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading job details...</p>
      </div>
    );

  // ✅ inject Bootstrap classes into CKEditor HTML
  const formatDescription = (html) => {
    if (!html) return "";
    return html
      .replaceAll("<p>", '<p class="mb-3">')
      .replaceAll("<ul>", '<ul class="mb-3 ps-3">')
      .replaceAll("<li>", '<li class="mb-2">')
      .replaceAll(
        "<strong>",
        '<strong class="d-block fw-bold h5 mt-4 mb-2">'
      );
  };

  return (
    <div className="py-5 bg-light min-vh-100">
      <div className="container">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4 p-md-5">
            {/* Job Title & Company */}
            <h1 className="fw-bold text-dark">{job.title}</h1>
            <h4 className="text-muted mb-3">{job.company}</h4>

            {/* Location + Remote */}
            <p className="mb-3">
              <span className="badge bg-primary">{job.location}</span>
              {job.isWFH && <span className="badge bg-success ms-2">Remote</span>}
            </p>

            {/* Posted Date */}
            <p className="text-secondary small mb-4">
              📅 Posted on {new Date(job.postedAt).toLocaleDateString()}
            </p>

            {/* Top Ad Slot */}
            <div className="p-3 bg-light rounded shadow-sm mb-4">
              <h5 className="fw-bold mb-3">Promotions</h5>
              <AdSlot height={120} width={728} /> {/* Leaderboard */}
            </div>

            {/* Job Description */}
            <h5 className="fw-semibold mb-3">Job Description</h5>
            <div
              className="text-secondary"
              style={{ lineHeight: "1.7" }}
              dangerouslySetInnerHTML={{
                __html: formatDescription(job.description),
              }}
            ></div>

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

        {/* Bottom Ad Slot */}
        <div className="p-3 bg-light rounded shadow-sm mt-4">
          <h5 className="fw-bold mb-3">Promotions</h5>
          <AdSlot height={120} width={300} /> {/* Medium Rectangle */}
        </div>
      </div>
    </div>
  );
}
