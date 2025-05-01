export type OrderStatus = 
  | "goingToRestaurant" 
  | "arrivedAtRestaurant" 
  | "pickedUp" 
  | "delivering" 
  | "arrivedAtCustomer" 
  | "delivered";

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  photoUrl: string;
}

export interface Restaurant {
  id: string;
  name: string;
  location: Location;
  photoUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurant: Restaurant;
  customer: Customer;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime: string;
  customerLocation: Location;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  isOnline: boolean;
  currentLocation?: Location;
}