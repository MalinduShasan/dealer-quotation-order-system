import shared from "../shared/tableShared.module.css";
import styles from "./RecentOrdersTable.module.css";

export default function RecentOrdersTable({ rows }) {
  return (
    <article className={shared.card}>
      <div className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Recent Orders</p>
          <h3 className={shared.title}>Order Execution Desk</h3>
        </div>
      </div>
      <div className={shared.tableWrap}>
        <table className={shared.table}>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Dealer</th>
              <th>Status</th>
              <th>Grand Total</th>
              <th>Order Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.number}>
                <td>{row.number}</td>
                <td>{row.dealer}</td>
                <td><span className={styles.status}>{row.status}</span></td>
                <td>{row.total}</td>
                <td>{row.date}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button">View</button>
                    <button type="button">Update</button>
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
