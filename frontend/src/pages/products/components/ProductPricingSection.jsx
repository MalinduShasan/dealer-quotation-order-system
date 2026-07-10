import styles from "../ProductDetails.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

export default function ProductPricingSection({ product, isEditing = false, values, errors, onChange }) {
  const retail = Number(isEditing ? values.unitPrice || 0 : product.unitPrice || 0);
  const dealer = Number(isEditing ? values.dealerPrice || 0 : product.dealerPrice || 0);
  const discountAmount = retail - dealer;
  const discountPercentage = retail > 0 ? (discountAmount / retail) * 100 : 0;

  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Pricing</p>
          <h2 className={styles.sectionTitle}>Commercial Pricing</h2>
        </div>
      </div>

      <div className={styles.metricGrid}>
        <div className={styles.metricCard}>
          <span className={styles.infoLabel}>Retail Price</span>
          {isEditing ? (
            <>
              <input name="unitPrice" type="number" min="0" step="0.01" className={styles.inlineInput} value={values.unitPrice} onChange={onChange} />
              {errors.unitPrice ? <span className={styles.inlineError}>{errors.unitPrice}</span> : null}
            </>
          ) : (
            <strong className={styles.metricValue}>{formatCurrency(retail)}</strong>
          )}
        </div>
        <div className={styles.metricCard}>
          <span className={styles.infoLabel}>Dealer Price</span>
          {isEditing ? (
            <>
              <input name="dealerPrice" type="number" min="0" step="0.01" className={styles.inlineInput} value={values.dealerPrice} onChange={onChange} />
              {errors.dealerPrice ? <span className={styles.inlineError}>{errors.dealerPrice}</span> : null}
            </>
          ) : (
            <strong className={styles.metricValue}>{formatCurrency(dealer)}</strong>
          )}
        </div>
        <div className={styles.metricCard}>
          <span className={styles.infoLabel}>Dealer Discount</span>
          <strong className={styles.metricValue}>{formatCurrency(discountAmount)}</strong>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.infoLabel}>Discount %</span>
          <strong className={styles.metricValue}>{discountPercentage.toFixed(1)}%</strong>
        </div>
      </div>
    </section>
  );
}
