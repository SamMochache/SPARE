import {
  BarChart3Icon,
  BoxesIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
  type LucideIcon } from
'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  ready: boolean;
  dividerBefore?: boolean;
  description: string;
  planned: string[];
}

export const navItems: NavItem[] = [
{ label: 'Overview', path: '/', icon: LayoutDashboardIcon, ready: true, description: 'Business performance at a glance.', planned: [] },
{ label: 'Point of Sale', path: '/pos', icon: ShoppingCartIcon, ready: true, description: 'Counter sales and checkout.', planned: [] },
{ label: 'Products & Spare Parts', path: '/products', icon: PackageIcon, ready: true, description: 'Catalog, pricing and compatibility.', planned: [] },
{
  label: 'Inventory Management', path: '/inventory', icon: WarehouseIcon, ready: false,
  description: 'Stock levels, adjustments, transfers and movement history.',
  planned: ['Stock levels with low and out-of-stock filters', 'Stock adjustments with reasons and approval', 'Transfers between branches', 'Damaged and returned goods tracking', 'Full movement history and valuation', 'Reorder suggestions']
},
{
  label: 'Sales & Orders', path: '/sales', icon: ReceiptTextIcon, ready: false,
  description: 'Sales history, receipts, returns and refunds.',
  planned: ['Searchable sales history with date, cashier and payment filters', 'Sale detail with items, payments and receipt', 'Return and refund requests with approval', 'Cancelled transaction tracking']
},
{
  label: 'Customers', path: '/customers', icon: UsersIcon, ready: false,
  description: 'Retail and wholesale accounts, credit and statements.',
  planned: ['Customer profiles with retail or wholesale pricing', 'Credit sales and payment tracking', 'Purchase history', 'Customer statement preview']
},
{
  label: 'Suppliers', path: '/suppliers', icon: TruckIcon, ready: false,
  description: 'Supplier contacts, categories and balances.',
  planned: ['Supplier directory with KRA PIN and contacts', 'Supplied categories', 'Outstanding supplier balances']
},
{
  label: 'Purchases & Restocking', path: '/purchases', icon: BoxesIcon, ready: false,
  description: 'Purchase orders and goods received.',
  planned: ['Purchase orders: Draft → Submitted → Received', 'Goods-received confirmation with damaged quantities', 'Expected delivery tracking']
},
{
  label: 'Reports & Analytics', path: '/reports', icon: BarChart3Icon, ready: false, dividerBefore: true,
  description: 'Sales, profit, stock and balance reports.',
  planned: ['Revenue, COGS, discounts and gross margin', 'Best-selling and slow-moving parts', 'Sales by cashier and payment method', 'CSV and PDF export']
},
{
  label: 'User Management', path: '/users', icon: ShieldCheckIcon, ready: false,
  description: 'Staff accounts, roles and permissions.',
  planned: ['Create and deactivate staff accounts', 'Role assignment: Admin, Manager, Cashier, Inventory, Sales Rep', 'Last-login activity', 'Permission-denied states']
},
{
  label: 'Settings', path: '/settings', icon: SettingsIcon, ready: false,
  description: 'Shop profile, tax, receipts and payments.',
  planned: ['Shop profile and branches', 'Currency (KES) and VAT configuration', 'Receipt and invoice numbering', 'Payment methods and low-stock thresholds']
}];