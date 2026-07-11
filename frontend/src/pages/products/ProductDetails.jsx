import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
  restockProduct
} from "../../api/inventoryService";
import {
  deleteProductImage,
  getProductById,
  updateProduct,
  updateProductStatus,
  uploadProductImage
} from "../../api/productService";
import { getCategories } from "../../api/categoryService";
import { getBrands } from "../../api/brandService";
import ProductDetailActions from "./components/ProductDetailActions";
import ProductDetailHeader from "./components/ProductDetailHeader";
import ProductImagePreviewModal from "./components/ProductImagePreviewModal";
import ProductImageSection from "./components/ProductImageSection";
import ProductInfoSection from "./components/ProductInfoSection";
import ProductInventorySection from "./components/ProductInventorySection";
import ProductPricingSection from "./components/ProductPricingSection";
import RestockModal from "../inventory/components/RestockModal";
import StockAdjustmentModal from "../inventory/components/StockAdjustmentModal";
import StockMovementHistory from "../inventory/components/StockMovementHistory";
import {
  buildProductFormValues,
  buildProductPayload,
  initialFormState,
  validateProductForm
} from "./productFormUtils";

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast}>
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

function ConfirmDialog({ isOpen, product, submitting, onClose, onConfirm }) {
  if (!isOpen || !product) return null;

  const nextStatus = product.status === "active" ? "inactive" : "active";

  return (
    <div className={styles.confirmOverlay} role="presentation">
      <div className={styles.confirmCard} role="dialog" aria-modal="true" aria-labelledby="product-status-title">
        <p className={styles.eyebrow}>Confirmation Required</p>
        <h2 id="product-status-title" className={styles.sectionTitle}>
          {nextStatus === "inactive" ? "Deactivate this product?" : "Activate this product?"}
        </h2>
        <p className={styles.confirmText}>
          {product.name} will be marked as <strong>{nextStatus}</strong>.
        </p>
        <div className={styles.confirmActions}>
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

function formatDate(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

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
  const [lookupError, setLookupError] = useState("");
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

  const canManageProducts = ["admin", "manager"].includes(user?.role);
  const canEditProducts = ["admin", "manager"].includes(user?.role);
  const detailMetadata = useMemo(
    () => [
      { label: "Created Date", value: formatDate(product?.createdAt) },
      { label: "Updated Date", value: formatDate(product?.updatedAt) },
      { label: "Created By", value: product?.createdByName || product?.createdBy || "N/A" },
      { label: "Updated By", value: product?.updatedByName || product?.updatedBy || "N/A" }
    ],
    [product]
  );

  useEffect(() => {
    const loadLookups = async () => {
      if (!user?.token || !canEditProducts) return;

      try {
        const [categoryResponse, brandResponse] = await Promise.all([
          getCategories(user.token, { page: 1, limit: 100, status: "all" }),
          getBrands(user.token, { page: 1, limit: 100, status: "all" })
        ]);

        setCategories(categoryResponse.data.items || []);
        setBrands(brandResponse.data.items || []);
      } catch (loadError) {
        setLookupError(loadError.response?.data?.message || "Failed to load category and brand options");
      }
    };

    loadLookups();
  }, [canEditProducts, user]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!user?.token) return;

      setLoading(true);
      setError("");

      try {
        const { data } = await getProductById(user.token, id);
        setProduct(data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Unable to load product details");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, user]);

  useEffect(() => {
    const loadMovements = async () => {
      if (!user?.token || !id) return;

      setMovementLoading(true);
      setMovementError("");

      try {
        const { data } = await getProductInventoryMovements(user.token, id, { page: 1, limit: 5 });
        setMovements(data.items || []);
      } catch (loadError) {
        setMovementError(loadError.response?.data?.message || "Unable to load stock movement history");
      } finally {
        setMovementLoading(false);
      }
    };

    loadMovements();
  }, [id, user]);

  useEffect(() => {
    if (toasts.length === 0) return undefined;

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    return () => {
      if (previewImageRef.current) {
        URL.revokeObjectURL(previewImageRef.current);
      }
    };
  }, []);

  const pushToast = (type, title, message) => {
    setToasts((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, title, message }
    ]);
  };

  const resetImageState = () => {
    setSelectedImageFile(null);
    setImageRemoved(false);
    setFormErrors((current) => ({ ...current, image: "" }));

    if (previewImageRef.current) {
      URL.revokeObjectURL(previewImageRef.current);
      previewImageRef.current = null;
    }

    setImagePreviewUrl("");
  };

  const setPreviewObjectUrl = (file) => {
    if (previewImageRef.current) {
      URL.revokeObjectURL(previewImageRef.current);
      previewImageRef.current = null;
    }

    if (!file) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewImageRef.current = objectUrl;
    setImagePreviewUrl(objectUrl);
  };

  const validateProductImage = (file) => {
    if (!file) return "Please choose a product image";
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return "Allowed file types: PNG, JPG, WEBP";
    }
    if (file.size > 3 * 1024 * 1024) {
      return "Product image must be 3 MB or smaller";
    }
    return "";
  };

  const refreshProduct = async () => {
    const { data } = await getProductById(user.token, id);
    setProduct(data);
    return data;
  };

  const refreshMovements = async () => {
    const { data } = await getProductInventoryMovements(user.token, id, { page: 1, limit: 5 });
    setMovements(data.items || []);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBack = () => {
    if (location.state?.productListState) {
      navigate("/products", { state: { productListState: location.state.productListState } });
      return;
    }

    navigate("/products");
  };

  const openEditModal = () => {
    if (!product) return;
    setFormValues(buildProductFormValues(product));
    setFormErrors({});
    resetImageState();
    setImagePreviewUrl(product.imageUrl || "");
    setIsEditing(true);
  };

  const closeInlineEdit = () => {
    if (submitting || imageUploading) return;
    setIsEditing(false);
    setFormValues(initialFormState);
    setFormErrors({});
    resetImageState();
  };

  const getFormCategories = () => {
    const activeCategories = categories.filter((category) => category.status === "active");
    if (!product?.categoryId) return activeCategories;
    const currentCategory = categories.find((category) => category.id === product.categoryId);
    return currentCategory && !activeCategories.some((category) => category.id === currentCategory.id)
      ? [...activeCategories, currentCategory]
      : activeCategories;
  };

  const getFormBrands = () => {
    const activeBrands = brands.filter((brand) => brand.status === "active");
    if (!product?.brandId) return activeBrands;
    const currentBrand = brands.find((brand) => brand.id === product.brandId);
    return currentBrand && !activeBrands.some((brand) => brand.id === currentBrand.id)
      ? [...activeBrands, currentBrand]
      : activeBrands;
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleImageSelect = (file) => {
    const validationError = validateProductImage(file);
    if (validationError) {
      setFormErrors((current) => ({ ...current, image: validationError }));
      return;
    }

    setSelectedImageFile(file);
    setImageRemoved(false);
    setFormErrors((current) => ({ ...current, image: "" }));
    setPreviewObjectUrl(file);
  };

  const handleImageRemove = () => {
    setSelectedImageFile(null);
    setImageRemoved(true);
    setFormErrors((current) => ({ ...current, image: "" }));
    setPreviewObjectUrl(null);
  };

  const syncProductImage = async () => {
    if (!product) return product;

    if (selectedImageFile) {
      setImageUploading(true);
      await uploadProductImage(user.token, product.id, selectedImageFile);
      return refreshProduct();
    }

    if (imageRemoved && product.imageUrl) {
      setImageUploading(true);
      await deleteProductImage(user.token, product.id);
      return refreshProduct();
    }

    return product;
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();

    const validationErrors = validateProductForm(formValues, { allowStockEdit: false });
    if (selectedImageFile) {
      const imageError = validateProductImage(selectedImageFile);
      if (imageError) validationErrors.image = imageError;
    }
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0 || !product) return;

    setSubmitting(true);

    try {
      await updateProduct(user.token, product.id, buildProductPayload(formValues, { includeStockQuantity: false }));
      await refreshProduct();

      if (selectedImageFile || (imageRemoved && product.imageUrl)) {
        await syncProductImage();
      }

      pushToast("success", "Product updated", "The product was updated successfully.");
      closeInlineEdit();
    } catch (saveError) {
      pushToast("error", "Save failed", saveError.response?.data?.message || saveError.message || "Unable to save product");
    } finally {
      setSubmitting(false);
      setImageUploading(false);
    }
  };

  const openImagePreview = () => {
    if (product) {
      setPreviewProduct(product);
    }
  };

  const handlePreviewImageReplace = async (file) => {
    const imageError = validateProductImage(file);
    if (imageError) {
      pushToast("error", "Invalid image", imageError);
      return;
    }

    if (!product) return;

    setImageUploading(true);

    try {
      await uploadProductImage(user.token, product.id, file);
      const refreshed = await refreshProduct();
      setPreviewProduct(refreshed);
      pushToast("success", "Image updated", "The product image was updated successfully.");
    } catch (uploadError) {
      pushToast("error", "Upload failed", uploadError.response?.data?.message || uploadError.message || "Unable to upload product image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmProduct) return;

    setSubmitting(true);

    try {
      const nextStatus = confirmProduct.status === "active" ? "inactive" : "active";
      await updateProductStatus(user.token, confirmProduct.id, nextStatus);
      const refreshed = await refreshProduct();
      await refreshMovements();
      setConfirmProduct(null);
      setPreviewProduct((current) => (current ? refreshed : current));
      pushToast("success", nextStatus === "active" ? "Product activated" : "Product deactivated", `${confirmProduct.name} is now ${nextStatus}.`);
    } catch (statusError) {
      pushToast("error", "Status update failed", statusError.response?.data?.message || "Unable to update product status");
    } finally {
      setSubmitting(false);
    }
  };

  const validateInventoryForm = (values, adjustmentType = null) => {
    const errors = {};
    const quantity = Number(values.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.quantity = "Quantity must be a positive integer";
    }
    if (!values.reason.trim()) {
      errors.reason = "Reason is required";
    }
    if (adjustmentType === "decrease" && Number(product?.stockQuantity || 0) - quantity < 0) {
      errors.quantity = "Adjustment cannot reduce stock below zero";
    }
    return errors;
  };

  const handleRestockSubmit = async (event) => {
    event.preventDefault();
    const errors = validateInventoryForm(restockValues);
    setRestockErrors(errors);
    if (Object.keys(errors).length > 0 || !product) return;

    setSubmitting(true);
    try {
      await restockProduct(user.token, {
        productId: product.id,
        quantity: Number(restockValues.quantity),
        reason: restockValues.reason.trim()
      });
      await refreshProduct();
      await refreshMovements();
      setIsRestockOpen(false);
      setRestockValues({ quantity: "1", reason: "" });
      pushToast("success", "Stock updated", "The product was restocked successfully.");
    } catch (submitError) {
      pushToast("error", "Restock failed", submitError.response?.data?.message || "Unable to restock product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustmentSubmit = async (event) => {
    event.preventDefault();
    const errors = validateInventoryForm(adjustmentValues, adjustmentValues.adjustmentType);
    setAdjustmentErrors(errors);
    if (Object.keys(errors).length > 0 || !product) return;

    setSubmitting(true);
    try {
      await adjustProductStock(user.token, {
        productId: product.id,
        adjustmentType: adjustmentValues.adjustmentType,
        quantity: Number(adjustmentValues.quantity),
        reason: adjustmentValues.reason.trim()
      });
      await refreshProduct();
      await refreshMovements();
      setIsAdjustmentOpen(false);
      setAdjustmentValues({ adjustmentType: "increase", quantity: "1", reason: "" });
      pushToast("success", "Stock adjusted", "The product stock adjustment was saved successfully.");
    } catch (submitError) {
      pushToast("error", "Adjustment failed", submitError.response?.data?.message || "Unable to adjust product stock");
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
          onLogout={handleLogout}
        />

        <main className={shellStyles.mainContent}>
          <div className={styles.page}>
            {loading ? <div className={styles.stateCard}>Loading product details...</div> : null}
            {!loading && error ? <div className={`${styles.stateCard} ${styles.errorCard}`}>{error}</div> : null}

            {!loading && !error && product ? (
              <>
                <ProductDetailHeader
                  product={product}
                  onBack={handleBack}
                  canManage={canManageProducts}
                  onEdit={openEditModal}
                />

                <div className={styles.contentGrid}>
                  <div className={styles.mainColumn}>
                    <ProductInfoSection
                      product={product}
                      isEditing={isEditing}
                      values={formValues}
                      errors={formErrors}
                      categories={getFormCategories()}
                      brands={getFormBrands()}
                      onChange={handleFormChange}
                    />
                    <ProductPricingSection
                      product={product}
                      isEditing={isEditing}
                      values={formValues}
                      errors={formErrors}
                      onChange={handleFormChange}
                    />
                    <ProductInventorySection
                      product={product}
                      isEditing={isEditing}
                      values={formValues}
                      errors={formErrors}
                      onChange={handleFormChange}
                    />
                    {movementLoading ? <div className={styles.stateCard}>Loading stock movement history...</div> : null}
                    {!movementLoading && movementError ? <div className={`${styles.stateCard} ${styles.errorCard}`}>{movementError}</div> : null}
                    {!movementLoading && !movementError ? (
                      <StockMovementHistory items={movements} title="Recent Stock Movements" compact showProduct={false} />
                    ) : null}
                  </div>

                  <div className={styles.sideColumn}>
                    <ProductImageSection
                      product={product}
                      canManage={canManageProducts}
                      onPreview={openImagePreview}
                      loading={imageUploading}
                      isEditing={isEditing}
                      imagePreviewUrl={imagePreviewUrl || (imageRemoved ? "" : product?.imageUrl || "")}
                      imageError={formErrors.image}
                      onImageSelect={handleImageSelect}
                      onImageRemove={handleImageRemove}
                      hasImage={!imageRemoved && Boolean(imagePreviewUrl || product?.imageUrl)}
                    />
                    <ProductDetailActions
                      canManage={canManageProducts}
                      product={product}
                      onToggleStatus={setConfirmProduct}
                      onRestock={() => {
                        setRestockValues({ quantity: "1", reason: "" });
                        setRestockErrors({});
                        setIsRestockOpen(true);
                      }}
                      onAdjust={() => {
                        setAdjustmentValues({ adjustmentType: "increase", quantity: "1", reason: "" });
                        setAdjustmentErrors({});
                        setIsAdjustmentOpen(true);
                      }}
                      onViewFullHistory={() => navigate("/inventory", { state: { inventoryState: { productId: product.id } } })}
                      isEditing={isEditing}
                      onCancelEdit={closeInlineEdit}
                      onSaveInline={handleSubmit}
                      submitting={submitting || imageUploading}
                    />
                    <section className={styles.sectionCard}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <p className={styles.eyebrow}>Metadata</p>
                          <h2 className={styles.sectionTitle}>Audit Information</h2>
                        </div>
                      </div>
                      <div className={`${styles.infoGrid} ${styles.sideInfoGrid}`}>
                        {detailMetadata.map((item) => (
                          <div key={item.label} className={styles.infoItem}>
                            <span className={styles.infoLabel}>{item.label}</span>
                            <span className={styles.infoValue}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                    {lookupError ? <div className={`${styles.stateCard} ${styles.errorCard}`}>{lookupError}</div> : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </main>

        <DashboardFooter />
      </div>
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
        onChange={(event) => setRestockValues((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onClose={() => setIsRestockOpen(false)}
        onSubmit={handleRestockSubmit}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        product={product}
        values={adjustmentValues}
        errors={adjustmentErrors}
        submitting={submitting}
        onChange={(event) => setAdjustmentValues((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onClose={() => setIsAdjustmentOpen(false)}
        onSubmit={handleAdjustmentSubmit}
      />

      <ToastStack toasts={toasts} onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))} />
    </div>
  );
}
