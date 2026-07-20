import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { EditIcon } from "../../components/dashboard/dashboardIcons";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./DealerManagement.module.css";
import { createDealer, getDealers, updateDealer, updateDealerStatus } from "../../api/dealerService";

const statusOptions = ["draft", "active", "inactive", "blocked"];
const pageSize = 10;

const initialFormState = {
  dealer_code: "",
  user_id: "",
  company_name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  country: "Sri Lanka",
  credit_limit: "",
  payment_terms: "",
  status: "active",
  notes: ""
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function validateForm(values) {
  const errors = {};

  if (!values.company_name.trim()) errors.company_name = "Company name is required";
  if (!values.contact_person.trim()) errors.contact_person = "Contact person is required";
  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (values.credit_limit !== "" && Number.isNaN(Number(values.credit_limit))) {
    errors.credit_limit = "Credit limit must be a valid number";
  }

  if (!values.status) errors.status = "Status is required";
  if (values.status !== "draft" && !values.user_id.trim()) {
    errors.user_id = "Linked dealer user is required unless this is a draft profile";
  }

  return errors;
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
          <button type="button" onClick={() => onDismiss(toast.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

function DealerFormModal({ isOpen, mode, values, errors, submitting, onChange, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="dealer-modal-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{mode === "edit" ? "Update Dealer" : "New Dealer"}</p>
            <h2 id="dealer-modal-title" className={styles.modalTitle}>
              {mode === "edit" ? "Edit dealer profile" : "Add dealer account"}
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <form className={styles.formGrid} onSubmit={onSubmit}>
          {[
            ["dealer_code", "Dealer Code", "Optional. Auto-generated if empty"],
            ["user_id", "Linked Dealer User ID", "Required unless status is draft"],
            ["company_name", "Company Name", "Registered dealer company"],
            ["contact_person", "Contact Person", "Primary contact"],
            ["email", "Email", "contact@company.com"],
            ["phone", "Phone", "Business phone number"],
            ["city", "City", "City"],
            ["province", "Province", "Province"],
            ["country", "Country", "Country"],
            ["credit_limit", "Credit Limit", "Allowed credit amount"],
            ["payment_terms", "Payment Terms", "Net 30 / COD / custom"],
            ["address", "Address", "Street address"],
            ["notes", "Notes", "Internal notes"]
          ].map(([name, label, placeholder]) => (
            <div
              key={name}
              className={`${styles.fieldGroup} ${name === "address" || name === "notes" ? styles.fieldGroupWide : ""}`}
            >
              <label className={styles.fieldLabel} htmlFor={`dealer-${name}`}>
                {label}
              </label>
              {name === "address" || name === "notes" ? (
                <textarea
                  id={`dealer-${name}`}
                  name={name}
                  className={`${styles.fieldInput} ${styles.textArea} ${errors[name] ? styles.fieldInputError : ""}`}
                  value={values[name]}
                  onChange={onChange}
                  placeholder={placeholder}
                  rows={3}
                />
              ) : (
                <input
                  id={`dealer-${name}`}
                  name={name}
                  type={name === "email" ? "email" : "text"}
                  className={`${styles.fieldInput} ${errors[name] ? styles.fieldInputError : ""}`}
                  value={values[name]}
                  onChange={onChange}
                  placeholder={placeholder}
                />
              )}
              {errors[name] ? <span className={styles.fieldError}>{errors[name]}</span> : null}
            </div>
          ))}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="dealer-status">
              Status
            </label>
            <select
              id="dealer-status"
              name="status"
              className={`${styles.fieldInput} ${errors.status ? styles.fieldInputError : ""}`}
              value={values.status}
              onChange={onChange}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status ? <span className={styles.fieldError}>{errors.status}</span> : null}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Dealer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({ isOpen, dealer, submitting, onClose, onConfirm }) {
  if (!isOpen || !dealer) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.confirmCard} role="dialog" aria-modal="true" aria-labelledby="dealer-confirm-title">
        <p className={styles.sectionEyebrow}>Confirmation Required</p>
        <h2 id="dealer-confirm-title" className={styles.modalTitle}>
          Change dealer status?
        </h2>
        <p className={styles.confirmText}>
          Update <strong>{dealer.companyName}</strong> from <strong>{dealer.status}</strong> to{" "}
          <strong>{dealer.nextStatus}</strong>.
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.dangerButton} onClick={onConfirm} disabled={submitting}>
            {submitting ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DealerManagement({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dealers, setDealers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [modalMode, setModalMode] = useState("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [confirmDealer, setConfirmDealer] = useState(null);
  const [toasts, setToasts] = useState([]);

  const summaryText = useMemo(
    () => (statusFilter === "all" ? "all dealer statuses" : statusFilter),
    [statusFilter]
  );

  useEffect(() => {
    const loadDealers = async () => {
      if (!user?.token) return;

      setLoading(true);
      setTableError("");

      try {
        const { data } = await getDealers(user.token, {
          page: pagination.page,
          limit: pagination.limit,
          search: searchValue.trim(),
          status: statusFilter
        });

        setDealers(data.items || []);
        setPagination((current) => ({ ...current, ...data.pagination }));
      } catch (error) {
        setTableError(error.response?.data?.message || "Failed to load dealers");
      } finally {
        setLoading(false);
      }
    };

    loadDealers();
  }, [pagination.page, pagination.limit, searchValue, statusFilter, user]);

  useEffect(() => {
    setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
  }, [searchValue, statusFilter]);

  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), 4000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pushToast = (type, title, message) => {
    setToasts((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, title, message }
    ]);
  };

  const reloadDealers = async (targetPage = pagination.page) => {
    const { data } = await getDealers(user.token, {
      page: targetPage,
      limit: pagination.limit,
      search: searchValue.trim(),
      status: statusFilter
    });
    setDealers(data.items || []);
    setPagination((current) => ({ ...current, ...data.pagination }));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingDealer(null);
    setFormValues(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (dealer) => {
    setModalMode("edit");
    setEditingDealer(dealer);
    setFormValues({
      dealer_code: dealer.dealerCode || "",
      user_id: dealer.userId || "",
      company_name: dealer.companyName || "",
      contact_person: dealer.contactPerson || "",
      email: dealer.email || "",
      phone: dealer.phone || "",
      address: dealer.address || "",
      city: dealer.city || "",
      province: dealer.province || "",
      country: dealer.country || "Sri Lanka",
      credit_limit: dealer.creditLimit ?? "",
      payment_terms: dealer.paymentTerms || "",
      status: dealer.status || "active",
      notes: dealer.notes || ""
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setEditingDealer(null);
    setFormErrors({});
    if (modalMode !== "edit") setFormValues(initialFormState);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formValues,
        user_id: formValues.user_id.trim() || null
      };

      if (modalMode === "edit" && editingDealer) {
        await updateDealer(user.token, editingDealer.id, payload);
        pushToast("success", "Dealer updated", "The dealer profile was updated successfully.");
      } else {
        await createDealer(user.token, payload);
        pushToast("success", "Dealer created", "A new dealer record has been added.");
      }

      setIsModalOpen(false);
      setEditingDealer(null);
      setFormValues(initialFormState);
      await reloadDealers(modalMode === "create" ? 1 : pagination.page);
    } catch (error) {
      pushToast("error", "Save failed", error.response?.data?.message || "Unable to save dealer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!confirmDealer) return;
    setSubmitting(true);
    try {
      await updateDealerStatus(user.token, confirmDealer.id, confirmDealer.nextStatus);
      pushToast("success", "Dealer status updated", `${confirmDealer.companyName} is now ${confirmDealer.nextStatus}.`);
      setConfirmDealer(null);
      await reloadDealers(pagination.page);
    } catch (error) {
      pushToast("error", "Status update failed", error.response?.data?.message || "Unable to update dealer status");
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
        onLogout={handleLogout}
        activeItem="dealers"
      />

      <div className={shellStyles.workspace}>
        <Navbar
          currentPageTitle="Dealer Management"
          user={user}
          theme={theme}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onToggleTheme={onToggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className={shellStyles.mainContent}>
          <section className={styles.heroCard}>
            <div>
              <p className={styles.sectionEyebrow}>Dealer Operations</p>
              <h1 className={styles.pageTitle}>Manage partner dealers and account health.</h1>
              <p className={styles.pageDescription}>
                Maintain dealer profiles, contact records, credit terms, and status changes from one operational desk.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <div className={styles.heroMetric}>
                <span>Total Dealers</span>
                <strong>{pagination.total}</strong>
              </div>
              <div className={styles.heroMetric}>
                <span>Current Filter</span>
                <strong>{summaryText}</strong>
              </div>
            </div>
          </section>

          <section className={styles.toolbarCard}>
            <div className={styles.filterGroup}>
              <div className={styles.inlineField}>
                <label htmlFor="dealerStatusFilter">Status</label>
                <select
                  id="dealerStatusFilter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="button" className={styles.primaryButton} onClick={openCreateModal}>
              Add Dealer
            </button>
          </section>

          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Partner Directory</p>
                <h2 className={styles.sectionTitle}>Dealer registry</h2>
              </div>
              <p className={styles.sectionMeta}>
                Showing page {pagination.page} of {pagination.totalPages}
              </p>
            </div>

            {loading ? <div className={styles.stateBlock}>Loading dealer records...</div> : null}
            {!loading && tableError ? <div className={styles.errorBlock}>{tableError}</div> : null}
            {!loading && !tableError && dealers.length === 0 ? (
              <div className={styles.emptyBlock}>
                <strong>No dealers found</strong>
                <p>Try a different search or adjust the status filter.</p>
              </div>
            ) : null}

            {!loading && !tableError && dealers.length > 0 ? (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Dealer</th>
                        <th>Code</th>
                        <th>Contact</th>
                        <th>City</th>
                        <th>Credit Limit</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dealers.map((dealer) => (
                        <tr key={dealer.id}>
                          <td>
                            <div className={styles.userCell}>
                              <strong>{dealer.companyName}</strong>
                              <span>{dealer.email}</span>
                            </div>
                          </td>
                          <td>{dealer.dealerCode}</td>
                          <td>
                            <div className={styles.userCell}>
                              <strong>{dealer.contactPerson}</strong>
                              <span>{dealer.phone || "No phone"}</span>
                            </div>
                          </td>
                          <td>{dealer.city || "N/A"}</td>
                          <td>{formatCurrency(dealer.creditLimit)}</td>
                          <td>
                            <span className={`${styles.badge} ${styles[dealer.status]}`}>{dealer.status}</span>
                          </td>
                          <td>
                            <div className={styles.actionRow}>
                              <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => openEditModal(dealer)}
                                aria-label={`Edit ${dealer.companyName}`}
                                title={`Edit ${dealer.companyName}`}
                              >
                                <EditIcon className={styles.actionIcon} />
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionButton} ${styles.actionWarning}`}
                                onClick={() =>
                                  setConfirmDealer({
                                    ...dealer,
                                    nextStatus:
                                      dealer.status === "draft"
                                        ? "active"
                                        : dealer.status === "active"
                                        ? "inactive"
                                        : dealer.status === "inactive"
                                          ? "blocked"
                                          : "active"
                                  })
                                }
                              >
                                Change Status
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.paginationRow}>
                  <p className={styles.paginationMeta}>
                    {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} dealers
                  </p>
                  <div className={styles.paginationActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </main>

        <DashboardFooter />
      </div>

      <DealerFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        values={formValues}
        errors={formErrors}
        submitting={submitting}
        onChange={handleFormChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDealer) && !isModalOpen}
        dealer={confirmDealer}
        submitting={submitting}
        onClose={() => setConfirmDealer(null)}
        onConfirm={handleChangeStatus}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))}
      />
    </div>
  );
}
