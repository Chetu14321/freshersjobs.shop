import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import JobList from "./components/JobList";
import JobDetails from "./components/JobDetails";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Intership from "./components/internship";
import AdBanner from "./components/Addbanner";

import About from "./pages/About";
import Contact from "./pages/contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/terms";
import ResumeChecker from "./components/resumeChecker"; // ✅ NEW IMPORT

function App() {
  return (
    <Router>
      <Navbar />

      <div className="container-fluid mt-4">
        <div className="row">
          {/* Main Content */}
          <div className="col-lg-8 col-md-12">
            <Routes>
              <Route path="/" element={<JobList />} />
              <Route path="/job/:id" element={<JobDetails />} />
              <Route path="/internships" element={<Intership />} />
              <Route path="/locations" element={<h2>Locations Coming Soon</h2>} />

              {/* New Trust Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* ✅ New ATS Resume Checker Page */}
              <Route path="/resume-checker" element={<ResumeChecker />} />
            </Routes>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4 d-none d-lg-block">
            <Sidebar />
          </div>
        </div>
      </div>

      <AdBanner />
      <Footer />
    </Router>
  );
}

export default App;
