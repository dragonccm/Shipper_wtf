import { User } from "@/types";

export const mockUser: User = {
  id: "user-1",
  name: "Tran Minh Shipper",
  email: "shipper@example.com",
  phone: "0909123456",
  photoUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop",
  isOnline: true,
  currentLocation: {
    latitude: 10.7769,
    longitude: 106.7009
  }
};