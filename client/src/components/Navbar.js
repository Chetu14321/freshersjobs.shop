import { Link, NavLink } from "react-router-dom";
import {
  Briefcase,
  GraduationCap,
  Info,
  Mail,
  ShieldCheck,
  FileText,
  FileSearch,
  X,
} from "lucide-react";

export default function Navbar() {
  // ✅ helper to close offcanvas manually
  const closeOffcanvas = () => {
    const offcanvas = document.getElementById("mobileSidebar");
    if (offcanvas) {
      const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvas);
      bsOffcanvas?.hide();
    }
  };

  return (
    <nav
      className="navbar navbar-light shadow-sm sticky-top"
      style={{ backgroundColor: "#fcf8f8d5" }}
    >
      <div className="container">
        {/* Logo / Brand */}
        <Link
          className="navbar-brand fw-bold text-dark"
          to="/"
          style={{ fontSize: "1.7rem" }}
        >
          <span className="text-primary">Freshers</span>Job
        </Link>

        {/* Mobile Toggle (Sidebar) */}
        <button
          className="btn btn-outline-primary d-lg-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#mobileSidebar"
          aria-controls="mobileSidebar"
        >
          ☰
        </button>

        {/* Desktop Nav Links */}
        <ul className="navbar-nav ms-auto d-none d-lg-flex flex-row gap-4">
          <li className="nav-item">
            <NavLink end className="nav-link fw-semibold" style={{ fontSize: "1.1rem" }} to="/">
              Jobs
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link fw-semibold" style={{ fontSize: "1.1rem" }} to="/internships">
              Internships
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link fw-semibold" style={{ fontSize: "1.1rem" }} to="/resume-checker">
              Resume ATS
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link fw-semibold" style={{ fontSize: "1.1rem" }} to="/about">
              About
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Offcanvas Sidebar for Mobile */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="mobileSidebar"
        aria-labelledby="mobileSidebarLabel"
        style={{ width: "260px" }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold text-primary" id="mobileSidebarLabel">
            JobBoard Menu
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="offcanvas-body p-0">
          <ul className="list-group list-group-flush">
            <li className="list-group-item">
              <NavLink
                end
                to="/"
                onClick={closeOffcanvas}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <Briefcase size={18} className="text-primary" />
                <span className="fw-semibold">Jobs</span>
              </NavLink>
            </li>
            <li className="list-group-item">
              <NavLink
                to="/internships"
                onClick={closeOffcanvas}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <GraduationCap size={18} className="text-success" />
                <span className="fw-semibold">Internships</span>
              </NavLink>
            </li>
            
            <li className="list-group-item">
              <NavLink
                to="/resume-checker"
                onClick={closeOffcanvas}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <FileSearch size={18} className="text-primary" />
                <span className="fw-semibold">Resume ATS</span>
              </NavLink>
            </li>
            <li className="list-group-item">
              <NavLink
                to="/about"
                onClick={closeOffcanvas}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <Info size={18} className="text-info" />
                <span className="fw-semibold">About</span>
              </NavLink>
            </li>
            <li className="list-group-item">
              <NavLink
                to="/contact"
                onClick={closeOffcanvas}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <Mail size={18} className="text-warning" />
                <span className="fw-semibold">Contact</span>
              </NavLink>
            </li>
            <li className="list-group-item">
              <NavLink
                to="/privacy"
                onClick={closeOffcanvas}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <ShieldCheck size={18} className="text-success" />
                <span className="fw-semibold">Privacy</span>
              </NavLink>
            </li>
            <li className="list-group-item">
              <NavLink
                to="/terms"
                onClick={closeOffcanvas}
                className="d-flex align-items-center gap-2 text-decoration-none text-dark"
              >
                <FileText size={18} className="text-secondary" />
                <span className="fw-semibold">Terms</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
