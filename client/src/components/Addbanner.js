import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    // Google AdSense auto-ads script
    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXX"; // <-- replace with your AdSense client ID
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error", e);
    }

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="ad-banner text-center my-4">
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXX" // <-- replace with your AdSense client ID
        data-ad-slot="1234567890" // <-- replace with your AdSense ad slot
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
