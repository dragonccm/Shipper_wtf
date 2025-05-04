import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors } from '@/constants/colors';
import { CheckCircle, Clock, Calendar, ChevronDown, Filter, Search, XCircle } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';

export default function HistoryScreen() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const orderHistory = [
    {
      id: '923',
      date: '12 Jul 2023',
      time: '14:35',
      customerName: 'Sarah Williams',
      address: '78 Baker St, District 3',
      amount: '$32.50',
      status: 'completed',
    },
    {
      id: '845',
      date: '10 Jul 2023',
      time: '09:20',
      customerName: 'Mike Johnson',
      address: '214 Pine Ave, District 1',
      amount: '$18.75',
      status: 'completed',
    },
    {
      id: '782',
      date: '08 Jul 2023',
      time: '16:50',
      customerName: 'David Lee',
      address: '55 Ocean Blvd, District 7',
      amount: '$27.30',
      status: 'canceled',
    },
    {
      id: '691',
      date: '05 Jul 2023',
      time: '11:15',
      customerName: 'Lisa Chen',
      address: '123 Garden St, District 2',
      amount: '$41.20',
      status: 'completed',
    }
  ];
  
  const filteredOrders = orderHistory.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.includes(searchQuery);
    
    const matchesFilter = 
      activeFilter === 'all' || 
      order.status === activeFilter;
      
    return matchesSearch && matchesFilter;
  });
  
  const renderOrderItem = ({ item } : {item : any}) => (
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
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        <Text style={styles.orderAmount}>{item.amount}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Calendar size={14} color={colors.subtext} style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={14} color={colors.subtext} style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
      </View>
      
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>{item.address}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <TouchableOpacity style={styles.viewDetails}>
        <Text style={styles.viewDetailsText}>View Full Details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.subtext} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
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
              All Orders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, activeFilter === 'completed' && styles.activeFilter]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterText, activeFilter === 'completed' && styles.activeFilterText]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, activeFilter === 'canceled' && styles.activeFilter]}
            onPress={() => setActiveFilter('canceled')}
          >
            <Text style={[styles.filterText, activeFilter === 'canceled' && styles.activeFilterText]}>
              Canceled
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
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
  viewDetails: {
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
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