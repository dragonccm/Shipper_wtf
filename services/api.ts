import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Order } from "@/types";

// Cấu hình API
// Sử dụng localhost hoặc 10.0.2.2 cho máy ảo Android
const API_URL = " https://cffe-2402-800-63b5-dab2-516a-9e03-cd68-2d5.ngrok-free.app/api";

// Tạm thời sử dụng dữ liệu mẫu thay vì gọi API thật
// const USE_MOCK_DATA = true;

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
      console.log("[LOGIN REQUEST]", { email });
      const data = await response.json();
      console.log("[LOGIN RESPONSE]", data);
      
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
      console.error("Login error: roi ne", error);
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
      console.log("[REGISTER REQUEST]", { name, email, phone });
      const data = await response.json();
      console.log("[REGISTER RESPONSE]", data);
      
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
      console.log("[CHECK AUTH REQUEST]", { token });
      if (response.ok) {
        const data = await response.json();
        console.log("[CHECK AUTH RESPONSE]", data);
        return { isAuthenticated: true, user: data.user };
      } else {
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
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'GET',
        headers,
      });
      console.log("[GET ORDER DETAIL REQUEST]", { orderId });
      const data = await response.json();
      console.log("[GET ORDER DETAIL RESPONSE]", data);
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
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${API_URL}/orders`, {
        method: 'GET',
        headers,
      });
      console.log("[GET ORDERS REQUEST]");
      const data = await response.json();
      console.log("[GET ORDERS RESPONSE]", data);
      if (data) {
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
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${API_URL}/orders/${orderId}/accept`, {
        method: 'POST',
        headers,
      });
      console.log("[ACCEPT ORDER REQUEST]", { orderId });
      const data = await response.json();
      console.log("[ACCEPT ORDER RESPONSE]", data);
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
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${API_URL}/orders/${orderId}/decline`, {
        method: 'POST',
        headers,
      });
      console.log("[DECLINE ORDER REQUEST]", { orderId });
      const data = await response.json();
      console.log("[DECLINE ORDER RESPONSE]", data);
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
    try {
      const headers = await createAuthHeaders();
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });
      console.log("[UPDATE ORDER STATUS REQUEST]", { orderId, status });
      const data = await response.json();
      console.log("[UPDATE ORDER STATUS RESPONSE]", data);
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