import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import builderStyles from "./components/QuotationBuilder.module.css";
import { getDealers } from "../../api/dealerService";
import { getProducts } from "../../api/productService";
import { createQuotation } from "../../api/quotationService";
import QuotationBuilder from "./components/QuotationBuilder";

const initialValues = {
  valid_until: "",
  status: "draft",
  shipping_amount: "0",
  discount_percentage: "0",
  tax_percentage: "0",
  currency_code: "USD",
  internal_notes: "",
  dealer_notes: "",
  terms: ""
};

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className={builderStyles.toastStack}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${builderStyles.toast} ${builderStyles[toast.type]}`}>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button type="button" onClick={() => onDismiss(toast.id)}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}

export default function CreateQuotation({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.token) return;
      setLoading(true);
      try {
        const [dealerResponse, productResponse] = await Promise.all([
          getDealers(user.token, { page: 1, limit: 100, status: "active" }),
          getProducts(user.token, { page: 1, limit: 100, status: "active" })
        ]);
        setDealers(dealerResponse.data.items || []);
        setProducts(productResponse.data.items || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), 4000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const pushToast = (type, title, message) =>
    setToasts((current) => [...current, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, title, message }]);

  const handleSave = async (payload) => {
    setSubmitting(true);
    try {
      const { data } = await createQuotation(user.token, payload);
      pushToast("success", "Quotation created", `${data.quotationNumber} was created successfully.`);
      navigate("/quotations");
    } catch (error) {
      pushToast("error", "Creation failed", error.response?.data?.message || "Unable to create quotation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={shellStyles.dashboardShell}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        onNavigate={navigate}
        onLogout={() => { logout(); navigate("/login"); }}
        activeItem="quotations"
      />

      <div className={shellStyles.workspace}>
        <Navbar
          currentPageTitle="Create Quotation"
          user={user}
          theme={theme}
          searchValue=""
          onSearchChange={() => {}}
          onToggleTheme={onToggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={() => { logout(); navigate("/login"); }}
        />

        <main className={shellStyles.mainContent}>
          {loading ? (
            <div className={builderStyles.sectionCard}>Loading quotation builder...</div>
          ) : (
            <QuotationBuilder
              mode="create"
              dealers={dealers}
              products={products}
              initialValues={initialValues}
              initialDealer={null}
              initialItems={[]}
              submitting={submitting}
              onCancel={() => navigate("/quotations")}
              onSave={handleSave}
              onToast={pushToast}
            />
          )}
        </main>
        <DashboardFooter />
      </div>
      <ToastStack toasts={toasts} onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))} />
    </div>
  );
}
