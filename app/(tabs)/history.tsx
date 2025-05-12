import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { CheckCircle, Clock, Calendar, ChevronDown, Filter, Search, XCircle } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
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

export default function HistoryScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      if (user?.id) {
        const response = await fetch(`${API_URL}/api/shipper/orders/${user.id}`);
        const data = await response.json();
        
        if (data.EC === "0" && data.DT) {
          setOrders(data.DT.completedOrders);
        } else {
          console.error('Error fetching orders:', data.EM);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order._id.includes(searchQuery);
    
    const matchesFilter = 
      activeFilter === 'all' || 
      order.status === activeFilter;
      
    return matchesSearch && matchesFilter;
  });
  
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
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{item._id.slice(-4)}</Text>
          <Text style={styles.customerName}>{item.customer.name}</Text>
        </View>
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
      
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>{item.restaurant.address}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
        <Text style={styles.phoneNumber}>{item.customer.phone}</Text>
      </View>
    </TouchableOpacity>
  );
  
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
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.subtext} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đơn hàng..."
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <XCircle size={18} color={colors.subtext} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
        >
          <Filter size={18} color={colors.primary} />
          <ChevronDown size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {isFilterMenuOpen && (
        <View style={styles.filterMenu}>
          <TouchableOpacity 
            style={[styles.filterOption, activeFilter === 'all' && styles.activeFilter]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, activeFilter === 'completed' && styles.activeFilter]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterText, activeFilter === 'completed' && styles.activeFilterText]}>
              Hoàn thành
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, activeFilter === 'canceled' && styles.activeFilter]}
            onPress={() => setActiveFilter('canceled')}
          >
            <Text style={[styles.filterText, activeFilter === 'canceled' && styles.activeFilterText]}>
              Đã hủy
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào</Text>
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
});