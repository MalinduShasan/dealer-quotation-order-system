import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./BrandManagement.module.css";
import { createBrand, getBrands, updateBrand, updateBrandStatus } from "../../api/brandService";

const statusOptions = ["active", "inactive"];
const pageSize = 10;

const initialFormState = {
  name: "",
  description: "",
  status: "active"
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function validateForm(values) {
  const errors = {};
  const name = values.name.trim();
  const description = values.description.trim();

  if (!name) {
    errors.name = "Name is required";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (name.length > 100) {
    errors.name = "Name must be at most 100 characters";
  }

  if (description.length > 500) {
    errors.description = "Description must be at most 500 characters";
  }

  if (!values.status) {
    errors.status = "Status is required";
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

function BrandFormModal({ isOpen, mode, values, errors, submitting, onChange, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="brand-modal-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{mode === "edit" ? "Update Brand" : "New Brand"}</p>
            <h2 id="brand-modal-title" className={styles.modalTitle}>
              {mode === "edit" ? "Edit brand" : "Add brand"}
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <form className={styles.formGrid} onSubmit={onSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="brand-name">
              Name
            </label>
            <input
              id="brand-name"
              name="name"
              className={`${styles.fieldInput} ${errors.name ? styles.fieldInputError : ""}`}
              value={values.name}
              onChange={onChange}
              placeholder="Brand name"
            />
            {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="brand-status">
              Status
            </label>
            <select
              id="brand-status"
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

          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel} htmlFor="brand-description">
              Description
            </label>
            <textarea
              id="brand-description"
              name="description"
              className={`${styles.fieldInput} ${styles.textArea} ${errors.description ? styles.fieldInputError : ""}`}
              value={values.description}
              onChange={onChange}
              placeholder="Brand description"
              rows={5}
            />
            {errors.description ? <span className={styles.fieldError}>{errors.description}</span> : null}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({ isOpen, brand, submitting, onClose, onConfirm }) {
  if (!isOpen || !brand) return null;

  const nextStatus = brand.status === "active" ? "inactive" : "active";

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.confirmCard} role="dialog" aria-modal="true" aria-labelledby="brand-confirm-title">
        <p className={styles.sectionEyebrow}>Confirmation Required</p>
        <h2 id="brand-confirm-title" className={styles.modalTitle}>
          {nextStatus === "inactive" ? "Deactivate this brand?" : "Activate this brand?"}
        </h2>
        <p className={styles.confirmText}>
          {brand.name} will be marked as <strong>{nextStatus}</strong>.
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.dangerButton} onClick={onConfirm} disabled={submitting}>
            {submitting ? "Updating..." : nextStatus === "inactive" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrandManagement({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [modalMode, setModalMode] = useState("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [confirmBrand, setConfirmBrand] = useState(null);
  const [toasts, setToasts] = useState([]);

  const summaryText = useMemo(() => (statusFilter === "all" ? "all brand statuses" : statusFilter), [statusFilter]);

  useEffect(() => {
    const loadBrands = async () => {
      if (!user?.token) return;

      setLoading(true);
      setTableError("");

      try {
        const { data } = await getBrands(user.token, {
          page: pagination.page,
          limit: pagination.limit,
          search: searchValue.trim(),
          status: statusFilter
        });

        setBrands(data.items || []);
        setPagination((current) => ({
          ...current,
          ...data.pagination
        }));
      } catch (error) {
        setTableError(error.response?.data?.message || "Failed to load brands");
      } finally {
        setLoading(false);
      }
    };

    loadBrands();
  }, [pagination.page, pagination.limit, searchValue, statusFilter, user]);

  useEffect(() => {
    setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
  }, [searchValue, statusFilter]);

  useEffect(() => {
    if (toasts.length === 0) return undefined;

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 4000);

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

  const reloadBrands = async (targetPage = pagination.page) => {
    const { data } = await getBrands(user.token, {
      page: targetPage,
      limit: pagination.limit,
      search: searchValue.trim(),
      status: statusFilter
    });

    setBrands(data.items || []);
    setPagination((current) => ({
      ...current,
      ...data.pagination
    }));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingBrand(null);
    setFormValues(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (brand) => {
    setModalMode("edit");
    setEditingBrand(brand);
    setFormValues({
      name: brand.name || "",
      description: brand.description || "",
      status: brand.status || "active"
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
    setEditingBrand(null);
    setFormErrors({});
    if (modalMode !== "edit") {
      setFormValues(initialFormState);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm(formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        status: formValues.status
      };

      if (modalMode === "edit" && editingBrand) {
        await updateBrand(user.token, editingBrand.id, payload);
        pushToast("success", "Brand updated", "The brand was updated successfully.");
      } else {
        await createBrand(user.token, payload);
        pushToast("success", "Brand created", "A new brand has been added.");
      }

      setIsModalOpen(false);
      setEditingBrand(null);
      setFormValues(initialFormState);
      await reloadBrands(modalMode === "create" ? 1 : pagination.page);
    } catch (error) {
      pushToast("error", "Save failed", error.response?.data?.message || "Unable to save brand");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmBrand) return;

    setSubmitting(true);

    try {
      const nextStatus = confirmBrand.status === "active" ? "inactive" : "active";
      await updateBrandStatus(user.token, confirmBrand.id, nextStatus);
      pushToast(
        "success",
        nextStatus === "active" ? "Brand activated" : "Brand deactivated",
        `${confirmBrand.name} is now ${nextStatus}.`
      );
      setConfirmBrand(null);
      await reloadBrands(pagination.page);
    } catch (error) {
      pushToast("error", "Status update failed", error.response?.data?.message || "Unable to update brand status");
    } finally {
      setSubmitting(false);
    }
  };

  const canManageBrands = user?.role === "admin";

  return (
    <div className={shellStyles.dashboardShell}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        onNavigate={navigate}
        onLogout={handleLogout}
        activeItem="brands"
      />

      <div className={shellStyles.workspace}>
        <Navbar
          currentPageTitle="Brand Management"
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
              <p className={styles.sectionEyebrow}>Brand Catalogue</p>
              <h1 className={styles.pageTitle}>Manage supplier and product brands in one place.</h1>
              <p className={styles.pageDescription}>
                Keep brand names, descriptions, and status control aligned across your commercial catalog and future product flows.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <div className={styles.heroMetric}>
                <span>Total Brands</span>
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
                <label htmlFor="brandStatusFilter">Status</label>
                <select id="brandStatusFilter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {canManageBrands ? (
              <button type="button" className={styles.primaryButton} onClick={openCreateModal}>
                Add Brand
              </button>
            ) : null}
          </section>

          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Brand Directory</p>
                <h2 className={styles.sectionTitle}>Brand registry</h2>
              </div>
              <p className={styles.sectionMeta}>
                Showing page {pagination.page} of {pagination.totalPages}
              </p>
            </div>

            {loading ? <div className={styles.stateBlock}>Loading brand records...</div> : null}
            {!loading && tableError ? <div className={styles.errorBlock}>{tableError}</div> : null}
            {!loading && !tableError && brands.length === 0 ? (
              <div className={styles.emptyBlock}>
                <strong>No brands found</strong>
                <p>Try a different search or adjust the status filter.</p>
              </div>
            ) : null}

            {!loading && !tableError && brands.length > 0 ? (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        {canManageBrands ? <th>Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map((brand) => (
                        <tr key={brand.id}>
                          <td data-label="Name">
                            <div className={styles.primaryCell}>
                              <strong>{brand.name}</strong>
                            </div>
                          </td>
                          <td data-label="Description">
                            <span className={styles.descriptionText}>{brand.description || "No description"}</span>
                          </td>
                          <td data-label="Status">
                            <span className={`${styles.badge} ${styles[brand.status]}`}>{brand.status}</span>
                          </td>
                          <td data-label="Created Date">{formatDate(brand.createdAt)}</td>
                          {canManageBrands ? (
                            <td data-label="Actions">
                              <div className={styles.actionRow}>
                                <button type="button" className={styles.actionButton} onClick={() => openEditModal(brand)}>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.actionButton} ${brand.status === "active" ? styles.actionDanger : styles.actionSuccess}`}
                                  onClick={() => setConfirmBrand(brand)}
                                >
                                  {brand.status === "active" ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.paginationRow}>
                  <p className={styles.paginationMeta}>
                    {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} brands
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

      <BrandFormModal
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
        isOpen={Boolean(confirmBrand)}
        brand={confirmBrand}
        submitting={submitting}
        onClose={() => setConfirmBrand(null)}
        onConfirm={handleToggleStatus}
      />

      <ToastStack toasts={toasts} onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))} />
    </div>
  );
}
