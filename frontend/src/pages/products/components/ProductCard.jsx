import { memo } from "react";
import { EyeIcon } from "../../../components/dashboard/dashboardIcons";
import ProductStatusBadge from "./ProductStatusBadge";
import cardStyles from "./ProductCard.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(Number(value || 0));
}

function ProductCard({ product, onNavigate }) {
  return (
    <article className={cardStyles.card}>
      <div className={cardStyles.imageWrap}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className={cardStyles.image} loading="lazy" />
        ) : (
          <span className={cardStyles.placeholder}>No Image</span>
        )}
      </div>

      <div className={cardStyles.content}>
        <div className={cardStyles.header}>
          <div className={cardStyles.titleRow}>
            <h3 className={cardStyles.title}>{product.name}</h3>
            <ProductStatusBadge status={product.status} />
          </div>
          <div className={cardStyles.meta}>
            <span className={cardStyles.metaText}>{product.brandName || "No brand"}</span>
            <span className={cardStyles.metaText}>{product.categoryName || "No category"}</span>
          </div>
        </div>

        <div className={cardStyles.pricingGrid}>
          <div className={cardStyles.metric}>
            <span className={cardStyles.metricLabel}>Retail</span>
            <strong className={cardStyles.metricValue}>{formatCurrency(product.unitPrice)}</strong>
          </div>
          <div className={cardStyles.metric}>
            <span className={cardStyles.metricLabel}>Dealer</span>
            <strong className={cardStyles.metricValue}>{formatCurrency(product.dealerPrice)}</strong>
          </div>
        </div>

        <div className={cardStyles.inventoryGrid}>
          <div className={cardStyles.metric}>
            <span className={cardStyles.metricLabel}>Current stock</span>
            <strong className={cardStyles.metricValue}>{product.stockQuantity}</strong>
          </div>
          <div className={cardStyles.metric}>
            <span className={cardStyles.metricLabel}>Minimum stock</span>
            <strong className={cardStyles.metricValue}>{product.minimumStock}</strong>
          </div>
        </div>
      </div>

      <div className={cardStyles.footer}>
        <button
          type="button"
          className={cardStyles.iconButton}
          onClick={() => onNavigate(product)}
          aria-label={`View ${product.name} details`}
          title={`View ${product.name} details`}
        >
          <EyeIcon className={cardStyles.icon} />
        </button>
      </div>
    </article>
  );
}

export default memo(ProductCard);
