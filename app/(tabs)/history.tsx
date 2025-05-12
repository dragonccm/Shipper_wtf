import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '@/constants/colors';
import { CheckCircle, Clock, Calendar, XCircle, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { API_URL } from '@/constants/config';

interface Order {
  _id: string;
  orderStatus: string;
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
  createdAt: string;
  updatedAt: string;
}

export default function HistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [user?.shipperId]);
console.log('User ID:', user?.shipperId); // Log ID người dùng để debug
  const fetchOrders = async () => {
    try {
      if (!user?.shipperId) {
        setOrders([]);
        return;
      }
      
      const response = await fetch(`${API_URL}/api/shipper/orders/${user.shipperId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.EC === "0" && data.DT) {
        // Lấy danh sách đơn hàng đã hoàn thành từ cả activeOrders và completedOrders
        let completedOrders = [];
        if (data.DT.activeOrders && Array.isArray(data.DT.activeOrders)) {
          const deliveredFromActive = data.DT.activeOrders.filter(order => order.orderStatus === 'delivered');
          completedOrders = completedOrders.concat(deliveredFromActive);
        }
        if (data.DT.completedOrders && Array.isArray(data.DT.completedOrders)) {
          completedOrders = completedOrders.concat(data.DT.completedOrders);
        }

        // Nới lỏng điều kiện filter, lấy các trường có thể có
        const validOrders = completedOrders
          .filter(order => order && order._id)
          .map(order => ({
            _id: order._id,
            restaurant: {
              name: (order.restaurant && order.restaurant.name) || order.restaurantName || '',
              address: (order.address && order.address.address) || (order.restaurant && order.restaurant.address) || ''
            },
            customer: {
              name:
                (order.user && order.user.username) ||
                (order.customer && order.customer.name) ||
                '',
              phone:
                (order.user && order.user.phone) ||
                (order.customer && order.customer.phone) ||
                (order.address && order.address.phoneNumber) ||
                ''
            },
            items: Array.isArray(order.items) ? order.items.map(item => ({
              name: (item.food && item.food.name) || item.name || '',
              quantity: Number(item.quantity) || 0,
              price: Number(item.price) || 0
            })) : [],
            total: Number(order.finalAmount || order.total) || 0,
            status: order.orderStatus === 'delivered' ? 'completed' : order.orderStatus,
            createdAt: order.createdAt || new Date().toISOString(),
            completedAt: order.updatedAt || new Date().toISOString()
          }));

        setOrders(validOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };
  

  
  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: item.status === 'completed' ? colors.success : colors.danger }
        ]}>
          {item.status === 'completed' ? 
            <CheckCircle size={16} color={colors.white} /> : 
            <XCircle size={16} color={colors.white} />
          }
        </View>
        <Text style={styles.orderId}>Đơn #{item._id.slice(-4)}</Text>
        <Text style={styles.orderAmount}>{formatCurrency(item.total)}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Calendar size={14} color={colors.subtext} style={styles.detailIcon} />
          <Text style={styles.detailText}>
            {new Date(item.completedAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={14} color={colors.subtext} style={styles.detailIcon} />
          <Text style={styles.detailText}>
            {new Date(item.completedAt).toLocaleTimeString('vi-VN')}
          </Text>
        </View>
      </View>
      
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
        <Text style={styles.addressText}>{item.restaurant.address}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải lịch sử đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.reloadButton}
          onPress={onRefresh}
        >
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào</Text>
            <TouchableOpacity 
              style={styles.reloadButtonLarge}
              onPress={onRefresh}
            >
              <RefreshCw size={24} color={colors.primary} />
              <Text style={styles.reloadText}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
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
  header: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    marginLeft: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  filterMenu: {
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
    flexDirection: 'row',
  },
  filterOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 14,
  },
  activeFilterText: {
    color: colors.white,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  customerName: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    color: colors.subtext,
  },
  addressContainer: {
    backgroundColor: colors.background,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  phoneNumber: {
    fontSize: 14,
    color: colors.subtext,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: colors.subtext,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  reloadButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  reloadText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '500',
  },
});