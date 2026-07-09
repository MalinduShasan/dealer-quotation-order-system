import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./UserManagement.module.css";
import { createUser, getUsers, updateUser, updateUserStatus } from "../../api/userService";

const roleOptions = ["admin", "manager", "sales_executive", "dealer"];
const statusOptions = ["active", "inactive", "suspended"];
const pageSize = 10;

const initialFormState = {
  name: "",
  email: "",
  password: "",
  role: "manager",
  status: "active"
};

function formatRole(role) {
  return role.replace(/_/g, " ");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function validateForm(values, isEditMode) {
  const errors = {};

  if (!values.name.trim()) errors.name = "Name is required";
  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!isEditMode && !values.password) {
    errors.password = "Password is required";
  } else if (values.password && values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!values.role) errors.role = "Role is required";
  if (!values.status) errors.status = "Status is required";

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

function UserFormModal({
  isOpen,
  mode,
  values,
  errors,
  submitting,
  onChange,
  onClose,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{mode === "edit" ? "Update User" : "New User"}</p>
            <h2 id="user-modal-title" className={styles.modalTitle}>
              {mode === "edit" ? "Edit system user" : "Add system user"}
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <form className={styles.formGrid} onSubmit={onSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="user-name">
              Full Name
            </label>
            <input
              id="user-name"
              name="name"
              className={`${styles.fieldInput} ${errors.name ? styles.fieldInputError : ""}`}
              value={values.name}
              onChange={onChange}
              placeholder="Enter full name"
            />
            {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="user-email">
              Email
            </label>
            <input
              id="user-email"
              name="email"
              type="email"
              className={`${styles.fieldInput} ${errors.email ? styles.fieldInputError : ""}`}
              value={values.email}
              onChange={onChange}
              placeholder="name@company.com"
            />
            {errors.email ? <span className={styles.fieldError}>{errors.email}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="user-password">
              {mode === "edit" ? "New Password" : "Password"}
            </label>
            <input
              id="user-password"
              name="password"
              type="password"
              className={`${styles.fieldInput} ${errors.password ? styles.fieldInputError : ""}`}
              value={values.password}
              onChange={onChange}
              placeholder={mode === "edit" ? "Leave blank to keep current password" : "Minimum 8 characters"}
            />
            {errors.password ? <span className={styles.fieldError}>{errors.password}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              name="role"
              className={`${styles.fieldInput} ${errors.role ? styles.fieldInputError : ""}`}
              value={values.role}
              onChange={onChange}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {formatRole(role)}
                </option>
              ))}
            </select>
            {errors.role ? <span className={styles.fieldError}>{errors.role}</span> : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="user-status">
              Status
            </label>
            <select
              id="user-status"
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
              {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({ isOpen, user, submitting, onClose, onConfirm }) {
  if (!isOpen || !user) return null;

  const nextStatus = user.status === "active" ? "inactive" : "active";

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.confirmCard} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <p className={styles.sectionEyebrow}>Confirmation Required</p>
        <h2 id="confirm-title" className={styles.modalTitle}>
          {nextStatus === "inactive" ? "Deactivate this user?" : "Activate this user?"}
        </h2>
        <p className={styles.confirmText}>
          {nextStatus === "inactive"
            ? `${user.name} will lose access until an admin reactivates the account.`
            : `${user.name} will regain access to the QuoteFlow workspace.`}
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.dangerButton} onClick={onConfirm} disabled={submitting}>
            {submitting ? "Updating..." : nextStatus === "inactive" ? "Deactivate User" : "Activate User"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [modalMode, setModalMode] = useState("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  const summaryText = useMemo(() => {
    const parts = [];
    if (roleFilter !== "all") parts.push(formatRole(roleFilter));
    if (statusFilter !== "all") parts.push(statusFilter);
    return parts.length > 0 ? parts.join(" / ") : "all roles and statuses";
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!user?.token) return;

      setLoading(true);
      setTableError("");

      try {
        const { data } = await getUsers(user.token, {
          page: pagination.page,
          limit: pagination.limit,
          search: searchValue.trim(),
          role: roleFilter,
          status: statusFilter
        });

        setUsers(data.items || []);
        setPagination((current) => ({
          ...current,
          ...data.pagination
        }));
      } catch (error) {
        setTableError(error.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [pagination.page, pagination.limit, roleFilter, searchValue, statusFilter, user]);

  useEffect(() => {
    setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
  }, [searchValue, roleFilter, statusFilter]);

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
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        title,
        message
      }
    ]);
  };

  const reloadUsers = async (targetPage = pagination.page) => {
    const { data } = await getUsers(user.token, {
      page: targetPage,
      limit: pagination.limit,
      search: searchValue.trim(),
      role: roleFilter,
      status: statusFilter
    });

    setUsers(data.items || []);
    setPagination((current) => ({
      ...current,
      ...data.pagination
    }));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingUser(null);
    setFormValues(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (selectedUser) => {
    setModalMode("edit");
    setEditingUser(selectedUser);
    setFormValues({
      name: selectedUser.name,
      email: selectedUser.email,
      password: "",
      role: selectedUser.role,
      status: selectedUser.status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const selectedEditUser = modalMode === "edit" ? editingUser : null;

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setFormErrors({});
    setEditingUser(null);
    if (modalMode !== "edit") {
      setFormValues(initialFormState);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm(formValues, modalMode === "edit");
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      if (modalMode === "edit" && selectedEditUser) {
        await updateUser(user.token, selectedEditUser.id, {
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
          role: formValues.role,
          status: formValues.status
        });
        pushToast("success", "User updated", "The user profile was updated successfully.");
      } else {
        await createUser(user.token, {
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          password: formValues.password,
          role: formValues.role,
          status: formValues.status
        });
        pushToast("success", "User created", "A new system user has been added.");
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setFormValues(initialFormState);
      await reloadUsers(modalMode === "create" ? 1 : pagination.page);
    } catch (error) {
      pushToast("error", "Save failed", error.response?.data?.message || "Unable to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmUser) return;

    setSubmitting(true);

    try {
      const nextStatus = confirmUser.status === "active" ? "inactive" : "active";
      await updateUserStatus(user.token, confirmUser.id, nextStatus);
      pushToast(
        "success",
        nextStatus === "active" ? "User activated" : "User deactivated",
        `${confirmUser.name} is now marked as ${nextStatus}.`
      );
      setConfirmUser(null);
      await reloadUsers(pagination.page);
    } catch (error) {
      pushToast("error", "Status update failed", error.response?.data?.message || "Unable to update user status");
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
        activeItem="users"
      />

      <div className={shellStyles.workspace}>
        <Navbar
          currentPageTitle="User Management"
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
              <p className={styles.sectionEyebrow}>Administration</p>
              <h1 className={styles.pageTitle}>Manage platform users with controlled access.</h1>
              <p className={styles.pageDescription}>
                Create accounts, assign roles, update status, and keep internal access aligned with current operations.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <div className={styles.heroMetric}>
                <span>Total Records</span>
                <strong>{pagination.total}</strong>
              </div>
              <div className={styles.heroMetric}>
                <span>Current Filters</span>
                <strong>{summaryText}</strong>
              </div>
            </div>
          </section>

          <section className={styles.toolbarCard}>
            <div className={styles.filterGroup}>
              <div className={styles.inlineField}>
                <label htmlFor="roleFilter">Role</label>
                <select id="roleFilter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">All roles</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inlineField}>
                <label htmlFor="statusFilter">Status</label>
                <select id="statusFilter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
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
              Add User
            </button>
          </section>

          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <p className={styles.sectionEyebrow}>System Directory</p>
                <h2 className={styles.sectionTitle}>User access registry</h2>
              </div>
              <p className={styles.sectionMeta}>
                Showing page {pagination.page} of {pagination.totalPages}
              </p>
            </div>

            {loading ? <div className={styles.stateBlock}>Loading user records...</div> : null}
            {!loading && tableError ? <div className={styles.errorBlock}>{tableError}</div> : null}
            {!loading && !tableError && users.length === 0 ? (
              <div className={styles.emptyBlock}>
                <strong>No users found</strong>
                <p>Try a different search or adjust the role and status filters.</p>
              </div>
            ) : null}

            {!loading && !tableError && users.length > 0 ? (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <div className={styles.userCell}>
                              <strong>{entry.name}</strong>
                              <span>{entry.email}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${styles.roleBadge}`}>{formatRole(entry.role)}</span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${styles[entry.status]}`}>{entry.status}</span>
                          </td>
                          <td>{formatDate(entry.createdAt)}</td>
                          <td>{formatDate(entry.updatedAt)}</td>
                          <td>
                            <div className={styles.actionRow}>
                              <button type="button" className={styles.actionButton} onClick={() => openEditModal(entry)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionButton} ${entry.status === "active" ? styles.actionDanger : styles.actionSuccess}`}
                                onClick={() => setConfirmUser(entry)}
                              >
                                {entry.status === "active" ? "Deactivate" : "Activate"}
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
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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

      <UserFormModal
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
        isOpen={Boolean(confirmUser) && !isModalOpen}
        user={confirmUser}
        submitting={submitting}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleToggleStatus}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))}
      />
    </div>
  );
}
