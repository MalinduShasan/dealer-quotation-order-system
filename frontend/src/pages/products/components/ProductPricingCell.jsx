import styles from "../ProductManagement.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

export default function ProductPricingCell({ product }) {
  return (
    <div className={styles.pricingCell}>
      <div className={styles.pricingRow}>
        <span className={styles.pricingLabel}>Retail</span>
        <strong className={styles.pricingValue}>{formatCurrency(product.unitPrice)}</strong>
      </div>
      <div className={styles.pricingRow}>
        <span className={styles.pricingLabel}>Dealer</span>
        <strong className={styles.pricingValue}>{formatCurrency(product.dealerPrice)}</strong>
      </div>
    </div>
  );
}
