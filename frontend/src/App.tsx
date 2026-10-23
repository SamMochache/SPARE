import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ApplicationLayout } from "./components/layout/ApplicationLayout";
import { AppDataProvider } from "./contexts/AppDataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { navItems } from "./data/navigation";
import { BranchManagement } from "./pages/BranchManagement";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import { Inventory } from "./pages/Inventory";
import { Login } from "./pages/Login";
import { ModulePlaceholder } from "./pages/ModulePlaceholder";
import { PointOfSale } from "./pages/PointOfSale";
import { Products } from "./pages/Products";
import { Purchasing } from "./pages/Purchasing";
import { Reports } from "./pages/Reports";
import { SalesHistory } from "./pages/SalesHistory";
import { Settings } from "./pages/Settings";
import { Suppliers } from "./pages/Suppliers";
import { UserManagement } from "./pages/UserManagement";

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center bg-canvas text-sm text-ink-muted">Loading your workspace…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppDataProvider><ApplicationLayout /></AppDataProvider>;
}

export function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<RequireAuth />}>
      <Route index element={<Dashboard />} />
      <Route path="pos" element={<PointOfSale />} />
      <Route path="products" element={<Products />} />
      <Route path="inventory" element={<Inventory />} />
      <Route path="purchases" element={<Purchasing />} />
      <Route path="sales" element={<SalesHistory />} />
      <Route path="customers" element={<Customers />} />
      <Route path="settings" element={<Settings />} />
      <Route path="branches" element={<BranchManagement />} />
      <Route path="suppliers" element={<Suppliers />} />
      <Route path="reports" element={<Reports />} />
      <Route path="users" element={<UserManagement />} />
      {navItems.filter((item) => !item.ready && !["/inventory", "/purchases", "/sales", "/settings", "/suppliers", "/reports", "/users", "/branches"].includes(item.path)).map((item) => <Route key={item.path} path={item.path.slice(1)} element={<ModulePlaceholder item={item} />} />)}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes></BrowserRouter><Toaster position="top-right" closeButton richColors toastOptions={{ style: { fontFamily: "Inter, system-ui, sans-serif" } }} /></AuthProvider>;
}
