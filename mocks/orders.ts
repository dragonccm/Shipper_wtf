import { Order, OrderStatus } from "@/types";

export const mockOrders: Order[] = [
  {
    id: "order-1",
    orderNumber: "#ORD-12345",
    restaurant: {
      id: "rest-1",
      name: "Burger King",
      location: {
        latitude: 10.7769,
        longitude: 106.7009,
        address: "123 Nguyen Hue, District 1, HCMC"
      },
      photoUrl: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?q=80&w=2115&auto=format&fit=crop"
    },
    customer: {
      id: "cust-1",
      name: "Nguyen Van A",
      phone: "0901234567",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop"
    },
    items: [
      { name: "Whopper Burger", quantity: 2, price: 79000 },
      { name: "French Fries (L)", quantity: 1, price: 39000 },
      { name: "Coca Cola", quantity: 2, price: 25000 }
    ],
    totalAmount: 247000,
    status: "goingToRestaurant",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
    customerLocation: {
      latitude: 10.7868,
      longitude: 106.6893,
      address: "456 Le Thanh Ton, District 1, HCMC"
    },
    notes: "Please bring extra ketchup"
  },
  {
    id: "order-2",
    orderNumber: "#ORD-12346",
    restaurant: {
      id: "rest-2",
      name: "Pho 24",
      location: {
        latitude: 10.7819,
        longitude: 106.6929,
        address: "24 Le Loi, District 1, HCMC"
      },
      photoUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=2074&auto=format&fit=crop"
    },
    customer: {
      id: "cust-2",
      name: "Tran Thi B",
      phone: "0909876543",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop"
    },
    items: [
      { name: "Pho Bo Tai", quantity: 1, price: 89000 },
      { name: "Cha Gio", quantity: 1, price: 59000 },
      { name: "Tra Da", quantity: 2, price: 10000 }
    ],
    totalAmount: 168000,
    status: "pickedUp",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 15 * 60000).toISOString(),
    customerLocation: {
      latitude: 10.7729,
      longitude: 106.6958,
      address: "789 Dong Khoi, District 1, HCMC"
    }
  },
  {
    id: "order-3",
    orderNumber: "#ORD-12347",
    restaurant: {
      id: "rest-3",
      name: "Pizza Hut",
      location: {
        latitude: 10.7739,
        longitude: 106.7029,
        address: "100 Nguyen Trai, District 5, HCMC"
      },
      photoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop"
    },
    customer: {
      id: "cust-3",
      name: "Le Van C",
      phone: "0912345678",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop"
    },
    items: [
      { name: "Seafood Pizza (L)", quantity: 1, price: 219000 },
      { name: "Garlic Bread", quantity: 1, price: 49000 },
      { name: "Pepsi (L)", quantity: 1, price: 35000 }
    ],
    totalAmount: 303000,
    status: "delivered",
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() - 60 * 60000).toISOString(),
    customerLocation: {
      latitude: 10.7619,
      longitude: 106.6829,
      address: "200 Ly Tu Trong, District 1, HCMC"
    },
    notes: "Leave at door"
  }
];

export const generateNewOrder = (): Order => {
  const restaurants = [
    {
      id: "rest-4",
      name: "Highlands Coffee",
      location: {
        latitude: 10.7719,
        longitude: 106.6949,
        address: "42 Nguyen Hue, District 1, HCMC"
      },
      photoUrl: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=2071&auto=format&fit=crop"
    },
    {
      id: "rest-5",
      name: "KFC",
      location: {
        latitude: 10.7829,
        longitude: 106.7039,
        address: "123 Cach Mang Thang 8, District 3, HCMC"
      },
      photoUrl: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=2067&auto=format&fit=crop"
    }
  ];

  const customers = [
    {
      id: "cust-4",
      name: "Pham Thi D",
      phone: "0987654321",
      photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop"
    },
    {
      id: "cust-5",
      name: "Hoang Van E",
      phone: "0912876543",
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop"
    }
  ];

  const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
  const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
  
  const items = [
    { name: "Cafe Sua Da", quantity: 2, price: 39000 },
    { name: "Banh Mi Thit", quantity: 1, price: 35000 },
    { name: "Tra Sua", quantity: 1, price: 45000 }
  ];

  return {
    id: `order-${Date.now()}`,
    orderNumber: `#ORD-${Math.floor(10000 + Math.random() * 90000)}`,
    restaurant: randomRestaurant,
    customer: randomCustomer,
    items: items,
    totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    status: "goingToRestaurant",
    createdAt: new Date().toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString(),
    customerLocation: {
      latitude: 10.7729 + (Math.random() * 0.02 - 0.01),
      longitude: 106.6958 + (Math.random() * 0.02 - 0.01),
      address: `${Math.floor(100 + Math.random() * 900)} Le Loi, District 1, HCMC`
    },
    notes: Math.random() > 0.5 ? "Please call when you arrive" : undefined
  };
};