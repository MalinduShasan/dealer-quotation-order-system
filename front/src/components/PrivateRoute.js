// Example: PrivateRoute.js
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ user, children, role }) => {
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
};

export default PrivateRoute;
