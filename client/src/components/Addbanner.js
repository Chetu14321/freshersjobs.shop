import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//pl27486447.profitableratecpm.com/65/ae/bf/65aebf171b71556f335dc3755c9b0790.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="ad-banner" style={{ textAlign: "center", margin: "20px 0" }}>
      {/* Adsterra banner will load here */}
    </div>
  );
}
