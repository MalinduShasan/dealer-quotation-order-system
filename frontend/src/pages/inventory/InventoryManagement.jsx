import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/layout/Sidebar";
import Navbar from "../../components/dashboard/layout/Navbar";
import DashboardFooter from "../../components/dashboard/DashboardFooter";
import shellStyles from "../../components/dashboard/AdminDashboard.module.css";
import styles from "./InventoryManagement.module.css";
import { getBrands } from "../../api/brandService";
import { getCategories } from "../../api/categoryService";
import {
  adjustProductStock,
  getInventory,
  getInventoryMovements,
  getProductInventoryMovements,
  restockProduct
} from "../../api/inventoryService";
import InventoryFilters from "./components/InventoryFilters";
import InventoryEmptyState from "./components/InventoryEmptyState";
import InventoryGrid from "./components/InventoryGrid";
import InventorySkeleton from "./components/InventorySkeleton";
import InventorySummaryCards from "./components/InventorySummaryCards";
import RestockModal from "./components/RestockModal";
import StockAdjustmentModal from "./components/StockAdjustmentModal";
import StockHistoryDrawer from "./components/StockHistoryDrawer";
import StockMovementHistory from "./components/StockMovementHistory";

const pageSize = 10;
const initialRestockState = { quantity: "1", reason: "" };
const initialAdjustmentState = { adjustmentType: "increase", quantity: "1", reason: "" };

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button type="button" className={styles.secondaryButton} onClick={() => onDismiss(toast.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}

function validateRestock(values) {
  const errors = {};
  const quantity = Number(values.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) errors.quantity = "Quantity must be a positive integer";
  if (!values.reason.trim()) errors.reason = "Reason is required";
  return errors;
}

function validateAdjustment(values, currentStock) {
  const errors = validateRestock(values);
  const quantity = Number(values.quantity);
  if (values.adjustmentType === "decrease" && currentStock - quantity < 0) {
    errors.quantity = "Adjustment cannot reduce stock below zero";
  }
  return errors;
}

export default function InventoryManagement({ theme, onToggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const initialProductId = location.state?.inventoryState?.productId || "all";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 1 });
  const [movementPagination, setMovementPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [movements, setMovements] = useState([]);
  const [selectedProductHistory, setSelectedProductHistory] = useState(null);
  const [productHistoryItems, setProductHistoryItems] = useState([]);
  const [productHistoryLoading, setProductHistoryLoading] = useState(false);
  const [productHistoryError, setProductHistoryError] = useState("");
  const [loading, setLoading] = useState(true);
  const [movementLoading, setMovementLoading] = useState(true);
  const [error, setError] = useState("");
  const [movementError, setMovementError] = useState("");
  const [restockProductTarget, setRestockProductTarget] = useState(null);
  const [adjustmentProductTarget, setAdjustmentProductTarget] = useState(null);
  const [restockValues, setRestockValues] = useState(initialRestockState);
  const [adjustmentValues, setAdjustmentValues] = useState(initialAdjustmentState);
  const [restockErrors, setRestockErrors] = useState({});
  const [adjustmentErrors, setAdjustmentErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const canManage = ["admin", "manager"].includes(user?.role);
  const todayMovements = useMemo(() => {
    const today = new Date();
    return movements.filter((item) => {
      const date = new Date(item.createdAt);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    }).length;
  }, [movements]);

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
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Failed to load filters");
      }
    };

    loadLookups();
  }, [user]);

  useEffect(() => {
    const loadInventory = async () => {
      if (!user?.token) return;

      setLoading(true);
      setError("");
      try {
        const { data } = await getInventory(user.token, {
          page: pagination.page,
          limit: pagination.limit,
          search: searchValue.trim(),
          categoryId: categoryFilter,
          brandId: brandFilter,
          condition: conditionFilter,
          sortBy,
          sortOrder
        });
        setItems(data.items || []);
        setSummary(data.summary || {});
        setPagination((current) => ({ ...current, ...data.pagination }));
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [brandFilter, categoryFilter, conditionFilter, pagination.limit, pagination.page, searchValue, sortBy, sortOrder, user]);

  useEffect(() => {
    const loadMovements = async () => {
      if (!user?.token) return;

      setMovementLoading(true);
      setMovementError("");
      try {
        const loader = getInventoryMovements(user.token, {
          page: movementPagination.page,
          limit: movementPagination.limit
        });
        const { data } = await loader;
        setMovements(data.items || []);
        setMovementPagination((current) => ({ ...current, ...data.pagination }));
      } catch (loadError) {
        setMovementError(loadError.response?.data?.message || "Failed to load stock movement history");
      } finally {
        setMovementLoading(false);
      }
    };

    loadMovements();
  }, [movementPagination.limit, movementPagination.page, user]);

  useEffect(() => {
    setPagination((current) => (current.page === 1 ? current : { ...current, page: 1 }));
  }, [searchValue, categoryFilter, brandFilter, conditionFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), 4000);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const pushToast = (type, title, message) => {
    setToasts((current) => [...current, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type, title, message }]);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const resetFilters = () => {
    setSearchValue("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setConditionFilter("all");
    setSortBy("updated_at");
    setSortOrder("desc");
  };

  const refreshData = async () => {
    const [inventoryResponse, movementResponse] = await Promise.all([
      getInventory(user.token, {
        page: pagination.page,
        limit: pagination.limit,
        search: searchValue.trim(),
        categoryId: categoryFilter,
        brandId: brandFilter,
        condition: conditionFilter,
        sortBy,
        sortOrder
      }),
      getInventoryMovements(user.token, {
        page: movementPagination.page,
        limit: movementPagination.limit
      })
    ]);

    setItems(inventoryResponse.data.items || []);
    setSummary(inventoryResponse.data.summary || {});
    setPagination((current) => ({ ...current, ...inventoryResponse.data.pagination }));
    setMovements(movementResponse.data.items || []);
    setMovementPagination((current) => ({ ...current, ...movementResponse.data.pagination }));
  };

  const handleRestockSubmit = async (event) => {
    event.preventDefault();
    const errors = validateRestock(restockValues);
    setRestockErrors(errors);
    if (Object.keys(errors).length > 0 || !restockProductTarget) return;

    setSubmitting(true);
    try {
      await restockProduct(user.token, {
        productId: restockProductTarget.id,
        quantity: Number(restockValues.quantity),
        reason: restockValues.reason.trim()
      });
      pushToast("success", "Stock updated", `${restockProductTarget.name} was restocked successfully.`);
      setRestockProductTarget(null);
      setRestockValues(initialRestockState);
      await refreshData();
    } catch (submitError) {
      pushToast("error", "Restock failed", submitError.response?.data?.message || "Unable to restock product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustmentSubmit = async (event) => {
    event.preventDefault();
    const currentStock = Number(adjustmentProductTarget?.stockQuantity || 0);
    const errors = validateAdjustment(adjustmentValues, currentStock);
    setAdjustmentErrors(errors);
    if (Object.keys(errors).length > 0 || !adjustmentProductTarget) return;

    setSubmitting(true);
    try {
      await adjustProductStock(user.token, {
        productId: adjustmentProductTarget.id,
        adjustmentType: adjustmentValues.adjustmentType,
        quantity: Number(adjustmentValues.quantity),
        reason: adjustmentValues.reason.trim()
      });
      pushToast("success", "Stock adjusted", `${adjustmentProductTarget.name} inventory was updated successfully.`);
      setAdjustmentProductTarget(null);
      setAdjustmentValues(initialAdjustmentState);
      await refreshData();
    } catch (submitError) {
      pushToast("error", "Adjustment failed", submitError.response?.data?.message || "Unable to adjust product stock");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const openInitialHistory = async () => {
      if (!user?.token || initialProductId === "all" || selectedProductHistory) return;

      const knownProduct = items.find((item) => item.id === initialProductId);
      if (!knownProduct) return;

      setSelectedProductHistory(knownProduct);
      setProductHistoryLoading(true);
      setProductHistoryError("");

      try {
        const { data } = await getProductInventoryMovements(user.token, knownProduct.id, { page: 1, limit: 12 });
        setProductHistoryItems(data.items || []);
      } catch (loadError) {
        setProductHistoryError(loadError.response?.data?.message || "Failed to load product history");
      } finally {
        setProductHistoryLoading(false);
      }
    };

    openInitialHistory();
  }, [initialProductId, items, selectedProductHistory, user]);

  return (
    <div className={shellStyles.dashboardShell}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        onNavigate={navigate}
        onLogout={handleLogout}
        activeItem="inventory"
      />

      <div className={shellStyles.workspace}>
        <Navbar
          currentPageTitle="Inventory Management"
          user={user}
          theme={theme}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onToggleTheme={onToggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className={shellStyles.mainContent}>
          <div className={styles.page}>
          <section className={styles.heroCard}>
            <div>
              <p className={styles.sectionEyebrow}>Inventory Control</p>
              <h1 className={styles.pageTitle}>Track stock health, replenish faster, and keep every movement audit-ready.</h1>
              <p className={styles.pageDescription}>
                  QuoteFlow inventory uses stock movements for every change, with responsive product cards, compact controls, and on-demand product history.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <div className={styles.heroMetric}>
                  <span className={styles.mobileMeta}>Visible Products</span>
                  <strong className={styles.pageTitle}>{pagination.total}</strong>
              </div>
              <div className={styles.heroMetric}>
                  <span className={styles.mobileMeta}>Movement Feed</span>
                  <strong className={styles.pageTitle}>Recent Activity</strong>
              </div>
            </div>
          </section>

            <InventorySummaryCards summary={summary} todayMovements={todayMovements} />

            <section className={styles.toolbarCard}>
              <InventoryFilters
                searchValue={searchValue}
                categoryFilter={categoryFilter}
                brandFilter={brandFilter}
                conditionFilter={conditionFilter}
                sortBy={sortBy}
                sortOrder={sortOrder}
                categories={categories}
                brands={brands}
                onSearchChange={setSearchValue}
                onCategoryChange={setCategoryFilter}
                onBrandChange={setBrandFilter}
                onConditionChange={setConditionFilter}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                onReset={resetFilters}
              />
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Inventory Directory</p>
                  <h2 className={styles.sectionTitle}>Current stock positions</h2>
                </div>
                <p className={styles.paginationMeta}>
                  Page {pagination.page} of {pagination.totalPages}
                </p>
              </div>

              {loading ? <InventorySkeleton /> : null}
              {!loading && error ? <div className={styles.errorBlock}>{error}</div> : null}
              {!loading && !error && items.length === 0 ? (
                <InventoryEmptyState title="No inventory records found" message="Try changing the search or stock filters." />
              ) : null}
              {!loading && !error && items.length > 0 ? (
                <>
                  <InventoryGrid
                    items={items}
                    canManage={canManage}
                    onViewHistory={async (product) => {
                      setSelectedProductHistory(product);
                      setProductHistoryLoading(true);
                      setProductHistoryError("");
                      try {
                        const { data } = await getProductInventoryMovements(user.token, product.id, { page: 1, limit: 12 });
                        setProductHistoryItems(data.items || []);
                      } catch (loadError) {
                        setProductHistoryError(loadError.response?.data?.message || "Failed to load product history");
                      } finally {
                        setProductHistoryLoading(false);
                      }
                    }}
                    onRestock={(product) => {
                      setRestockProductTarget(product);
                      setRestockValues(initialRestockState);
                      setRestockErrors({});
                    }}
                    onAdjust={(product) => {
                      setAdjustmentProductTarget(product);
                      setAdjustmentValues(initialAdjustmentState);
                      setAdjustmentErrors({});
                    }}
                  />
                  <div className={styles.paginationRow}>
                    <p className={styles.paginationMeta}>
                      {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </p>
                    <div className={styles.paginationActions}>
                      <button type="button" className={styles.secondaryButton} disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>
                        Previous
                      </button>
                      <button type="button" className={styles.secondaryButton} disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </section>

            {movementLoading ? <div className={styles.stateBlock}>Loading movement history...</div> : null}
            {!movementLoading && movementError ? <div className={styles.errorBlock}>{movementError}</div> : null}
            {!movementLoading && !movementError && movements.length === 0 ? (
              <InventoryEmptyState title="No inventory movements found yet." message="Stock activity will appear here after restocks, adjustments, or initial stock entries." />
            ) : null}
            {!movementLoading && !movementError && movements.length > 0 ? (
              <StockMovementHistory
                items={movements}
                title="Recent Inventory Movements"
                pagination={movementPagination}
                onPageChange={(page) => setMovementPagination((current) => ({ ...current, page }))}
              />
            ) : null}
          </div>
        </main>

        <DashboardFooter />
      </div>

      <RestockModal
        isOpen={Boolean(restockProductTarget)}
        product={restockProductTarget}
        values={restockValues}
        errors={restockErrors}
        submitting={submitting}
        onChange={(event) => setRestockValues((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onClose={() => setRestockProductTarget(null)}
        onSubmit={handleRestockSubmit}
      />

      <StockAdjustmentModal
        isOpen={Boolean(adjustmentProductTarget)}
        product={adjustmentProductTarget}
        values={adjustmentValues}
        errors={adjustmentErrors}
        submitting={submitting}
        onChange={(event) => setAdjustmentValues((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onClose={() => setAdjustmentProductTarget(null)}
        onSubmit={handleAdjustmentSubmit}
      />

      <ToastStack toasts={toasts} onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))} />

      <StockHistoryDrawer
        isOpen={Boolean(selectedProductHistory)}
        product={selectedProductHistory}
        items={productHistoryItems}
        loading={productHistoryLoading}
        error={productHistoryError}
        onClose={() => {
          setSelectedProductHistory(null);
          setProductHistoryItems([]);
          setProductHistoryError("");
        }}
      />
    </div>
  );
}
