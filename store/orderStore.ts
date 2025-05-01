import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { Order, OrderStatus } from "@/types";
import { mockOrders, generateNewOrder } from "@/mocks/orders";

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  completedOrders: Order[];
  pendingOrder: Order | null;
  isLoading: boolean;
  
  // Actions
  fetchOrders: () => Promise<void>;
  acceptOrder: (orderId: string) => void;
  declineOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  generateNewOrderRequest: () => void;
  clearPendingOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      activeOrders: [],
      completedOrders: [],
      pendingOrder: null,
      isLoading: false,
      
      fetchOrders: async () => {
        set({ isLoading: true });
        
        // Simulate API call
        setTimeout(() => {
          const orders = [...mockOrders];
          const activeOrders = orders.filter(order => order.status !== "delivered");
          const completedOrders = orders.filter(order => order.status === "delivered");
          
          set({ 
            orders, 
            activeOrders, 
            completedOrders,
            isLoading: false 
          });
        }, 1000);
      },
      
      acceptOrder: (orderId: string) => {
        const { pendingOrder, orders, activeOrders } = get();
        
        if (pendingOrder && pendingOrder.id === orderId) {
          const newOrders = [...orders, pendingOrder];
          const newActiveOrders = [...activeOrders, pendingOrder];
          
          set({ 
            orders: newOrders,
            activeOrders: newActiveOrders,
            pendingOrder: null
          });
        }
      },
      
      declineOrder: (orderId: string) => {
        const { pendingOrder } = get();
        
        if (pendingOrder && pendingOrder.id === orderId) {
          set({ pendingOrder: null });
        }
      },
      
      updateOrderStatus: (orderId: string, status: OrderStatus) => {
        const { orders, activeOrders, completedOrders } = get();
        
        const updatedOrders = orders.map(order => 
          order.id === orderId ? { ...order, status } : order
        );
        
        let updatedActiveOrders = [...activeOrders];
        let updatedCompletedOrders = [...completedOrders];
        
        if (status === "delivered") {
          // Move from active to completed
          const orderToMove = activeOrders.find(order => order.id === orderId);
          if (orderToMove) {
            updatedActiveOrders = activeOrders.filter(order => order.id !== orderId);
            updatedCompletedOrders = [...completedOrders, { ...orderToMove, status }];
          }
        } else {
          // Update in active orders
          updatedActiveOrders = activeOrders.map(order => 
            order.id === orderId ? { ...order, status } : order
          );
        }
        
        set({ 
          orders: updatedOrders,
          activeOrders: updatedActiveOrders,
          completedOrders: updatedCompletedOrders
        });
      },
      
      generateNewOrderRequest: () => {
        const newOrder = generateNewOrder();
        set({ pendingOrder: newOrder });
      },
      
      clearPendingOrder: () => {
        set({ pendingOrder: null });
      }
    }),
    {
      name: "shipper-orders-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        orders: state.orders,
        activeOrders: state.activeOrders,
        completedOrders: state.completedOrders
      }),
    }
  )
);