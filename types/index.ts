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

export interface Address {
  name: string;
  phoneNumber: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Discount {
  voucherId?: string;
  amount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isOnline: boolean;
  currentLocation?: Location;
  balance?: number;
}

export interface OrderItem {
  food: string;
  quantity: number;
  price: number;
  toppings: Topping[];
  _id?: string;
}

export interface ToppingItem {
  id: string;
  price: number;
  _id?: string;
}

export interface Topping {
  topping: string;
  item: ToppingItem[];
  _id?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  restaurant?: {
    _id: string;
    name: string;
    phone: string;
    location: {
      latitude: number;
      longitude: number;
    };
    address: string;
  };
  user: {
    _id: string;
    phone: string;
    username: string;
  };
  address: Address;
  items: OrderItem[];
  discount?: Discount;
  totalPrice: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
  isRated?: boolean;
  shipper?: string;
  __v?: number;
  notes?: string;
}