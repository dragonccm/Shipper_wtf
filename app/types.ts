export type OrderStatus = 
  | 'goingToRestaurant'
  | 'arrivedAtRestaurant'
  | 'pickedUp'
  | 'delivering'
  | 'arrivedAtCustomer'
  | 'delivered';

export interface Order {
  _id: string;
  orderStatus: OrderStatus;
  status: OrderStatus;
  shipper: string;
  user: {
    _id: string;
    phone: string;
    username: string;
  };
  address: {
    name: string;
    phoneNumber: string;
    address: string;
    latitude: number;
    longitude: number;
  };
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
  items: Array<{
    _id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  discount?: {
    voucherId?: string;
    amount: number;
  };
  createdAt?: string;
  updatedAt?: string;
  isRated?: boolean;
  __v?: number;
} 