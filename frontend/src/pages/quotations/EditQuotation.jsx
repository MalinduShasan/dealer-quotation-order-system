import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import builderStyles from "./components/QuotationBuilder.module.css";
import { getDealers } from "../../api/dealerService";
import { getProducts } from "../../api/productService";
import { getQuotationById, updateQuotation } from "../../api/quotationService";
import QuotationBuilder from "./components/QuotationBuilder";

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

export default function EditQuotation({ theme, onToggleTheme }) {
  const { id } = useParams();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.token) return;
      setLoading(true);
      try {
        const [dealerResponse, productResponse, quotationResponse] = await Promise.all([
          getDealers(user.token, { page: 1, limit: 100, status: "active" }),
          getProducts(user.token, { page: 1, limit: 100, status: "active" }),
          getQuotationById(user.token, id)
        ]);
        setDealers(dealerResponse.data.items || []);
        setProducts(productResponse.data.items || []);
        setQuotation(quotationResponse.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), 4000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const pushToast = (type, title, message) =>
    setToasts((current) => [...current, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, title, message }]);

  const initialValues = useMemo(() => ({
    valid_until: quotation?.validUntil ? quotation.validUntil.slice(0, 10) : "",
    status: quotation?.status || "draft",
    shipping_amount: String(quotation?.shippingAmount || 0),
    discount_percentage: String(quotation?.discountPercentage || 0),
    tax_percentage: String(quotation?.taxPercentage || 0),
    currency_code: quotation?.currencyCode || "USD",
    internal_notes: quotation?.internalNotes || "",
    dealer_notes: quotation?.dealerNotes || "",
    terms: quotation?.terms || ""
  }), [quotation]);

  const initialDealer = useMemo(
    () => dealers.find((dealer) => dealer.id === quotation?.dealerId) || null,
    [dealers, quotation]
  );

  const initialItems = useMemo(
    () => (quotation?.items || []).map((item) => ({
      product_id: item.productId,
      product_name_snapshot: item.productNameSnapshot || item.product?.name || "",
      product_sku_snapshot: item.productSkuSnapshot || item.product?.sku || "",
      product_description_snapshot: item.productDescriptionSnapshot || "",
      brand_name_snapshot: item.brandNameSnapshot || "",
      category_name_snapshot: item.categoryNameSnapshot || "",
      stockQuantity: Number(item.product?.stockQuantity || item.quantity || 0),
      quantity: String(item.quantity),
      unit_price: String(item.unitPrice),
      discount_amount: String(item.discountAmount || 0),
      tax_amount: String(item.taxAmount || 0),
      line_total: Number(item.lineTotal || 0)
    })),
    [quotation]
  );

  const handleSave = async (payload) => {
    setSubmitting(true);
    try {
      const { data } = await updateQuotation(user.token, id, payload);
      pushToast("success", "Quotation updated", `${data.quotationNumber} was updated successfully.`);
      navigate("/quotations");
    } catch (error) {
      pushToast("error", "Update failed", error.response?.data?.message || "Unable to update quotation");
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
          currentPageTitle="Edit Quotation"
          user={user}
          theme={theme}
          searchValue=""
          onSearchChange={() => {}}
          onToggleTheme={onToggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={() => { logout(); navigate("/login"); }}
        />

        <main className={shellStyles.mainContent}>
          {loading || !quotation ? (
            <div className={builderStyles.sectionCard}>Loading quotation builder...</div>
          ) : (
            <QuotationBuilder
              mode="edit"
              dealers={dealers}
              products={products}
              initialValues={initialValues}
              initialDealer={initialDealer}
              initialItems={initialItems}
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
