import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { checkBackendHealth } from "../../api/axios";

/**
 * Main application shell pairing the fixed/collapsible sidebar
 * with the scrollable page workspace.
 */
function MainLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");

  const refreshHealth = useCallback(async () => {
    setBackendStatus("checking");
    try {
      const data = await checkBackendHealth();
      if (data?.status === "healthy" || data?.status === "running") {
        setBackendStatus("connected");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    checkBackendHealth()
      .then((data) => {
        if (!cancelled) {
          if (data?.status === "healthy" || data?.status === "running") {
            setBackendStatus("connected");
          } else {
            setBackendStatus("offline");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendStatus("offline");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openMobileMenu = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileMenu}
        backendStatus={backendStatus}
        onRefreshHealth={refreshHealth}
      />

      <div className="app-shell__content">
        <Outlet
          context={{
            openMobileMenu,
            backendStatus,
            refreshHealth,
          }}
        />
      </div>
    </div>
  );
}

export default MainLayout;
