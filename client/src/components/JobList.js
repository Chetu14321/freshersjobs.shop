import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AdSlot from "./AdSlot";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [email, setEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6;

  useEffect(() => {
    axios
      .get("/api/jobs")
      .then((res) => {
        const onlyJobs = res.data.filter((job) => job.type === "job");
        setJobs(onlyJobs);
      })
      .catch((err) => console.error("Error fetching jobs:", err));

    const subscribed = localStorage.getItem("subscribed");
    if (!subscribed) setShowSubscribe(true);
  }, []);

  const handleSubscribe = async () => {
    if (!email) return alert("Please enter your email");
    try {
      const res = await axios.post("/api/subscribe", { email });
      if (res.status === 200) {
        alert(res.data.message || "Subscribed successfully!");
        localStorage.setItem("subscribed", "true");
        setShowSubscribe(false);
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      alert(err.response?.data?.error || "Subscription failed!");
    }
  };

  const handleCloseSubscribe = () => setShowSubscribe(false);

  // 🔹 Single filter method: title OR company OR role
  const filteredJobs = jobs.filter((job) => {
  const term = searchTerm.toLowerCase();
  const roleTerm = roleFilter.toLowerCase();

  // Check title or company match
  const matchesSearch =
    job.title.toLowerCase().includes(term) ||
    job.company.toLowerCase().includes(term);

  // Check role filter
  const matchesRole =
    roleFilter === "all" || job.title.toLowerCase().includes(roleTerm);

  return matchesSearch && matchesRole;
});

  // Pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  return (
    <div
      className="pt-3 pb-5"
      style={{ backgroundColor: "#f7f9f4ff", minHeight: "100vh" }}
    >
      <div className="container">
        <h5 className="mb-5 text-center fw-bold display-6 text-dark">
          🚀 Latest Job Opportunities
        </h5>

        {/* 🔹 Search + Role Filter */}
        <div className="row mb-4">
          <div className="col-md-6 mb-2">
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="🔍 Search jobs by title or company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="col-md-6 mb-2">
            <select
              className="form-select rounded-pill"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Roles</option>
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="fullstack">Full Stack Developer</option>
              <option value="designer">Designer</option>
              <option value="mernstack">MERN Stack Developer</option>
            </select>
          </div>
        </div>

        {/* 🔹 Job Cards */}
        <div className="row g-4">
          {currentJobs.length === 0 ? (
            <p className="text-center text-muted">No jobs found 😢</p>
          ) : (
            currentJobs.map((job) => (
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

        {/* 🔹 Pagination Controls */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <nav>
              <ul className="pagination pagination-sm">
                {Array.from({ length: totalPages }, (_, i) => (
                  <li
                    key={i + 1}
                    className={`page-item ${
                      currentPage === i + 1 ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        {/* 🔹 Ads after every 3 jobs */}
        <div className="row mt-4">
          {currentJobs.map((_, i) =>
            (i + 1) % 3 === 0 ? (
              <div key={`ad-${i}`} className="col-12 my-3">
                <AdSlot height={90} width={728} />
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* 🔹 Subscribe Popup */}
      {showSubscribe && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "white",
            border: "1px solid #ccc",
            padding: "15px",
            zIndex: 9999,
            width: "300px",
            maxWidth: "90%", // responsive
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <h6 className="mb-2">Subscribe for Daily Updates 🚀</h6>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control rounded-pill mb-2"
          />
          <div className="d-flex justify-content-between">
            <button
              className="btn btn-primary rounded-pill"
              onClick={handleSubscribe}
            >
              Subscribe
            </button>
            <button
              className="btn btn-secondary rounded-pill"
              onClick={handleCloseSubscribe}
            >
              No Thanks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
