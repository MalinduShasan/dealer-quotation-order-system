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

export default function ProductDetailsModal({ product, isOpen, onClose }) {
  if (!isOpen || !product) return null;

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div className={styles.detailsCard} role="dialog" aria-modal="true" aria-labelledby="product-details-title" onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Product Details</p>
            <h2 id="product-details-title" className={styles.modalTitle}>
              {product.name}
            </h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailsMedia}>
            <ImagePreview imageUrl={product.imageUrl} alt={`${product.name} image`} />
            <div className={styles.detailsItem}>
              <span className={styles.detailsLabel}>Description</span>
              <p className={styles.detailsText}>{product.description || "No description provided."}</p>
            </div>
          </div>

          <div className={styles.detailsSections}>
            <div className={styles.detailsSection}>
              <h3>General</h3>
              <div className={styles.detailsList}>
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
              </div>
            </div>

            <div className={styles.detailsSection}>
              <h3>Pricing</h3>
              <div className={styles.detailsList}>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Unit Price</span>
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
              <div className={styles.detailsList}>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Stock Quantity</span>
                  <span className={styles.detailsValue}>{product.stockQuantity}</span>
                </div>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Minimum Stock</span>
                  <span className={styles.detailsValue}>{product.minimumStock}</span>
                </div>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Low Stock</span>
                  <span className={styles.detailsValue}>{product.isLowStock ? "Yes" : "No"}</span>
                </div>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Status</span>
                  <ProductStatusBadge status={product.status} />
                </div>
              </div>
            </div>

            <div className={styles.detailsSection}>
              <h3>Dates</h3>
              <div className={styles.detailsList}>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Created</span>
                  <span className={styles.detailsValue}>{formatDate(product.createdAt)}</span>
                </div>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Updated</span>
                  <span className={styles.detailsValue}>{formatDate(product.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
