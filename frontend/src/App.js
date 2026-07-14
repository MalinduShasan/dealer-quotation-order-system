import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import QuotationManagement from "./pages/quotations/QuotationManagement";
import UserManagement from "./pages/users/UserManagement";
import DealerManagement from "./pages/dealers/DealerManagement";
import CategoryManagement from "./pages/categories/CategoryManagement";
import BrandManagement from "./pages/brands/BrandManagement";
import InventoryManagement from "./pages/inventory/InventoryManagement";
import ProductManagement from "./pages/products/ProductManagement";
import ProductDetails from "./pages/products/ProductDetails";
import CreateQuotation from "./pages/quotations/CreateQuotation";
import EditQuotation from "./pages/quotations/EditQuotation";
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
              <PrivateRoute role={["admin", "manager", "sales_executive", "dealer"]}>
                <QuotationManagement
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/quotations/new"
            element={
              <PrivateRoute role={["admin", "manager", "sales_executive"]}>
                <CreateQuotation
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/quotations/:id/edit"
            element={
              <PrivateRoute role={["admin", "manager", "sales_executive"]}>
                <EditQuotation
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
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

          <Route
            path="/dealers"
            element={
              <PrivateRoute role={["admin", "manager"]}>
                <DealerManagement
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <PrivateRoute role={["admin", "manager", "sales_executive"]}>
                <CategoryManagement
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/brands"
            element={
              <PrivateRoute role={["admin", "manager", "sales_executive"]}>
                <BrandManagement
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <PrivateRoute role={["admin", "manager", "sales_executive"]}>
                <InventoryManagement
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/products"
            element={
              <PrivateRoute role={["admin", "manager", "sales_executive", "dealer"]}>
                <ProductManagement
                  theme={theme}
                  onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/products/:id"
            element={
              <PrivateRoute role={["admin", "manager", "sales_executive", "dealer"]}>
                <ProductDetails
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
