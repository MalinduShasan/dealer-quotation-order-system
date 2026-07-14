import styles from "./QuotationBuilder.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

export default function QuotationItemRow({ item, index, onChange, onRemove }) {
  const exceedsStock = Number(item.quantity || 0) > Number(item.stockQuantity || 0);
  return (
    <div className={styles.itemCard}>
      <div className={styles.itemCardHeader}>
        <div>
          <strong>{item.product_name_snapshot}</strong>
          <p className={styles.itemMeta}>
            {item.product_sku_snapshot} • {item.brand_name_snapshot || "No brand"} • {item.category_name_snapshot || "No category"}
          </p>
        </div>
        <button type="button" className={styles.dangerButton} onClick={() => onRemove(index)}>
          Remove
        </button>
      </div>

      <div className={styles.itemEditorGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Quantity</label>
          <input
            type="number"
            min="1"
            className={styles.fieldInput}
            value={item.quantity}
            onChange={(event) => onChange(index, "quantity", event.target.value)}
          />
          {exceedsStock ? <span className={styles.fieldHint}>Available stock: {item.stockQuantity}</span> : null}
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Unit Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={styles.fieldInput}
            value={item.unit_price}
            onChange={(event) => onChange(index, "unit_price", event.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Discount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={styles.fieldInput}
            value={item.discount_amount}
            onChange={(event) => onChange(index, "discount_amount", event.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Tax</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={styles.fieldInput}
            value={item.tax_amount}
            onChange={(event) => onChange(index, "tax_amount", event.target.value)}
          />
        </div>
      </div>

      <div className={styles.itemActions}>
        <span className={styles.badge}>Stock: {item.stockQuantity}</span>
        <span className={styles.badge}>Line Total: {formatCurrency(item.line_total)}</span>
      </div>
    </div>
  );
}
