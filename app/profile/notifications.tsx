import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Button } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Trash2 } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { NavigationBar } from "@/components/NavigationBar";
import { useAuthStore } from "@/store/authStore";

export default function NotificationsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  // Mock data - replace with actual data from your API/store
  const [notificationSettings, setNotificationSettings] = useState([
    { id: 1, title: 'New Order Notifications', description: 'Nhận thông báo khi có đơn hàng mới', enabled: true },
    { id: 2, title: 'Earnings Updates', description: 'Cập nhật về thu nhập và thanh toán', enabled: true },
    { id: 3, title: 'Promotions', description: 'Thông tin về khuyến mãi và ưu đãi đặc biệt', enabled: false },
    { id: 4, title: 'System Messages', description: 'Thông báo hệ thống quan trọng', enabled: true },
  ]);

  const toggleSwitch = (id: number) => {
    setNotificationSettings(prev => 
      prev.map(item => 
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      "Xóa tất cả thông báo",
      "Bạn có chắc chắn muốn xóa tất cả thông báo không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: () => {
            // Implement clear all notifications logic here
            Alert.alert("Thành công", "Đã xóa tất cả thông báo");
          } 
        }
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thông báo</Text>
        <Text style={styles.subtitle}>Bạn cần đăng nhập để xem thông tin</Text>
        <Text style={styles.emptyText}>Không có dữ liệu</Text>
        <Button 
          title="Đăng nhập / Đăng ký" 
          onPress={handleLoginPress}
          style={styles.button}
        />
        <Button 
          title="Đăng xuất" 
          onPress={handleLogout}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavigationBar 
        title="Thông báo" 
        showBackButton={true} 
        rightComponent={
          <TouchableOpacity style={styles.iconButton} onPress={clearAllNotifications}>
            <Trash2 size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        {notificationSettings.map((item) => (
          <View key={item.id} style={styles.notificationItem}>
            <Bell size={20} color={colors.primary} />
            <View style={styles.textContainer}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationDescription}>{item.description}</Text>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              onValueChange={() => toggleSwitch(item.id)}
              value={item.enabled}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: colors.subtext,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
});