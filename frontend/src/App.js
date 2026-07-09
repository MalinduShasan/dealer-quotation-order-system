import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import UserManagement from "./pages/users/UserManagement";
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("themeMode") || "dark");

  useEffect(() => {
    localStorage.setItem("themeMode", theme);
  }, [theme]);

  return (
    <div className={`app ${theme}`}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
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

          <Route
            path="/users"
            element={
              <PrivateRoute role="admin">
                <UserManagement
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
