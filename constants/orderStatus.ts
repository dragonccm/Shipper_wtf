export const ORDER_STATUS = {
  GOING_TO_RESTAURANT: "goingToRestaurant",
  ARRIVED_AT_RESTAURANT: "arrivedAtRestaurant",
  PICKED_UP: "pickedUp",
  DELIVERING: "delivering",
  ARRIVED_AT_CUSTOMER: "arrivedAtCustomer",
  DELIVERED: "delivered"
} as const;

export const ORDER_STATUS_LABELS: Record<keyof typeof ORDER_STATUS, string> = {
  GOING_TO_RESTAURANT: "Đang đến nhà hàng",
  ARRIVED_AT_RESTAURANT: "Đã đến nhà hàng",
  PICKED_UP: "Đã lấy hàng",
  DELIVERING: "Đang giao hàng",
  ARRIVED_AT_CUSTOMER: "Đã đến nơi giao",
  DELIVERED: "Đã giao hàng"
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]; 