import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ApplicationLayout } from './components/layout/ApplicationLayout';
import { AppDataProvider } from './contexts/AppDataContext';
import { navItems } from './data/navigation';
import { Dashboard } from './pages/Dashboard';
import { ModulePlaceholder } from './pages/ModulePlaceholder';
import { PointOfSale } from './pages/PointOfSale';
import { Products } from './pages/Products';

export function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<ApplicationLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<PointOfSale />} />
            <Route path="products" element={<Products />} />
            {navItems.
            filter((item) => !item.ready).
            map((item) =>
            <Route key={item.path} path={item.path.slice(1)} element={<ModulePlaceholder item={item} />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" closeButton richColors toastOptions={{ style: { fontFamily: 'Inter, system-ui, sans-serif' } }} />
    </AppDataProvider>);

}