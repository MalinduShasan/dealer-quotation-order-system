import { useEffect, useRef } from "react";
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

function ProductImagePreview({ imageUrl, alt }) {
  return (
    <div className={`${styles.imagePreviewFrame} ${styles.imagePreviewModal}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className={styles.imagePreviewImage} />
      ) : (
        <span className={styles.imagePreviewFallback}>No Image</span>
      )}
    </div>
  );
}

export default function ProductImagePreviewModal({
  product,
  isOpen,
  canManage,
  loading,
  onClose,
  onReplaceImage,
  onRemoveImage
}) {
  const closeButtonRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div className={styles.detailsCard} role="dialog" aria-modal="true" aria-labelledby="product-image-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Product Image</p>
            <h2 id="product-image-modal-title" className={styles.modalTitle}>
              {product.name}
            </h2>
          </div>
          <button ref={closeButtonRef} type="button" className={styles.modalCloseButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailsMedia}>
            <ProductImagePreview imageUrl={product.imageUrl} alt={`${product.name} image`} />
          </div>
          <div className={styles.detailsSections}>
            <div className={styles.detailsSection}>
              <h3>Product Summary</h3>
              <div className={styles.detailsList}>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>SKU</span>
                  <span className={styles.detailsValue}>{product.sku}</span>
                </div>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Status</span>
                  <ProductStatusBadge status={product.status} />
                </div>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Brand</span>
                  <span className={styles.detailsValue}>{product.brandName || "N/A"}</span>
                </div>
                <div className={styles.detailsItem}>
                  <span className={styles.detailsLabel}>Category</span>
                  <span className={styles.detailsValue}>{product.categoryName || "N/A"}</span>
                </div>
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

        <div className={styles.modalActions}>
          {canManage ? (
            <>
              <button type="button" className={styles.secondaryButton} onClick={() => fileInputRef.current?.click()} disabled={loading}>
                {product.imageUrl ? "Replace Image" : "Upload Image"}
              </button>
              <button type="button" className={styles.dangerButton} onClick={onRemoveImage} disabled={loading || !product.imageUrl}>
                Remove Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={styles.hiddenInput}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onReplaceImage(file);
                  event.target.value = "";
                }}
              />
            </>
          ) : null}
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
