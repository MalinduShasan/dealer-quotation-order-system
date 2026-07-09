import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../utils/supabase";

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [todoError, setTodoError] = useState("");

  useEffect(() => {
    const loadTodos = async () => {
      const { data, error } = await supabase.from("todos").select("id, name").limit(5);

      if (error) {
        setTodoError(error.message);
        return;
      }

      setTodos(data || []);
    };

    loadTodos();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <section className="dashboard-layout">
      <div className="dashboard-main">
        <div className="page-card hero-panel">
          <p className="eyebrow">Control Center</p>
          <h2 className="hero-title">Elevate every quotation into a polished business flow.</h2>
          <p className="hero-text">
            Track customer demand, manage dealer response, and turn incoming requests into calm,
            controlled operations through one shared workspace.
          </p>
          <div className="hero-actions">
            {user?.role === "dealer" && (
              <button className="lux-button" type="button" onClick={() => navigate("/quotations")}>
                Review Pending Quotations
              </button>
            )}
            <button className="ghost-button" type="button" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="dashboard-stat">
            <p className="stat-label">Current Role</p>
            <p className="stat-value">{user?.role || "guest"}</p>
            <p className="supporting-text">Role-based access keeps workflows separated and secure.</p>
          </div>
          <div className="dashboard-stat">
            <p className="stat-label">Theme Engine</p>
            <p className="stat-value">Dual Mode</p>
            <p className="supporting-text">Shared tokens power both midnight and linen presentation styles.</p>
          </div>
          <div className="dashboard-stat">
            <p className="stat-label">Experience</p>
            <p className="stat-value">Responsive</p>
            <p className="supporting-text">Cards and controls reshape smoothly for desktop, tablet, and mobile.</p>
          </div>
        </div>

        <div className="info-card">
          <p className="mini-label">Supabase Demo</p>
          <h3 className="section-title">Live Todo Query</h3>
          <p className="supporting-text">
            This panel reads from the Supabase `todos` table using the frontend browser client.
          </p>
          {todoError && <div className="status-banner status-banner--error">{todoError}</div>}
          {!todoError && todos.length === 0 && (
            <p className="supporting-text">No todos found yet. Create a `todos` table to see sample data here.</p>
          )}
          {!todoError && todos.length > 0 && (
            <div className="line-items">
              {todos.map((todo) => (
                <div key={todo.id} className="line-item">
                  <strong>{todo.name}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="dashboard-sidebar">
        <div className="info-card">
          <p className="mini-label">Profile</p>
          <h3 className="section-title">Workspace Identity</h3>
          <p className="supporting-text">Signed in as {user?.name || user?.email}.</p>
          <p className="supporting-text">Email: {user?.email}</p>
          <p className="supporting-text">Role access: {user?.role}</p>
        </div>

        <div className="info-card">
          <p className="mini-label">Next Build</p>
          <p className="supporting-text">
            This dashboard shell is now ready for widgets like revenue summaries, approval queues,
            stock alerts, and recent order activity.
          </p>
        </div>
      </aside>
    </section>
  );
}

export default Dashboard;
