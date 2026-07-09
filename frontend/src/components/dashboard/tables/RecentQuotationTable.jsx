import styles from "./RecentQuotationTable.module.css";
import shared from "../shared/tableShared.module.css";

export default function RecentQuotationTable({ rows }) {
  return (
    <article className={shared.card}>
      <div className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Recent Quotations</p>
          <h3 className={shared.title}>Quotation Review Queue</h3>
        </div>
      </div>
      <div className={shared.tableWrap}>
        <table className={shared.table}>
          <thead>
            <tr>
              <th>Quotation Number</th>
              <th>Dealer</th>
              <th>Sales Executive</th>
              <th>Status</th>
              <th>Grand Total</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.number}>
                <td>{row.number}</td>
                <td>{row.dealer}</td>
                <td>{row.executive}</td>
                <td><span className={`${styles.badge} ${styles[row.status.replace(/\s+/g, "")] || styles.default}`}>{row.status}</span></td>
                <td>{row.total}</td>
                <td>{row.date}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button">View</button>
                    <button type="button">Edit</button>
                    <button type="button">Convert</button>
                    <button type="button">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
