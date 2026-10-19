import {
  BatteryChargingIcon,
  CarIcon,
  CogIcon,
  Disc3Icon,
  DropletIcon,
  FilterIcon,
  LightbulbIcon,
  MoveVerticalIcon,
  Settings2Icon,
  ThermometerIcon,
  ZapIcon,
  type LucideIcon } from
'lucide-react';

export const categories: {name: string;icon: LucideIcon;}[] = [
{ name: 'Filters', icon: FilterIcon },
{ name: 'Brakes', icon: Disc3Icon },
{ name: 'Ignition', icon: ZapIcon },
{ name: 'Suspension', icon: MoveVerticalIcon },
{ name: 'Engine', icon: CogIcon },
{ name: 'Transmission', icon: Settings2Icon },
{ name: 'Cooling', icon: ThermometerIcon },
{ name: 'Electrical', icon: BatteryChargingIcon },
{ name: 'Lighting', icon: LightbulbIcon },
{ name: 'Lubricants', icon: DropletIcon },
{ name: 'Body & Accessories', icon: CarIcon }];


export const brands = [
'Toyota Genuine',
'Nissan Genuine',
'Isuzu Genuine',
'Aisin',
'Bando',
'Bosch',
'Brembo',
'Denso',
'Depo',
'Exedy',
'Gates',
'Koyo',
'KYB',
'Mann-Filter',
'NGK',
'Sakura',
'TotalEnergies',
'Varta',
'555'];


export const vehicleMakes = ['Toyota', 'Nissan', 'Isuzu', 'Mazda', 'Subaru', 'Mitsubishi', 'Honda', 'Universal'];

export const suppliers = [
'Kirinyaga Auto Distributors',
'Industrial Area Motors Ltd',
'Japan Auto Imports KE',
'Mombasa Road Spares',
'Grogan Road Wholesalers'];