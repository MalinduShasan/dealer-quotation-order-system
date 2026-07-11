import StockHealthBadge from "./StockHealthBadge";
import styles from "../InventoryManagement.module.css";

function formatDate(value) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function InventoryTable({
  items,
  canManage,
  onViewHistory,
  onRestock,
  onAdjust
}) {
  return (
    <div className={styles.inventoryTableWrap}>
      <table className={styles.inventoryTable}>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Current Stock</th>
            <th>Minimum Stock</th>
            <th>Stock Health</th>
            <th>Last Movement</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className={styles.productCell}>
                  <div className={styles.productThumb}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className={styles.productThumbImage} loading="lazy" /> : <span>No Image</span>}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                  </div>
                </div>
              </td>
              <td>{item.sku}</td>
              <td>{item.categoryName || "N/A"}</td>
              <td>{item.brandName || "N/A"}</td>
              <td>{item.stockQuantity}</td>
              <td>{item.minimumStock}</td>
              <td><StockHealthBadge value={item.stockHealth} /></td>
              <td>{formatDate(item.lastMovement?.createdAt)}</td>
              <td>
                <div className={styles.actionRow}>
                  <button type="button" className={styles.secondaryButton} onClick={() => onViewHistory(item)}>
                    View History
                  </button>
                  {canManage ? (
                    <>
                      <button type="button" className={styles.secondaryButton} onClick={() => onRestock(item)}>
                        Restock
                      </button>
                      <button type="button" className={styles.secondaryButton} onClick={() => onAdjust(item)}>
                        Adjust Stock
                      </button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.mobileInventoryCards}>
        {items.map((item) => (
          <article key={item.id} className={styles.mobileInventoryCard}>
            <div className={styles.mobileInventoryHeader}>
              <strong>{item.name}</strong>
              <StockHealthBadge value={item.stockHealth} />
            </div>
            <p className={styles.mobileMeta}>SKU: {item.sku}</p>
            <p className={styles.mobileMeta}>Category: {item.categoryName || "N/A"}</p>
            <p className={styles.mobileMeta}>Brand: {item.brandName || "N/A"}</p>
            <p className={styles.mobileMeta}>Current Stock: {item.stockQuantity}</p>
            <p className={styles.mobileMeta}>Minimum Stock: {item.minimumStock}</p>
            <p className={styles.mobileMeta}>Last Movement: {formatDate(item.lastMovement?.createdAt)}</p>
            <div className={styles.actionRow}>
              <button type="button" className={styles.secondaryButton} onClick={() => onViewHistory(item)}>
                View History
              </button>
              {canManage ? (
                <>
                  <button type="button" className={styles.secondaryButton} onClick={() => onRestock(item)}>
                    Restock
                  </button>
                  <button type="button" className={styles.secondaryButton} onClick={() => onAdjust(item)}>
                    Adjust Stock
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
