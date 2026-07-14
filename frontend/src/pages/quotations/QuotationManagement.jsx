import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./QuotationManagement.module.css";
import {
  acceptQuotation,
  approveQuotation,
  cancelQuotation,
  declineQuotation,
  duplicateQuotation,
  getQuotationById,
  getQuotationHistory,
  getQuotations,
  rejectQuotation,
  sendQuotation,
  submitQuotation
} from "../../api/quotationService";
import QuotationCards from "./components/QuotationCards";
import QuotationEmptyState from "./components/QuotationEmptyState";
import QuotationFilters from "./components/QuotationFilters";
import QuotationSkeleton from "./components/QuotationSkeleton";
import QuotationSummaryCards from "./components/QuotationSummaryCards";
import QuotationTable from "./components/QuotationTable";
import QuotationStatusBadge from "./components/QuotationStatusBadge";

const pageSize = 10;

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button type="button" onClick={() => onDismiss(toast.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function QuotationViewModal({ quotation, history, loading, onClose }) {
  if (!quotation) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="quotation-view-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Quotation Overview</p>
            <h2 id="quotation-view-title" className={styles.modalTitle}>{quotation.quotationNumber}</h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>Close</button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <span className={styles.detailLabel}>Dealer</span>
              <strong>{quotation.dealer?.companyName || "—"}</strong>
            </div>
            <div className={styles.detailCard}>
              <span className={styles.detailLabel}>Status</span>
              <QuotationStatusBadge status={quotation.status} />
            </div>
            <div className={styles.detailCard}>
              <span className={styles.detailLabel}>Created By</span>
              <strong>{quotation.createdByName || "System"}</strong>
            </div>
            <div className={styles.detailCard}>
              <span className={styles.detailLabel}>Grand Total</span>
              <strong>{formatCurrency(quotation.grandTotal)}</strong>
            </div>
            <div className={`${styles.detailCard} ${styles.detailCardWide}`}>
              <span className={styles.detailLabel}>Terms</span>
              <span>{quotation.terms || "No terms added."}</span>
            </div>
            <div className={`${styles.detailCard} ${styles.detailCardWide}`}>
              <span className={styles.detailLabel}>Dealer Notes</span>
              <span>{quotation.dealerNotes || "No dealer notes."}</span>
            </div>
          </div>

          <div>
            <p className={styles.sectionEyebrow}>Items</p>
            <div className={styles.itemsList}>
              {(quotation.items || []).map((item) => (
                <div key={item.id} className={styles.itemCard}>
                  <strong>{item.productNameSnapshot || item.product?.name || "Product"}</strong>
                  <p className={styles.mutedText}>
                    {item.productSkuSnapshot || item.product?.sku || "No SKU"} • Qty {item.quantity} • {formatCurrency(item.lineTotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className={styles.sectionEyebrow}>Status Timeline</p>
            {loading ? (
              <div className={styles.stateBlock}>Loading quotation history…</div>
            ) : (
              <div className={styles.timelineList}>
                {(history || []).map((entry) => (
                  <div key={entry.id} className={styles.timelineItem}>
                    <div className={styles.timelineHeader}>
                      <strong>{entry.newStatus.replaceAll("_", " ")}</strong>
                      <span className={styles.mutedText}>{formatDate(entry.createdAt)}</span>
                    </div>
                    <p className={styles.timelineNote}>
                      {entry.changedByName || "System"}{entry.note ? ` • ${entry.note}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuotationManagement({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    validity: "all",
    sortBy: "created_at",
    sortOrder: "desc"
  });
  const [quotations, setQuotations] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewQuotation, setViewQuotation] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const loadQuotations = async () => {
      if (!user?.token) return;
      setLoading(true);
      setError("");
      try {
        const { data } = await getQuotations(user.token, {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          status: filters.status,
          validity: filters.validity,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder
        });
        setQuotations(data.items || []);
        setSummary(data.summary || {});
        setPagination((current) => ({ ...current, ...data.pagination }));
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Failed to load quotations");
      } finally {
        setLoading(false);
      }
    };

    loadQuotations();
  }, [filters, pagination.page, pagination.limit, user]);

  useEffect(() => {
    setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
  }, [filters.search, filters.status, filters.validity, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), 4000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const pushToast = (type, title, message) =>
    setToasts((current) => [...current, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, title, message }]);

  const summaryText = useMemo(() => {
    if (filters.status !== "all") return filters.status.replaceAll("_", " ");
    if (filters.validity !== "all") return filters.validity.replaceAll("_", " ");
    return "all quotations";
  }, [filters]);

  const reload = async () => {
    const { data } = await getQuotations(user.token, {
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      status: filters.status,
      validity: filters.validity,
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder
    });
    setQuotations(data.items || []);
    setSummary(data.summary || {});
    setPagination((current) => ({ ...current, ...data.pagination }));
  };

  const handleView = async (quotation) => {
    setViewQuotation(quotation);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const [{ data: detail }, { data: historyData }] = await Promise.all([
        getQuotationById(user.token, quotation.id),
        getQuotationHistory(user.token, quotation.id)
      ]);
      setViewQuotation(detail);
      setHistory(historyData.items || []);
    } catch (loadError) {
      pushToast("error", "Load failed", loadError.response?.data?.message || "Unable to load quotation details");
    } finally {
      setHistoryLoading(false);
    }
  };

  const actionHandlers = {
    submit: submitQuotation,
    approve: approveQuotation,
    reject: rejectQuotation,
    send: sendQuotation,
    accept: acceptQuotation,
    decline: declineQuotation,
    cancel: cancelQuotation,
    duplicate: duplicateQuotation
  };

  const handleAction = async (action, quotation) => {
    if (action === "edit") {
      pushToast("info", "Builder pending", "Quotation builder screens will be wired in the next stage.");
      return;
    }

    if (action === "convert") {
      pushToast("info", "Conversion pending", "Order conversion preparation is reserved for the next stage.");
      return;
    }

    const handler = actionHandlers[action];
    if (!handler) return;

    const reason = ["reject", "decline", "cancel"].includes(action)
      ? window.prompt("Enter a reason for this action:") || ""
      : "";

    try {
      await handler(user.token, quotation.id, reason);
      pushToast("success", "Quotation updated", `${quotation.quotationNumber} was updated successfully.`);
      await reload();
      if (viewQuotation?.id === quotation.id) {
        handleView(quotation);
      }
    } catch (actionError) {
      pushToast("error", "Action failed", actionError.response?.data?.message || "Unable to update quotation");
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
          currentPageTitle="Quotation Management"
          user={user}
          theme={theme}
          searchValue={filters.search}
          onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          onToggleTheme={onToggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={() => { logout(); navigate("/login"); }}
        />

        <main className={shellStyles.mainContent}>
          <div className={styles.page}>
            <section className={styles.heroCard}>
              <div>
                <p className={styles.sectionEyebrow}>QuoteFlow Quotations</p>
                <h1 className={styles.heroTitle}>Control the full dealer quotation workflow with audit-ready visibility.</h1>
                <p className={styles.heroText}>
                  Review quotations, monitor lifecycle stages, and prepare approvals or dealer responses from one commercial workspace.
                </p>
              </div>
              <div className={styles.mutedText}>Showing {summaryText}</div>
            </section>

            <QuotationSummaryCards summary={summary} />

            <section className={styles.toolbarCard}>
              <QuotationFilters
                filters={filters}
                onChange={(field, value) => setFilters((current) => ({ ...current, [field]: value }))}
                onReset={() => setFilters({ search: "", status: "all", validity: "all", sortBy: "created_at", sortOrder: "desc" })}
              />
            </section>

            <section className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Quotation Directory</p>
                  <h2 className={styles.sectionTitle}>Active quotation register</h2>
                </div>
                <div className={styles.mutedText}>
                  {loading ? "Loading…" : `${pagination.total} quotations • page ${pagination.page} of ${pagination.totalPages}`}
                </div>
              </div>

              {loading ? <QuotationSkeleton /> : null}
              {!loading && error ? <div className={styles.stateBlock}>{error}</div> : null}
              {!loading && !error && quotations.length === 0 ? (
                <QuotationEmptyState title="No quotations found" message="Try changing the filters or create the first quotation in the next implementation stage." />
              ) : null}
              {!loading && !error && quotations.length > 0 ? (
                <>
                  <QuotationTable items={quotations} userRole={user.role} onView={handleView} onAction={handleAction} />
                  <QuotationCards items={quotations} userRole={user.role} onView={handleView} onAction={handleAction} />
                  <div className={styles.paginationRow}>
                    <span className={styles.mutedText}>
                      {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <div className={styles.modalActions}>
                      <button type="button" className={styles.secondaryButton} disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>
                        Previous
                      </button>
                      <button type="button" className={styles.secondaryButton} disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </main>

        <DashboardFooter />
      </div>

      <QuotationViewModal
        quotation={viewQuotation}
        history={history}
        loading={historyLoading}
        onClose={() => {
          setViewQuotation(null);
          setHistory([]);
        }}
      />

      <ToastStack toasts={toasts} onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))} />
    </div>
  );
}
