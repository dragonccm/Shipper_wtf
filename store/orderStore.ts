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
          const response = await fetch(`https://cffe-2402-800-63b5-dab2-516a-9e03-cd68-2d5.ngrok-free.app/api/getorder/681f06bf71a1380d27f81ecd`, {
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
            set({
              orders: orders,
              activeOrders: orders.filter((order: Order) => order.orderStatus !== "delivered"),
              completedOrders: orders.filter((order: Order) => order.orderStatus === "delivered"),
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
        socket.emit("accept_order", { orderId, shipperId: "65f7b1a4e01c6f2d542a7777" })
        if (isLoading || !pendingOrder || pendingOrder.id !== orderId) return;

        set({ isLoading: true, error: null });
        const f = {
          "discount": {
            "voucherId": "681c9b3b9a23041dbc3027fb",
            "amount": 5000
          },
          "_id": "681f06bf71a1380d27f81ecd",
          "user": {
            "_id": "6814a71243a532607e592b08",
            "phone": "0944034769",
            "username": "Hưng Thịnh"
          },
          "items": [
            {
              "food": "67e9245d7959b1f43adf7cd5",
              "quantity": 2,
              "price": 50000,
              "toppings": [
                {
                  "topping": "681639d05a56620ec0753f7a",
                  "item": [
                    {
                      "id": "67f2568e6b37cd0a94655e07",
                      "price": 2200,
                      "_id": "681efd2e50ac2b9eea6f13e1"
                    }
                  ],
                  "_id": "681efd2e50ac2b9eea6f13e0"
                }
              ],
              "_id": "681efd2e50ac2b9eea6f13df"
            },
            {
              "food": "67ded2611dfb8dafb9200be4",
              "quantity": 1,
              "price": 50000,
              "toppings": [
                {
                  "topping": "6819d35fd9108757680e6e88",
                  "item": [
                    {
                      "id": "67f2568e6b37cd0a94655e07",
                      "price": 2200,
                      "_id": "681efd2e50ac2b9eea6f13e4"
                    },
                    {
                      "id": "67f931be611cc9ec963e6933",
                      "price": 2000,
                      "_id": "681efd2e50ac2b9eea6f13e5"
                    },
                    {
                      "id": "67f93203611cc9ec963e693e",
                      "price": 1000,
                      "_id": "681efd2e50ac2b9eea6f13e6"
                    }
                  ],
                  "_id": "681efd2e50ac2b9eea6f13e3"
                },
                {
                  "topping": "6819d35fd9108757680e6e89",
                  "item": [
                    {
                      "id": "67f265978eb487399d88560b",
                      "price": 10000,
                      "_id": "681efd2e50ac2b9eea6f13e8"
                    }
                  ],
                  "_id": "681efd2e50ac2b9eea6f13e7"
                }
              ],
              "_id": "681efd2e50ac2b9eea6f13e2"
            },
            {
              "food": "67eba7ffed2cdc702b33a907",
              "quantity": 1,
              "price": 20000,
              "toppings": [
                {
                  "topping": "6819d4b9d9108757680e6f49",
                  "item": [
                    {
                      "id": "67f93203611cc9ec963e693e",
                      "price": 1000,
                      "_id": "681efd2e50ac2b9eea6f13eb"
                    },
                    {
                      "id": "67f931be611cc9ec963e6933",
                      "price": 2000,
                      "_id": "681efd2e50ac2b9eea6f13ec"
                    }
                  ],
                  "_id": "681efd2e50ac2b9eea6f13ea"
                }
              ],
              "_id": "681efd2e50ac2b9eea6f13e9"
            }
          ],
          "totalPrice": 199600,
          "shippingFee": 12000,
          "finalAmount": 199600,
          "paymentMethod": "cash",
          "paymentStatus": "pending",
          "orderStatus": "delivering",
          "createdAt": "2025-05-10T07:15:58.746Z",
          "updatedAt": "2025-05-10T07:15:58.746Z",
          "note": "nhớ mua thêm trứng",
          "isRated": false,
          "__v": 0,
          "shipper": "65f7b1a4e01c6f2d542a7777"
        }
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
