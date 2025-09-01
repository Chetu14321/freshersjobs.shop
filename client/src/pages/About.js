export default function About() {
  return (
    <div className="container my-5">
      <div className="card shadow-sm border-0 p-4">
        <h2 className="fw-bold text-primary mb-3">About FreshersJobs</h2>
        <p className="text-muted" style={{ fontSize: "1.1rem", lineHeight: "1.7" }}>
          Welcome to <strong>FreshersJobs</strong>, your trusted platform for
          the latest job openings, internships, and career opportunities for
          students and recent graduates. We are committed to helping freshers
          build their careers by providing timely, verified, and high-quality
          job information.
        </p>

        <h4 className="fw-semibold mt-4">🎯 Our Mission</h4>
        <p className="text-muted">
          To bridge the gap between aspiring professionals and employers by
          making job hunting simpler, faster, and more transparent. We aim to
          empower fresh graduates with reliable job listings and career
          guidance.
        </p>

        <h4 className="fw-semibold mt-4">✅ What We Offer</h4>
        <ul className="list-group list-group-flush mb-3">
          <li className="list-group-item border-0">
            🔹 Daily updates on <strong>fresher jobs & internships</strong>
          </li>
          <li className="list-group-item border-0">
            🔹 Verified listings from trusted companies
          </li>
          <li className="list-group-item border-0">
            🔹 Career resources, interview tips, and resume help
          </li>
          <li className="list-group-item border-0">
            🔹 Easy navigation by categories, skills, and locations
          </li>
        </ul>

        <h4 className="fw-semibold mt-4">🤝 Why Choose Us?</h4>
        <p className="text-muted">
          Unlike other portals, we focus solely on <strong>fresh graduates</strong>.
          Every listing is reviewed to ensure authenticity, so you can apply
          confidently without worrying about fake or irrelevant postings.
        </p>

        <div className="alert alert-info mt-4">
          <strong>FreshersJobs</strong> – Your career journey starts here.  
          Together, let’s build a brighter future 🚀
        </div>
      </div>
    </div>
  );
}
