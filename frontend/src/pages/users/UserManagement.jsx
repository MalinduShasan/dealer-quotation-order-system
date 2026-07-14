import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { EditIcon } from "../../components/dashboard/dashboardIcons";
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
  status: "active",
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
  notes: "",
};

function formatRole(role) {
  return role.replace(/_/g, " ");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

/* ─── Avatar initials ─── */

function Avatar({ name }) {
  const initials = name
    ? name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";
  return <div className={styles.avatar}>{initials}</div>;
}

/* ─── Toast ─── */

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type] || styles[`toast_${toast.type}`]}`}>
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

/* ─── User form drawer ─── */

function UserFormDrawer({ isOpen, mode, values, errors, submitting, onChange, onClose, onSubmit }) {
  if (!isOpen) return null;
  return (
    <>
      <div className={styles.drawerBackdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="user-drawer-title">
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.drawerEyebrow}>{mode === "edit" ? "Update user" : "New user"}</p>
            <h2 id="user-drawer-title" className={styles.drawerTitle}>
              {mode === "edit" ? "Edit system user" : "Add system user"}
            </h2>
          </div>
          <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="u-name">Full name</label>
            <input id="u-name" name="name" className={`${styles.fieldInput} ${errors.name ? styles.fieldInputError : ""}`} value={values.name} onChange={onChange} placeholder="Jane Smith" />
            {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="u-email">Email</label>
            <input id="u-email" name="email" type="email" className={`${styles.fieldInput} ${errors.email ? styles.fieldInputError : ""}`} value={values.email} onChange={onChange} placeholder="name@company.com" />
            {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="u-password">{mode === "edit" ? "New password" : "Password"}</label>
            <input id="u-password" name="password" type="password" className={`${styles.fieldInput} ${errors.password ? styles.fieldInputError : ""}`} value={values.password} onChange={onChange} placeholder={mode === "edit" ? "Leave blank to keep current" : "Min. 8 characters"} />
            {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="u-role">Role</label>
              <select id="u-role" name="role" className={`${styles.fieldInput} ${errors.role ? styles.fieldInputError : ""}`} value={values.role} onChange={onChange}>
                {roleOptions.map((r) => <option key={r} value={r}>{formatRole(r)}</option>)}
              </select>
              {errors.role && <p className={styles.fieldError}>{errors.role}</p>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="u-status">Status</label>
              <select id="u-status" name="status" className={`${styles.fieldInput} ${errors.status ? styles.fieldInputError : ""}`} value={values.status} onChange={onChange}>
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.status && <p className={styles.fieldError}>{errors.status}</p>}
            </div>
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" className={styles.btnPrimary} onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Create user"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Dealer profile create drawer ─── */

function DealerProfileDrawer({ isOpen, values, errors, submitting, onChange, onClose, onSubmit }) {
  if (!isOpen) return null;

  const fields = [
    ["company_name", "Company name", "Registered company name"],
    ["contact_person", "Contact person", "Primary contact"],
    ["phone", "Phone", "Business phone"],
    ["city", "City", "City"],
    ["province", "Province", "Province"],
    ["country", "Country", "Country"],
    ["credit_limit", "Credit limit ($)", "0"],
    ["payment_terms", "Payment terms", "Net 30 / COD"],
  ];

  return (
    <>
      <div className={styles.drawerBackdrop} onClick={onClose} aria-hidden="true" />
      <div className={`${styles.drawer} ${styles.drawerWide}`} role="dialog" aria-modal="true" aria-labelledby="dealer-drawer-title">
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.drawerEyebrow}>Dealer profile</p>
            <h2 id="dealer-drawer-title" className={styles.drawerTitle}>Create linked profile</h2>
          </div>
          <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.drawerBody}>
          {/* read-only user context */}
          <div className={styles.linkedUserCard}>
            <Avatar name={values.linkedUserName} />
            <div>
              <p className={styles.linkedUserName}>{values.linkedUserName}</p>
              <p className={styles.linkedUserEmail}>{values.linkedUserEmail}</p>
            </div>
          </div>

          <div className={styles.fieldRow}>
            {fields.slice(0, 2).map(([name, label, placeholder]) => (
              <div key={name} className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`dp-${name}`}>{label}</label>
                <input id={`dp-${name}`} name={name} className={`${styles.fieldInput} ${errors[name] ? styles.fieldInputError : ""}`} value={values[name]} onChange={onChange} placeholder={placeholder} />
                {errors[name] && <p className={styles.fieldError}>{errors[name]}</p>}
              </div>
            ))}
          </div>

          <div className={styles.fieldRow}>
            {fields.slice(2, 4).map(([name, label, placeholder]) => (
              <div key={name} className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`dp-${name}`}>{label}</label>
                <input id={`dp-${name}`} name={name} className={styles.fieldInput} value={values[name]} onChange={onChange} placeholder={placeholder} />
              </div>
            ))}
          </div>

          <div className={styles.fieldRow}>
            {fields.slice(4, 6).map(([name, label, placeholder]) => (
              <div key={name} className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`dp-${name}`}>{label}</label>
                <input id={`dp-${name}`} name={name} className={styles.fieldInput} value={values[name]} onChange={onChange} placeholder={placeholder} />
              </div>
            ))}
          </div>

          <div className={styles.fieldRow}>
            {fields.slice(6, 8).map(([name, label, placeholder]) => (
              <div key={name} className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`dp-${name}`}>{label}</label>
                <input id={`dp-${name}`} name={name} className={`${styles.fieldInput} ${errors[name] ? styles.fieldInputError : ""}`} value={values[name]} onChange={onChange} placeholder={placeholder} />
                {errors[name] && <p className={styles.fieldError}>{errors[name]}</p>}
              </div>
            ))}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="dp-address">Address</label>
            <textarea id="dp-address" name="address" className={styles.fieldTextarea} value={values.address} onChange={onChange} placeholder="Street address" rows={2} />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="dp-status">Status</label>
              <select id="dp-status" name="status" className={styles.fieldInput} value={values.status} onChange={onChange}>
                {dealerStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="dp-notes">Notes</label>
            <textarea id="dp-notes" name="notes" className={styles.fieldTextarea} value={values.notes} onChange={onChange} placeholder="Internal notes" rows={2} />
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" className={styles.btnPrimary} onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Create profile"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Dealer profile view modal ─── */

function DealerProfileModal({ isOpen, profile, loading, onClose }) {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="dp-view-title">
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.drawerEyebrow}>Dealer Profile</p>
            <h2 id="dp-view-title" className={styles.drawerTitle}>Linked dealer profile</h2>
          </div>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>

        {loading && <div className={styles.stateMsg}>Loading profile…</div>}

        {!loading && profile && (
          <div className={styles.profileGrid}>
            {[
              ["Dealer code", profile.dealerCode],
              ["Company", profile.companyName],
              ["Contact person", profile.contactPerson],
              ["Email", profile.email],
              ["Phone", profile.phone || "—"],
              ["City", profile.city || "—"],
              ["Province", profile.province || "—"],
              ["Country", profile.country || "—"],
              ["Credit limit", formatCurrency(profile.creditLimit)],
              ["Payment terms", profile.paymentTerms || "—"],
              ["Status", profile.status],
            ].map(([k, v]) => (
              <div key={k} className={styles.profileItem}>
                <span className={styles.profileKey}>{k}</span>
                <span className={styles.profileVal}>{v}</span>
              </div>
            ))}
            <div className={`${styles.profileItem} ${styles.profileItemWide}`}>
              <span className={styles.profileKey}>Address</span>
              <span className={styles.profileVal}>{profile.address || "—"}</span>
            </div>
            {profile.notes && (
              <div className={`${styles.profileItem} ${styles.profileItemWide}`}>
                <span className={styles.profileKey}>Notes</span>
                <span className={styles.profileVal}>{profile.notes}</span>
              </div>
            )}
          </div>
        )}

        {!loading && !profile && (
          <div className={styles.stateMsg}>No profile data available.</div>
        )}

        <div className={styles.drawerFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm dialog ─── */

function ConfirmDialog({ isOpen, user, submitting, onClose, onConfirm }) {
  if (!isOpen || !user) return null;
  const next = user.status === "active" ? "inactive" : "active";
  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.confirmDialog} role="dialog" aria-modal="true">
        <p className={styles.drawerEyebrow}>Confirmation required</p>
        <h2 className={styles.drawerTitle}>
          {next === "inactive" ? "Deactivate this user?" : "Activate this user?"}
        </h2>
        <p className={styles.confirmBody}>
          {next === "inactive"
            ? <><strong>{user.name}</strong> will lose access until an admin reactivates the account.</>
            : <><strong>{user.name}</strong> will regain access to the workspace.</>}
        </p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button type="button" className={next === "inactive" ? styles.btnDanger : styles.btnPrimary} onClick={onConfirm} disabled={submitting}>
            {submitting ? "Updating…" : next === "inactive" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export default function UserManagement({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [modalMode, setModalMode] = useState("create");
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
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
    return parts.length ? parts.join(" · ") : "All users";
  }, [roleFilter, statusFilter]);

  /* ── data ── */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    setTableError("");
    getUsers(user.token, { page: pagination.page, limit: pagination.limit, search: debouncedSearch, role: roleFilter, status: statusFilter })
      .then(({ data }) => {
        setUsers(data.items || []);
        setPagination((c) => ({ ...c, ...data.pagination }));
      })
      .catch((e) => setTableError(e.response?.data?.message || "Failed to load users"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, pagination.page, pagination.limit, roleFilter, statusFilter, user]);

  useEffect(() => {
    setPagination((c) => (c.page === 1 ? c : { ...c, page: 1 }));
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((c) => c.slice(1)), 4000);
    return () => clearTimeout(t);
  }, [toasts]);

  const pushToast = (type, title, message) =>
    setToasts((c) => [...c, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, title, message }]);

  const reloadUsers = async (targetPage = pagination.page) => {
    const { data } = await getUsers(user.token, { page: targetPage, limit: pagination.limit, search: debouncedSearch, role: roleFilter, status: statusFilter });
    setUsers(data.items || []);
    setPagination((c) => ({ ...c, ...data.pagination }));
  };

  /* ── user form ── */

  const openCreateDrawer = () => {
    setModalMode("create");
    setEditingUser(null);
    setFormValues(initialFormState);
    setFormErrors({});
    setIsUserDrawerOpen(true);
  };

  const openEditDrawer = (u) => {
    setModalMode("edit");
    setEditingUser(u);
    setFormValues({ name: u.name, email: u.email, password: "", role: u.role, status: u.status });
    setFormErrors({});
    setIsUserDrawerOpen(true);
  };

  const closeUserDrawer = () => {
    if (submitting) return;
    setIsUserDrawerOpen(false);
    setFormErrors({});
    setEditingUser(null);
    if (modalMode !== "edit") setFormValues(initialFormState);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues((c) => ({ ...c, [name]: value }));
    setFormErrors((c) => ({ ...c, [name]: "" }));
  };

  const handleUserSubmit = async () => {
    const errors = validateUserForm(formValues, modalMode === "edit");
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    try {
      if (modalMode === "edit" && editingUser) {
        const payload = {
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          role: formValues.role,
          status: formValues.status,
        };
        if (formValues.password) payload.password = formValues.password;
        await updateUser(user.token, editingUser.id, payload);
        pushToast("success", "User updated", "The user profile was updated.");
      } else {
        await createUser(user.token, { name: formValues.name.trim(), email: formValues.email.trim(), password: formValues.password, role: formValues.role, status: formValues.status });
        pushToast("success", "User created", "A new system user has been added.");
      }
      setIsUserDrawerOpen(false);
      setEditingUser(null);
      setFormValues(initialFormState);
      await reloadUsers(modalMode === "create" ? 1 : pagination.page);
    } catch (e) {
      pushToast("error", "Save failed", e.response?.data?.message || "Unable to save user");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── dealer profile ── */

  const openProfileCreateDrawer = (u) => {
    if (u.role !== "dealer") { pushToast("error", "Role mismatch", "Only dealer-role users can have dealer profiles."); return; }
    if (u.dealerProfileExists) { pushToast("error", "Profile exists", "This user already has a dealer profile."); return; }
    setProfileCreateUser(u);
    setProfileFormValues({ ...initialDealerProfileForm, user_id: u.id, linkedUserName: u.name, linkedUserEmail: u.email });
    setProfileFormErrors({});
  };

  const openProfileView = async (u) => {
    if (!u.dealerId) return;
    setProfileViewUser(u);
    setProfileDetails(null);
    setProfileDetailsLoading(true);
    try {
      const { data } = await getDealerById(user.token, u.dealerId);
      setProfileDetails(data);
    } catch (e) {
      pushToast("error", "Load failed", e.response?.data?.message || "Unable to load dealer profile");
    } finally {
      setProfileDetailsLoading(false);
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormValues((c) => ({ ...c, [name]: value }));
    setProfileFormErrors((c) => ({ ...c, [name]: "" }));
  };

  const handleCreateDealerProfile = async () => {
    const errors = validateDealerProfileForm(profileFormValues);
    setProfileFormErrors(errors);
    if (Object.keys(errors).length || !profileCreateUser) return;
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
        notes: profileFormValues.notes.trim(),
      });
      pushToast("success", "Profile created", "Dealer profile linked successfully.");
      setProfileCreateUser(null);
      setProfileFormValues(initialDealerProfileForm);
      await reloadUsers(pagination.page);
    } catch (e) {
      pushToast("error", "Creation failed", e.response?.data?.message || "Unable to create dealer profile");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── status toggle ── */

  const handleToggleStatus = async () => {
    if (!confirmUser) return;
    setSubmitting(true);
    try {
      const next = confirmUser.status === "active" ? "inactive" : "active";
      await updateUserStatus(user.token, confirmUser.id, next);
      pushToast("success", next === "active" ? "User activated" : "User deactivated", `${confirmUser.name} is now ${next}.`);
      setConfirmUser(null);
      await reloadUsers(pagination.page);
    } catch (e) {
      pushToast("error", "Update failed", e.response?.data?.message || "Unable to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProfileExpansion = (userId) =>
    setExpandedProfileIds((c) => c.includes(userId) ? c.filter((id) => id !== userId) : [...c, userId]);

  /* ── dealer profile cell ── */

  const renderDealerCell = (entry) => {
    if (entry.role !== "dealer") {
      return <span className={`${styles.badge} ${styles.badgeNeutral}`}>N/A</span>;
    }
    if (!entry.dealerProfileExists) {
      return (
        <button type="button" className={styles.linkBtn} onClick={() => openProfileCreateDrawer(entry)}>
          + Create profile
        </button>
      );
    }
    const expanded = expandedProfileIds.includes(entry.id);
    return (
      <div className={styles.dealerCell}>
        <div className={styles.dealerCellTop}>
          <span className={`${styles.badge} ${styles.badgeSuccess}`}>Linked</span>
          <button
            type="button"
            className={styles.expandBtn}
            onClick={() => toggleProfileExpansion(entry.id)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide details" : "Show details"}
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
        {expanded && (
          <div className={styles.dealerExpanded}>
            <span className={styles.dealerCode}>{entry.dealerCode}</span>
            <span className={styles.dealerCompany}>{entry.companyName}</span>
            <button type="button" className={styles.linkBtn} onClick={() => openProfileView(entry)}>
              View Profile
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ─── render ─── */

  return (
    <div className={shellStyles.dashboardShell}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
        onNavigate={navigate}
        onLogout={() => { logout(); navigate("/login"); }}
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
          onLogout={() => { logout(); navigate("/login"); }}
        />

        <main className={shellStyles.mainContent}>
          <div className={styles.page}>

            {/* ── page header ── */}
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>User management</h1>
                <p className={styles.pageDesc}>
                  Create accounts, assign roles, and control access across the platform.
                </p>
              </div>
              <div className={styles.headerStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Total users</span>
                  <span className={styles.statValue}>{pagination.total}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Showing</span>
                  <span className={styles.statValue}>{summaryText}</span>
                </div>
              </div>
            </div>

            {/* ── toolbar ── */}
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <div className={styles.filterField}>
                  <label htmlFor="roleFilter" className={styles.filterLabel}>Role</label>
                  <select id="roleFilter" className={styles.filterSelect} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="all">All roles</option>
                    {roleOptions.map((r) => <option key={r} value={r}>{formatRole(r)}</option>)}
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label htmlFor="statusFilter" className={styles.filterLabel}>Status</label>
                  <select id="statusFilter" className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button type="button" className={styles.btnPrimary} onClick={openCreateDrawer}>
                Add user
              </button>
            </div>

            {/* ── table ── */}
            <div className={styles.tableSection}>
              <div className={styles.tableMeta}>
                <span className={styles.tableMetaText}>
                  {loading ? "Loading…" : `${pagination.total} users · page ${pagination.page} of ${pagination.totalPages}`}
                </span>
              </div>

              {loading && <div className={styles.stateMsg}>Loading users…</div>}
              {!loading && tableError && <div className={`${styles.stateMsg} ${styles.stateMsgError}`}>{tableError}</div>}
              {!loading && !tableError && users.length === 0 && (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>No users found</p>
                  <p className={styles.emptyDesc}>Try a different search term or adjust your filters.</p>
                </div>
              )}

              {!loading && !tableError && users.length > 0 && (
                <>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Dealer profile</th>
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
                                <Avatar name={entry.name} />
                                <div className={styles.userCellText}>
                                  <span className={styles.userName}>{entry.name}</span>
                                  <span className={styles.userEmail}>{entry.email}</span>
                                </div>
                              </div>
                            </td>
                            <td data-label="Role">
                              <span className={`${styles.badge} ${styles.badgeRole}`}>{formatRole(entry.role)}</span>
                            </td>
                            <td data-label="Status">
                              <span className={`${styles.badge} ${
                                entry.status === "active" ? styles.badgeActive
                                : entry.status === "suspended" ? styles.badgeDanger
                                : styles.badgeInactive
                              }`}>{entry.status}</span>
                            </td>
                            <td data-label="Dealer profile">{renderDealerCell(entry)}</td>
                            <td data-label="Created" className={styles.dateCell}>{formatDate(entry.createdAt)}</td>
                            <td data-label="Updated" className={styles.dateCell}>{formatDate(entry.updatedAt)}</td>
                            <td data-label="Actions">
                              <div className={styles.actionRow}>
                                <button type="button" className={styles.actionBtn} onClick={() => openEditDrawer(entry)} aria-label={`Edit ${entry.name}`} title="Edit user">
                                  <EditIcon className={styles.actionIcon} />
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${entry.status === "active" ? styles.actionBtnDanger : styles.actionBtnSuccess}`}
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

                  {/* ── pagination ── */}
                  <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>
                      {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <div className={styles.paginationBtns}>
                      <button type="button" className={styles.btnSecondary} disabled={pagination.page <= 1} onClick={() => setPagination((c) => ({ ...c, page: c.page - 1 }))}>
                        ← Previous
                      </button>
                      <button type="button" className={styles.btnSecondary} disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((c) => ({ ...c, page: c.page + 1 }))}>
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        <DashboardFooter />
      </div>

      {/* ── drawers & modals ── */}
      <UserFormDrawer
        isOpen={isUserDrawerOpen}
        mode={modalMode}
        values={formValues}
        errors={formErrors}
        submitting={submitting}
        onChange={handleFormChange}
        onClose={closeUserDrawer}
        onSubmit={handleUserSubmit}
      />

      <DealerProfileDrawer
        isOpen={Boolean(profileCreateUser)}
        values={profileFormValues}
        errors={profileFormErrors}
        submitting={submitting}
        onChange={handleProfileFormChange}
        onClose={() => { if (!submitting) { setProfileCreateUser(null); setProfileFormValues(initialDealerProfileForm); setProfileFormErrors({}); }}}
        onSubmit={handleCreateDealerProfile}
      />

      <DealerProfileModal
        isOpen={Boolean(profileViewUser)}
        profile={profileDetails}
        loading={profileDetailsLoading}
        onClose={() => { setProfileViewUser(null); setProfileDetails(null); }}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmUser) && !isUserDrawerOpen}
        user={confirmUser}
        submitting={submitting}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleToggleStatus}
      />

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />
    </div>
  );
}
