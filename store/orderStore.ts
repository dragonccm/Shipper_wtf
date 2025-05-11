import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { Order, OrderStatus } from "@/types";
import { orderAPI } from "@/services/api";
import { socket } from "@/utils/socket";
import { router } from "expo-router";
// Không cần định nghĩa User ở đây vì chúng ta sẽ sử dụng token từ authAPI

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  completedOrders: Order[];
  pendingOrder: Order | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: () => Promise<void>;
  acceptOrder: (orderId: string, orderData: Order) => Promise<void>;
  declineOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
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
      error: null,

      fetchOrders: async () => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const result = await orderAPI.getOrders();
          
          if (result.success && result.orders) {
            // Transform the orders to match our interface
            const transformedOrders = result.orders.map((order: any) => ({
              id: order.id || order._id,
              orderNumber: order.orderNumber || `#${order.id}`,
              restaurant: {
                id: order.restaurant?.id || 'unknown',
                name: order.restaurant?.name || 'Unknown Restaurant',
                location: {
                  latitude: order.restaurant?.location?.latitude || 0,
                  longitude: order.restaurant?.location?.longitude || 0,
                  address: order.restaurant?.location?.address || 'No address provided'
                },
                photoUrl: order.restaurant?.photoUrl || 'https://via.placeholder.com/60'
              },
              customer: {
                id: order.customer?.id || 'unknown',
                name: order.customer?.name || 'Unknown Customer',
                phone: order.customer?.phone || 'No phone provided',
                photoUrl: order.customer?.photoUrl || 'https://via.placeholder.com/60'
              },
              items: order.items || [],
              totalAmount: order.totalAmount || 0,
              status: order.status || 'pending',
              createdAt: order.createdAt || new Date().toISOString(),
              estimatedDeliveryTime: order.estimatedDeliveryTime || new Date(Date.now() + 30 * 60000).toISOString(),
              customerLocation: {
                latitude: order.customerLocation?.latitude || 0,
                longitude: order.customerLocation?.longitude || 0,
                address: order.customerLocation?.address || 'No address provided'
              },
              notes: order.notes || ''
            }));

            set({
              orders: transformedOrders,
              activeOrders: transformedOrders.filter(order => order.status !== "delivered"),
              completedOrders: transformedOrders.filter(order => order.status === "delivered"),
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

      acceptOrder: async (orderId: string, orderData: Order) => {
        const { pendingOrder, isLoading } = get();
        socket.emit("accept_order",{orderId,shipperId:"65f7b1a4e01c6f2d542a7777"})
        if (isLoading || !pendingOrder || pendingOrder.id !== orderId) return;

        set({ isLoading: true, error: null });

        try {
          const result = await orderAPI.acceptOrder(orderId);

          if (result.success && result.order) {
            // Cập nhật danh sách đơn hàng với đơn hàng đã chấp nhận
            const { orders, activeOrders } = get();
            set({
              orders: [...orders, orderData],
              activeOrders: [...activeOrders, orderData],
              pendingOrder: null,
              isLoading: false
            });
          } else {
            set({ 
              isLoading: false, 
              error: result.message || 'Không thể chấp nhận đơn hàng' 
            });
          }
        } catch (error: any) {
          console.error("Failed to accept order:", error);
          set({ 
            isLoading: false, 
            error: error.message || 'Đã xảy ra lỗi khi chấp nhận đơn hàng' 
          });
        }
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
        const { orders, activeOrders, completedOrders } = get();
        set({ isLoading: true, error: null });

        try {
          const result = await orderAPI.updateOrderStatus(orderId, status);

          if (result.success && result.order) {
            // Cập nhật đơn hàng trong state
            const updatedOrder = result.order;
            const updatedOrders = orders.map(order => 
              order.id === orderId ? updatedOrder : order
            );

            // Cập nhật danh sách đơn hàng đang hoạt động và đã hoàn thành
            let updatedActiveOrders = activeOrders.filter(order => order.id !== orderId);
            let updatedCompletedOrders = [...completedOrders];

            if (status === "delivered") {
              updatedCompletedOrders.push(updatedOrder);
            } else {
              updatedActiveOrders.push(updatedOrder);
            }

            set({
              orders: updatedOrders,
              activeOrders: updatedActiveOrders,
              completedOrders: updatedCompletedOrders,
              isLoading: false
            });

          } else {
            set({ 
              isLoading: false, 
              error: result.message || 'Không thể cập nhật trạng thái đơn hàng' 
            });
          }
        } catch (error: any) {
          console.error("Failed to update status:", error);
          set({ 
            isLoading: false, 
            error: error.message || 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng' 
          });
        }
      },

      generateNewOrderRequest: () => {
        // Trong ứng dụng thực tế, điều này sẽ được kích hoạt bởi websocket hoặc push notification
        // Tạm thời giữ lại chức năng này để demo, nhưng trong thực tế sẽ được thay thế bằng API
        set({ pendingOrder: null });
        // Trong tương lai, chúng ta sẽ nhận đơn hàng mới từ server thông qua websocket
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
      })
    }
  )
);
