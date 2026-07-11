import ProductInventoryBadge from "./ProductInventoryBadge";
import styles from "../ProductDetails.module.css";

export default function ProductInventorySection({ product, isEditing = false, values, errors, onChange }) {
  const stock = Number(product.stockQuantity || 0);
  const minimum = Math.max(Number(isEditing ? values.minimumStock || 0 : product.minimumStock || 0), 0);
  const capacity = Math.max(stock, minimum, 1);
  const percentage = Math.min((stock / capacity) * 100, 100);
  const healthLabel =
    (isEditing ? values.status : product.status) === "out_of_stock" || stock === 0 ? "Out of stock" : stock <= minimum ? "Low stock warning" : "Healthy stock level";

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Inventory</p>
          <h2 className={styles.sectionTitle}>Stock Health</h2>
        </div>
      </div>

      <div className={styles.inventoryLayout}>
        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <span className={styles.infoLabel}>Current Stock</span>
            <strong className={styles.metricValue}>{stock}</strong>
            {isEditing ? <span className={styles.supportText}>Use Restock or Adjust Stock to change this value.</span> : null}
          </div>
          <div className={styles.metricCard}>
            <span className={styles.infoLabel}>Minimum Stock</span>
            {isEditing ? (
              <>
                <input name="minimumStock" type="number" min="0" step="1" className={styles.inlineInput} value={values.minimumStock} onChange={onChange} />
                {errors.minimumStock ? <span className={styles.inlineError}>{errors.minimumStock}</span> : null}
              </>
            ) : (
              <strong className={styles.metricValue}>{minimum}</strong>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className={styles.metricCard}>
            <span className={styles.infoLabel}>Status</span>
            <select name="status" className={styles.inlineInput} value={values.status} onChange={onChange}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="out_of_stock">out of stock</option>
            </select>
            {errors.status ? <span className={styles.inlineError}>{errors.status}</span> : null}
          </div>
        ) : (
          <ProductInventoryBadge product={product} />
        )}

        <div className={styles.progressBlock}>
          <div className={styles.progressMeta}>
            <span className={styles.infoLabel}>Stock Progress</span>
            <span className={styles.infoValue}>{healthLabel}</span>
          </div>
          <div className={styles.progressTrack}>
            <span className={styles.progressFill} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
