import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Order } from "@/types";

// Cấu hình API
// Sử dụng localhost hoặc 10.0.2.2 cho máy ảo Android
const API_URL = "http://localhost:3000/api";

// Tạm thời sử dụng dữ liệu mẫu thay vì gọi API thật
const USE_MOCK_DATA = true;

// Hàm helper để lấy token từ AsyncStorage
async function getAuthToken(): Promise<string | null> {
  try {
    const userData = await AsyncStorage.getItem('shipper-auth-token');
    if (userData) {
      return userData;
    }
    return null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

// Hàm helper để tạo headers với token xác thực
async function createAuthHeaders() {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// API xác thực
export const authAPI = {
  // Đăng nhập
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Lưu token vào AsyncStorage
        if (data.token) {
          await AsyncStorage.setItem('shipper-auth-token', data.token);
        }
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Đăng nhập thất bại' };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: 'Lỗi kết nối đến máy chủ' };
    }
  },
  
  // Đăng ký
  register: async (name: string, email: string, phone: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Lưu token vào AsyncStorage
        if (data.token) {
          await AsyncStorage.setItem('shipper-auth-token', data.token);
        }
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Đăng ký thất bại' };
      }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: 'Lỗi kết nối đến máy chủ' };
    }
  },
  
  // Kiểm tra token
  checkAuth: async (): Promise<{ isAuthenticated: boolean; user?: User }> => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        return { isAuthenticated: false };
      }
      
      const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { isAuthenticated: true, user: data.user };
      } else {
        // Token không hợp lệ, xóa khỏi AsyncStorage
        await AsyncStorage.removeItem('shipper-auth-token');
        return { isAuthenticated: false };
      }
    } catch (error) {
      console.error("Check auth error:", error);
      return { isAuthenticated: false };
    }
  },
  
  // Đăng xuất
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('shipper-auth-token');
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
};

// API đơn hàng
export const orderAPI = {
  // Lấy chi tiết đơn hàng
  getOrderDetail: async (orderId: string): Promise<{ success: boolean; order?: Order; message?: string }> => {
    // Sử dụng dữ liệu mẫu nếu USE_MOCK_DATA = true
    if (USE_MOCK_DATA) {
      console.log("Sử dụng dữ liệu mẫu cho chi tiết đơn hàng");
      // Dữ liệu mẫu cho chi tiết đơn hàng
      const mockOrder: Order = {
        id: orderId,
        orderNumber: `#${orderId}`,
        createdAt: new Date(),
        status: "goingToRestaurant",
        restaurant: {
          name: "Pizza Hut",
          photoUrl: "https://via.placeholder.com/60",
          location: { address: "123 Delivery St, District 1" }
        },
        customer: {
          name: "John Smith",
          phone: "+84 123 456 789",
          photoUrl: "https://via.placeholder.com/60"
        },
        customerLocation: { address: "123 Delivery St, District 1" },
        items: [
          { name: "Pizza Hải Sản", quantity: 1, price: 120000 },
          { name: "Coca Cola", quantity: 2, price: 25000 }
        ],
        totalAmount: 170000,
        note: "Giao hàng trước 12h trưa"
      };
      return { success: true, order: mockOrder };
    }
    
    // Gọi API thật nếu không sử dụng dữ liệu mẫu
    try {
      const headers = await createAuthHeaders();
      
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, order: data.order };
      } else {
        return { success: false, message: data.message || 'Không thể lấy chi tiết đơn hàng' };
      }
    } catch (error) {
      console.error("Get order detail error:", error);
      return { success: false, message: 'Lỗi kết nối đến máy chủ' };
    }
  },
  // Lấy danh sách đơn hàng
  getOrders: async (): Promise<{ success: boolean; orders?: Order[]; message?: string }> => {
    // Sử dụng dữ liệu mẫu nếu USE_MOCK_DATA = true
    if (USE_MOCK_DATA) {
      console.log("Sử dụng dữ liệu mẫu cho đơn hàng");
      // Dữ liệu mẫu cho đơn hàng
      const mockOrders: Order[] = [
        {
          id: "1001",
          orderNumber: "#1001",
          createdAt: new Date(),
          status: "goingToRestaurant",
          restaurant: {
            name: "Pizza Hut",
            photoUrl: "https://via.placeholder.com/60",
            location: { address: "123 Delivery St, District 1" }
          },
          customer: {
            name: "John Smith",
            phone: "+84 123 456 789",
            photoUrl: "https://via.placeholder.com/60"
          },
          customerLocation: { address: "123 Delivery St, District 1" },
          items: [{ quantity: 2 }, { quantity: 1 }],
          totalAmount: 245000
        },
        {
          id: "1002",
          orderNumber: "#1002",
          createdAt: new Date(),
          status: "arrivedAtRestaurant",
          restaurant: {
            name: "McDonald's",
            photoUrl: "https://via.placeholder.com/60",
            location: { address: "456 Pickup Rd, District 2" }
          },
          customer: {
            name: "Mary Johnson",
            phone: "+84 987 654 321",
            photoUrl: "https://via.placeholder.com/60"
          },
          customerLocation: { address: "456 Pickup Rd, District 2" },
          items: [{ quantity: 1 }, { quantity: 2 }],
          totalAmount: 187500
        }
      ];
      return { success: true, orders: mockOrders };
    }
    
    // Gọi API thật nếu không sử dụng dữ liệu mẫu
    try {
      const headers = await createAuthHeaders();
      
      const response = await fetch(`${API_URL}/orders`, {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, orders: data.orders };
      } else {
        return { success: false, message: data.message || 'Không thể lấy danh sách đơn hàng' };
      }
    } catch (error) {
      console.error("Get orders error:", error);
      return { success: false, message: 'Lỗi kết nối đến máy chủ' };
    }
  },
  
  // Chấp nhận đơn hàng
  acceptOrder: async (orderId: string): Promise<{ success: boolean; order?: Order; message?: string }> => {
    // Sử dụng dữ liệu mẫu nếu USE_MOCK_DATA = true
    if (USE_MOCK_DATA) {
      console.log("Sử dụng dữ liệu mẫu cho chấp nhận đơn hàng");
      // Tạo đơn hàng mẫu đã được chấp nhận
      const mockOrder: Order = {
        id: orderId,
        orderNumber: `#${orderId}`,
        createdAt: new Date(),
        status: "goingToRestaurant",
        restaurant: {
          name: "Pizza Hut",
          photoUrl: "https://via.placeholder.com/60",
          location: { address: "123 Delivery St, District 1" }
        },
        customer: {
          name: "John Smith",
          phone: "+84 123 456 789",
          photoUrl: "https://via.placeholder.com/60"
        },
        customerLocation: { address: "123 Delivery St, District 1" },
        items: [{ quantity: 2 }, { quantity: 1 }],
        totalAmount: 245000
      };
      return { success: true, order: mockOrder };
    }
    
    // Gọi API thật nếu không sử dụng dữ liệu mẫu
    try {
      const headers = await createAuthHeaders();
      
      const response = await fetch(`${API_URL}/orders/${orderId}/accept`, {
        method: 'POST',
        headers,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, order: data.order };
      } else {
        return { success: false, message: data.message || 'Không thể chấp nhận đơn hàng' };
      }
    } catch (error) {
      console.error("Accept order error:", error);
      return { success: false, message: 'Lỗi kết nối đến máy chủ' };
    }
  },
  
  // Từ chối đơn hàng
  declineOrder: async (orderId: string): Promise<{ success: boolean; message?: string }> => {
    // Sử dụng dữ liệu mẫu nếu USE_MOCK_DATA = true
    if (USE_MOCK_DATA) {
      console.log("Sử dụng dữ liệu mẫu cho từ chối đơn hàng");
      return { success: true };
    }
    
    // Gọi API thật nếu không sử dụng dữ liệu mẫu
    try {
      const headers = await createAuthHeaders();
      
      const response = await fetch(`${API_URL}/orders/${orderId}/decline`, {
        method: 'POST',
        headers,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Không thể từ chối đơn hàng' };
      }
    } catch (error) {
      console.error("Decline order error:", error);
      return { success: false, message: 'Lỗi kết nối đến máy chủ' };
    }
  },
  
  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<{ success: boolean; order?: Order; message?: string }> => {
    // Sử dụng dữ liệu mẫu nếu USE_MOCK_DATA = true
    if (USE_MOCK_DATA) {
      console.log("Sử dụng dữ liệu mẫu cho cập nhật trạng thái đơn hàng");
      // Tạo đơn hàng mẫu với trạng thái đã cập nhật
      const mockOrder: Order = {
        id: orderId,
        orderNumber: `#${orderId}`,
        createdAt: new Date(),
        status: status,
        restaurant: {
          name: "Pizza Hut",
          photoUrl: "https://via.placeholder.com/60",
          location: { address: "123 Delivery St, District 1" }
        },
        customer: {
          name: "John Smith",
          phone: "+84 123 456 789",
          photoUrl: "https://via.placeholder.com/60"
        },
        customerLocation: { address: "123 Delivery St, District 1" },
        items: [{ quantity: 2 }, { quantity: 1 }],
        totalAmount: 245000
      };
      return { success: true, order: mockOrder };
    }
    
    // Gọi API thật nếu không sử dụng dữ liệu mẫu
    try {
      const headers = await createAuthHeaders();
      
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, order: data.order };
      } else {
        return { success: false, message: data.message || 'Không thể cập nhật trạng thái đơn hàng' };
      }
    } catch (error) {
      console.error("Update order status error:", error);
      return { success: false, message: 'Lỗi kết nối đến máy chủ' };
    }
  },
};