import { useEffect, useState } from "react";
import styles from "./AdminDashboard.module.css";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import DashboardCards from "./DashboardCards";
import RevenueChart from "./RevenueChart";
import OrdersChart from "./OrdersChart";
import QuotationChart from "./QuotationChart";
import TopProductsChart from "./TopProductsChart";
import DealerGrowthChart from "./DealerGrowthChart";
import RecentSalesChart from "./RecentSalesChart";
import RecentQuotationTable from "./RecentQuotationTable";
import RecentOrdersTable from "./RecentOrdersTable";
import RecentActivity from "./RecentActivity";
import NotificationPanel from "./NotificationPanel";
import QuickActions from "./QuickActions";
import SystemHealth from "./SystemHealth";
import LowStockPanel from "./LowStockPanel";
import DashboardFooter from "./DashboardFooter";
import {
  kpis,
  revenueByMonth,
  ordersByMonth,
  quotationStatusData,
  topProducts,
  recentQuotations,
  recentOrders,
  lowStockItems,
  activityTimeline,
  notifications,
  quickActions,
  systemHealth,
  dealerGrowth,
  recentSalesTrend
} from "./dashboardData";

function formatClock(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function greetingByHour(date) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function AdminDashboard({ user, theme, onToggleTheme, onLogout, onNavigate }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.dashboardShell}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <div className={styles.workspace}>
        <Navbar
          currentPageTitle="Admin Dashboard"
          user={user}
          theme={theme}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onToggleTheme={onToggleTheme}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={onLogout}
        />

        <main className={styles.mainContent}>
          <section className={styles.welcomeCard}>
            <div>
              <p className={styles.welcomeEyebrow}>QuoteFlow ERP</p>
              <h1 className={styles.welcomeTitle}>
                {greetingByHour(currentTime)}, Administrator
              </h1>
              <p className={styles.welcomeMessage}>
                Welcome back to QuoteFlow. Your commercial operations snapshot is ready for review.
              </p>
            </div>
            <div className={styles.datePanel}>
              <span>{formatDate(currentTime)}</span>
              <strong>{formatClock(currentTime)}</strong>
            </div>
          </section>

          <DashboardCards items={kpis} />

          <section className={styles.chartGrid}>
            <RevenueChart data={revenueByMonth} />
            <OrdersChart data={ordersByMonth} />
            <QuotationChart data={quotationStatusData} />
            <TopProductsChart data={topProducts} />
            <DealerGrowthChart data={dealerGrowth} />
            <RecentSalesChart data={recentSalesTrend} />
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.primaryColumn}>
              <RecentQuotationTable rows={recentQuotations} />
              <RecentOrdersTable rows={recentOrders} />
            </div>
            <div className={styles.secondaryColumn}>
              <LowStockPanel rows={lowStockItems} />
              <RecentActivity items={activityTimeline} />
              <NotificationPanel items={notifications} />
            </div>
          </section>

          <section className={styles.bottomGrid}>
            <QuickActions items={quickActions} />
            <SystemHealth items={systemHealth} />
          </section>
        </main>

        <DashboardFooter />
      </div>
    </div>
  );
}
