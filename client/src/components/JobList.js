import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AdSlot from "./AdSlot";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6; // ✅ how many jobs per page

  useEffect(() => {
    axios
      .get("/api/jobs") // ✅ Your backend API
      .then((res) => {
        // ✅ Only include jobs, exclude internships
        const onlyJobs = res.data.filter((job) => job.type === "job");
        setJobs(onlyJobs);
      })
      .catch((err) => console.error("Error fetching jobs:", err));
  }, []);

  // 🔹 Filter jobs based only on job title
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      job.title.toLowerCase().includes(roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  // 🔹 Pagination Logic
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

        {/* 🔹 Search + Filter Controls */}
        <div className="row mb-4">
          <div className="col-md-6 mb-2">
            <input
              type="text"
              className="form-control rounded-pill"
              placeholder="🔍 Search jobs by title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset to first page when searching
              }}
            />
          </div>
          <div className="col-md-6 mb-2">
            <select
              className="form-select rounded-pill"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1); // reset to first page when filtering
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
                    <h5 className="card-title fw-bold text-dark">
                      {job.title}
                    </h5>
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

        {/* 🔹 Insert Ads after every 3 jobs */}
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
    </div>
  );
}
