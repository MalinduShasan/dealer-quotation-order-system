import styles from "../ProductManagement.module.css";

function ProductImageThumb({ product, onImagePreview }) {
  return (
    <button
      type="button"
      className={styles.imagePreviewButton}
      onClick={() => onImagePreview(product)}
      aria-label={product.imageUrl ? `View ${product.name} image` : `View ${product.name} image placeholder`}
      title={product.imageUrl ? `View ${product.name} image` : `View ${product.name} image placeholder`}
    >
      <div className={`${styles.imagePreviewFrame} ${styles.imagePreviewThumbnail}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className={styles.imagePreviewImage} />
        ) : (
          <span className={styles.imagePreviewFallback}>No Image</span>
        )}
      </div>
    </button>
  );
}

export default function ProductCardCell({ product, onImagePreview }) {
  return (
    <div className={styles.productCardCell}>
      <ProductImageThumb product={product} onImagePreview={onImagePreview} />
      <div className={styles.productMeta}>
        <strong className={styles.productName}>{product.name}</strong>
        <span className={styles.productSku}>SKU: {product.sku}</span>
        <span className={styles.productSubtle}>{product.brandName || "No brand"}</span>
        <span className={styles.productSubtle}>{product.categoryName || "No category"}</span>
      </div>
    </div>
  );
}
