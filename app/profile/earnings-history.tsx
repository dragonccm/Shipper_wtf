import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, DollarSign } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";

export default function EarningsHistoryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  // Mock data - replace with actual data from your API/store
  const earningsData = [
    { id: 1, date: '2023-10-01', amount: 150000, deliveries: 5 },
    { id: 2, date: '2023-10-02', amount: 180000, deliveries: 6 },
    { id: 3, date: '2023-10-03', amount: 120000, deliveries: 4 },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lịch sử thu nhập</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings History</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <DollarSign size={20} color={colors.primary} />
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={styles.summaryValue}>450,000đ</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Deliveries</Text>
            <Text style={styles.summaryValue}>15</Text>
          </View>
        </View>
        
        {earningsData.map((item) => (
          <View key={item.id} style={styles.earningItem}>
            <Text style={styles.earningDate}>{item.date}</Text>
            <View style={styles.earningDetails}>
              <Text style={styles.earningAmount}>{item.amount.toLocaleString()}đ</Text>
              <Text style={styles.earningDeliveries}>{item.deliveries} deliveries</Text>
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.subtext,
    flex: 1,
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  earningItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningDate: {
    fontSize: 14,
    color: colors.subtext,
  },
  earningDetails: {
    alignItems: "flex-end",
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  earningDeliveries: {
    fontSize: 12,
    color: colors.subtext,
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 16,
  },
});