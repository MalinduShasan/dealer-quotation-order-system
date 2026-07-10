import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./BrandManagement.module.css";
import {
  createBrand,
  deleteBrandLogo,
  getBrands,
  updateBrand,
  updateBrandStatus,
  uploadBrandLogo
} from "../../api/brandService";
import { validateBrandLogoFile } from "../../utils/supabase";
import BrandFormModal from "./components/BrandFormModal";
import BrandTable from "./components/BrandTable";

const pageSize = 10;

const initialFormState = {
  name: "",
  description: "",
  status: "active"
};

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
  const previewUrlRef = useRef(null);
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
  const [logoUploading, setLogoUploading] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [confirmBrand, setConfirmBrand] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [logoRemoved, setLogoRemoved] = useState(false);

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

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

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

  const setPreviewObjectUrl = (file) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!file) {
      setLogoPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setLogoPreviewUrl(objectUrl);
  };

  const resetLogoState = () => {
    setSelectedLogoFile(null);
    setLogoRemoved(false);
    setFormErrors((current) => ({ ...current, logo: "" }));
    setPreviewObjectUrl(null);
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
    resetLogoState();
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
    resetLogoState();
    setLogoPreviewUrl(brand.logoUrl || "");
    setIsModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleLogoSelect = (file) => {
    const logoError = validateBrandLogoFile(file);
    if (logoError) {
      setFormErrors((current) => ({ ...current, logo: logoError }));
      return;
    }

    setSelectedLogoFile(file);
    setLogoRemoved(false);
    setFormErrors((current) => ({ ...current, logo: "" }));
    setPreviewObjectUrl(file);
  };

  const handleLogoRemove = () => {
    setSelectedLogoFile(null);
    setLogoRemoved(true);
    setFormErrors((current) => ({ ...current, logo: "" }));
    setPreviewObjectUrl(null);
  };

  const closeModal = () => {
    if (submitting || logoUploading) return;
    setIsModalOpen(false);
    setEditingBrand(null);
    setFormErrors({});
    setFormValues(initialFormState);
    resetLogoState();
  };

  const syncBrandLogo = async (brandRecord) => {
    if (selectedLogoFile) {
      setLogoUploading(true);
      const { data } = await uploadBrandLogo(user.token, brandRecord.id, selectedLogoFile);
      return data;
    }

    if (logoRemoved && brandRecord.logoUrl) {
      setLogoUploading(true);
      const { data } = await deleteBrandLogo(user.token, brandRecord.id);
      return data;
    }

    return brandRecord;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm(formValues);
    if (selectedLogoFile) {
      const logoError = validateBrandLogoFile(selectedLogoFile);
      if (logoError) {
        errors.logo = logoError;
      }
    }

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

      let savedBrand;

      if (modalMode === "edit" && editingBrand) {
        const { data } = await updateBrand(user.token, editingBrand.id, payload);
        savedBrand = data;
      } else {
        const { data } = await createBrand(user.token, payload);
        savedBrand = data;
      }

      if (selectedLogoFile || (logoRemoved && editingBrand?.logoUrl)) {
        await syncBrandLogo(savedBrand);
      }

      pushToast(
        "success",
        modalMode === "edit" ? "Brand updated" : "Brand created",
        modalMode === "edit" ? "The brand was updated successfully." : "A new brand has been added."
      );

      setIsModalOpen(false);
      setEditingBrand(null);
      setFormValues(initialFormState);
      resetLogoState();
      await reloadBrands(modalMode === "create" ? 1 : pagination.page);
    } catch (error) {
      pushToast("error", "Save failed", error.response?.data?.message || error.message || "Unable to save brand");
    } finally {
      setSubmitting(false);
      setLogoUploading(false);
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
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
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
              <BrandTable
                brands={brands}
                pagination={{
                  ...pagination,
                  onPageChange: (page) => setPagination((current) => ({ ...current, page }))
                }}
                canManageBrands={canManageBrands}
                onEdit={openEditModal}
                onToggleStatus={setConfirmBrand}
              />
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
        logoPreviewUrl={logoPreviewUrl || (logoRemoved ? "" : editingBrand?.logoUrl || "")}
        hasExistingLogo={Boolean(editingBrand?.logoUrl) && !logoRemoved}
        logoUploading={logoUploading}
        onChange={handleFormChange}
        onLogoSelect={handleLogoSelect}
        onLogoRemove={handleLogoRemove}
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
