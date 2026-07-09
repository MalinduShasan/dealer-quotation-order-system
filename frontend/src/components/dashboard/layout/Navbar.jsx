import { useState } from "react";
import styles from "./Navbar.module.css";
import { BellIcon, MenuIcon, ProfileIcon, SearchIcon, SunMoonIcon } from "../dashboardIcons";

export default function Navbar({
  currentPageTitle,
  user,
  theme,
  searchValue,
  onSearchChange,
  onToggleTheme,
  onMenuClick,
  onLogout
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className={styles.navbar}>
      <div className={styles.leftGroup}>
        <button type="button" className={styles.iconButton} onClick={onMenuClick}>
          <MenuIcon className={styles.icon} />
        </button>
        <div>
          <p className={styles.eyebrow}>QuoteFlow</p>
          <h1 className={styles.title}>{currentPageTitle}</h1>
        </div>
      </div>

      <div className={styles.searchBar}>
        <SearchIcon className={styles.searchIcon} />
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search quotations, dealers, orders, reports..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.rightGroup}>
        <button type="button" className={styles.iconButton}>
          <BellIcon className={styles.icon} />
          <span className={styles.badge}>5</span>
        </button>
        <button type="button" className={styles.themeButton} onClick={onToggleTheme}>
          <SunMoonIcon className={styles.icon} />
          <span>{theme === "dark" ? "Dark" : "Light"}</span>
        </button>
        <div className={styles.profileWrap}>
          <button type="button" className={styles.profileButton} onClick={() => setProfileOpen((open) => !open)}>
            <div className={styles.avatar}>
              <ProfileIcon className={styles.icon} />
            </div>
            <div className={styles.profileMeta}>
              <strong>{user?.name || "Administrator"}</strong>
              <span>{user?.role || "Admin"}</span>
            </div>
          </button>
          {profileOpen && (
            <div className={styles.dropdown}>
              <p>{user?.email || "admin@quoteflow.com"}</p>
              <button type="button" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
