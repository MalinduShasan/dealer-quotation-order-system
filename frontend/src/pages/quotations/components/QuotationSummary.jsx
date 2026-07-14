import styles from "./QuotationBuilder.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

export default function QuotationSummary({ totals }) {
  return (
    <section className={styles.summaryCard}>
      <div>
        <p className={styles.eyebrow}>Summary</p>
        <h2 className={styles.sectionTitle}>Commercial Totals</h2>
      </div>

      <div className={styles.summaryLine}>
        <span>Subtotal</span>
        <strong>{formatCurrency(totals.subtotal)}</strong>
      </div>
      <div className={styles.summaryLine}>
        <span>Discount</span>
        <strong>{formatCurrency(totals.discountAmount)}</strong>
      </div>
      <div className={styles.summaryLine}>
        <span>Tax</span>
        <strong>{formatCurrency(totals.taxAmount)}</strong>
      </div>
      <div className={styles.summaryLine}>
        <span>Shipping</span>
        <strong>{formatCurrency(totals.shippingAmount)}</strong>
      </div>
      <div className={styles.summaryLine}>
        <span className={styles.summaryTotal}>Grand Total</span>
        <strong className={styles.summaryTotal}>{formatCurrency(totals.grandTotal)}</strong>
      </div>
    </section>
  );
}
