import styles from "../QuotationManagement.module.css";

const summaryCards = [
  { key: "total", label: "Total Quotations" },
  { key: "draft", label: "Draft" },
  { key: "pendingApproval", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "expiringSoon", label: "Expiring Soon" }
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export default function QuotationSummaryCards({ summary }) {
  return (
    <div className={styles.summaryGrid}>
      {summaryCards.map((card) => (
        <div key={card.key} className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{card.label}</span>
          <strong className={styles.summaryValue}>{summary?.[card.key] ?? 0}</strong>
        </div>
      ))}
      <div className={`${styles.summaryCard} ${styles.summaryCardWide}`}>
        <span className={styles.summaryLabel}>Estimated Quotation Value</span>
        <strong className={styles.summaryValue}>{formatCurrency(summary?.estimatedValue || 0)}</strong>
      </div>
    </div>
  );
}
