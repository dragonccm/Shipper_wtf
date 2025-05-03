import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Order } from "@/types";

// Cấu hình API
const API_URL = "http://192.168.1.13:3000/api";

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
  // Lấy danh sách đơn hàng
  getOrders: async (): Promise<{ success: boolean; orders?: Order[]; message?: string }> => {
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
  updateOrderStatus: async (orderId: string, status: string): Promise<{ success: boolean; order?: Order; message?: string }> => {
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