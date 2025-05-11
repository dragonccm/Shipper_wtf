import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Button, Alert, Platform, Linking } from 'react-native';
import { useOrderStore } from '@/store/orderStore';
import { colors } from '@/constants/colors';
import { Package, Clock, ChevronRight, MapPin, Phone } from 'lucide-react-native';
import { socket } from '@/utils/socket';
import * as Location from 'expo-location';
import { Order } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useRouter } from 'expo-router';

export default function OrdersScreen() {
  const router = useRouter();
  const { acceptOrder, orders } = useOrderStore();
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  const checkLocationSettings = async () => {
    try {
      // Kiểm tra trạng thái dịch vụ vị trí
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      console.log('Location services enabled:', serviceEnabled);
      
      if (!serviceEnabled) {
        setLocationStatus('Dịch vụ vị trí bị tắt');
        return false;
      }

      // Kiểm tra quyền truy cập vị trí
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      console.log('Existing location permission status:', existingStatus);
      setLocationStatus(`Trạng thái quyền: ${existingStatus}`);

      return serviceEnabled;
    } catch (error) {
      console.error('Error checking location settings:', error);
      setLocationStatus('Lỗi kiểm tra cài đặt vị trí');
      return false;
    }
  };

  const requestLocationPermission = async () => {
    try {
      setIsRequestingPermission(true);
      setLocationStatus('Đang yêu cầu quyền truy cập vị trí...');
      
      // Kiểm tra cài đặt vị trí
      const settingsEnabled = await checkLocationSettings();
      if (!settingsEnabled) {
        Alert.alert(
          'Dịch vụ vị trí bị tắt',
          'Vui lòng bật dịch vụ vị trí trong cài đặt thiết bị để tiếp tục.',
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: 'Mở cài đặt',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return false;
      }

      // Yêu cầu quyền truy cập vị trí
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('New permission status:', status);
      setLocationStatus(`Trạng thái quyền mới: ${status}`);
      
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập vị trí',
          'Ứng dụng cần quyền truy cập vị trí để có thể nhận đơn hàng gần bạn.',
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: 'Cấp quyền',
              onPress: async () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return false;
      }

      // Lấy vị trí hiện tại
      setLocationStatus('Đang lấy vị trí...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });
      
      console.log('Location obtained:', location);
      setCurrentLocation(location);
      setLocationError(null);
      setLocationStatus('Đã lấy được vị trí');
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationError('Không thể lấy vị trí hiện tại');
      setLocationStatus('Lỗi: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const handleAcceptOrder = async (orderId: string, orderDetails: Order) => {
    try {
      // Gửi yêu cầu chấp nhận đơn hàng qua socket
      socket.emit('accept_order', {
        orderId,
        shipperId: '65f7b1a4e01c6f2d542a6666' // Thay thế bằng ID shipper thực tế
      });

      // Lắng nghe phản hồi từ server
      socket.once('order_response', (response) => {
        if (response.success) {
          // Lưu thông tin đơn hàng vào store
          acceptOrder(orderId, response.orderDetails);
          // Chuyển hướng đến trang chi tiết đơn hàng
          router.push(`/order/${orderId}`);
        } else {
          Alert.alert(
            'Lỗi',
            response.message || 'Không thể chấp nhận đơn hàng. Vui lòng thử lại.'
          );
        }
      });

      // Đặt timeout cho việc chờ phản hồi
      setTimeout(() => {
        socket.off('order_response');
        Alert.alert(
          'Hết thời gian chờ',
          'Không nhận được phản hồi từ server. Vui lòng thử lại.'
        );
      }, 100000); // 10 giây timeout

    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert(
        'Lỗi',
        'Đã xảy ra lỗi khi chấp nhận đơn hàng. Vui lòng thử lại.'
      );
    }
  };

  useEffect(() => {
    if (!currentLocation) return;

    const intervalId = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
        });
        console.log('Location update:', location);
        setCurrentLocation(location);
        
        socket.emit('current_location', {
          shipperId: '65f7b1a4e01c6f2d542a6666',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error updating location:', error);
        setLocationError('Không thể cập nhật vị trí');
        setLocationStatus('Lỗi cập nhật: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }, 3000);

    socket.on('new_order_assigned', (data) => {
      const { orderId, orderDetails } = data;
      Alert.alert(
        'Đơn hàng mới!',
        `Bạn có muốn nhận đơn hàng ${orderId} không?`,
        [
          { text: 'Từ chối', style: 'cancel' },
          {
            text: 'Chấp nhận',
            onPress: () => handleAcceptOrder(orderId, orderDetails),
          },
        ]
      );
    });

    return () => {
      clearInterval(intervalId);
      socket.off('new_order_assigned');
    };
  }, [currentLocation]);

  const sendLocation = async () => {
    if (!currentLocation) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return;
      }
    }

    socket.emit('assign_order', {
      orderId: '681efd2e50ac2b9eea6f13de',
    });
  };

  // Hiển thị trạng thái vị trí
  const renderLocationStatus = () => {
    if (locationError) {
      return (
        <View style={styles.locationStatusContainer}>
          <Text style={styles.locationError}>{locationError}</Text>
          <Button title="Thử lại" onPress={requestLocationPermission} />
        </View>
      );
    }

    if (isRequestingPermission) {
      return (
        <View style={styles.locationStatusContainer}>
          <Text style={styles.locationStatus}>Đang yêu cầu quyền truy cập vị trí...</Text>
        </View>
      );
    }

    if (!currentLocation) {
      return (
        <View style={styles.locationStatusContainer}>
          <Text style={styles.locationStatus}>Chưa có thông tin vị trí</Text>
          <Button title="Yêu cầu quyền truy cập" onPress={requestLocationPermission} />
        </View>
      );
    }

    return (
      <View style={styles.locationStatusContainer}>
        <Text style={styles.locationStatus}>
          Vị trí hiện tại: {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
        </Text>
      </View>
    );
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(selectedOrder?.id === item.id ? null : item);
        router.push(`/order/${item.id}`);
      }}
    >
      <Button title="Gửi vị trí hiện tại" onPress={sendLocation} />

      <View style={styles.orderHeader}>
        <View style={styles.statusIndicator}>
          <Package size={20} color={colors.white} />
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{item.orderNumber}</Text>
          <View style={styles.orderTime}>
            <Clock size={14} color={colors.subtext} style={styles.icon} />
            <Text>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.orderAmount}>
          <Text style={styles.amountText}>{formatCurrency(item.totalAmount)}</Text>
          <Text style={styles.itemCount}>
            {item.items.reduce((sum, item) => sum + item.quantity, 0)} items
          </Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <Image source={{ uri: item.customer.photoUrl }} style={styles.customerImage} />
        <Text style={styles.customerName}>{item.customer.name}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'delivering' ? colors.warning : colors.success,
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {selectedOrder?.id === item.id && (
        <View style={styles.orderDetails}>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.detailText}>{item.customerLocation.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={16} color={colors.primary} />
            <Text style={styles.detailText}>{item.customer.phone}</Text>
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
      {renderLocationStatus()}
      <Text style={styles.pageTitle}>Current Deliveries</Text>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Package size={60} color={colors.border} />
          <Text style={styles.emptyTitle}>No Active Orders</Text>
          <Text style={styles.emptyDescription}>
            When you accept new delivery requests, they will appear here.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  listContainer: { paddingBottom: 20 },
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
  orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  orderTime: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  icon: { marginRight: 4 },
  orderAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  itemCount: { fontSize: 14, color: colors.subtext },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  customerImage: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  customerName: { flex: 1, fontSize: 16, color: colors.text },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  statusText: { fontSize: 12, color: colors.white, fontWeight: '500' },
  expandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  expandText: { fontSize: 14, color: colors.subtext, marginRight: 4 },
  rotatedIcon: { transform: [{ rotate: '90deg' }] },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  orderDetails: { marginTop: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailText: { fontSize: 15, color: colors.text, marginLeft: 10, flex: 1 },
  actionButtons: { flexDirection: 'row', marginTop: 8 },
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
  navigateButton: { backgroundColor: colors.primary },
  actionButtonText: { color: colors.primary, fontWeight: '500' },
  navigateButtonText: { color: colors.white, fontWeight: '500' },
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
  emptyDescription: { fontSize: 15, color: colors.subtext, textAlign: 'center' },
  locationStatusContainer: {
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 10,
  },
  locationStatus: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  locationError: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});
