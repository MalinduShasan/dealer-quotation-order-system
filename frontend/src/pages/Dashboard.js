import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AdminDashboard from "../components/dashboard/AdminDashboard";

function Dashboard({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AdminDashboard
      user={user}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onLogout={handleLogout}
      onNavigate={navigate}
    />
  );
}

export default Dashboard;
