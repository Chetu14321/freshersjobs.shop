import { useRef, useEffect } from "react";

function AdSlot({ height = 250, width = 300 }) {
  const adRef = useRef(null);

  useEffect(() => {
    if (adRef.current) {
      // Clear previous dummy
      adRef.current.innerHTML = "";

      // Create dummy placeholder
      const placeholder = document.createElement("div");
      placeholder.style.width = `${width}px`;
      placeholder.style.height = `${height}px`;
      placeholder.style.background = "#f1f1f1";
      placeholder.style.border = "1px dashed #ccc";
      placeholder.style.display = "flex";
      placeholder.style.alignItems = "center";
      placeholder.style.justifyContent = "center";
      placeholder.style.color = "#888";
      placeholder.innerText = "Ad Placeholder";

      adRef.current.appendChild(placeholder);
    }
  }, [height, width]);

  return (
    <div className="d-flex justify-content-center my-3">
      <div ref={adRef}></div>
    </div>
  );
}

export default function ContentWithAd() {
  return (
    <div className="container my-4">
      <div className="card shadow-sm p-4">
        <h2 className="mb-3">Welcome to FreshersJobs</h2>
        <p>
          FreshersJobs is a trusted platform where students and recent graduates
          can explore career opportunities. We provide verified job listings,
          internships, and career resources to help young professionals succeed
          in their career journey.
        </p>

        {/* ✅ Dummy ad for approval */}
        <AdSlot height={250} width={300} />

        <p>
          Our mission is to connect fresh talent with leading companies and
          startups across industries. Every listing on our portal goes through a
          verification process to ensure that applicants can apply with
          confidence.
        </p>
      </div>
    </div>
  );
}
