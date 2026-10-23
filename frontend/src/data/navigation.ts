import {
  BarChart3Icon, BoxesIcon, Building2Icon, LayoutDashboardIcon, PackageIcon,
  ReceiptTextIcon, SettingsIcon, ShieldCheckIcon, ShoppingCartIcon, TruckIcon,
  UsersIcon, WarehouseIcon, type LucideIcon
} from 'lucide-react';

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
  { label: 'Inventory Management', path: '/inventory', icon: WarehouseIcon, ready: true, description: 'Branch stock levels, receipts, adjustments and movement history.', planned: ['Transfers between branches', 'Approval workflows', 'Reorder suggestions'] },
  { label: 'Sales & Orders', path: '/sales', icon: ReceiptTextIcon, ready: true, description: 'Sales history, receipts, returns and refunds.', planned: ['Payment settlement verification', 'Fiscal receipts and tax calculation'] },
  { label: 'Customers', path: '/customers', icon: UsersIcon, ready: true, description: 'Customer contacts and retail/wholesale profiles.', planned: ['POS customer picker integration', 'Credit sales and payment tracking', 'Purchase history and statements'] },
  { label: 'Suppliers', path: '/suppliers', icon: TruckIcon, ready: true, description: 'Supplier contacts, categories and balances.', planned: ['Supplier directory with KRA PIN and contacts', 'Supplied categories', 'Outstanding supplier balances'] },
  { label: 'Purchases & Restocking', path: '/purchases', icon: BoxesIcon, ready: true, description: 'Purchase orders and goods received.', planned: ['Supplier invoices and accounts payable'] },
  { label: 'Reports & Analytics', path: '/reports', icon: BarChart3Icon, ready: true, dividerBefore: true, description: 'Sales, profit, stock and balance reports.', planned: ['Revenue, COGS, discounts and gross margin', 'Sales by cashier and payment method', 'CSV and PDF export'] },
  { label: 'User Management', path: '/users', icon: ShieldCheckIcon, ready: true, description: 'Staff account management and permissions.', planned: ['Create/deactivate staff accounts', 'Role assignment', 'Last-login activity'] },
  { label: 'Branches', path: '/branches', icon: Building2Icon, ready: true, description: 'Manage shop locations and branch details.', planned: ['Branch transfers and consolidated reports'] },
  { label: 'Settings', path: '/settings', icon: SettingsIcon, ready: true, description: 'Personal profile and account security.', planned: ['VAT configuration', 'Receipt numbering', 'Payment-provider integration'] }
];
