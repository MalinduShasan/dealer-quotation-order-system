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
      <div className={cardStyles.cardTopRow}>
        <div className={cardStyles.statusCorner}>
          <ProductStatusBadge status={product.status} />
        </div>
      </div>

      <div className={cardStyles.imageContainer}>
        <div className={cardStyles.imageFrame} aria-hidden="true">
          <div className={cardStyles.imageWrap}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className={cardStyles.image} loading="lazy" />
            ) : (
              <span className={cardStyles.placeholder}>No Image</span>
            )}
          </div>
        </div>
      </div>

      <div className={cardStyles.content}>
        <div className={cardStyles.header}>
          <h3 className={cardStyles.title}>{product.name}</h3>
          <div className={cardStyles.meta}>
            <span className={cardStyles.metaText}>{product.brandName || "No brand"}</span>
            <span className={cardStyles.metaText}>{product.categoryName || "No category"}</span>
          </div>
        </div>

        <div className={cardStyles.infoSection}>
          <div className={cardStyles.infoRow}>
            <span className={cardStyles.infoLabel}>Retail Price</span>
            <strong className={cardStyles.infoValue}>{formatCurrency(product.unitPrice)}</strong>
          </div>
          <div className={cardStyles.infoRow}>
            <span className={cardStyles.infoLabel}>Dealer Price</span>
            <strong className={cardStyles.infoValue}>{formatCurrency(product.dealerPrice)}</strong>
          </div>
        </div>

        <div className={cardStyles.infoSection}>
          <div className={cardStyles.infoRow}>
            <span className={cardStyles.infoLabel}>Current Stock</span>
            <strong className={cardStyles.infoValue}>{product.stockQuantity}</strong>
          </div>
          <div className={cardStyles.infoRow}>
            <span className={cardStyles.infoLabel}>Minimum Stock</span>
            <strong className={cardStyles.infoValue}>{product.minimumStock}</strong>
          </div>
        </div>
      </div>

      <div className={cardStyles.footer}>
        <button
          type="button"
          className={cardStyles.viewButton}
          onClick={() => onNavigate(product)}
          aria-label={`View ${product.name} details`}
          title={`View ${product.name} details`}
        >
          <EyeIcon className={cardStyles.icon} />
          <span>View</span>
        </button>
      </div>
    </article>
  );
}

export default memo(ProductCard);
