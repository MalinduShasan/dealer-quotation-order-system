import styles from "../QuotationManagement.module.css";

export default function QuotationFilters({
  filters,
  onChange,
  onReset
}) {
  return (
    <div className={styles.filterGrid}>
      <input
        className={styles.filterInput}
        placeholder="Search quotation number or dealer"
        value={filters.search}
        onChange={(event) => onChange("search", event.target.value)}
      />
      <select className={styles.filterInput} value={filters.status} onChange={(event) => onChange("status", event.target.value)}>
        <option value="all">All statuses</option>
        <option value="draft">Draft</option>
        <option value="pending_approval">Pending Approval</option>
        <option value="approved">Approved</option>
        <option value="sent">Sent</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
        <option value="expired">Expired</option>
        <option value="cancelled">Cancelled</option>
        <option value="converted">Converted</option>
      </select>
      <select className={styles.filterInput} value={filters.validity} onChange={(event) => onChange("validity", event.target.value)}>
        <option value="all">All validity</option>
        <option value="active">Active</option>
        <option value="expiring_soon">Expiring soon</option>
        <option value="expired">Expired</option>
      </select>
      <select className={styles.filterInput} value={filters.sortBy} onChange={(event) => onChange("sortBy", event.target.value)}>
        <option value="created_at">Created Date</option>
        <option value="valid_until">Valid Until</option>
        <option value="grand_total">Grand Total</option>
        <option value="quotation_number">Quotation Number</option>
        <option value="status">Status</option>
      </select>
      <select className={styles.filterInput} value={filters.sortOrder} onChange={(event) => onChange("sortOrder", event.target.value)}>
        <option value="desc">Newest First</option>
        <option value="asc">Oldest First</option>
      </select>
      <button type="button" className={styles.secondaryButton} onClick={onReset}>
        Reset Filters
      </button>
    </div>
  );
}
