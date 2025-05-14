import React, { useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { MapPin, Package, Clock, User } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useOrderStore } from "@/store/orderStore";
import { useAuthStore } from "../../store/authStore";
import { NewOrderPopup } from "@/components/NewOrderPopup";
import { NavigationBar } from "@/components/NavigationBar";
import { socket } from "@/utils/socket";
import { Order } from "@/types";

export default function TabLayout() {
  const { 
    pendingOrder, 
    acceptOrder, 
    declineOrder, 
    generateNewOrderRequest,
    fetchOrders,
    activeOrders,
    setCurrentOrder
  } = useOrderStore();
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Map");
  
  // Lắng nghe sự kiện đơn hàng mới
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewOrder = (data: { orderId: string; orderDetails: Order }) => {
      console.log('📦 Nhận đơn hàng mới:', data);
      setCurrentOrder(data.orderDetails);
      // router.push(`/order/${data.orderId}`);
    };

    // Đăng ký event listener
    socket.on('new_order_assigned', handleNewOrder);

    // Cleanup khi component unmount
    return () => {
      socket.off('new_order_assigned', handleNewOrder);
    };
  }, [isAuthenticated]);
  useEffect(() => {
    // Chỉ tải dữ liệu khi đã xác thực
    if (isAuthenticated) {
      // Tải danh sách đơn hàng ban đầu
      fetchOrders();
    }
  }, [isAuthenticated]);
  
  return (
    <View style={styles.container}>
      {pendingOrder && (
        <NewOrderPopup
          order={pendingOrder}
          onAccept={acceptOrder}
          onDecline={declineOrder}
        />
      )}
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subtext,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerShown: false, // Hide default header
        }}
        screenListeners={{
          state: (e) => {
            const routes = e.data.state?.routes;
            const index = e.data.state?.index ?? 0;
            if (routes && routes.length > 0) {
              const currentRoute = routes[index];
              switch (currentRoute.name) {
                case "index":
                  setActiveTab("Map");
                  break;
                case "orders":
                  setActiveTab("Active Orders");
                  break;
                case "history":
                  setActiveTab("Order History");
                  break;
                case "profile":
                  setActiveTab("Profile");
                  break;
                default:
                  setActiveTab("Shipper App");
              }
            }
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Map",
            tabBarLabel: "Map",
            tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
            header: () => (
              <NavigationBar 
                title="Shipper Map" 
                showNotification 
                showMenu
                onMenuPress={() => console.log("Menu pressed")}
                onNotificationPress={() => console.log("Notification pressed")}
              />
            )
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: "Active Orders",
            tabBarLabel: "Orders",
            tabBarIcon: ({ color }) => <Package size={24} color={color} />,
            tabBarBadge: activeOrders.length > 0 ? activeOrders.length : undefined,
            header: () => (
              <NavigationBar 
                title="Active Orders" 
                showNotification
              />
            )
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Order History",
            tabBarLabel: "History",
            tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
            header: () => (
              <NavigationBar 
                title="Order History" 
                showNotification
              />
            )
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
            header: () => (
              <NavigationBar 
                title="My Profile" 
                showNotification
              />
            )
          }}
          listeners={{
            tabPress: (e) => {
              // Ngăn chặn hành vi mặc định
              e.preventDefault();
              // Điều hướng đến màn hình profile trong thư mục profile
              router.push('/profile/profile');
            },
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    height: Platform.OS === "ios" ? 90 : 70,
    paddingBottom: Platform.OS === "ios" ? 30 : 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});