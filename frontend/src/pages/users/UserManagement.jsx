import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./UserManagement.module.css";
import { createUser, getUsers, updateUser, updateUserStatus } from "../../api/userService";
import { createDealer, getDealerById } from "../../api/dealerService";

const roleOptions = ["admin", "manager", "sales_executive", "dealer"];
const statusOptions = ["active", "inactive", "suspended"];
const dealerStatusOptions = ["active", "inactive", "blocked"];
const pageSize = 10;

const initialFormState = {
  name: "",
  email: "",
  password: "",
  role: "manager",
  status: "active"
};

const initialDealerProfileForm = {
  user_id: "",
  linkedUserName: "",
  linkedUserEmail: "",
  company_name: "",
  contact_person: "",
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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function validateUserForm(values, isEditMode) {
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

function validateDealerProfileForm(values) {
  const errors = {};

  if (!values.company_name.trim()) errors.company_name = "Company name is required";
  if (!values.contact_person.trim()) errors.contact_person = "Contact person is required";
  if (values.credit_limit !== "" && Number.isNaN(Number(values.credit_limit))) {
    errors.credit_limit = "Credit limit must be a valid number";
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

function UserFormModal({ isOpen, mode, values, errors, submitting, onChange, onClose, onSubmit }) {
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

function DealerProfileCreateModal({ isOpen, values, errors, submitting, onChange, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={`${styles.modalCard} ${styles.dealerProfileModal}`} role="dialog" aria-modal="true" aria-labelledby="dealer-profile-modal-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Dealer Profile</p>
            <h2 id="dealer-profile-modal-title" className={styles.modalTitle}>
              Create linked dealer profile
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <form className={styles.dealerProfileGrid} onSubmit={onSubmit}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="dealer-linked-user">
              Dealer User
            </label>
            <input id="dealer-linked-user" className={styles.fieldInput} value={values.user_id} disabled readOnly />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="dealer-linked-name">
              Name
            </label>
            <input id="dealer-linked-name" className={styles.fieldInput} value={values.linkedUserName} disabled readOnly />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="dealer-linked-email">
              Email
            </label>
            <input id="dealer-linked-email" className={styles.fieldInput} value={values.linkedUserEmail} disabled readOnly />
          </div>

          {[
            ["company_name", "Company Name", "Registered dealer company"],
            ["contact_person", "Contact Person", "Primary contact"],
            ["phone", "Phone", "Business phone number"],
            ["city", "City", "City"],
            ["province", "Province", "Province"],
            ["country", "Country", "Country"],
            ["credit_limit", "Credit Limit", "Allowed credit amount"],
            ["payment_terms", "Payment Terms", "Net 30 / COD / custom"]
          ].map(([name, label, placeholder]) => (
            <div key={name} className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor={`profile-${name}`}>
                {label}
              </label>
              <input
                id={`profile-${name}`}
                name={name}
                className={`${styles.fieldInput} ${errors[name] ? styles.fieldInputError : ""}`}
                value={values[name]}
                onChange={onChange}
                placeholder={placeholder}
              />
              {errors[name] ? <span className={styles.fieldError}>{errors[name]}</span> : null}
            </div>
          ))}

          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel} htmlFor="profile-address">
              Address
            </label>
            <textarea
              id="profile-address"
              name="address"
              className={`${styles.fieldInput} ${styles.textArea}`}
              value={values.address}
              onChange={onChange}
              placeholder="Street address"
              rows={3}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="profile-status">
              Status
            </label>
            <select
              id="profile-status"
              name="status"
              className={`${styles.fieldInput} ${errors.status ? styles.fieldInputError : ""}`}
              value={values.status}
              onChange={onChange}
            >
              {dealerStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status ? <span className={styles.fieldError}>{errors.status}</span> : null}
          </div>

          <div className={`${styles.fieldGroup} ${styles.fieldGroupWide}`}>
            <label className={styles.fieldLabel} htmlFor="profile-notes">
              Notes
            </label>
            <textarea
              id="profile-notes"
              name="notes"
              className={`${styles.fieldInput} ${styles.textArea}`}
              value={values.notes}
              onChange={onChange}
              placeholder="Internal notes"
              rows={3}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              {submitting ? "Saving..." : "Create Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealerProfileViewModal({ isOpen, profile, loading, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={`${styles.modalCard} ${styles.profileDetailsModal}`} role="dialog" aria-modal="true" aria-labelledby="dealer-profile-view-title">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Dealer Profile</p>
            <h2 id="dealer-profile-view-title" className={styles.modalTitle}>
              Linked dealer details
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        {loading ? (
          <div className={styles.stateBlock}>Loading dealer profile...</div>
        ) : profile ? (
          <div className={styles.profileDetailsGrid}>
            {[
              ["Dealer Code", profile.dealerCode],
              ["Company Name", profile.companyName],
              ["Contact Person", profile.contactPerson],
              ["Email", profile.email],
              ["Phone", profile.phone || "N/A"],
              ["City", profile.city || "N/A"],
              ["Province", profile.province || "N/A"],
              ["Country", profile.country || "N/A"],
              ["Credit Limit", formatCurrency(profile.creditLimit)],
              ["Payment Terms", profile.paymentTerms || "N/A"],
              ["Status", profile.status]
            ].map(([label, value]) => (
              <div key={label} className={styles.detailCard}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}

            <div className={`${styles.detailCard} ${styles.detailCardWide}`}>
              <span>Address</span>
              <strong>{profile.address || "N/A"}</strong>
            </div>
            <div className={`${styles.detailCard} ${styles.detailCardWide}`}>
              <span>Notes</span>
              <strong>{profile.notes || "N/A"}</strong>
            </div>
          </div>
        ) : (
          <div className={styles.emptyBlock}>
            <strong>No profile data available</strong>
          </div>
        )}
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
  const [profileCreateUser, setProfileCreateUser] = useState(null);
  const [profileFormValues, setProfileFormValues] = useState(initialDealerProfileForm);
  const [profileFormErrors, setProfileFormErrors] = useState({});
  const [profileViewUser, setProfileViewUser] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [profileDetailsLoading, setProfileDetailsLoading] = useState(false);
  const [expandedProfileIds, setExpandedProfileIds] = useState([]);
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

  const openProfileCreateModal = (selectedUser) => {
    if (selectedUser.role !== "dealer") {
      pushToast("error", "Profile unavailable", "Only users with dealer role can have dealer profiles.");
      return;
    }

    if (selectedUser.dealerProfileExists) {
      pushToast("error", "Dealer profile already exists", "This dealer user is already linked to a dealer profile.");
      return;
    }

    setProfileCreateUser(selectedUser);
    setProfileFormValues({
      ...initialDealerProfileForm,
      user_id: selectedUser.id,
      linkedUserName: selectedUser.name,
      linkedUserEmail: selectedUser.email
    });
    setProfileFormErrors({});
  };

  const openProfileViewModal = async (selectedUser) => {
    if (!selectedUser.dealerId) return;

    setProfileViewUser(selectedUser);
    setProfileDetails(null);
    setProfileDetailsLoading(true);

    try {
      const { data } = await getDealerById(user.token, selectedUser.dealerId);
      setProfileDetails(data);
    } catch (error) {
      pushToast("error", "Profile load failed", error.response?.data?.message || "Unable to load dealer profile");
    } finally {
      setProfileDetailsLoading(false);
    }
  };

  const selectedEditUser = modalMode === "edit" ? editingUser : null;

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleProfileFormChange = (event) => {
    const { name, value } = event.target;
    setProfileFormValues((current) => ({ ...current, [name]: value }));
    setProfileFormErrors((current) => ({ ...current, [name]: "" }));
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

  const closeProfileCreateModal = () => {
    if (submitting) return;
    setProfileCreateUser(null);
    setProfileFormValues(initialDealerProfileForm);
    setProfileFormErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateUserForm(formValues, modalMode === "edit");
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

  const handleCreateDealerProfile = async (event) => {
    event.preventDefault();

    const errors = validateDealerProfileForm(profileFormValues);
    setProfileFormErrors(errors);

    if (Object.keys(errors).length > 0 || !profileCreateUser) {
      return;
    }

    setSubmitting(true);

    try {
      await createDealer(user.token, {
        user_id: profileFormValues.user_id,
        company_name: profileFormValues.company_name.trim(),
        contact_person: profileFormValues.contact_person.trim(),
        email: profileFormValues.linkedUserEmail,
        phone: profileFormValues.phone.trim(),
        address: profileFormValues.address.trim(),
        city: profileFormValues.city.trim(),
        province: profileFormValues.province.trim(),
        country: profileFormValues.country.trim(),
        credit_limit: profileFormValues.credit_limit,
        payment_terms: profileFormValues.payment_terms.trim(),
        status: profileFormValues.status,
        notes: profileFormValues.notes.trim()
      });

      pushToast("success", "Dealer profile created", "The dealer user is now linked to a dealer profile.");
      setProfileCreateUser(null);
      setProfileFormValues(initialDealerProfileForm);
      await reloadUsers(pagination.page);
    } catch (error) {
      pushToast("error", "Profile creation failed", error.response?.data?.message || "Unable to create dealer profile");
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

  const toggleProfileExpansion = (userId) => {
    setExpandedProfileIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const renderDealerProfileCell = (entry) => {
    if (entry.role !== "dealer") {
      return (
        <div className={styles.profileCell}>
          <span className={`${styles.badge} ${styles.naBadge}`}>N/A</span>
        </div>
      );
    }

    if (!entry.dealerProfileExists) {
      return (
        <div className={`${styles.profileCell} ${styles.profileCellInline}`}>
          <button type="button" className={styles.profileActionButton} onClick={() => openProfileCreateModal(entry)}>
            Create Profile
          </button>
        </div>
      );
    }

    const isExpanded = expandedProfileIds.includes(entry.id);

    return (
      <div className={`${styles.profileCell} ${styles.profileCellLinked}`}>
        <div className={styles.profileSummaryRow}>
          <span className={`${styles.badge} ${styles.linkedBadge}`}>Linked</span>
          <button
            type="button"
            className={`${styles.profileExpandButton} ${isExpanded ? styles.profileExpandButtonOpen : ""}`}
            onClick={() => toggleProfileExpansion(entry.id)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Hide dealer profile details" : "Show dealer profile details"}
          >
            <span className={styles.profileExpandChevron} />
          </button>
        </div>

        {isExpanded ? (
          <div className={styles.profileDetailsInline}>
            <div className={styles.profileMeta}>
              <strong>{entry.dealerCode}</strong>
              <span>{entry.companyName}</span>
            </div>
            <button type="button" className={styles.profileActionButton} onClick={() => openProfileViewModal(entry)}>
              View Profile
            </button>
          </div>
        ) : null}
      </div>
    );
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
                        <th>Dealer Profile</th>
                        <th>Created</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((entry) => (
                        <tr key={entry.id}>
                          <td data-label="User">
                            <div className={styles.userCell}>
                              <strong>{entry.name}</strong>
                              <span>{entry.email}</span>
                            </div>
                          </td>
                          <td data-label="Role">
                            <span className={`${styles.badge} ${styles.roleBadge}`}>{formatRole(entry.role)}</span>
                          </td>
                          <td data-label="Status">
                            <span className={`${styles.badge} ${styles[entry.status]}`}>{entry.status}</span>
                          </td>
                          <td data-label="Dealer Profile">{renderDealerProfileCell(entry)}</td>
                          <td data-label="Created">{formatDate(entry.createdAt)}</td>
                          <td data-label="Updated">{formatDate(entry.updatedAt)}</td>
                          <td data-label="Actions">
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

      <DealerProfileCreateModal
        isOpen={Boolean(profileCreateUser)}
        values={profileFormValues}
        errors={profileFormErrors}
        submitting={submitting}
        onChange={handleProfileFormChange}
        onClose={closeProfileCreateModal}
        onSubmit={handleCreateDealerProfile}
      />

      <DealerProfileViewModal
        isOpen={Boolean(profileViewUser)}
        profile={profileDetails}
        loading={profileDetailsLoading}
        onClose={() => {
          setProfileViewUser(null);
          setProfileDetails(null);
        }}
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
