import React, { useEffect, useState } from "react";

function AdzunaJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/adzuna-jobs?search=software&location=India");
        if (!res.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <p className="p-4">Loading jobs...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Latest Software Jobs in India</h1>
      {jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="border p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold">{job.title}</h2>
              <p className="text-gray-600">{job.company?.display_name}</p>
              <p className="text-sm">{job.location?.display_name}</p>
              <p className="text-sm mt-2">
                {job.description?.slice(0, 150)}...
              </p>
              <a
                href={job.redirect_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-medium mt-2 inline-block"
              >
                Apply Now →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdzunaJobs;
