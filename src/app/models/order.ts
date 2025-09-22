import {CartItem} from './cart-item';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  shipping: number;
  customerInfo: CustomerInfo;
  status: 'processing' | 'shipped' | 'delivered';
  date: Date;
}

export interface CustomerInfo {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  postalCode: string;
}
