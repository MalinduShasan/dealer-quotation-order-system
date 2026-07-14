import QuotationActionsMenu from "./QuotationActionsMenu";
import QuotationStatusBadge from "./QuotationStatusBadge";
import styles from "../QuotationManagement.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export default function QuotationCards({ items, userRole, onView, onAction }) {
  return (
    <div className={styles.cardGrid}>
      {items.map((item) => (
        <article key={item.id} className={styles.quotationCard}>
          <div className={styles.cardHeader}>
            <div>
              <strong className={styles.cardTitle}>{item.quotationNumber}</strong>
              <p className={styles.cardSubtle}>{item.dealer?.companyName || "No dealer"}</p>
            </div>
            <QuotationStatusBadge status={item.status} />
          </div>
          <div className={styles.cardMeta}>
            <span>Items: {item.items?.length || 0}</span>
            <span>Valid: {formatDate(item.validUntil)}</span>
            <span>Created: {formatDate(item.createdAt)}</span>
          </div>
          <div className={styles.cardTotal}>{formatCurrency(item.grandTotal)}</div>
          <QuotationActionsMenu quotation={item} userRole={userRole} onView={onView} onAction={onAction} />
        </article>
      ))}
    </div>
  );
}
