import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { OrderStatus } from "@/types";
import { orderAPI } from "@/services/api";
import { socket } from "@/utils/socket";
import { router } from "expo-router";
// Không cần định nghĩa User ở đây vì chúng ta sẽ sử dụng token từ authAPI

export interface Order {
  _id: string;
  orderStatus: OrderStatus;
  shipper?: string;
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
    food: {
      _id: string;
      restaurant: {
        address: string;
        _id: string;
        name: string;
        phone: string;
      };
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
    toppings?: Array<{
      topping: string;
      item: Array<{
        id: string;
        price: number;
        _id: string;
      }>;
      _id: string;
    }>;
  }>;
  totalPrice: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  note?: string;
  discount?: {
    voucherId?: string;
    amount: number;
  };
  createdAt?: string;
  updatedAt?: string;
  isRated?: boolean;
  __v?: number;
}

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  completedOrders: Order[];
  pendingOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  currentOrder: Order | null;

  // Actions
  fetchOrders: (shipperId: string) => Promise<void>;
  acceptOrder: (orderId: string, shipperId: string) => Promise<boolean>;
  declineOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  generateNewOrderRequest: () => void;
  clearPendingOrder: () => void;
  setCurrentOrder: (order: Order | null) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      activeOrders: [],
      completedOrders: [],
      pendingOrder: null,
      isLoading: false,
      error: null,
      currentOrder: null,

      fetchOrders: async (shipperId: string) => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`https://f3f8-2a09-bac5-d44d-2646-00-3d0-64.ngrok-free.app/api/shipper/orders/${shipperId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const result = await response.json();

          if (result.EC === "0" && result.DT) {
            const transformedOrder: Order = {
              ...result.DT,
              user: result.DT.user,
              address: result.DT.address,
              items: result.DT.items.map((item: any) => ({
                ...item,
                food: item.food,
                toppings: item.toppings?.map((topping: any) => ({
                  ...topping,
                  item: topping.item
                })) || []
              })),
              discount: result.DT.discount,
              isRated: result.DT.isRated,
              shipper: result.DT.shipper,
              __v: result.DT.__v
            };
            const orders = [transformedOrder];
            
            // Phân loại đơn hàng dựa trên trạng thái
            const activeOrders = orders.filter((order: Order) => 
              order.orderStatus !== "delivered" && order.orderStatus !== "canceled"
            );
            
            const completedOrders = orders.filter((order: Order) => 
              order.orderStatus === "delivered"
            );

            set({
              orders: orders,
              activeOrders: activeOrders,
              completedOrders: completedOrders,
              currentOrder: transformedOrder,
              isLoading: false
            });
          } else {
            set({
              isLoading: false,
              error: result.message || 'Không thể tải danh sách đơn hàng'
            });
          }
        } catch (error: any) {
          console.error("Failed to fetch orders:", error);
          set({
            isLoading: false,
            error: error.message || 'Đã xảy ra lỗi khi tải đơn hàng'
          });
        }
      },

      acceptOrder: async (orderId: string, shipperId: string) => {
        return new Promise((resolve, reject) => {
          socket.emit('accept_order', { orderId, shipperId });

          const timeout = setTimeout(() => {
            socket.off('order_response');
            reject(new Error('Accept timeout'));
          }, 10000);

          socket.once('order_response', (response) => {
            clearTimeout(timeout);
            if (response.success) {
              set({ currentOrder: response.orderDetails });
              resolve(true);
            } else {
              reject(new Error(response.message));
            }
          });
        });
      },

      declineOrder: async (orderId: string) => {
        const { pendingOrder, isLoading } = get();
        if (isLoading || !pendingOrder || pendingOrder.id !== orderId) return;

        set({ isLoading: true, error: null });

        try {
          const result = await orderAPI.declineOrder(orderId);

          if (result.success) {
            set({
              pendingOrder: null,
              isLoading: false
            });
          } else {
            set({
              isLoading: false,
              error: result.message || 'Không thể từ chối đơn hàng'
            });
          }
        } catch (error: any) {
          console.error("Failed to decline order:", error);
          set({
            isLoading: false,
            error: error.message || 'Đã xảy ra lỗi khi từ chối đơn hàng'
          });
        }
      },

      updateOrderStatus: async (orderId: string, status: OrderStatus) => {
        return new Promise((resolve, reject) => {
          const currentOrder = get().currentOrder;
          console.log('Current order state:', currentOrder);

          if (!currentOrder) {
            console.log('❌ Update failed: No current order');
            reject(new Error('No current order'));
            return;
          }

          const shipperId = currentOrder.shipper;
          if (!shipperId) {
            console.log('❌ Update failed: No shipper assigned');
            reject(new Error('No shipper assigned'));
            return;
          }

          console.log('📤 Emitting order_status_update:', { orderId, status, shipperId });
          // Emit socket event to update order status
          socket.emit('order_status_update', { orderId, status, shipperId });

          // Listen for response
          const timeout = setTimeout(() => {
            console.log('⏰ Update timeout');
            socket.off('status_update_response');
            reject(new Error('Update timeout'));
          }, 10000);

          socket.once('status_update_response', (response) => {
            clearTimeout(timeout);
            if (response.success) {
              console.log('✅ Status update successful:', { orderId, status });
              const updatedOrder = response.orderDetails;
              set((state) => ({
                ...state,
                currentOrder: updatedOrder,
                orders: state.orders.map(order => 
                  order._id === orderId ? updatedOrder : order
                ),
                activeOrders: state.activeOrders.map(order => 
                  order._id === orderId ? updatedOrder : order
                ),
                completedOrders: state.completedOrders.map(order => 
                  order._id === orderId ? updatedOrder : order
                )
              }));
              resolve();
            } else {
              console.log('❌ Status update failed:', response.message);
              reject(new Error(response.message));
            }
          });
        });
      },

      generateNewOrderRequest: () => {
        // Trong ứng dụng thực tế, điều này sẽ được kích hoạt bởi websocket hoặc push notification
        // Tạm thời giữ lại chức năng này để demo, nhưng trong thực tế sẽ được thay thế bằng API
        set({ pendingOrder: null });
        // Trong tương lai, chúng ta sẽ nhận đơn hàng mới từ server thông qua websocket
      },

      clearPendingOrder: () => {
        set({ pendingOrder: null });
      },

      setCurrentOrder: (order) => {
        console.log('Setting current order:', order);
        set({ currentOrder: order });
      }
    }),
    {
      name: "shipper-orders-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        orders: state.orders,
        activeOrders: state.activeOrders,
        completedOrders: state.completedOrders
      })
    }
  )
);
