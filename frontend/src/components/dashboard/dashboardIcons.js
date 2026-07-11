import React from "react";

function createIcon(path) {
  return function Icon({ className }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {path}
      </svg>
    );
  };
}

export const DashboardIcon = createIcon(<><path d="M3 13h8V3H3z" /><path d="M13 21h8V11h-8z" /><path d="M13 3h8v6h-8z" /><path d="M3 17h8v4H3z" /></>);
export const UsersIcon = createIcon(<><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>);
export const DealersIcon = createIcon(<><path d="M3 21h18" /><path d="M5 21V8l7-5 7 5v13" /><path d="M9 21v-6h6v6" /></>);
export const CategoriesIcon = createIcon(<><path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" /></>);
export const BrandsIcon = createIcon(<><path d="M20 7 9 18l-5-5" /></>);
export const ProductsIcon = createIcon(<><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>);
export const InventoryIcon = createIcon(<><path d="M3 7h18" /><path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" /><path d="M9 11h6" /><path d="M9 15h6" /><path d="M10 3h4l1 4H9z" /></>);
export const QuotationsIcon = createIcon(<><path d="M8 3h8l5 5v13H3V3z" /><path d="M13 3v5h5" /><path d="M8 13h8" /><path d="M8 17h5" /></>);
export const OrdersIcon = createIcon(<><circle cx="9" cy="20" r="1" /><circle cx="20" cy="20" r="1" /><path d="M3 4h2l2.6 10.4a1 1 0 0 0 1 .76h9.72a1 1 0 0 0 .98-.8L21 8H7" /></>);
export const ReportsIcon = createIcon(<><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-6" /></>);
export const NotificationsIcon = createIcon(<><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.66V4a2 2 0 1 0-4 0v1.34A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5" /><path d="M9 17a3 3 0 0 0 6 0" /></>);
export const SettingsIcon = createIcon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>);
export const AuditIcon = createIcon(<><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></>);
export const LogoutIcon = createIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>);
export const SearchIcon = createIcon(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></>);
export const SunMoonIcon = createIcon(<><path d="M12 3a6 6 0 1 0 9 9 9 9 0 1 1-9-9Z" /></>);
export const MenuIcon = createIcon(<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>);
export const BellIcon = NotificationsIcon;
export const ProfileIcon = createIcon(<><circle cx="12" cy="8" r="4" /><path d="M6 20a6 6 0 0 1 12 0" /></>);
export const TrendUpIcon = createIcon(<><path d="m3 17 6-6 4 4 7-8" /><path d="M14 7h6v6" /></>);
export const TrendDownIcon = createIcon(<><path d="m3 7 6 6 4-4 7 8" /><path d="M14 17h6v-6" /></>);
export const WarningIcon = createIcon(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>);
export const EditIcon = createIcon(<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" /></>);
export const CheckCircleIcon = createIcon(<><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>);
export const XCircleIcon = createIcon(<><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></>);
export const GridIcon = createIcon(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>);
export const TableIcon = createIcon(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M9 4v16" /><path d="M15 4v16" /></>);
export const ArrowLeftIcon = createIcon(<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>);
export const EyeIcon = createIcon(<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);
