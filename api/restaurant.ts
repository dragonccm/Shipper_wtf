import http from "@/lib/http";
import { RestaurantResType } from "@/schema/restaurant.schema";


const RestaurantApiRequest = {
    getRestaurant: (id: string) => http.get<RestaurantResType>(`/api/restaurant-page/${id}`),
  };
  
  export default RestaurantApiRequest;
