import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { API_URL } from '@/constants/config';

interface Order {
  _id: string;
  restaurant: {
    name: string;
    address: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
  completedAt: string;
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      if (user?.id) {
        const response = await fetch(`${API_URL}/api/shipper/orders/${user.id}`);
        const data = await response.json();
        console.log("--------------------------------",data)
        if (data.EC === "0" && data.DT) {
          setOrders(data.DT.completedOrders);
        } else {
          console.error('Error fetching completed orders:', data.EM);
        }
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`/profile/order-details/${item._id}`)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.restaurantInfo}>
          <Feather name="shopping-bag" size={20} color={colors.primary} />
          <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
        </View>
        <Text style={styles.orderDate}>
          {new Date(item.completedAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Khách hàng:</Text>
          <Text style={styles.detailValue}>{item.customer.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số điện thoại:</Text>
          <Text style={styles.detailValue}>{item.customer.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Địa chỉ:</Text>
          <Text style={styles.detailValue}>{item.restaurant.address}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalAmount}>
          Tổng tiền: {formatCurrency(item.total)}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Hoàn thành</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="package" size={48} color={colors.subtext} />
          <Text style={styles.emptyText}>Chưa có đơn hàng nào đã hoàn thành</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  orderDate: {
    fontSize: 14,
    color: colors.subtext,
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.subtext,
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 16,
  },
}); 