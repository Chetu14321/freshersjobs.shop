// src/context/ThemeContext.js
import { createContext, useContext, useEffect, useState } from "react";

// 1. Create context
const ThemeContext = createContext();

// 2. Provider component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Load saved theme from localStorage OR default to light
    return localStorage.getItem("theme") || "light";
  });

  // Apply theme to <body> whenever it changes
  useEffect(() => {
    document.body.setAttribute("data-bs-theme", theme); // ✅ works with Bootstrap 5.3+
    localStorage.setItem("theme", theme); // save choice
  }, [theme]);

  // Toggle function
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Custom hook for easy usage
export function useTheme() {
  return useContext(ThemeContext);
}
