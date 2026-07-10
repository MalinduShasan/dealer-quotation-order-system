import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { EditIcon } from "../../components/dashboard/dashboardIcons";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./CategoryManagement.module.css";
import { createCategory, getCategories, updateCategory, updateCategoryStatus } from "../../api/categoryService";

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

function CategoryFormModal({ isOpen, mode, values, errors, submitting, onChange, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{mode === "edit" ? "Update Category" : "New Category"}</p>
            <h2 id="category-modal-title" className={styles.modalTitle}>
              {mode === "edit" ? "Edit category" : "Add category"}
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <form className={styles.formGrid} onSubmit={onSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="category-name">
              Name
            </label>
            <input
              id="category-name"
              name="name"
              className={`${styles.fieldInput} ${errors.name ? styles.fieldInputError : ""}`}
              value={values.name}
              onChange={onChange}
              placeholder="Category name"
            />
            {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="category-status">
              Status
            </label>
            <select
              id="category-status"
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
            <label className={styles.fieldLabel} htmlFor="category-description">
              Description
            </label>
            <textarea
              id="category-description"
              name="description"
              className={`${styles.fieldInput} ${styles.textArea} ${errors.description ? styles.fieldInputError : ""}`}
              value={values.description}
              onChange={onChange}
              placeholder="Category description"
              rows={5}
            />
            {errors.description ? <span className={styles.fieldError}>{errors.description}</span> : null}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({ isOpen, category, submitting, onClose, onConfirm }) {
  if (!isOpen || !category) return null;

  const nextStatus = category.status === "active" ? "inactive" : "active";

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.confirmCard} role="dialog" aria-modal="true" aria-labelledby="category-confirm-title">
        <p className={styles.sectionEyebrow}>Confirmation Required</p>
        <h2 id="category-confirm-title" className={styles.modalTitle}>
          {nextStatus === "inactive" ? "Deactivate this category?" : "Activate this category?"}
        </h2>
        <p className={styles.confirmText}>
          {category.name} will be marked as <strong>{nextStatus}</strong>.
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

export default function CategoryManagement({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [modalMode, setModalMode] = useState("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmCategory, setConfirmCategory] = useState(null);
  const [toasts, setToasts] = useState([]);

  const summaryText = useMemo(
    () => (statusFilter === "all" ? "all category statuses" : statusFilter),
    [statusFilter]
  );

  useEffect(() => {
    const loadCategories = async () => {
      if (!user?.token) return;

      setLoading(true);
      setTableError("");

      try {
        const { data } = await getCategories(user.token, {
          page: pagination.page,
          limit: pagination.limit,
          search: searchValue.trim(),
          status: statusFilter
        });

        setCategories(data.items || []);
        setPagination((current) => ({
          ...current,
          ...data.pagination
        }));
      } catch (error) {
        setTableError(error.response?.data?.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
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

  const reloadCategories = async (targetPage = pagination.page) => {
    const { data } = await getCategories(user.token, {
      page: targetPage,
      limit: pagination.limit,
      search: searchValue.trim(),
      status: statusFilter
    });

    setCategories(data.items || []);
    setPagination((current) => ({
      ...current,
      ...data.pagination
    }));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingCategory(null);
    setFormValues(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setModalMode("edit");
    setEditingCategory(category);
    setFormValues({
      name: category.name || "",
      description: category.description || "",
      status: category.status || "active"
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
    setEditingCategory(null);
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

      if (modalMode === "edit" && editingCategory) {
        await updateCategory(user.token, editingCategory.id, payload);
        pushToast("success", "Category updated", "The category was updated successfully.");
      } else {
        await createCategory(user.token, payload);
        pushToast("success", "Category created", "A new category has been added.");
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      setFormValues(initialFormState);
      await reloadCategories(modalMode === "create" ? 1 : pagination.page);
    } catch (error) {
      pushToast("error", "Save failed", error.response?.data?.message || "Unable to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmCategory) return;

    setSubmitting(true);

    try {
      const nextStatus = confirmCategory.status === "active" ? "inactive" : "active";
      await updateCategoryStatus(user.token, confirmCategory.id, nextStatus);
      pushToast(
        "success",
        nextStatus === "active" ? "Category activated" : "Category deactivated",
        `${confirmCategory.name} is now ${nextStatus}.`
      );
      setConfirmCategory(null);
      await reloadCategories(pagination.page);
    } catch (error) {
      pushToast("error", "Status update failed", error.response?.data?.message || "Unable to update category status");
    } finally {
      setSubmitting(false);
    }
  };

  const canManageCategories = user?.role === "admin";

  return (
    <div className={shellStyles.dashboardShell}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        onNavigate={navigate}
        onLogout={handleLogout}
        activeItem="categories"
      />

      <div className={shellStyles.workspace}>
        <Navbar
          currentPageTitle="Category Management"
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
              <p className={styles.sectionEyebrow}>Catalog Structure</p>
              <h1 className={styles.pageTitle}>Manage product categories cleanly and consistently.</h1>
              <p className={styles.pageDescription}>
                Organize your product catalog with category names, descriptions, and status control from one compact workspace.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <div className={styles.heroMetric}>
                <span>Total Categories</span>
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
                <label htmlFor="categoryStatusFilter">Status</label>
                <select
                  id="categoryStatusFilter"
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

            {canManageCategories ? (
              <button type="button" className={styles.primaryButton} onClick={openCreateModal}>
                Add Category
              </button>
            ) : null}
          </section>

          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Category Directory</p>
                <h2 className={styles.sectionTitle}>Category registry</h2>
              </div>
              <p className={styles.sectionMeta}>
                Showing page {pagination.page} of {pagination.totalPages}
              </p>
            </div>

            {loading ? <div className={styles.stateBlock}>Loading category records...</div> : null}
            {!loading && tableError ? <div className={styles.errorBlock}>{tableError}</div> : null}
            {!loading && !tableError && categories.length === 0 ? (
              <div className={styles.emptyBlock}>
                <strong>No categories found</strong>
                <p>Try a different search or adjust the status filter.</p>
              </div>
            ) : null}

            {!loading && !tableError && categories.length > 0 ? (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        {canManageCategories ? <th>Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id}>
                          <td data-label="Name">
                            <div className={styles.primaryCell}>
                              <strong>{category.name}</strong>
                            </div>
                          </td>
                          <td data-label="Description">
                            <span className={styles.descriptionText}>{category.description || "No description"}</span>
                          </td>
                          <td data-label="Status">
                            <span className={`${styles.badge} ${styles[category.status]}`}>{category.status}</span>
                          </td>
                          <td data-label="Created Date">{formatDate(category.createdAt)}</td>
                          {canManageCategories ? (
                            <td data-label="Actions">
                              <div className={styles.actionRow}>
                                <button
                                  type="button"
                                  className={styles.actionButton}
                                  onClick={() => openEditModal(category)}
                                  aria-label={`Edit ${category.name}`}
                                  title={`Edit ${category.name}`}
                                >
                                  <EditIcon className={styles.actionIcon} />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.actionButton} ${category.status === "active" ? styles.actionDanger : styles.actionSuccess}`}
                                  onClick={() => setConfirmCategory(category)}
                                >
                                  {category.status === "active" ? "Deactivate" : "Activate"}
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
                    {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} categories
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

      <CategoryFormModal
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
        isOpen={Boolean(confirmCategory)}
        category={confirmCategory}
        submitting={submitting}
        onClose={() => setConfirmCategory(null)}
        onConfirm={handleToggleStatus}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))}
      />
    </div>
  );
}
