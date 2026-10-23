import type { Customer } from '../types/customer';

export const WALK_IN_CUSTOMER_ID = 0;

export const customers: Customer[] = [
{ id: 0, name: 'Walk-in Customer', phone: '', email: '', type: 'retail', kraPin: '', discountRate: 0, creditLimit: 0, balance: 0 },
{ id: 2, name: 'Kamau Auto Garage', phone: '+254 722 384 116', email: 'kamau.garage@gmail.com', type: 'wholesale', kraPin: 'P051345678Q', discountRate: 10, creditLimit: 150000, balance: 48500 },
{ id: 3, name: 'Wanjiru Transport Ltd', phone: '+254 733 902 471', email: 'accounts@wanjirutransport.co.ke', type: 'wholesale', kraPin: 'P052214567M', discountRate: 8, creditLimit: 300000, balance: 126800 },
{ id: 4, name: 'James Mwangi', phone: '+254 712 556 093', email: 'james.mwangi@gmail.com', type: 'retail', kraPin: '', discountRate: 0, creditLimit: 0, balance: 0 },
{ id: 5, name: 'Fatuma Hassan', phone: '+254 701 448 220', email: '', type: 'retail', kraPin: '', discountRate: 0, creditLimit: 20000, balance: 6450 },
{ id: 6, name: 'Brian Otieno', phone: '+254 790 113 584', email: 'brian.otieno@yahoo.com', type: 'retail', kraPin: '', discountRate: 0, creditLimit: 0, balance: 0 },
{ id: 7, name: 'Mombasa Road Motors', phone: '+254 720 667 309', email: 'info@mrmotors.co.ke', type: 'wholesale', kraPin: 'P051876543Z', discountRate: 12, creditLimit: 250000, balance: 0 },
{ id: 8, name: 'Peter Njoroge', phone: '+254 745 210 876', email: '', type: 'retail', kraPin: '', discountRate: 5, creditLimit: 30000, balance: 12300 }];