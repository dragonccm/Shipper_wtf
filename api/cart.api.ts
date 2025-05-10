import http from "@/lib/http";
import { AddCartBodyType, CartFullResType } from "@/schema/cart.schema";
const CartApiRequest = {
  add: (cart: AddCartBodyType, token: string) =>
    http.post<any>(
      "/api/add-cart",
      { cart },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),
  get: (token: string) =>
    http.get<CartFullResType>("/api/get-cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  quantity: (itemId: string, quantity: number, option: string, token: string) =>
    http.put<CartFullResType>(
      "/api/quantity-cart",
      { itemId, quantity, option },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),
};

export default CartApiRequest;
