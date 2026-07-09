import styles from "./DashboardCards.module.css";
import { TrendDownIcon, TrendUpIcon, WarningIcon } from "./dashboardIcons";

const accentClass = {
  champagne: styles.champagne,
  emerald: styles.emerald,
  blue: styles.blue,
  violet: styles.violet,
  amber: styles.amber,
  green: styles.green,
  red: styles.red
};

export default function DashboardCards({ items }) {
  return (
    <section className={styles.grid}>
      {items.map((item) => {
        const TrendIcon = item.trend === "down" ? TrendDownIcon : item.trend === "alert" ? WarningIcon : TrendUpIcon;
        return (
          <article key={item.id} className={`${styles.card} ${accentClass[item.accent] || ""}`}>
            <div className={styles.header}>
              <div>
                <p className={styles.label}>{item.label}</p>
                <strong className={styles.value}>{item.value}</strong>
              </div>
              <div className={styles.iconBubble}>
                <TrendIcon className={styles.icon} />
              </div>
            </div>
            <p className={styles.note}>{item.note}</p>
            <div className={styles.footer}>
              <span className={styles.change}>{item.change}</span>
              <span className={styles.trendText}>{item.trend === "down" ? "versus yesterday" : item.trend === "alert" ? "new inventory alert" : "versus last period"}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
