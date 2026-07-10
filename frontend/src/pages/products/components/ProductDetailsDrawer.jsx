import { useEffect } from "react";
import ProductStatusBadge from "./ProductStatusBadge";
import styles from "../ProductManagement.module.css";

function formatDate(value) {
  if (!value) return "N/A";

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
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

function ImagePreview({ imageUrl, alt }) {
  return (
    <div className={`${styles.imagePreviewFrame} ${styles.imagePreviewLarge}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className={styles.imagePreviewImage} />
      ) : (
        <span className={styles.imagePreviewFallback}>No Image</span>
      )}
    </div>
  );
}

export default function ProductDetailsDrawer({
  product,
  isOpen,
  canManage,
  onClose,
  onEdit,
  onReplaceImage,
  onToggleStatus
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div className={styles.drawerOverlay} role="presentation" onClick={onClose}>
      <aside
        className={styles.detailsDrawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Product Details</p>
            <h2 id="product-details-drawer-title" className={styles.modalTitle}>
              {product.name}
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.drawerContent}>
          <div className={styles.detailsMediaPanel}>
            <ImagePreview imageUrl={product.imageUrl} alt={product.name} />
          </div>

          <div className={styles.detailsSection}>
            <h3>General</h3>
            <div className={styles.detailsStack}>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>SKU</span>
                <span className={styles.detailsValue}>{product.sku}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Name</span>
                <span className={styles.detailsValue}>{product.name}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Category</span>
                <span className={styles.detailsValue}>{product.categoryName || "N/A"}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Brand</span>
                <span className={styles.detailsValue}>{product.brandName || "N/A"}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Description</span>
                <p className={styles.detailsText}>{product.description || "No description provided."}</p>
              </div>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h3>Pricing</h3>
            <div className={styles.detailsStack}>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Retail Price</span>
                <span className={styles.detailsValue}>{formatCurrency(product.unitPrice)}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Dealer Price</span>
                <span className={styles.detailsValue}>{formatCurrency(product.dealerPrice)}</span>
              </div>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h3>Inventory</h3>
            <div className={styles.detailsStack}>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Stock</span>
                <span className={styles.detailsValue}>{product.stockQuantity}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Minimum Stock</span>
                <span className={styles.detailsValue}>{product.minimumStock}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Low Stock Status</span>
                <span className={styles.detailsValue}>
                  {product.status === "out_of_stock" || Number(product.stockQuantity) === 0
                    ? "Out of Stock"
                    : product.isLowStock
                      ? "Low Stock"
                      : "Healthy"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h3>Status & Dates</h3>
            <div className={styles.detailsStack}>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Status</span>
                <ProductStatusBadge status={product.status} />
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Created Date</span>
                <span className={styles.detailsValue}>{formatDate(product.createdAt)}</span>
              </div>
              <div className={styles.detailsItem}>
                <span className={styles.detailsLabel}>Updated Date</span>
                <span className={styles.detailsValue}>{formatDate(product.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.drawerActions}>
          {canManage ? (
            <>
              <button type="button" className={styles.secondaryButton} onClick={() => onEdit(product)}>
                Edit
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => onReplaceImage(product)}>
                Replace Image
              </button>
              <button
                type="button"
                className={product.status === "active" ? styles.dangerButton : styles.secondaryButton}
                onClick={() => onToggleStatus(product)}
              >
                {product.status === "active" ? "Deactivate" : "Activate"}
              </button>
            </>
          ) : null}
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
