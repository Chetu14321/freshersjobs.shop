import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-dark text-light mt-5">
      <div className="container py-5">
        <div className="row text-center text-md-start">
          {/* Brand Section */}
          <div className="col-12 col-md-4 mb-4">
            <h4 className="fw-bold">
              <span className="text-primary">Job</span>Board
            </h4>
            <p className="small text-secondary">
              Discover jobs, internships, and opportunities that shape your future. 
              We connect talent with the right companies.
            </p>
            {/* Social Links */}
            <div className="d-flex justify-content-center justify-content-md-start gap-3 mt-3">
              <a href="#" className="text-light fs-5">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-light fs-5">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-light fs-5">
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="#" className="text-light fs-5">
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </div>

          {/* Links Section */}
          <div className="col-12 col-md-4 mb-4">
            <h6 className="fw-bold mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link className="text-decoration-none text-light" to="/">
                  Jobs
                </Link>
              </li>
              <li className="mb-2">
                <Link className="text-decoration-none text-light" to="/internships">
                  Internships
                </Link>
              </li>
             
              <li className="mb-2">
                <Link className="text-decoration-none text-light" to="/contact">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="col-12 col-md-4 mb-4">
            <h6 className="fw-bold mb-3">Contact</h6>
            <p className="small mb-2">
              📧{" "}
              <a
                href="mailto:support@jobboard.com"
                className="text-light text-decoration-none"
              >
                chetuchethan87@gmail.com
              </a>
            </p>
            <p className="small mb-2">📍 Bangalore, India</p>
            
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-secondary text-center py-3">
        <p className="mb-0 small">
          © {new Date().getFullYear()}{" "}
          <span className="fw-bold">JobBoard</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
