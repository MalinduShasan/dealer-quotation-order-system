import summaryStyles from "./InventorySummaryCards.module.css";
import {
  CheckCircleIcon,
  InventoryIcon,
  ProductsIcon,
  TrendUpIcon,
  WarningIcon,
  XCircleIcon
} from "../../../components/dashboard/dashboardIcons";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export default function InventorySummaryCards({ summary, todayMovements = 0 }) {
  const healthyStock = Math.max((summary.totalProducts ?? 0) - (summary.lowStockProducts ?? 0) - (summary.outOfStockProducts ?? 0), 0);

  const cards = [
    { label: "Total Products", value: summary.totalProducts ?? 0, helper: "Tracked catalog items", icon: ProductsIcon },
    { label: "Total Stock Units", value: summary.totalUnitsInStock ?? 0, helper: "Units currently available", icon: InventoryIcon },
    { label: "Healthy Stock", value: healthyStock, helper: "Above minimum thresholds", icon: CheckCircleIcon },
    { label: "Low Stock Products", value: summary.lowStockProducts ?? 0, helper: "Needs replenishment soon", icon: WarningIcon },
    { label: "Out of Stock Products", value: summary.outOfStockProducts ?? 0, helper: "Unavailable for immediate sale", icon: XCircleIcon },
    { label: "Inventory Value", value: currency.format(summary.inventoryValue ?? 0), helper: "Estimated on-hand value", icon: TrendUpIcon },
    { label: "Today's Movements", value: todayMovements, helper: "Recorded stock changes today", icon: TrendUpIcon, trend: "Live from recent movement feed" }
  ];

  return (
    <div className={summaryStyles.grid}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className={summaryStyles.card} title={card.label}>
            <div className={summaryStyles.header}>
              <div>
                <p className={summaryStyles.label}>{card.label}</p>
                <h3 className={summaryStyles.value}>{card.value}</h3>
              </div>
              <div className={summaryStyles.iconWrap}>
                <Icon className={summaryStyles.icon} />
              </div>
            </div>
            <p className={summaryStyles.helper}>{card.helper}</p>
            {card.trend ? <span className={summaryStyles.trend}>{card.trend}</span> : null}
          </article>
        );
      })}
    </div>
  );
}
