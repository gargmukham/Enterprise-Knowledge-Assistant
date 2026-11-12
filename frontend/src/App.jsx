import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import LoadingState from "./components/common/LoadingState";
import "./App.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Documents = lazy(() => import("./pages/Documents"));
const Chat = lazy(() => import("./pages/Chat"));
const KnowledgeSearch = lazy(() => import("./pages/KnowledgeSearch"));

function RouteFallback() {
  return (
    <div className="page-body">
      <div className="card">
        <LoadingState message="Loading page..." />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="documents"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Documents />
              </Suspense>
            }
          />
          <Route
            path="chat"
            element={
              <Suspense fallback={<RouteFallback />}>
                <Chat />
              </Suspense>
            }
          />
          <Route
            path="knowledge-base"
            element={
              <Suspense fallback={<RouteFallback />}>
                <KnowledgeSearch />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
