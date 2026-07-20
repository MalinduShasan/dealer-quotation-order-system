import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import {
  acceptQuotation,
  approveQuotation,
  cancelQuotation,
  convertQuotationToOrder,
  declineQuotation,
  duplicateQuotation,
  getQuotationById,
  getQuotationHistory,
  rejectQuotation,
  sendQuotation,
  submitQuotation
} from "../../api/quotationService";
import QuotationStatusBadge from "./components/QuotationStatusBadge";
import styles from "./QuotationDetails.module.css";

const terminalStatuses = new Set(["converted", "cancelled", "rejected", "expired"]);

function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(value, withTime = false) {
  if (!value) return "-";
  const options = withTime
    ? { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "short", day: "numeric" };
  return new Intl.DateTimeFormat("en-US", options).format(new Date(value));
}

function labelStatus(status) {
  return (status || "").replaceAll("_", " ") || "unknown";
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
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

function InfoBlock({ label, children }) {
  return (
    <div className={styles.infoBlock}>
      <span>{label}</span>
      <strong>{children || "-"}</strong>
    </div>
  );
}

export default function QuotationDetails({ theme, onToggleTheme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quotation, setQuotation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);

  const isDealer = user?.role === "dealer";
  const currency = quotation?.currencyCode || "USD";

  const pushToast = useCallback((type, title, message) => {
    setToasts((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, title, message }
    ]);
  }, []);

  const loadQuotation = useCallback(async () => {
    if (!user?.token || !id) return;
    setLoading(true);
    setError("");
    try {
      const [{ data: detail }, { data: historyData }] = await Promise.all([
        getQuotationById(user.token, id),
        getQuotationHistory(user.token, id)
      ]);
      setQuotation(detail);
      setHistory(historyData.items || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load quotation details");
    } finally {
      setLoading(false);
    }
  }, [id, user?.token]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), 4200);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const actions = useMemo(() => {
    if (!quotation || terminalStatuses.has(quotation.status)) return [];
    const nextActions = [];
    const role = user?.role;

    if (quotation.status === "draft" && ["admin", "manager", "sales_executive"].includes(role)) {
      nextActions.push({ id: "submit", label: "Submit", tone: "primary" });
    }
    if (quotation.status === "pending_approval" && ["admin", "manager"].includes(role)) {
      nextActions.push({ id: "approve", label: "Approve", tone: "primary" });
      nextActions.push({ id: "reject", label: "Reject", tone: "danger", requiresReason: true });
    }
    if (quotation.status === "approved" && ["admin", "manager", "sales_executive"].includes(role)) {
      nextActions.push({ id: "send", label: "Send", tone: "primary" });
    }
    if (quotation.status === "sent" && role === "dealer") {
      nextActions.push({ id: "accept", label: "Dealer Accept", tone: "primary" });
      nextActions.push({ id: "decline", label: "Dealer Reject", tone: "danger", requiresReason: true });
    }
    if (quotation.status === "accepted" && ["admin", "manager", "sales_executive", "dealer"].includes(role)) {
      nextActions.push({ id: "convert", label: "Convert to Order", tone: "primary" });
    }
    if (!isDealer) {
      nextActions.push({ id: "cancel", label: "Cancel", tone: "danger", requiresReason: true });
    }

    return nextActions;
  }, [isDealer, quotation, user?.role]);

  const handlers = {
    submit: () => submitQuotation(user.token, id),
    approve: () => approveQuotation(user.token, id),
    reject: (reason) => rejectQuotation(user.token, id, reason),
    send: () => sendQuotation(user.token, id),
    accept: () => acceptQuotation(user.token, id),
    decline: (reason) => declineQuotation(user.token, id, reason),
    cancel: (reason) => cancelQuotation(user.token, id, reason),
    convert: () => convertQuotationToOrder(user.token, id),
    duplicate: () => duplicateQuotation(user.token, id)
  };

  const runAction = async (action) => {
    const reason = action.requiresReason ? window.prompt("Enter a reason for this action:") || "" : "";
    if (action.requiresReason && !reason.trim()) {
      pushToast("error", "Reason required", `${action.label} needs a reason before it can continue.`);
      return;
    }

    setActionLoading(action.id);
    try {
      const response = await handlers[action.id](reason);
      if (action.id === "duplicate") {
        navigate(`/quotations/${response.data.id}`);
        return;
      }
      pushToast("success", "Quotation updated", `${quotation.quotationNumber} moved through the workflow.`);
      await loadQuotation();
    } catch (actionError) {
      pushToast("error", "Action failed", actionError.response?.data?.message || "Unable to update quotation");
    } finally {
      setActionLoading("");
    }
  };

  const duplicateAction = { id: "duplicate", label: "Duplicate", tone: "secondary" };
  const canDuplicate = ["admin", "manager", "sales_executive"].includes(user?.role);

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
          currentPageTitle="Quotation Details"
          user={user}
          theme={theme}
          searchValue=""
          onSearchChange={() => {}}
          onToggleTheme={onToggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={() => { logout(); navigate("/login"); }}
        />

        <main className={shellStyles.mainContent}>
          <div className={styles.page}>
            {loading ? <section className={styles.stateCard}>Loading quotation details...</section> : null}
            {!loading && error ? <section className={styles.stateCard}>{error}</section> : null}
            {!loading && quotation ? (
              <>
                <section className={styles.headerBand}>
                  <div>
                    <p className={styles.eyebrow}>Quotation Details</p>
                    <h1>{quotation.quotationNumber}</h1>
                    <div className={styles.headerMeta}>
                      <QuotationStatusBadge status={quotation.status} />
                      <span>Version {quotation.version || 1}</span>
                      <span>Created {formatDate(quotation.createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.headerActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => navigate("/quotations")}>Back</button>
                    {canDuplicate ? (
                      <button type="button" className={styles.secondaryButton} disabled={Boolean(actionLoading)} onClick={() => runAction(duplicateAction)}>
                        Duplicate
                      </button>
                    ) : null}
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        className={action.tone === "danger" ? styles.dangerButton : styles.primaryButton}
                        disabled={Boolean(actionLoading)}
                        onClick={() => runAction(action)}
                      >
                        {actionLoading === action.id ? "Working..." : action.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className={styles.twoColumnGrid}>
                  <article className={styles.panel}>
                    <p className={styles.eyebrow}>Dealer Information</p>
                    <div className={styles.infoGrid}>
                      <InfoBlock label="Company">{quotation.dealer?.companyName}</InfoBlock>
                      <InfoBlock label="Dealer Code">{quotation.dealer?.dealerCode}</InfoBlock>
                      <InfoBlock label="Contact">{quotation.dealer?.contactPerson}</InfoBlock>
                      <InfoBlock label="Email">{quotation.dealer?.email}</InfoBlock>
                      <InfoBlock label="Phone">{quotation.dealer?.phone}</InfoBlock>
                    </div>
                  </article>

                  <article className={styles.panel}>
                    <p className={styles.eyebrow}>Quotation Information</p>
                    <div className={styles.infoGrid}>
                      <InfoBlock label="Valid Until">{formatDate(quotation.validUntil)}</InfoBlock>
                      <InfoBlock label="Currency">{currency}</InfoBlock>
                      <InfoBlock label="Created By">{quotation.createdByName || "System"}</InfoBlock>
                      <InfoBlock label="Approved By">{quotation.approvedByName || "-"}</InfoBlock>
                      <InfoBlock label="Sent At">{formatDate(quotation.sentAt, true)}</InfoBlock>
                      <InfoBlock label="Accepted At">{formatDate(quotation.acceptedAt, true)}</InfoBlock>
                    </div>
                  </article>
                </section>

                <section className={styles.panel}>
                  <p className={styles.eyebrow}>Product Snapshot Table</p>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Brand</th>
                          <th>Category</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Discount</th>
                          <th>Tax</th>
                          <th>Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(quotation.items || []).map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.productNameSnapshot || item.product?.name || "Product"}</strong>
                              <span>{item.productDescriptionSnapshot || "Snapshot retained from quotation creation."}</span>
                            </td>
                            <td>{item.productSkuSnapshot || item.product?.sku || "-"}</td>
                            <td>{item.brandNameSnapshot || "-"}</td>
                            <td>{item.categoryNameSnapshot || "-"}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unitPrice, currency)}</td>
                            <td>{formatCurrency(item.discountAmount, currency)}</td>
                            <td>{formatCurrency(item.taxAmount, currency)}</td>
                            <td>{formatCurrency(item.lineTotal, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className={styles.twoColumnGrid}>
                  <article className={styles.panel}>
                    <p className={styles.eyebrow}>Totals</p>
                    <div className={styles.totalsList}>
                      <span>Subtotal <strong>{formatCurrency(quotation.subtotal, currency)}</strong></span>
                      <span>Discount ({quotation.discountPercentage || 0}%) <strong>{formatCurrency(quotation.discountAmount, currency)}</strong></span>
                      <span>Tax ({quotation.taxPercentage || 0}%) <strong>{formatCurrency(quotation.taxAmount, currency)}</strong></span>
                      <span>Shipping <strong>{formatCurrency(quotation.shippingAmount, currency)}</strong></span>
                      <span className={styles.grandTotal}>Grand Total <strong>{formatCurrency(quotation.grandTotal, currency)}</strong></span>
                    </div>
                  </article>

                  <article className={styles.panel}>
                    <p className={styles.eyebrow}>Terms</p>
                    <p className={styles.richText}>{quotation.terms || "No terms added."}</p>
                  </article>
                </section>

                <section className={styles.twoColumnGrid}>
                  <article className={styles.panel}>
                    <p className={styles.eyebrow}>Dealer Notes</p>
                    <p className={styles.richText}>{quotation.dealerNotes || "No dealer notes."}</p>
                  </article>

                  {!isDealer ? (
                    <article className={styles.panel}>
                      <p className={styles.eyebrow}>Internal Notes</p>
                      <p className={styles.richText}>{quotation.internalNotes || "No internal notes."}</p>
                    </article>
                  ) : null}
                </section>

                <section className={styles.twoColumnGrid}>
                  <article className={styles.panel}>
                    <p className={styles.eyebrow}>Timeline</p>
                    <div className={styles.timeline}>
                      {history.map((entry) => (
                        <div key={entry.id} className={styles.timelineItem}>
                          <div>
                            <strong>{labelStatus(entry.oldStatus)} to {labelStatus(entry.newStatus)}</strong>
                            <span>{entry.changedByName || "System"} - {formatDate(entry.createdAt, true)}</span>
                          </div>
                          {entry.note ? <p>{entry.note}</p> : null}
                        </div>
                      ))}
                    </div>
                  </article>

                  {!isDealer ? (
                    <article className={styles.panel}>
                      <p className={styles.eyebrow}>Audit Information</p>
                      <div className={styles.infoGrid}>
                        <InfoBlock label="Created At">{formatDate(quotation.createdAt, true)}</InfoBlock>
                        <InfoBlock label="Updated At">{formatDate(quotation.updatedAt, true)}</InfoBlock>
                        <InfoBlock label="Updated By">{quotation.updatedByName || "-"}</InfoBlock>
                        <InfoBlock label="Rejected At">{formatDate(quotation.rejectedAt, true)}</InfoBlock>
                        <InfoBlock label="Cancelled At">{formatDate(quotation.cancelledAt, true)}</InfoBlock>
                        <InfoBlock label="Converted At">{formatDate(quotation.convertedAt, true)}</InfoBlock>
                      </div>
                      {quotation.rejectionReason ? <p className={styles.auditReason}>Rejection: {quotation.rejectionReason}</p> : null}
                      {quotation.cancellationReason ? <p className={styles.auditReason}>Cancellation: {quotation.cancellationReason}</p> : null}
                    </article>
                  ) : null}
                </section>
              </>
            ) : null}
          </div>
        </main>

        <DashboardFooter />
      </div>

      <ToastStack toasts={toasts} onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))} />
    </div>
  );
}
