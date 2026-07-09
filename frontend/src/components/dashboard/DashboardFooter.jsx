import styles from "./DashboardFooter.module.css";

export default function DashboardFooter() {
  return (
    <footer className={styles.footer}>
      <span>QuoteFlow ERP</span>
      <span>Version 1.0.0</span>
      <span>©2026</span>
    </footer>
  );
}
