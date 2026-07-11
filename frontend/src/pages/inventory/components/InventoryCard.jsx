import { memo } from "react";
import StockHealthBadge from "./StockHealthBadge";
import cardStyles from "./InventoryCard.module.css";
import { EyeIcon, InventoryIcon } from "../../../components/dashboard/dashboardIcons";

function formatDate(value) {
  if (!value) return "No movement yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function InventoryCard({ item, canManage, onViewHistory, onRestock, onAdjust }) {
  const stockValue = Number(item.stockQuantity || 0) * Number(item.unitPrice || 0);

  return (
    <article className={cardStyles.card}>
      <div className={cardStyles.header}>
        <button
          type="button"
          className={cardStyles.thumbButton}
          onClick={() => onViewHistory(item)}
          aria-label={`View ${item.name} history`}
          title="View History"
        >
          <div className={cardStyles.thumb}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={`${item.name} product`} className={cardStyles.thumbImage} loading="lazy" />
            ) : (
              <InventoryIcon className={cardStyles.placeholderIcon} />
            )}
          </div>
        </button>

        <div className={cardStyles.titleBlock}>
          <h3 className={cardStyles.title}>{item.name}</h3>
          <p className={cardStyles.meta}>SKU: {item.sku}</p>
          <div className={cardStyles.metaRow}>
            <p className={cardStyles.subMeta}>{item.brandName || "No brand"}</p>
            <p className={cardStyles.subMeta}>{item.categoryName || "No category"}</p>
          </div>
        </div>
      </div>

      <div className={cardStyles.metrics}>
        <div className={cardStyles.metricCard}>
          <span className={cardStyles.valueLabel}>Current Stock</span>
          <strong className={cardStyles.value}>{item.stockQuantity}</strong>
        </div>
        <div className={cardStyles.metricCard}>
          <span className={cardStyles.valueLabel}>Minimum Stock</span>
          <strong className={cardStyles.value}>{item.minimumStock}</strong>
        </div>
        <div className={cardStyles.metricCard}>
          <span className={cardStyles.valueLabel}>Unit Price</span>
          <strong className={cardStyles.value}>{formatCurrency(item.unitPrice)}</strong>
        </div>
        <div className={cardStyles.metricCard}>
          <span className={cardStyles.valueLabel}>Stock Value</span>
          <strong className={cardStyles.value}>{formatCurrency(stockValue)}</strong>
        </div>
      </div>

      <div className={cardStyles.footer}>
        <div className={cardStyles.statusRow}>
          <StockHealthBadge value={item.stockHealth} />
          <p className={cardStyles.footNote}>
            {item.lastMovement?.movementType ? `${item.lastMovement.movementType.replaceAll("_", " ")}` : "No movement"} | {formatDate(item.lastMovement?.createdAt)}
          </p>
        </div>

        <div className={cardStyles.actions}>
          {canManage ? (
            <>
              <button type="button" className={cardStyles.restockButton} onClick={() => onRestock(item)}>
                Restock
              </button>
              <button type="button" className={cardStyles.adjustButton} onClick={() => onAdjust(item)}>
                Adjust
              </button>
            </>
          ) : null}
          <button
            type="button"
            className={cardStyles.historyButton}
            onClick={() => onViewHistory(item)}
            aria-label={`Open ${item.name} stock history`}
            title="View History"
          >
            <EyeIcon className={cardStyles.actionIcon} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(InventoryCard);
