import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";

const NAVIGATION_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/documents",
    label: "Documents",
    icon: FileText,
  },
  {
    to: "/chat",
    label: "AI Assistant",
    icon: MessageSquare,
  },
  {
    to: "/knowledge-base",
    label: "Knowledge Search",
    icon: Search,
  },
];

const STATUS_CONFIG = {
  connected: {
    label: "Backend Connected",
    dotClass: "status-dot--connected",
  },
  offline: {
    label: "Backend Offline",
    dotClass: "status-dot--offline",
  },
  checking: {
    label: "Checking Backend...",
    dotClass: "status-dot--checking",
  },
};

/**
 * Persistent left navigation sidebar with mobile drawer support,
 * backend health indicator, and workspace session summary.
 */
function Sidebar({
  isOpen,
  onClose,
  backendStatus = "checking",
  onRefreshHealth,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const statusMeta = STATUS_CONFIG[backendStatus] || STATUS_CONFIG.checking;

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${isOpen ? "sidebar--open" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar__brand">
          <div className="sidebar__logo" aria-hidden="true">
            <BookOpen size={18} />
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__title">Enterprise Knowledge</span>
            <span className="sidebar__subtitle">Assistant</span>
          </div>
          <button
            type="button"
            className="sidebar__close-btn"
            aria-label="Close navigation menu"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__section-label">Workspace</div>
          <ul className="sidebar__nav-list">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                    }
                  >
                    <Icon size={18} className="sidebar__link-icon" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__status-card">
            <div className="sidebar__status-row">
              <div className="sidebar__status-info">
                <span
                  className={`status-dot ${statusMeta.dotClass}`}
                  aria-hidden="true"
                />
                <span className="sidebar__status-text">{statusMeta.label}</span>
              </div>
              <button
                type="button"
                className="sidebar__status-refresh"
                aria-label="Check backend connection status"
                title="Re-check backend status"
                onClick={onRefreshHealth}
                disabled={backendStatus === "checking"}
              >
                <RefreshCw
                  size={13}
                  className={backendStatus === "checking" ? "spin" : ""}
                  aria-hidden="true"
                />
              </button>
            </div>
            <span className="sidebar__status-endpoint">Proxy: /api → :8000</span>
          </div>

          <div className="sidebar__profile">
            <div className="sidebar__avatar" aria-hidden="true">
              <User size={16} />
            </div>
            <div className="sidebar__profile-info">
              <span className="sidebar__profile-name">Workspace Member</span>
              <span className="sidebar__profile-role">Local Session</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

