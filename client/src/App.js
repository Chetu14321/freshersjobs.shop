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
import ResumeChecker from "./components/resumeChecker"; 
import { ThemeProvider } from "./components/ThemeContex";

import ChatWidget from "./components/ChatWidget";  
import AdzunaJobs from "./components/AIjobs";   // ⬅️ import the AI Jobs page

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar />

        <div className="container-fluid mt-4">
          <div className="row">
            <div className="col-lg-8 col-md-12">
              <Routes>
                <Route path="/" element={<JobList />} />
                <Route path="/job/:id" element={<JobDetails />} />
                <Route path="/internships" element={<Intership />} />
                <Route path="/locations" element={<h2>Locations Coming Soon</h2>} />

                <Route path="/aijobs" element={<AdzunaJobs />} /> {/* ⬅️ NEW ROUTE */}

                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                <Route path="/resume-checker" element={<ResumeChecker />} />
              </Routes>
            </div>

            <div className="col-lg-4 d-none d-lg-block">
              <Sidebar />
            </div>
          </div>
        </div>

        <AdBanner />
        <Footer />

        {/* ⬇️ Floating Chat Widget */}
        <ChatWidget />
      </Router>
    </ThemeProvider>
  );
}

export default App;
