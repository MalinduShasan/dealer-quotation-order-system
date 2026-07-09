import shared from "../shared/panelShared.module.css";
import styles from "./SystemHealth.module.css";

export default function SystemHealth({ items }) {
  return (
    <article className={shared.panel}>
      <p className={shared.eyebrow}>System Health</p>
      <h3 className={shared.title}>Infrastructure Status</h3>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.label} className={styles.row}>
            <div>
              <strong>{item.label}</strong>
              <p>{item.meta}</p>
            </div>
            <span className={`${styles.status} ${styles[item.tone]}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
