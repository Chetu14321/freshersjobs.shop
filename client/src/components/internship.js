import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Internship() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/jobs")
      .then((res) => {
        // ✅ Filter internships only
        const onlyInternships = res.data.filter(
          (job) => job.type === "internship"
        );
        setInternships(onlyInternships);
      })
      .catch((err) => console.error("Error fetching internships:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-dark" role="status"></div>
        <p className="mt-3">Loading internships...</p>
      </div>
    );
  }

  return (
    <div
      className="py-5"
      style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}
    >
      <div className="container">
        <h3 className="mb-5 text-center fw-bold display-6 text-dark">
          🎓 Internship Opportunities
        </h3>

        <div className="row g-4">
          {internships.length === 0 ? (
            <p className="text-center text-muted">
              No internships available right now 😢
            </p>
          ) : (
            internships.map((job) => (
              <div key={job._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0 rounded-4">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold text-dark">{job.title}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">
                      {job.company}
                    </h6>

                    <p className="mb-2">
                      <span className="badge bg-primary">{job.location}</span>
                      {job.isWFH && (
                        <span className="badge bg-success ms-2">Remote</span>
                      )}
                    </p>

                    <Link
                      to={`/job/${job._id}`}
                      className="btn btn-dark rounded-pill mt-auto"
                    >
                      View Details
                    </Link>
                  </div>
                  <div className="card-footer text-muted small bg-light">
                    📅 {new Date(job.postedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
