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

export default function QuotationTable({ items, userRole, onView, onAction }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Quotation</th>
            <th>Dealer</th>
            <th>Created By</th>
            <th>Status</th>
            <th>Items</th>
            <th>Grand Total</th>
            <th>Valid Until</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className={styles.primaryCell}>
                  <strong>{item.quotationNumber}</strong>
                  <span>{item.currencyCode || "USD"} • v{item.version || 1}</span>
                </div>
              </td>
              <td>
                <div className={styles.primaryCell}>
                  <strong>{item.dealer?.companyName || "—"}</strong>
                  <span>{item.dealer?.dealerCode || "No dealer code"}</span>
                </div>
              </td>
              <td>{item.createdByName || "System"}</td>
              <td><QuotationStatusBadge status={item.status} /></td>
              <td>{item.items?.length || 0}</td>
              <td>{formatCurrency(item.grandTotal)}</td>
              <td>{formatDate(item.validUntil)}</td>
              <td>{formatDate(item.createdAt)}</td>
              <td>
                <QuotationActionsMenu quotation={item} userRole={userRole} onView={onView} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
