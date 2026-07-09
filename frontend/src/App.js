import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle__orb" />
      <span>{theme === "dark" ? "Midnight Mode" : "Linen Mode"}</span>
    </button>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("themeMode") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("themeMode", theme);
  }, [theme]);

  return (
    <Router>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dealer Quotation System</p>
            <h1 className="topbar__title">Luxury Trade Operations</h1>
          </div>
          <ThemeToggle
            theme={theme}
            onToggle={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
          />
        </header>

        <main className="page-frame">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/quotations"
              element={
                <PrivateRoute role="dealer">
                  <Quotations />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
