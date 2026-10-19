import type { Branch } from '../types/shop';

export const VAT_RATE = 0.16;
export const MAX_DISCOUNT_PERCENT = 20;
export const DEMO_MANAGER_PIN = '1234';

export const shopProfile = {
  name: 'AutoParts Pro',
  legalName: 'AutoParts Pro Ltd',
  address: 'Kirinyaga Road, Nairobi CBD',
  phone: '+254 722 418 905',
  email: 'sales@autopartspro.co.ke',
  kraPin: 'P051987654K'
};

export const currentUser = {
  id: 2,
  name: 'Grace Wambui',
  role: 'Shop Manager',
  initials: 'GW',
  email: 'grace.wambui@autopartspro.co.ke'
};

export const branches: Branch[] = [
{ id: 'nbo-cbd', name: 'Nairobi CBD', location: 'Kirinyaga Road' },
{ id: 'westlands', name: 'Westlands', location: 'Waiyaki Way' },
{ id: 'mombasa', name: 'Mombasa', location: 'Moi Avenue' },
{ id: 'kisumu', name: 'Kisumu', location: 'Oginga Odinga Street' }];