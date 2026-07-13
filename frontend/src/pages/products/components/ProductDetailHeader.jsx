import { ArrowLeftIcon } from "../../../components/dashboard/dashboardIcons";
import ProductStatusBadge from "./ProductStatusBadge";
import styles from "../ProductDetails.module.css";

export default function ProductDetailHeader({ product, onBack, canManage, onEdit }) {
  return (
    <section className={styles.headerCard}>
      <div className={styles.headerTopRow}>
        <div className={styles.headerInlineActions}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label="Back to Products"
            title="Back to Products"
          >
            <ArrowLeftIcon className={styles.backIcon} />
          </button>
          <ProductStatusBadge status={product.status} />
        </div>
        {canManage ? (
          <button type="button" className={styles.primaryButton} onClick={() => onEdit(product)}>
            Edit Product
          </button>
        ) : null}
      </div>
      <div className={styles.headerBody}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>Product Details</p>
          <h1 className={styles.title}>{product.name}</h1>
          <span className={styles.sku}>SKU: {product.sku || "N/A"}</span>
        </div>
      </div>
    </section>
  );
}
