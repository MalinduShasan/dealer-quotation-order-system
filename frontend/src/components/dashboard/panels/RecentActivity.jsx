import shared from "../shared/panelShared.module.css";
import styles from "./RecentActivity.module.css";

export default function RecentActivity({ items }) {
  return (
    <article className={shared.panel}>
      <p className={shared.eyebrow}>Recent Activity</p>
      <h3 className={shared.title}>Operational Timeline</h3>
      <div className={styles.timeline}>
        {items.map((item) => (
          <div key={item.title + item.time} className={styles.item}>
            <span className={styles.marker} />
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
