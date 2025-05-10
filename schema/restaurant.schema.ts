// Restaurant response schema types
export interface Coordinates {
    type: string;
    coordinates: number[];
  }
  
  export interface Address {
    location: Coordinates;
    fullAddress: string;
    street: string;
    district: string;
    city: string;
  }
  
  export interface Rating {
    average: number;
    count: number;
    total: number;
  }
  
  export interface Restaurant {
    _id: string;
    name: string;
    description: string;
    phone: string;
    avt: string;
    address: Address;
    rating: Rating;
  }
  
  export interface ToppingItem {
    name: string;
    price: number;
    _id: string;
    available: boolean;
    state?: number;
  }
  
  export interface Topping {
    _id: string;
    name: string;
    item: ToppingItem[];
    option:{
      type: number;
      quantity: number;
    }
  }
  
  export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    restaurant: string;
    image: string;
    topping: Topping[];
  }
  
  export interface SectionProduct {
    productId: Product;
    _id: string;
  }
  
  export interface Section {
    name: string;
    displayOrder: number;
    _id: string;
    products: SectionProduct[];
  }
  
  export interface Menu {
    _id: string;
    restaurant: string;
    sections: Section[];
  }
  
  export interface RestaurantData {
    restaurant: Restaurant;
    menu: Menu;
  }
  
  export interface RestaurantResponseData {
    EM: string;
    EC: string;
    DT: RestaurantData;
  }
  
  export type RestaurantResType = RestaurantResponseData;