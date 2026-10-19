import type { AppNotification } from '../types/shop';

export const notifications: AppNotification[] = [
{ id: 'n1', title: 'Low stock: Toyota Corolla Brake Pads', body: '6 left — reorder level is 10.', time: '12 min ago', tone: 'warning', read: false, link: '/products?q=BRK-TOY-0002' },
{ id: 'n2', title: 'Out of stock: Isuzu D-Max Fuel Filter', body: '3 customers asked for this part this week.', time: '1 hr ago', tone: 'danger', read: false, link: '/products?q=FLT-ISU-0004' },
{ id: 'n3', title: 'PO-2026-0142 expected today', body: 'Kirinyaga Auto Distributors · 14 lines.', time: '2 hrs ago', tone: 'info', read: false, link: '/purchases' },
{ id: 'n4', title: 'Credit balance overdue', body: 'Kamau Auto Garage — KES 48,500.00 past 30 days.', time: '3 hrs ago', tone: 'warning', read: false, link: '/customers' },
{ id: 'n5', title: 'Refund request RF-0019 approved', body: 'APP-261019-0042 · Fatuma Hassan.', time: 'Yesterday', tone: 'success', read: true, link: '/sales' }];