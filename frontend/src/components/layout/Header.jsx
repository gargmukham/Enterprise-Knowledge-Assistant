import { ChevronRight, Menu } from "lucide-react";
import { useOutletContext } from "react-router-dom";

/**
 * Reusable page header displaying mobile menu trigger, breadcrumb,
 * current page title, concise description, and contextual actions.
 */
function Header({ title, breadcrumb, description, actions }) {
  const outletContext = useOutletContext() || {};
  const openMobileMenu = outletContext.openMobileMenu;

  return (
    <header className="page-header">
      <div className="page-header__left">
        {openMobileMenu && (
          <button
            type="button"
            className="page-header__menu-btn"
            aria-label="Open navigation menu"
            onClick={openMobileMenu}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        )}

        <div className="page-header__titles">
          {breadcrumb && (
            <div className="page-header__breadcrumb" aria-label="Breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={13} aria-hidden="true" />
              <span>{breadcrumb}</span>
            </div>
          )}
          <h1 className="page-header__title">{title}</h1>
          {description && (
            <p className="page-header__description">{description}</p>
          )}
        </div>
      </div>

      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export default Header;

