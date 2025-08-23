import { useEffect, useRef } from "react";

export default function AdSlot({ height = 60, width = 468 }) {
  const adRef = useRef(null);

  useEffect(() => {
    if (adRef.current) {
      adRef.current.innerHTML = ""; // clear any previous script

      // Insert config
      const atOptions = document.createElement("script");
      atOptions.type = "text/javascript";
      atOptions.innerHTML = `
        atOptions = {
          'key' : '43ddb4694d8682f21f448f072c4834e7',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;

      // Insert script
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "//www.highperformanceformat.com/43ddb4694d8682f21f448f072c4834e7/invoke.js";

      adRef.current.appendChild(atOptions);
      adRef.current.appendChild(script);
    }
  }, [height, width]);

  return <div ref={adRef} className="d-flex justify-content-center my-3"></div>;
}
