import React from 'react';
import { Link } from 'react-router-dom';
import { CoinsIcon, PackageIcon, PackagePlusIcon, PlusIcon, TriangleAlertIcon, TruckIcon, UserPlusIcon, WalletIcon } from 'lucide-react';
import { BestSellersTable } from '../components/dashboard/BestSellersTable';
import { LowStockAlerts } from '../components/dashboard/LowStockAlerts';
import { PaymentBreakdown } from '../components/dashboard/PaymentBreakdown';
import { RecentSales } from '../components/dashboard/RecentSales';
import { SalesChart } from '../components/dashboard/SalesChart';
import { StockMovementSummary } from '../components/dashboard/StockMovementSummary';
import { TodaySalesPanel } from '../components/dashboard/TodaySalesPanel';
import { buttonClass } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { useAppData } from '../contexts/AppDataContext';
import { formatKES, formatNumber } from '../utils/currency';
import { getStockStatus } from '../utils/stock';

export function Dashboard() {
  const { products, customers, branch } = useAppData();

  const alertItems = products.filter((p) => {
    const s = getStockStatus(p);
    return s === 'low_stock' || s === 'out_of_stock';
  });
  const activeProducts = products.filter((p) => p.status !== 'discontinued');
  const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
  const debtors = customers.filter((c) => c.balance > 0);
  const outstanding = debtors.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Overview"
        description={`Monday, 19 October 2026 · ${branch.name} branch`}
        demo
        actions={
        <>
            <Link to="/pos" className={buttonClass('primary')}>
              <PlusIcon className="w-4 h-4" aria-hidden="true" />
              New sale
            </Link>
            <Link to="/products?new=1" className={buttonClass('secondary')}>
              <PackagePlusIcon className="w-4 h-4" aria-hidden="true" />
              Add product
            </Link>
            <Link to="/purchases" className={buttonClass('secondary')}>
              <TruckIcon className="w-4 h-4" aria-hidden="true" />
              Receive stock
            </Link>
            <Link to="/customers" className={buttonClass('secondary')}>
              <UserPlusIcon className="w-4 h-4" aria-hidden="true" />
              Add customer
            </Link>
          </>
        } />
      

      <div className="grid gap-4 lg:grid-cols-12">
        <TodaySalesPanel className="lg:col-span-5" />
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Low stock items" value={formatNumber(alertItems.length)} icon={TriangleAlertIcon} tone={alertItems.length > 0 ? 'danger' : 'default'} meta="Needs reordering" to="/products?stock=needs_reorder" />
          <StatCard label="Inventory value" value={formatKES(inventoryValue)} icon={CoinsIcon} meta="At cost price, all bins" />
          <StatCard label="Total products" value={formatNumber(products.length)} icon={PackageIcon} meta={`${activeProducts.length} active SKUs`} to="/products" />
          <StatCard label="Outstanding balances" value={formatKES(outstanding)} icon={WalletIcon} tone="warning" meta={`${debtors.length} customers on credit`} to="/customers" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SalesChart className="xl:col-span-2" />
        <PaymentBreakdown />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <RecentSales className="xl:col-span-2" />
        <LowStockAlerts items={alertItems} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <BestSellersTable className="xl:col-span-2" />
        <StockMovementSummary />
      </div>
    </div>);

}