import shared from "../shared/panelShared.module.css";
import styles from "./QuickActions.module.css";

export default function QuickActions({ items }) {
  return (
    <article className={shared.panel}>
      <p className={shared.eyebrow}>Quick Actions</p>
      <h3 className={shared.title}>Common Admin Tasks</h3>
      <div className={styles.grid}>
        {items.map((item) => (
          <button key={item} type="button" className={styles.actionButton}>
            {item}
          </button>
        ))}
      </div>
    </article>
  );
}
