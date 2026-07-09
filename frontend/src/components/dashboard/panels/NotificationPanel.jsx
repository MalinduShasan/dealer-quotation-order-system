import shared from "../shared/panelShared.module.css";
import styles from "./NotificationPanel.module.css";

export default function NotificationPanel({ items }) {
  return (
    <article className={shared.panel}>
      <p className={shared.eyebrow}>Notifications</p>
      <h3 className={shared.title}>Unread Alerts</h3>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.title} className={`${styles.notification} ${styles[item.level]}`}>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
