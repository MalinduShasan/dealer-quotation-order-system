import styles from "./Sidebar.module.css";
import {
  AuditIcon,
  BrandsIcon,
  CategoriesIcon,
  DashboardIcon,
  DealersIcon,
  LogoutIcon,
  NotificationsIcon,
  OrdersIcon,
  ProductsIcon,
  QuotationsIcon,
  ReportsIcon,
  SettingsIcon,
  UsersIcon
} from "../dashboardIcons";
import { sidebarItems } from "../dashboardData";

const iconMap = {
  dashboard: DashboardIcon,
  users: UsersIcon,
  dealers: DealersIcon,
  categories: CategoriesIcon,
  brands: BrandsIcon,
  products: ProductsIcon,
  quotations: QuotationsIcon,
  orders: OrdersIcon,
  reports: ReportsIcon,
  notifications: NotificationsIcon,
  settings: SettingsIcon,
  "audit-logs": AuditIcon
};

const routeMap = {
  dashboard: "/dashboard",
  users: "/users",
  dealers: "/dealers",
  categories: "/categories",
  brands: "/brands",
  quotations: "/quotations"
};

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
  onNavigate,
  onLogout,
  activeItem = "dashboard"
}) {
  return (
    <>
      <div className={`${styles.backdrop} ${mobileOpen ? styles.backdropVisible : ""}`} onClick={onCloseMobile} />
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>QF</div>
          {!collapsed && (
            <div>
              <p className={styles.brandEyebrow}>QuoteFlow</p>
              <h2 className={styles.brandTitle}>ERP Console</h2>
            </div>
          )}
        </div>

        <button type="button" className={styles.collapseButton} onClick={onToggleCollapse}>
          {collapsed ? "Expand" : "Collapse"}
        </button>

        <nav className={styles.navList}>
          {sidebarItems.map((item) => {
            const Icon = iconMap[item.id];
            const isActive = item.id === activeItem;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={() => {
                  if (routeMap[item.id]) {
                    onNavigate(routeMap[item.id]);
                  }
                  onCloseMobile();
                }}
              >
                <Icon className={styles.navIcon} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button type="button" className={`${styles.navItem} ${styles.logoutButton}`} onClick={onLogout}>
          <LogoutIcon className={styles.navIcon} />
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>
    </>
  );
}
