export type CustomerType = 'retail' | 'wholesale';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  type: CustomerType;
  kraPin: string;
  discountRate: number;
  creditLimit: number;
  balance: number;
}