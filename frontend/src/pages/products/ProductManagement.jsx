import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./ProductManagement.module.css";
import {
  createProduct,
  deleteProductImage,
  getProductById,
  getProducts,
  updateProduct,
  updateProductStatus,
  uploadProductImage
} from "../../api/productService";
import { getCategories } from "../../api/categoryService";
import { getBrands } from "../../api/brandService";
import ProductFilters from "./components/ProductFilters";
import ProductFormModal from "./components/ProductFormModal";
import ProductGrid from "./components/ProductGrid";
import ProductImagePreviewModal from "./components/ProductImagePreviewModal";
import ProductTable from "./components/ProductTable";
import ProductViewToggle from "./components/ProductViewToggle";
import { buildProductFormValues, buildProductPayload, initialFormState, validateProductForm } from "./productFormUtils";

const pageSize = 10;
const productViewStorageKey = "productViewMode";

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

function ConfirmDialog({ isOpen, product, submitting, onClose, onConfirm }) {
  if (!isOpen || !product) return null;

  const nextStatus = product.status === "active" ? "inactive" : "active";

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div className={styles.confirmCard} role="dialog" aria-modal="true" aria-labelledby="product-confirm-title">
        <p className={styles.sectionEyebrow}>Confirmation Required</p>
        <h2 id="product-confirm-title" className={styles.modalTitle}>
          {nextStatus === "inactive" ? "Deactivate this product?" : "Activate this product?"}
        </h2>
        <p className={styles.confirmText}>
          {product.name} will be marked as <strong>{nextStatus}</strong>.
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

export default function ProductManagement({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const previewImageRef = useRef(null);
  const restoredState = location.state?.productListState;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(() => restoredState?.searchValue ?? "");
  const [statusFilter, setStatusFilter] = useState(() => restoredState?.statusFilter ?? "all");
  const [categoryFilter, setCategoryFilter] = useState(() => restoredState?.categoryFilter ?? "all");
  const [brandFilter, setBrandFilter] = useState(() => restoredState?.brandFilter ?? "all");
  const [lowStockOnly, setLowStockOnly] = useState(() => restoredState?.lowStockOnly ?? false);
  const [sortBy, setSortBy] = useState(() => restoredState?.sortBy ?? "created_at");
  const [sortOrder, setSortOrder] = useState(() => restoredState?.sortOrder ?? "desc");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem(productViewStorageKey) || "grid");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState(() => ({
    page: restoredState?.page ?? 1,
    limit: pageSize,
    total: 0,
    totalPages: 1
  }));
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [modalMode, setModalMode] = useState("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageRemoved, setImageRemoved] = useState(false);

  const canManageProducts = ["admin", "manager"].includes(user?.role);
  const summaryText = useMemo(() => (lowStockOnly ? "low stock products" : statusFilter === "all" ? "all product statuses" : statusFilter), [lowStockOnly, statusFilter]);

  useEffect(() => {
    localStorage.setItem(productViewStorageKey, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const loadLookups = async () => {
      if (!user?.token) return;

      try {
        const [categoryResponse, brandResponse] = await Promise.all([
          getCategories(user.token, { page: 1, limit: 100, status: "all" }),
          getBrands(user.token, { page: 1, limit: 100, status: "all" })
        ]);

        setCategories(categoryResponse.data.items || []);
        setBrands(brandResponse.data.items || []);
      } catch (error) {
        setLookupError(error.response?.data?.message || "Failed to load category and brand options");
      }
    };

    loadLookups();
  }, [user]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user?.token) return;

      setLoading(true);
      setTableError("");

      try {
        const { data } = await getProducts(user.token, {
          page: pagination.page,
          limit: pagination.limit,
          search: searchValue.trim(),
          status: statusFilter,
          categoryId: categoryFilter,
          brandId: brandFilter,
          lowStock: lowStockOnly,
          sortBy,
          sortOrder
        });

        setProducts(data.items || []);
        setPagination((current) => ({
          ...current,
          ...data.pagination
        }));
      } catch (error) {
        setTableError(error.response?.data?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [brandFilter, categoryFilter, lowStockOnly, pagination.limit, pagination.page, searchValue, sortBy, sortOrder, statusFilter, user]);

  useEffect(() => {
    setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
  }, [searchValue, statusFilter, categoryFilter, brandFilter, lowStockOnly, sortBy, sortOrder]);

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

  const reloadProducts = async (targetPage = pagination.page) => {
    const { data } = await getProducts(user.token, {
      page: targetPage,
      limit: pagination.limit,
      search: searchValue.trim(),
      status: statusFilter,
      categoryId: categoryFilter,
      brandId: brandFilter,
      lowStock: lowStockOnly,
      sortBy,
      sortOrder
    });

    setProducts(data.items || []);
    setPagination((current) => ({
      ...current,
      ...data.pagination
    }));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigateToProduct = (product) => {
    navigate(`/products/${product.id}`, {
      state: {
        productListState: {
          searchValue,
          statusFilter,
          categoryFilter,
          brandFilter,
          lowStockOnly,
          sortBy,
          sortOrder,
          page: pagination.page
        }
      }
    });
  };

  const resetFilters = () => {
    setSearchValue("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setBrandFilter("all");
    setLowStockOnly(false);
    setSortBy("created_at");
    setSortOrder("desc");
  };

  const getFormCategories = () => {
    const activeCategories = categories.filter((category) => category.status === "active");
    if (modalMode !== "edit" || !editingProduct?.categoryId) return activeCategories;
    const currentCategory = categories.find((category) => category.id === editingProduct.categoryId);
    return currentCategory && !activeCategories.some((category) => category.id === currentCategory.id)
      ? [...activeCategories, currentCategory]
      : activeCategories;
  };

  const getFormBrands = () => {
    const activeBrands = brands.filter((brand) => brand.status === "active");
    if (modalMode !== "edit" || !editingProduct?.brandId) return activeBrands;
    const currentBrand = brands.find((brand) => brand.id === editingProduct.brandId);
    return currentBrand && !activeBrands.some((brand) => brand.id === currentBrand.id)
      ? [...activeBrands, currentBrand]
      : activeBrands;
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingProduct(null);
    setFormValues(initialFormState);
    setFormErrors({});
    resetImageState();
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    const loadProduct = async () => {
      try {
        const { data } = await getProductById(user.token, product.id);
        setModalMode("edit");
        setEditingProduct(data);
        setFormValues(buildProductFormValues(data));
        setFormErrors({});
        resetImageState();
        setImagePreviewUrl(data.imageUrl || "");
        setIsModalOpen(true);
      } catch (error) {
        pushToast("error", "Load failed", error.response?.data?.message || "Unable to load product details");
      }
    };

    loadProduct();
  };

  const closeModal = () => {
    if (submitting || imageUploading) return;
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormValues(initialFormState);
    setFormErrors({});
    resetImageState();
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
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

  const handleImageSelect = (file) => {
    const error = validateProductImage(file);
    if (error) {
      setFormErrors((current) => ({ ...current, image: error }));
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

  const syncProductImage = async (product) => {
    if (selectedImageFile) {
      setImageUploading(true);
      const { data } = await uploadProductImage(user.token, product.id, selectedImageFile);
      return data;
    }

    if (imageRemoved && product.imageUrl) {
      setImageUploading(true);
      const { data } = await deleteProductImage(user.token, product.id);
      return data;
    }

    return product;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateProductForm(formValues, { allowStockEdit: modalMode === "create" });
    if (selectedImageFile) {
      const imageError = validateProductImage(selectedImageFile);
      if (imageError) errors.image = imageError;
    }
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    try {
      const payload = buildProductPayload(formValues, { includeStockQuantity: modalMode === "create" });

      let savedProduct;

      if (modalMode === "edit" && editingProduct) {
        const { data } = await updateProduct(user.token, editingProduct.id, payload);
        savedProduct = data;
      } else {
        const { data } = await createProduct(user.token, payload);
        savedProduct = data;
      }

      if (selectedImageFile || (imageRemoved && editingProduct?.imageUrl)) {
        await syncProductImage(savedProduct);
      }

      pushToast(
        "success",
        modalMode === "edit" ? "Product updated" : "Product created",
        modalMode === "edit" ? "The product was updated successfully." : "A new product has been added."
      );

      closeModal();
      await reloadProducts(modalMode === "create" ? 1 : pagination.page);
    } catch (error) {
      pushToast("error", "Save failed", error.response?.data?.message || error.message || "Unable to save product");
    } finally {
      setSubmitting(false);
      setImageUploading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmProduct) return;

    setSubmitting(true);

    try {
      const nextStatus = confirmProduct.status === "active" ? "inactive" : "active";
      await updateProductStatus(user.token, confirmProduct.id, nextStatus);
      pushToast(
        "success",
        nextStatus === "active" ? "Product activated" : "Product deactivated",
        `${confirmProduct.name} is now ${nextStatus}.`
      );
      setConfirmProduct(null);
      await reloadProducts(pagination.page);
    } catch (error) {
      pushToast("error", "Status update failed", error.response?.data?.message || "Unable to update product status");
    } finally {
      setSubmitting(false);
    }
  };

  const openImagePreview = async (product) => {
    try {
      const { data } = await getProductById(user.token, product.id);
      setPreviewProduct(data);
    } catch (error) {
      pushToast("error", "Load failed", error.response?.data?.message || "Unable to load product image preview");
    }
  };

  const handlePreviewImageReplace = async (file) => {
    const error = validateProductImage(file);
    if (error) {
      pushToast("error", "Invalid image", error);
      return;
    }

    if (!previewProduct) return;

    setImageUploading(true);

    try {
      const { data } = await uploadProductImage(user.token, previewProduct.id, file);
      setPreviewProduct(data);
      pushToast("success", "Image updated", "The product image was updated successfully.");
      await reloadProducts(pagination.page);
    } catch (uploadError) {
      pushToast("error", "Upload failed", uploadError.response?.data?.message || uploadError.message || "Unable to upload product image");
    } finally {
      setImageUploading(false);
    }
  };

  const handlePreviewImageRemove = async () => {
    if (!previewProduct?.imageUrl) return;

    setImageUploading(true);

    try {
      const { data } = await deleteProductImage(user.token, previewProduct.id);
      setPreviewProduct(data);
      pushToast("success", "Image removed", "The product image was removed successfully.");
      await reloadProducts(pagination.page);
    } catch (error) {
      pushToast("error", "Remove failed", error.response?.data?.message || error.message || "Unable to remove product image");
    } finally {
      setImageUploading(false);
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
          currentPageTitle="Product Management"
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
              <p className={styles.sectionEyebrow}>Product Catalogue</p>
              <h1 className={styles.pageTitle}>Manage products, pricing, inventory, brands, and media in one place.</h1>
              <p className={styles.pageDescription}>
                Control your product catalog with stock visibility, low-stock alerts, pricing structure, and backend-managed image uploads.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <div className={styles.heroMetric}>
                <span>Total Products</span>
                <strong>{pagination.total}</strong>
              </div>
              <div className={styles.heroMetric}>
                <span>Current Filter</span>
                <strong>{summaryText}</strong>
              </div>
            </div>
          </section>

          <section className={styles.toolbarCard}>
            <ProductFilters
              searchValue={searchValue}
              statusFilter={statusFilter}
              categoryFilter={categoryFilter}
              brandFilter={brandFilter}
              lowStockOnly={lowStockOnly}
              sortBy={sortBy}
              sortOrder={sortOrder}
              categories={categories}
              brands={brands}
              onSearchChange={setSearchValue}
              onStatusChange={setStatusFilter}
              onCategoryChange={setCategoryFilter}
              onBrandChange={setBrandFilter}
              onLowStockChange={setLowStockOnly}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
              onReset={resetFilters}
              canManage={canManageProducts}
              onAddProduct={openCreateModal}
            />
          </section>

          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Product Directory</p>
                <h2 className={styles.sectionTitle}>Product registry</h2>
              </div>
              <div className={styles.headerControls}>
                <p className={styles.sectionMeta}>
                  Showing page {pagination.page} of {pagination.totalPages}
                </p>
                <ProductViewToggle value={viewMode} onChange={setViewMode} />
              </div>
            </div>

            {lookupError ? <div className={styles.errorBlock}>{lookupError}</div> : null}
            {loading && viewMode === "table" ? <div className={styles.stateBlock}>Loading product records...</div> : null}
            {!loading && tableError ? <div className={styles.errorBlock}>{tableError}</div> : null}
            {!loading && !tableError && products.length === 0 ? (
              <div className={styles.emptyBlock}>
                <strong>No products found</strong>
                <p>Try a different search or adjust the filters.</p>
              </div>
            ) : null}

            {!tableError && (loading || products.length > 0) ? (
              viewMode === "grid" ? (
                <>
                  <ProductGrid
                    products={products}
                    canManage={canManageProducts}
                    loading={loading}
                    onNavigate={navigateToProduct}
                    onEdit={openEditModal}
                    onToggleStatus={setConfirmProduct}
                    onImagePreview={openImagePreview}
                  />
                  {!loading ? (
                    <div className={styles.paginationRow}>
                      <p className={styles.paginationMeta}>
                        {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} products
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
                  ) : null}
                </>
              ) : (
                !loading && (
                  <ProductTable
                    products={products}
                    pagination={{
                      ...pagination,
                      onPageChange: (page) => setPagination((current) => ({ ...current, page }))
                    }}
                    canManage={canManageProducts}
                    onView={navigateToProduct}
                    onEdit={openEditModal}
                    onToggleStatus={setConfirmProduct}
                    onImagePreview={openImagePreview}
                  />
                )
              )
            ) : null}
          </section>
        </main>

        <DashboardFooter />
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        values={formValues}
        errors={formErrors}
        categories={getFormCategories()}
        brands={getFormBrands()}
        canManage={canManageProducts}
        submitting={submitting}
        imageUploading={imageUploading}
        imagePreviewUrl={imagePreviewUrl || (imageRemoved ? "" : editingProduct?.imageUrl || "")}
        hasExistingImage={Boolean(editingProduct?.imageUrl) && !imageRemoved}
        skuLocked={Boolean(editingProduct?.hasTransactionHistory)}
        onChange={handleFormChange}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ProductImagePreviewModal
        product={previewProduct}
        isOpen={Boolean(previewProduct)}
        canManage={canManageProducts}
        loading={imageUploading}
        onClose={() => setPreviewProduct(null)}
        onReplaceImage={handlePreviewImageReplace}
        onRemoveImage={handlePreviewImageRemove}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmProduct)}
        product={confirmProduct}
        submitting={submitting}
        onClose={() => setConfirmProduct(null)}
        onConfirm={handleToggleStatus}
      />

      <ToastStack toasts={toasts} onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))} />
    </div>
  );
}
