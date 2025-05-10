import React, { useState,useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Button } from 'react-native';
import { colors } from '@/constants/colors';
import { Package, Clock, ChevronRight, MapPin, Phone } from 'lucide-react-native';
// Đã loại bỏ: import { useOrderStore } from '@/store/orderStore';

export default function OrdersScreen() {
  // Đã loại bỏ: const { activeOrders } = useOrderStore();
  const [selectedOrder, setSelectedOrder] = useState(null);
    const fetchUsers = async () => {
      console.log("dkfd")
      try {
        const response = await fetch("http://10.0.2.2:8000/api/getalluser");
        const data = await response.json();  // Chuyển đổi dữ liệu sang JSON
        console.log("Danh sách user:", data); // In ra console
      } catch (error) {
        console.error("Lỗi khi fetch user:", error); // In lỗi nếu có
      }
    };
  // Dữ liệu mẫu thay thế cho activeOrders
  const sampleOrders = [
    {
      id: '1001',
      customerName: 'John Smith',
      address: '123 Delivery St, District 1',
      time: '15:30',
      items: 3,
      total: '$24.50',
      status: 'In Progress',
      phone: '+84 123 456 789',
      imageUrl: 'https://via.placeholder.com/60'
    },
    {
      id: '1002',
      customerName: 'Mary Johnson',
      address: '456 Pickup Rd, District 2',
      time: '16:15',
      items: 2,
      total: '$18.75',
      status: 'Ready for Pickup',
      phone: '+84 987 654 321',
      imageUrl: 'https://via.placeholder.com/60'
    }
  ];

  const renderOrderCard = ({ item }: { item:any }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => setSelectedOrder(selectedOrder?.id === item.id ? null : item)}
    >
         <Button title="Lấy danh sách user" onPress={fetchUsers} />
      <View style={styles.orderHeader}>
        <View style={styles.statusIndicator}>
          <Package size={20} color={colors.white} />
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.orderTime}>
            <Clock size={14} color={colors.subtext} style={styles.icon} />
            {item.time}
          </Text>
        </View>
        <View style={styles.orderAmount}>
          <Text style={styles.amountText}>{item.total}</Text>
          <Text style={styles.itemCount}>{item.items} items</Text>
        </View>
      </View>
      
      <View style={styles.customerRow}>
        <Image 
          source={{ uri: item.imageUrl }}
          style={styles.customerImage}
        />
        <Text style={styles.customerName}>{item.customerName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'In Progress' ? colors.warning : colors.success }]}> 
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      {selectedOrder?.id === item.id && (
        <View style={styles.orderDetails}>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Phone size={16} color={colors.primary} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.navigateButton]}>
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <View style={styles.expandRow}>
        <Text style={styles.expandText}>
          {selectedOrder?.id === item.id ? 'Hide Details' : 'View Details'}
        </Text>
        <ChevronRight 
          size={16} 
          color={colors.subtext}
          style={selectedOrder?.id === item.id ? styles.rotatedIcon : null}
        />
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Current Deliveries</Text>
      
      {sampleOrders.length > 0 ? (
        <FlatList
          data={sampleOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Package size={60} color={colors.border} />
          <Text style={styles.emptyTitle}>No Active Orders</Text>
          <Text style={styles.emptyDescription}>
            When you accept new delivery requests, they will appear here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderTime: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  itemCount: {
    fontSize: 14,
    color: colors.subtext,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  customerName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  expandText: {
    fontSize: 14,
    color: colors.subtext,
    marginRight: 4,
  },
  rotatedIcon: {
    transform: [{ rotate: '90deg' }],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  orderDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 10,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
  },
  navigateButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  navigateButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: colors.subtext,
    textAlign: 'center',
  },
});