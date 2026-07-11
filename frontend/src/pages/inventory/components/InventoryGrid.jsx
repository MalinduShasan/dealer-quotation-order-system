import InventoryCard from "./InventoryCard";
import styles from "../InventoryManagement.module.css";

export default function InventoryGrid({ items, canManage, onViewHistory, onRestock, onAdjust }) {
  return (
    <div className={styles.inventoryGrid}>
      {items.map((item) => (
        <InventoryCard
          key={item.id}
          item={item}
          canManage={canManage}
          onViewHistory={onViewHistory}
          onRestock={onRestock}
          onAdjust={onAdjust}
        />
      ))}
    </div>
  );
}
