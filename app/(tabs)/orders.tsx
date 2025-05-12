import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Button,
  Alert,
  Platform,
  Linking,
  Switch,
} from 'react-native';
import { useOrderStore } from '@/store/orderStore';
import { colors } from '@/constants/colors';
import { Package, Clock, ChevronRight, MapPin, Phone } from 'lucide-react-native';
import { socket } from '@/utils/socket';
import * as Location from 'expo-location';
import { Order } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import io from 'socket.io-client';

export default function OrdersScreen(): JSX.Element {
  const router = useRouter();
  const { acceptOrder, orders } = useOrderStore();
  const { user } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isOnline, setIsOnline] = useState(false);
  const socket = io("https://f25f-171-246-69-224.ngrok-free.app");

  // Kiểm tra cài đặt vị trí và quyền
  const checkLocationSettings = async (): Promise<boolean> => {
    try {
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        setLocationStatus('Dịch vụ vị trí bị tắt');
        return false;
      }
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      setLocationStatus(`Quyền hiện tại: ${existingStatus}`);
      return true;
    } catch (error) {
      console.error(error);
      setLocationStatus('Lỗi kiểm tra cài đặt vị trí');
      return false;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    setLocationStatus('Đang yêu cầu quyền...');
    const settingsOk = await checkLocationSettings();
    if (!settingsOk) {
      Alert.alert(
        'Dịch vụ vị trí',
        'Vui lòng bật dịch vụ vị trí trong cài đặt.',
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Mở cài đặt',
            onPress: () =>
              Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings(),
          },
        ],
      );
      setIsRequestingPermission(false);
      return false;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(`Quyền mới: ${status}`);
    if (status !== 'granted') {
      Alert.alert(
        'Cần quyền vị trí',
        'Ứng dụng cần quyền vị trí để nhận đơn.',
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Cấp quyền',
            onPress: () =>
              Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings(),
          },
        ],
      );
      setIsRequestingPermission(false);
      return false;
    }

    try {
      setLocationStatus('Đang lấy vị trí...');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(loc);
      setLocationError(null);
      setLocationStatus('Đã lấy được vị trí');
      return true;
    } catch (err) {
      console.error(err);
      setLocationError('Không thể lấy vị trí');
      setLocationStatus(`Lỗi: ${(err as Error).message}`);
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Khi mount: yêu cầu quyền
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Lắng nghe các đơn mới và gửi cập nhật vị trí định kỳ
  useEffect(() => {
    if (!currentLocation || !user?.id) return;

    const intervalId = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(loc);
        socket.emit('current_location', {
          shipperId: user.id,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    // Đăng ký lắng nghe sự kiện đơn hàng mới
    const handleNewOrder = (data: { orderId: string; orderDetails: Order }) => {
      console.log('📦 Nhận đơn hàng mới:', data);
      Alert.alert(
        'Đơn hàng mới',
        `Bạn có muốn nhận đơn ${data.orderId} không?`,
        [
          { text: 'Từ chối', style: 'cancel' },
          {
            text: 'Chấp nhận',
            onPress: () => handleAcceptOrder(data.orderId, data.orderDetails),
          },
        ],
      );
    };

    // Lắng nghe sự kiện đơn hàng mới
    socket.on('new_order_assigned', handleNewOrder);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      socket.off('new_order_assigned', handleNewOrder);
    };
  }, [currentLocation, user?.id]);

  const handleAcceptOrder = (orderId: string, orderDetails: Order) => {
    if (!user?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin shipper');
      return;
    }

    console.log('🔄 Đang chấp nhận đơn hàng:', { orderId, shipperId: user.id });

    socket.emit('accept_order', {
      orderId,
      shipperId: user.id,
    });

    socket.once('order_response', (response: any) => {
      console.log('📥 Phản hồi từ server:', response);
      if (response.success) {
        // Thêm đơn hàng vào store với trạng thái goingToRestaurant
        const orderToAdd = {
          ...response.orderDetails,
          orderStatus: 'goingToRestaurant' // Trạng thái ban đầu khi shipper nhận đơn
        };
        acceptOrder(orderId, orderToAdd);
        
        // Đợi một chút để đảm bảo store đã được cập nhật
        setTimeout(() => {
          router.push(`/order/${orderId}`);
        }, 100);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể chấp nhận đơn.');
      }
    });

    setTimeout(() => {
      socket.off('order_response');
      Alert.alert('Hết thời gian', 'Không nhận được phản hồi từ server.');
    }, 10000);
  };

   const sendLocation = async () => {
    if (!currentLocation) {
      const ok = await requestLocationPermission();
      if (!ok) return;
    }
    socket.emit('assign_order', '681f06bf71a1380d27f81ecd');
  };
  
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
          <Text style={styles.locationStatus}>Đang yêu cầu quyền...</Text>
        </View>
      );
    }
    if (!currentLocation) {
      return (
        <View style={styles.locationStatusContainer}>
          <Text style={styles.locationStatus}>Chưa có vị trí</Text>
          <Button title="Yêu cầu quyền" onPress={requestLocationPermission} />
        </View>
      );
    }
    return (
      <View style={styles.locationStatusContainer}>
        <Text style={styles.locationStatus}>
          Vị trí: {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
        </Text>
      </View>
    );
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const expanded = selectedOrderId === item._id;
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          setSelectedOrderId(expanded ? null : item._id);
          router.push(`/order/${item._id}`);
        }}
      >
        <Button title="Gửi vị trí" onPress={sendLocation} />

        <View style={styles.orderHeader}>
          <View style={styles.statusIndicator}>
            <Package size={20} color={colors.white} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>{item.orderNumber || `#${item._id.slice(-8)}`}</Text>
            <View style={styles.orderTime}>
              <Clock size={14} color={colors.subtext} style={styles.icon} />
              <Text>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.orderAmount}>
            <Text style={styles.amountText}>{formatCurrency(item.finalAmount)}</Text>
            <Text style={styles.itemCount}>
              {item.items.reduce((sum, i) => sum + i.quantity, 0)} món
            </Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <Image
            source={{ uri: item.address?.photoUrl || 'https://via.placeholder.com/36' }}
            style={styles.customerImage}
          />
          <Text style={styles.customerName}>{item.address?.name || 'Khách hàng'}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.orderStatus === 'goingToRestaurant' ? colors.warning : colors.success },
            ]}
          >
            <Text style={styles.statusText}>{item.orderStatus}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.orderDetails}>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <MapPin size={16} color={colors.primary} />
              <Text style={styles.detailText}>{item.address?.address || 'Chưa có địa chỉ'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Phone size={16} color={colors.primary} />
              <Text style={styles.detailText}>{item.address?.phoneNumber}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
                <Text style={styles.actionButtonText}>Nhắn tin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.navigateButton]}>
                <Text style={styles.navigateButtonText}>Điều hướng</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.expandRow}>
          <Text style={styles.expandText}>{expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}</Text>
          <ChevronRight
            size={16}
            color={colors.subtext}
            style={expanded ? styles.rotatedIcon : undefined}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Xử lý cập nhật trạng thái online
  const handleOnlineStatusChange = async (value: boolean) => {
    if (!user?._id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    try {
      // Gửi yêu cầu cập nhật trạng thái
      socket.emit('update_online_status', {
        shipperId: user._id,
        isOnline: value
      });

      // Lắng nghe phản hồi
      socket.once('online_status_response', (response) => {
        if (response.success) {
          setIsOnline(value);
          Alert.alert(
            'Thành công',
            value ? 'Bạn đã bắt đầu nhận đơn hàng' : 'Bạn đã tạm dừng nhận đơn hàng'
          );
        } else {
          Alert.alert('Lỗi', response.message || 'Không thể cập nhật trạng thái');
        }
      });
    } catch (error) {
      console.error('Error updating online status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái online');
    }
  };

  // Lắng nghe sự kiện cập nhật trạng thái từ server
  useEffect(() => {
    socket.on('shipper_status_updated', (data) => {
      if (data.shipperId === user?._id) {
        setIsOnline(data.isOnline);
      }
    });

    return () => {
      socket.off('shipper_status_updated');
    };
  }, [user?._id]);

  return (
    <View style={styles.container}>
      {renderLocationStatus()}
      <Text style={styles.pageTitle}>Current Deliveries</Text>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item._id}
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
