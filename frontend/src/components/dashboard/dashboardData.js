export const sidebarItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "dealers", label: "Dealers" },
  { id: "categories", label: "Categories" },
  { id: "brands", label: "Brands" },
  { id: "products", label: "Products" },
  { id: "quotations", label: "Quotations" },
  { id: "orders", label: "Orders" },
  { id: "reports", label: "Reports" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
  { id: "audit-logs", label: "Audit Logs" }
];

export const kpis = [
  { id: "users", label: "Total Users", value: "128", note: "Across all internal roles", change: "+3.2%", trend: "up", accent: "champagne" },
  { id: "dealers", label: "Total Dealers", value: "42", note: "Active dealer partners", change: "+2.1%", trend: "up", accent: "emerald" },
  { id: "products", label: "Total Products", value: "386", note: "Listed sellable SKUs", change: "+1.4%", trend: "up", accent: "blue" },
  { id: "quotations", label: "Total Quotations", value: "264", note: "This quarter to date", change: "+5.8%", trend: "up", accent: "violet" },
  { id: "pending", label: "Pending Quotations", value: "18", note: "Waiting for approval", change: "-2.0%", trend: "down", accent: "amber" },
  { id: "approved", label: "Approved Quotations", value: "112", note: "Ready for conversion", change: "+4.6%", trend: "up", accent: "green" },
  { id: "ordersToday", label: "Orders Today", value: "9", note: "Placed since 08:00", change: "+2 orders", trend: "up", accent: "blue" },
  { id: "revenueToday", label: "Revenue Today", value: "$8.4K", note: "Recognized sales value", change: "+6.1%", trend: "up", accent: "champagne" },
  { id: "monthlyRevenue", label: "Monthly Revenue", value: "$86K", note: "Month-to-date turnover", change: "+8.4%", trend: "up", accent: "emerald" },
  { id: "lowStock", label: "Low Stock Products", value: "6", note: "Needs replenishment", change: "+1 alert", trend: "alert", accent: "red" }
];

export const revenueByMonth = [62, 70, 68, 76, 88, 95, 102, 109, 120, 128, 136, 148];
export const ordersByMonth = [88, 92, 95, 101, 110, 116, 124, 132, 138, 144, 151, 159];
export const dealerGrowth = [20, 26, 33, 36, 44, 51, 60, 68, 76, 88, 96, 108];
export const recentSalesTrend = [38, 42, 44, 48, 46, 53, 58];

export const quotationStatusData = [
  { label: "Draft", value: 18, color: "var(--text-muted)" },
  { label: "Pending", value: 24, color: "var(--accent-amber)" },
  { label: "Approved", value: 30, color: "var(--accent-success)" },
  { label: "Sent", value: 12, color: "var(--accent-info)" },
  { label: "Accepted", value: 10, color: "var(--accent-secondary)" },
  { label: "Rejected", value: 6, color: "var(--accent-danger)" }
];

export const topProducts = [
  { name: "Hydraulic Valve Set", value: 92 },
  { name: "Industrial Sensor Pack", value: 84 },
  { name: "Premium Seal Assembly", value: 72 },
  { name: "Smart Relay Module", value: 61 },
  { name: "Control Panel Kit", value: 54 }
];

export const recentQuotations = [
  { number: "QF-QT-2026-00481", dealer: "Apex Industrial Traders", executive: "N. Perera", status: "Pending Approval", total: "$12,480", date: "2026-07-10" },
  { number: "QF-QT-2026-00476", dealer: "Meridian Supply House", executive: "S. Fernando", status: "Approved", total: "$8,950", date: "2026-07-10" },
  { number: "QF-QT-2026-00471", dealer: "Lanka Build Commerce", executive: "D. Silva", status: "Sent", total: "$15,720", date: "2026-07-09" },
  { number: "QF-QT-2026-00468", dealer: "Nova Trade Network", executive: "K. Jayasekara", status: "Accepted", total: "$21,360", date: "2026-07-09" },
  { number: "QF-QT-2026-00459", dealer: "Central Engineering Depot", executive: "M. Weerasinghe", status: "Draft", total: "$4,120", date: "2026-07-08" }
];

export const recentOrders = [
  { number: "QF-OD-2026-00214", dealer: "Apex Industrial Traders", status: "Dispatch", total: "$10,880", date: "2026-07-10" },
  { number: "QF-OD-2026-00211", dealer: "Meridian Supply House", status: "Packing", total: "$7,440", date: "2026-07-10" },
  { number: "QF-OD-2026-00204", dealer: "Nova Trade Network", status: "Delivered", total: "$18,900", date: "2026-07-09" },
  { number: "QF-OD-2026-00198", dealer: "Central Engineering Depot", status: "Cancelled", total: "$2,640", date: "2026-07-08" }
];

export const lowStockItems = [
  { product: "Hydraulic Valve Set", sku: "HVS-0042", current: 6, minimum: 20, status: "Critical" },
  { product: "Industrial Sensor Pack", sku: "ISP-1180", current: 9, minimum: 25, status: "Low" },
  { product: "Control Panel Kit", sku: "CPK-9011", current: 11, minimum: 30, status: "Critical" },
  { product: "Premium Seal Assembly", sku: "PSA-7440", current: 13, minimum: 18, status: "Low" }
];

export const activityTimeline = [
  { title: "User Login", detail: "Administrator signed in from Colombo office", time: "2 minutes ago" },
  { title: "Quotation Created", detail: "QF-QT-2026-00481 created for Apex Industrial Traders", time: "11 minutes ago" },
  { title: "Quotation Approved", detail: "Manager approved quotation QF-QT-2026-00476", time: "23 minutes ago" },
  { title: "Order Created", detail: "Order QF-OD-2026-00214 converted from accepted quotation", time: "47 minutes ago" },
  { title: "Product Added", detail: "Smart Relay Module added to commercial catalog", time: "1 hour ago" },
  { title: "Dealer Registered", detail: "New dealer account created for Meridian Supply House", time: "2 hours ago" }
];

export const notifications = [
  { title: "Quotation expiry reminder", detail: "12 quotations will expire within the next 48 hours.", level: "warning" },
  { title: "Dealer accepted quotation", detail: "Nova Trade Network accepted QF-QT-2026-00468.", level: "success" },
  { title: "Low stock alert", detail: "4 priority SKUs dropped below minimum stock thresholds.", level: "danger" },
  { title: "System update", detail: "The nightly pricing sync completed successfully at 02:14.", level: "info" }
];

export const quickActions = [
  "Create Dealer",
  "Create Product",
  "Create Quotation",
  "Create Order",
  "Generate Report",
  "Manage Users"
];

export const systemHealth = [
  { label: "Database Status", value: "Healthy", meta: "Replication delay: 120ms", tone: "good" },
  { label: "API Status", value: "Operational", meta: "Avg response: 184ms", tone: "good" },
  { label: "Server Status", value: "Stable", meta: "CPU load: 41%", tone: "good" },
  { label: "Storage Usage", value: "68%", meta: "412 GB of 600 GB used", tone: "warn" },
  { label: "Version", value: "1.0.0", meta: "Release channel: production-candidate", tone: "neutral" }
];
