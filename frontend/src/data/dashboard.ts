import type { RecentSaleRow } from '../types/sales';

export type RevenueRange = 'daily' | 'weekly' | 'monthly';

export const todaySummary = {
  sales: 184350,
  comparisonSales: 164020,
  comparisonLabel: 'last Monday',
  transactions: 47,
  itemsSold: 136
};

export const hourlySales = [
{ label: '8am', revenue: 6200 },
{ label: '9am', revenue: 18400 },
{ label: '10am', revenue: 24600 },
{ label: '11am', revenue: 31200 },
{ label: '12pm', revenue: 22800 },
{ label: '1pm', revenue: 19500 },
{ label: '2pm', revenue: 27400 },
{ label: '3pm', revenue: 21650 },
{ label: '4pm', revenue: 12600 }];


export const revenueSeries: Record<RevenueRange, {label: string;revenue: number;transactions: number;}[]> = {
  daily: [
  { label: '6 Oct', revenue: 142300, transactions: 38 },
  { label: '7 Oct', revenue: 156800, transactions: 41 },
  { label: '8 Oct', revenue: 131450, transactions: 35 },
  { label: '9 Oct', revenue: 168900, transactions: 44 },
  { label: '10 Oct', revenue: 201750, transactions: 52 },
  { label: '11 Oct', revenue: 88600, transactions: 24 },
  { label: '12 Oct', revenue: 164020, transactions: 43 },
  { label: '13 Oct', revenue: 151200, transactions: 40 },
  { label: '14 Oct', revenue: 147900, transactions: 39 },
  { label: '15 Oct', revenue: 172350, transactions: 45 },
  { label: '16 Oct', revenue: 189200, transactions: 49 },
  { label: '17 Oct', revenue: 208400, transactions: 54 },
  { label: '18 Oct', revenue: 92400, transactions: 25 },
  { label: '19 Oct', revenue: 184350, transactions: 47 }],

  weekly: [
  { label: '27 Jul', revenue: 912400, transactions: 238 },
  { label: '3 Aug', revenue: 968300, transactions: 251 },
  { label: '10 Aug', revenue: 1004500, transactions: 262 },
  { label: '17 Aug', revenue: 945200, transactions: 244 },
  { label: '24 Aug', revenue: 1087600, transactions: 281 },
  { label: '31 Aug', revenue: 1121900, transactions: 290 },
  { label: '7 Sep', revenue: 1034800, transactions: 268 },
  { label: '14 Sep', revenue: 1098300, transactions: 284 },
  { label: '21 Sep', revenue: 1156400, transactions: 297 },
  { label: '28 Sep', revenue: 1189700, transactions: 305 },
  { label: '5 Oct', revenue: 1242150, transactions: 318 },
  { label: '12 Oct', revenue: 1125470, transactions: 295 }],

  monthly: [
  { label: 'Nov', revenue: 3842000, transactions: 1004 },
  { label: 'Dec', revenue: 4615000, transactions: 1192 },
  { label: 'Jan', revenue: 3510000, transactions: 921 },
  { label: 'Feb', revenue: 3968000, transactions: 1030 },
  { label: 'Mar', revenue: 4224000, transactions: 1098 },
  { label: 'Apr', revenue: 4087000, transactions: 1062 },
  { label: 'May', revenue: 4392000, transactions: 1135 },
  { label: 'Jun', revenue: 4518000, transactions: 1170 },
  { label: 'Jul', revenue: 4301000, transactions: 1116 },
  { label: 'Aug', revenue: 4687000, transactions: 1213 },
  { label: 'Sep', revenue: 4912000, transactions: 1268 },
  { label: 'Oct (MTD)', revenue: 2984000, transactions: 774 }]

};

export const paymentBreakdown = [
{ method: 'mpesa' as const, label: 'M-Pesa', amount: 98420, transactions: 26 },
{ method: 'cash' as const, label: 'Cash', amount: 51380, transactions: 14 },
{ method: 'card' as const, label: 'Card', amount: 22150, transactions: 4 },
{ method: 'bank' as const, label: 'Bank Transfer', amount: 12400, transactions: 3 }];


export const bestSellers = [
{ name: 'Toyota Hilux Oil Filter', sku: 'FLT-TOY-0001', units: 214, revenue: 203300 },
{ name: 'Toyota Premio Wiper Blades (Pair)', sku: 'ACC-TOY-0014', units: 168, revenue: 201600 },
{ name: 'TotalEnergies Quartz 9000 5W-30 (4L)', sku: 'LUB-UNI-0022', units: 142, revenue: 610600 },
{ name: 'Toyota Corolla Brake Pads (Front)', sku: 'BRK-TOY-0002', units: 96, revenue: 403200 },
{ name: 'Mazda Demio Spark Plugs (Set of 4)', sku: 'IGN-MAZ-0005', units: 88, revenue: 316800 },
{ name: 'Toyota Hiace Fan Belt', sku: 'ENG-TOY-0024', units: 81, revenue: 105300 }];


export const recentSales: RecentSaleRow[] = [
{ receiptNo: 'APP-261019-0047', time: '16:12', customer: 'Kamau Auto Garage', items: 6, total: 18270, method: 'mpesa', status: 'completed' },
{ receiptNo: 'APP-261019-0046', time: '15:54', customer: 'Walk-in Customer', items: 1, total: 1102, method: 'cash', status: 'completed' },
{ receiptNo: 'APP-261019-0045', time: '15:31', customer: 'Wanjiru Transport Ltd', items: 4, total: 42688, method: 'credit', status: 'credit' },
{ receiptNo: 'APP-261019-0044', time: '15:08', customer: 'James Mwangi', items: 2, total: 9744, method: 'card', status: 'completed' },
{ receiptNo: 'APP-261019-0043', time: '14:46', customer: 'Walk-in Customer', items: 3, total: 6264, method: 'mpesa', status: 'completed' },
{ receiptNo: 'APP-261019-0042', time: '14:20', customer: 'Fatuma Hassan', items: 1, total: 4176, method: 'mpesa', status: 'refunded' },
{ receiptNo: 'APP-261019-0041', time: '13:58', customer: 'Mombasa Road Motors', items: 8, total: 31540, method: 'bank', status: 'completed' }];


export const stockMovementSummary = [
{ type: 'Received from suppliers', quantity: 320, detail: '3 deliveries' },
{ type: 'Sold', quantity: -412, detail: '296 transactions' },
{ type: 'Customer returns', quantity: 9, detail: '4 returns' },
{ type: 'Adjustments', quantity: -6, detail: 'Stock count variance' },
{ type: 'Damaged / written off', quantity: -4, detail: '2 records' }];