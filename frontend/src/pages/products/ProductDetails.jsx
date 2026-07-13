import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./ProductDetails.module.css";
import {
  adjustProductStock,
  getProductInventoryMovements,
  restockProduct,
} from "../../api/inventoryService";
import {
  deleteProductImage,
  getProductById,
  updateProduct,
  updateProductStatus,
  uploadProductImage,
} from "../../api/productService";
import { getCategories } from "../../api/categoryService";
import { getBrands } from "../../api/brandService";
import RestockModal from "../inventory/components/RestockModal";
import StockAdjustmentModal from "../inventory/components/StockAdjustmentModal";
import ProductImagePreviewModal from "./components/ProductImagePreviewModal";
import {
  buildProductFormValues,
  buildProductPayload,
  initialFormState,
  validateProductForm,
} from "./productFormUtils";

/* ─── helpers ─── */

function fmt(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function fmtDt(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function fmtCurrency(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/* ─── Toast ─── */

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
          <div className={styles.toastBody}>
            <strong className={styles.toastTitle}>{t.title}</strong>
            <span className={styles.toastMsg}>{t.message}</span>
          </div>
          <button
            type="button"
            className={styles.toastDismiss}
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Confirm dialog ─── */

function ConfirmDialog({ isOpen, product, submitting, onClose, onConfirm }) {
  if (!isOpen || !product) return null;
  const next = product.status === "active" ? "inactive" : "active";
  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <p className={styles.dialogEyebrow}>Confirmation required</p>
        <h2 className={styles.dialogTitle}>
          {next === "inactive" ? "Deactivate this product?" : "Activate this product?"}
        </h2>
        <p className={styles.dialogBody}>
          <strong>{product.name}</strong> will be marked as <strong>{next}</strong>.
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={next === "inactive" ? styles.btnDanger : styles.btnPrimary}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Updating…" : next === "inactive" ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline edit form ─── */

function EditDrawer({
  isOpen,
  formValues,
  formErrors,
  categories,
  brands,
  imagePreviewUrl,
  imageRemoved,
  product,
  submitting,
  imageUploading,
  onChange,
  onImageSelect,
  onImageRemove,
  onCancel,
  onSave,
}) {
  if (!isOpen) return null;
  return (
    <div
      className={styles.editDrawer}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-product-title"
    >
      <div className={styles.editDrawerHeader}>
        <div>
          <p className={styles.dialogEyebrow}>Product Update</p>
          <h2 id="edit-product-title" className={styles.editDrawerTitle}>Edit Product</h2>
        </div>
        <button type="button" className={styles.drawerClose} onClick={onCancel} aria-label="Close">
          ✕
        </button>
      </div>

      <div className={styles.editDrawerBody}>
        {/* Image */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Product image</label>
          <div className={styles.imageUploadArea}>
            {imagePreviewUrl || (!imageRemoved && product?.imageUrl) ? (
              <div className={styles.imagePreviewWrap}>
                <img
                  src={imagePreviewUrl || product?.imageUrl}
                  alt="Preview"
                  className={styles.imagePreview}
                />
                <button type="button" className={styles.removeImgBtn} onClick={onImageRemove}>
                  Remove
                </button>
              </div>
            ) : (
              <label className={styles.imageDropzone}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => onImageSelect(e.target.files[0])}
                />
                <span className={styles.dropzoneIcon}>📷</span>
                <span className={styles.dropzoneText}>Click to upload</span>
                <span className={styles.dropzoneSub}>PNG, JPG or WEBP · max 3 MB</span>
              </label>
            )}
            {formErrors.image && <p className={styles.fieldError}>{formErrors.image}</p>}
          </div>
        </div>

        {/* Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="edit-name">Name</label>
          <input
            id="edit-name"
            name="name"
            className={`${styles.fieldInput} ${formErrors.name ? styles.fieldInputError : ""}`}
            value={formValues.name}
            onChange={onChange}
          />
          {formErrors.name && <p className={styles.fieldError}>{formErrors.name}</p>}
        </div>

        {/* Description */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="edit-desc">Description</label>
          <textarea
            id="edit-desc"
            name="description"
            className={styles.fieldTextarea}
            value={formValues.description}
            onChange={onChange}
            rows={3}
          />
        </div>

        {/* Category / Brand */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-cat">Category</label>
            <select
              id="edit-cat"
              name="categoryId"
              className={styles.fieldSelect}
              value={formValues.categoryId}
              onChange={onChange}
            >
              <option value="">— select —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {formErrors.categoryId && <p className={styles.fieldError}>{formErrors.categoryId}</p>}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-brand">Brand</label>
            <select
              id="edit-brand"
              name="brandId"
              className={styles.fieldSelect}
              value={formValues.brandId}
              onChange={onChange}
            >
              <option value="">— select —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-price">Retail price ($)</label>
            <input
              id="edit-price"
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              className={`${styles.fieldInput} ${formErrors.unitPrice ? styles.fieldInputError : ""}`}
              value={formValues.unitPrice}
              onChange={onChange}
            />
            {formErrors.unitPrice && <p className={styles.fieldError}>{formErrors.unitPrice}</p>}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-dealer-price">Dealer price ($)</label>
            <input
              id="edit-dealer-price"
              name="dealerPrice"
              type="number"
              min="0"
              step="0.01"
              className={`${styles.fieldInput} ${formErrors.dealerPrice ? styles.fieldInputError : ""}`}
              value={formValues.dealerPrice}
              onChange={onChange}
            />
            {formErrors.dealerPrice && <p className={styles.fieldError}>{formErrors.dealerPrice}</p>}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="edit-sku">SKU</label>
          <input
            id="edit-sku"
            name="sku"
            className={`${styles.fieldInput} ${formErrors.sku ? styles.fieldInputError : ""}`}
            value={formValues.sku}
            onChange={onChange}
            disabled={product.hasTransactionHistory}
          />
          {product.hasTransactionHistory && <p className={styles.fieldHint}>SKU is locked because this product has transaction history.</p>}
          {formErrors.sku && <p className={styles.fieldError}>{formErrors.sku}</p>}
        </div>

        {/* Inventory settings */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-minimum">Minimum stock</label>
            <input
              id="edit-minimum"
              name="minimumStock"
              type="number"
              min="0"
              className={`${styles.fieldInput} ${formErrors.minimumStock ? styles.fieldInputError : ""}`}
              value={formValues.minimumStock}
              onChange={onChange}
            />
            {formErrors.minimumStock && <p className={styles.fieldError}>{formErrors.minimumStock}</p>}
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              name="status"
              className={styles.fieldInput}
              value={formValues.status}
              onChange={onChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.editDrawerFooter}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel} disabled={submitting || imageUploading}>
          Cancel
        </button>
        <button type="button" className={styles.btnPrimary} onClick={onSave} disabled={submitting || imageUploading}>
          {submitting || imageUploading ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export default function ProductDetails({ theme, onToggleTheme }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const previewImageRef = useRef(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageRemoved, setImageRemoved] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movementLoading, setMovementLoading] = useState(true);
  const [movementError, setMovementError] = useState("");
  const [restockValues, setRestockValues] = useState({ quantity: "1", reason: "" });
  const [adjustmentValues, setAdjustmentValues] = useState({ adjustmentType: "increase", quantity: "1", reason: "" });
  const [restockErrors, setRestockErrors] = useState({});
  const [adjustmentErrors, setAdjustmentErrors] = useState({});
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const canManage = ["admin", "manager"].includes(user?.role);

  const isLowStock =
    product &&
    product.minimumStock != null &&
    product.stockQuantity <= product.minimumStock;

  const dealerDiscount = Math.max(Number(product?.unitPrice || 0) - Number(product?.dealerPrice || 0), 0);
  const dealerDiscountPercent = Number(product?.unitPrice) > 0
    ? ((dealerDiscount / Number(product.unitPrice)) * 100).toFixed(1)
    : "0.0";

  /* ── data fetching ── */

  useEffect(() => {
    if (!user?.token || !canManage) return;
    Promise.all([
      getCategories(user.token, { page: 1, limit: 100, status: "all" }),
      getBrands(user.token, { page: 1, limit: 100, status: "all" }),
    ]).then(([catRes, brandRes]) => {
      setCategories(catRes.data.items || []);
      setBrands(brandRes.data.items || []);
    });
  }, [canManage, user]);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    getProductById(user.token, id)
      .then(({ data }) => setProduct(data))
      .catch((e) => setError(e.response?.data?.message || "Unable to load product"))
      .finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    if (!user?.token || !id) return;
    setMovementLoading(true);
    getProductInventoryMovements(user.token, id, { page: 1, limit: 5 })
      .then(({ data }) => setMovements(data.items || []))
      .catch((e) => setMovementError(e.response?.data?.message || "Unable to load movements"))
      .finally(() => setMovementLoading(false));
  }, [id, user]);

  /* toast auto-dismiss */
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((c) => c.slice(1)), 4000);
    return () => clearTimeout(t);
  }, [toasts]);

  /* cleanup object URLs */
  useEffect(() => () => { if (previewImageRef.current) URL.revokeObjectURL(previewImageRef.current); }, []);

  /* ── helpers ── */

  const pushToast = (type, title, message) =>
    setToasts((c) => [...c, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, title, message }]);

  const refreshProduct = async () => {
    const { data } = await getProductById(user.token, id);
    setProduct(data);
    return data;
  };

  const refreshMovements = async () => {
    const { data } = await getProductInventoryMovements(user.token, id, { page: 1, limit: 5 });
    setMovements(data.items || []);
  };

  const resetImageState = () => {
    setSelectedImageFile(null);
    setImageRemoved(false);
    setFormErrors((c) => ({ ...c, image: "" }));
    if (previewImageRef.current) { URL.revokeObjectURL(previewImageRef.current); previewImageRef.current = null; }
    setImagePreviewUrl("");
  };

  const setPreviewObjectUrl = (file) => {
    if (previewImageRef.current) { URL.revokeObjectURL(previewImageRef.current); previewImageRef.current = null; }
    if (!file) { setImagePreviewUrl(""); return; }
    const url = URL.createObjectURL(file);
    previewImageRef.current = url;
    setImagePreviewUrl(url);
  };

  const validateProductImage = (file) => {
    if (!file) return "Please choose a product image";
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return "Allowed: PNG, JPG, WEBP";
    if (file.size > 3 * 1024 * 1024) return "Max file size is 3 MB";
    return "";
  };

  const getFormCategories = () => {
    const active = categories.filter((c) => c.status === "active");
    if (!product?.categoryId) return active;
    const current = categories.find((c) => c.id === product.categoryId);
    return current && !active.some((c) => c.id === current.id) ? [...active, current] : active;
  };

  const getFormBrands = () => {
    const active = brands.filter((b) => b.status === "active");
    if (!product?.brandId) return active;
    const current = brands.find((b) => b.id === product.brandId);
    return current && !active.some((b) => b.id === current.id) ? [...active, current] : active;
  };

  /* ── edit handlers ── */

  const openEdit = () => {
    if (!product) return;
    setFormValues(buildProductFormValues(product));
    setFormErrors({});
    resetImageState();
    setImagePreviewUrl(product.imageUrl || "");
    setIsEditing(true);
  };

  const closeEdit = () => {
    if (submitting || imageUploading) return;
    setIsEditing(false);
    setFormValues(initialFormState);
    setFormErrors({});
    resetImageState();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues((c) => ({ ...c, [name]: value }));
    setFormErrors((c) => ({ ...c, [name]: "" }));
  };

  const handleImageSelect = (file) => {
    const err = validateProductImage(file);
    if (err) { setFormErrors((c) => ({ ...c, image: err })); return; }
    setSelectedImageFile(file);
    setImageRemoved(false);
    setFormErrors((c) => ({ ...c, image: "" }));
    setPreviewObjectUrl(file);
  };

  const handleImageRemove = () => {
    setSelectedImageFile(null);
    setImageRemoved(true);
    setFormErrors((c) => ({ ...c, image: "" }));
    setPreviewObjectUrl(null);
  };

  const syncImage = async () => {
    if (!product) return product;
    if (selectedImageFile) { setImageUploading(true); await uploadProductImage(user.token, product.id, selectedImageFile); return refreshProduct(); }
    if (imageRemoved && product.imageUrl) { setImageUploading(true); await deleteProductImage(user.token, product.id); return refreshProduct(); }
    return product;
  };

  const handleSave = async () => {
    const errs = validateProductForm(formValues, { allowStockEdit: false });
    if (selectedImageFile) { const ie = validateProductImage(selectedImageFile); if (ie) errs.image = ie; }
    setFormErrors(errs);
    if (Object.keys(errs).length > 0 || !product) return;
    setSubmitting(true);
    try {
      await updateProduct(user.token, product.id, buildProductPayload(formValues, { includeStockQuantity: false }));
      await refreshProduct();
      if (selectedImageFile || (imageRemoved && product.imageUrl)) await syncImage();
      pushToast("success", "Product updated", "Changes saved.");
      setIsEditing(false);
      setFormValues(initialFormState);
      setFormErrors({});
      resetImageState();
    } catch (e) {
      pushToast("error", "Save failed", e.response?.data?.message || e.message || "Unable to save");
    } finally {
      setSubmitting(false);
      setImageUploading(false);
    }
  };

  /* ── status toggle ── */

  const handleToggleStatus = async () => {
    if (!confirmProduct) return;
    setSubmitting(true);
    try {
      const next = confirmProduct.status === "active" ? "inactive" : "active";
      await updateProductStatus(user.token, confirmProduct.id, next);
      const refreshed = await refreshProduct();
      await refreshMovements();
      setConfirmProduct(null);
      setPreviewProduct((p) => (p ? refreshed : p));
      pushToast("success", next === "active" ? "Product activated" : "Product deactivated", `${confirmProduct.name} is now ${next}.`);
    } catch (e) {
      pushToast("error", "Status update failed", e.response?.data?.message || "Unable to update status");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── inventory ── */

  const validateInventoryForm = (values, adjType = null) => {
    const errors = {};
    const qty = Number(values.quantity);
    if (!Number.isInteger(qty) || qty <= 0) errors.quantity = "Quantity must be a positive integer";
    if (!values.reason.trim()) errors.reason = "Reason is required";
    if (adjType === "decrease" && (product?.stockQuantity || 0) - qty < 0) errors.quantity = "Cannot reduce stock below zero";
    return errors;
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    const errs = validateInventoryForm(restockValues);
    setRestockErrors(errs);
    if (Object.keys(errs).length || !product) return;
    setSubmitting(true);
    try {
      await restockProduct(user.token, { productId: product.id, quantity: Number(restockValues.quantity), reason: restockValues.reason.trim() });
      await refreshProduct();
      await refreshMovements();
      setIsRestockOpen(false);
      setRestockValues({ quantity: "1", reason: "" });
      pushToast("success", "Stock updated", "Product restocked.");
    } catch (e) {
      pushToast("error", "Restock failed", e.response?.data?.message || "Unable to restock");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    const errs = validateInventoryForm(adjustmentValues, adjustmentValues.adjustmentType);
    setAdjustmentErrors(errs);
    if (Object.keys(errs).length || !product) return;
    setSubmitting(true);
    try {
      await adjustProductStock(user.token, { productId: product.id, adjustmentType: adjustmentValues.adjustmentType, quantity: Number(adjustmentValues.quantity), reason: adjustmentValues.reason.trim() });
      await refreshProduct();
      await refreshMovements();
      setIsAdjustmentOpen(false);
      setAdjustmentValues({ adjustmentType: "increase", quantity: "1", reason: "" });
      pushToast("success", "Stock adjusted", "Adjustment saved.");
    } catch (e) {
      pushToast("error", "Adjustment failed", e.response?.data?.message || "Unable to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── image preview modal ── */

  const handlePreviewImageReplace = async (file) => {
    const err = validateProductImage(file);
    if (err) { pushToast("error", "Invalid image", err); return; }
    if (!product) return;
    setImageUploading(true);
    try {
      await uploadProductImage(user.token, product.id, file);
      const refreshed = await refreshProduct();
      setPreviewProduct(refreshed);
      pushToast("success", "Image updated", "Product image replaced.");
    } catch (e) {
      pushToast("error", "Upload failed", e.response?.data?.message || "Unable to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  /* ── back nav ── */

  const handleBack = () => {
    if (location.state?.productListState) {
      navigate("/products", { state: { productListState: location.state.productListState } });
    } else {
      navigate("/products");
    }
  };

  /* ── movement type styling ── */

  const movementBadgeClass = (type) => {
    if (!type) return styles.movTypeSale;
    const t = type.toLowerCase();
    if (t.includes("restock") || t.includes("purchase")) return styles.movTypeRestock;
    if (t.includes("adjust")) return styles.movTypeAdjust;
    return styles.movTypeSale;
  };

  /* ─────────────────────────────────── render ─── */

  return (
    <div className={shellStyles.dashboardShell}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
        onNavigate={navigate}
        onLogout={() => { logout(); navigate("/login"); }}
        activeItem="products"
      />

      <div className={shellStyles.workspace}>
        <Navbar
          currentPageTitle="Product Details"
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

            {/* ── loading / error states ── */}
            {loading && <div className={styles.stateMsg}>Loading product…</div>}
            {!loading && error && <div className={`${styles.stateMsg} ${styles.stateMsgError}`}>{error}</div>}

            {!loading && !error && product && (
              <>
                {/* ── top bar ── */}
                <div className={styles.topbar}>
                  <button type="button" className={styles.backBtn} onClick={handleBack}>
                    ← Products
                  </button>
                  <span className={styles.breadcrumb}>/ {product.name}</span>
                </div>

                {/* ── hero ── */}
                <div className={styles.hero}>
                  {/* thumbnail */}
                  <button
                    type="button"
                    className={styles.thumb}
                    onClick={() => setPreviewProduct(product)}
                    aria-label="Preview product image"
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className={styles.thumbImg} />
                    ) : (
                      <div className={styles.thumbPlaceholder}>
                        <span className={styles.thumbIcon}>📦</span>
                        <span className={styles.thumbLabel}>No image</span>
                      </div>
                    )}
                    <div className={styles.thumbOverlay} aria-hidden="true">🔍</div>
                  </button>

                  {/* meta */}
                  <div className={styles.heroMeta}>
                    <div className={styles.statusRow}>
                      <span className={`${styles.badge} ${product.status === "active" ? styles.badgeActive : styles.badgeInactive}`}>
                        {product.status}
                      </span>
                      {product.categoryName && <span className={styles.tag}>{product.categoryName}</span>}
                      {product.brandName && <span className={styles.tag}>{product.brandName}</span>}
                      {isLowStock && <span className={styles.badgeWarn}>⚠ Low stock</span>}
                    </div>

                    <h1 className={styles.productName}>{product.name}</h1>

                    {product.description && (
                      <p className={styles.productDesc}>{product.description}</p>
                    )}

                    {product.sku && (
                      <p className={styles.skuRow}>
                        SKU <code className={styles.skuCode}>{product.sku}</code>
                      </p>
                    )}
                  </div>
                </div>

                {/* ── action strip ── */}
                {canManage && (
                  <div className={styles.actionStrip}>
                    <button type="button" className={styles.btnPrimary} onClick={openEdit}>
                      Edit product
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => { setRestockValues({ quantity: "1", reason: "" }); setRestockErrors({}); setIsRestockOpen(true); }}
                    >
                      Restock
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => { setAdjustmentValues({ adjustmentType: "increase", quantity: "1", reason: "" }); setAdjustmentErrors({}); setIsAdjustmentOpen(true); }}
                    >
                      Adjust stock
                    </button>
                    <div className={styles.actionGap} />
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => navigate("/inventory", { state: { inventoryState: { productId: product.id } } })}
                    >
                      Inventory history →
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnSecondary} ${styles.btnDestructive}`}
                      onClick={() => setConfirmProduct(product)}
                    >
                      {product.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                )}

                {/* ── metric tiles ── */}
                <div className={styles.metrics}>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Retail price</div>
                    <div className={styles.metricValue}>{fmtCurrency(product.unitPrice)}</div>
                    <div className={styles.metricSub}>Dealer {fmtCurrency(product.dealerPrice)}</div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Stock on hand</div>
                    <div className={`${styles.metricValue} ${isLowStock ? styles.metricWarn : ""}`}>
                      {product.stockQuantity ?? "—"}
                    </div>
                    {product.minimumStock != null && (
                      <div className={styles.metricSub}>Minimum {product.minimumStock} units</div>
                    )}
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Dealer discount</div>
                    <div className={styles.metricValue}>{dealerDiscountPercent}%</div>
                    <div className={styles.metricSub}>{fmtCurrency(dealerDiscount)} per unit</div>
                  </div>
                </div>

                {/* ── details grid ── */}
                <div className={styles.detailsGrid}>
                  <div className={styles.infoBlock}>
                    <div className={styles.infoBlockTitle}>Pricing</div>
                    {[
                      ["Retail price", fmtCurrency(product.unitPrice)],
                      ["Dealer price", fmtCurrency(product.dealerPrice)],
                      ["Dealer discount", fmtCurrency(dealerDiscount)],
                    ].map(([k, v]) => (
                      <div key={k} className={styles.infoRow}>
                        <span className={styles.infoKey}>{k}</span>
                        <span className={styles.infoVal}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.infoBlock}>
                    <div className={styles.infoBlockTitle}>Inventory</div>
                    {[
                      ["In stock", `${product.stockQuantity ?? "—"} units`],
                      ["Minimum stock", product.minimumStock != null ? `${product.minimumStock} units` : "Not set"],
                      ["Status", product.status?.replaceAll("_", " ") || "N/A"],
                    ].map(([k, v]) => (
                      <div key={k} className={styles.infoRow}>
                        <span className={styles.infoKey}>{k}</span>
                        <span className={styles.infoVal}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── stock movements ── */}
                <div className={styles.sectionDivider}>
                  <span className={styles.sectionLabel}>Stock movements</span>
                  <div className={styles.dividerLine} />
                </div>

                {movementLoading && <div className={styles.stateMsg}>Loading movements…</div>}
                {!movementLoading && movementError && (
                  <div className={`${styles.stateMsg} ${styles.stateMsgError}`}>{movementError}</div>
                )}
                {!movementLoading && !movementError && (
                  movements.length === 0 ? (
                    <div className={styles.emptyMovements}>
                      No stock movements yet. Activity will appear here once inventory changes are made.
                    </div>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.movTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Qty</th>
                            <th>Before → After</th>
                            <th>By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movements.map((m) => (
                            <tr key={m.id}>
                              <td>{fmtDt(m.createdAt)}</td>
                              <td>
                                <span className={`${styles.movType} ${movementBadgeClass(m.movementType)}`}>
                                  {m.movementType?.replaceAll("_", " ")}
                                </span>
                              </td>
                              <td className={m.quantity > 0 ? styles.qtyPos : styles.qtyNeg}>
                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                              </td>
                              <td className={styles.qtyRange}>
                                {m.previousQuantity} → {m.newQuantity}
                              </td>
                              <td>{m.createdByName || "System"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                <button
                  type="button"
                  className={styles.viewAllBtn}
                  onClick={() => navigate("/inventory", { state: { inventoryState: { productId: product.id } } })}
                >
                  View full inventory history →
                </button>

                {/* ── audit ── */}
                <div className={styles.sectionDivider} style={{ marginTop: "1.75rem" }}>
                  <span className={styles.sectionLabel}>Audit</span>
                  <div className={styles.dividerLine} />
                </div>
                <div className={styles.auditGrid}>
                  {[
                    ["Created", `${fmt(product.createdAt)}${product.createdByName ? ` · ${product.createdByName}` : ""}`],
                    ["Last updated", `${fmt(product.updatedAt)}${product.updatedByName ? ` · ${product.updatedByName}` : ""}`],
                  ].map(([k, v]) => (
                    <div key={k} className={styles.auditCell}>
                      <span className={styles.auditKey}>{k}</span>
                      <span className={styles.auditVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>

        <DashboardFooter />
      </div>

      {/* ── centered product edit modal ── */}
      {isEditing && (
        <div className={styles.drawerBackdrop} onClick={closeEdit} aria-hidden="true" />
      )}
      <EditDrawer
        isOpen={isEditing}
        formValues={formValues}
        formErrors={formErrors}
        categories={getFormCategories()}
        brands={getFormBrands()}
        imagePreviewUrl={imagePreviewUrl}
        imageRemoved={imageRemoved}
        product={product}
        submitting={submitting}
        imageUploading={imageUploading}
        onChange={handleFormChange}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        onCancel={closeEdit}
        onSave={handleSave}
      />

      <ProductImagePreviewModal
        product={previewProduct}
        isOpen={Boolean(previewProduct)}
        canManage={false}
        loading={imageUploading}
        onClose={() => setPreviewProduct(null)}
        onReplaceImage={handlePreviewImageReplace}
        onRemoveImage={() => {}}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmProduct)}
        product={confirmProduct}
        submitting={submitting}
        onClose={() => setConfirmProduct(null)}
        onConfirm={handleToggleStatus}
      />

      <RestockModal
        isOpen={isRestockOpen}
        product={product}
        values={restockValues}
        errors={restockErrors}
        submitting={submitting}
        onChange={(e) => setRestockValues((c) => ({ ...c, [e.target.name]: e.target.value }))}
        onClose={() => setIsRestockOpen(false)}
        onSubmit={handleRestock}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        product={product}
        values={adjustmentValues}
        errors={adjustmentErrors}
        submitting={submitting}
        onChange={(e) => setAdjustmentValues((c) => ({ ...c, [e.target.name]: e.target.value }))}
        onClose={() => setIsAdjustmentOpen(false)}
        onSubmit={handleAdjustment}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={(tid) => setToasts((c) => c.filter((t) => t.id !== tid))}
      />
    </div>
  );
}
