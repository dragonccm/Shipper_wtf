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
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useOrderStore } from '@/store/orderStore';
import { colors } from '@/constants/colors';
import { Package, Clock, ChevronRight, MapPin, Phone, Truck, CheckCircle2, XCircle, RefreshCw } from 'lucide-react-native';
import { socket } from '@/utils/socket';
import * as Location from 'expo-location';
import { Order } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { API_URL } from '@/constants/config';

const { width } = Dimensions.get('window');

export default function OrdersScreen(): JSX.Element {
  const router = useRouter();
  const { acceptOrder } = useOrderStore();
  const { user } = useAuthStore();
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [modalScale] = useState(new Animated.Value(0));
  const [modalOpacity] = useState(new Animated.Value(0));
  const [modalTranslateY] = useState(new Animated.Value(50));
  const [refreshing, setRefreshing] = useState(false);

  // Fetch active orders
  const fetchActiveOrders = async () => {
    try {
      if (!user?.shipperId) return;

      const response = await fetch(`${API_URL}/api/shipper/orders/${user.shipperId}`);
      const data = await response.json();

      if (data.EC === "0" && data.DT) {
        // Lọc ra các đơn hàng chưa được giao (không có trạng thái 'delivered')
        const activeOrders = data.DT.activeOrders.filter(
          (order: Order) => order.orderStatus !== 'delivered'
        );
        setOrders(activeOrders);
      } else {
        console.error('Error fetching orders:', data.EM);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, [user?.shipperId]);

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

  // Gửi cập nhật vị trí định kỳ chỉ khi đang online
  useEffect(() => {
    if (!currentLocation || !user?.shipperId || !isOnline) return;

    const intervalId = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(loc);
        socket.emit('current_location', {
          shipperId: user.shipperId,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentLocation, user?.shipperId, isOnline]);

  const handleAcceptOrder = (orderId: string, orderDetails: Order) => {
    // Kiểm tra trạng thái hoạt động trước khi nhận đơn
    if (!isOnline) {
      Alert.alert(
        'Chưa bật trạng thái hoạt động',
        'Bạn cần bật trạng thái hoạt động để nhận đơn hàng mới.'
      );
      return;
    }
    if (!user?.shipperId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin shipper');
      return;
    }

    socket.once('order_response', (response: any) => {
      console.log('📥 Phản hồi từ server:', response);
      if (response.success) {
        acceptOrder(orderId, user.shipperId);
        fetchActiveOrders(); // Refresh orders list
        router.push(`/order/${orderId}`);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể chấp nhận đơn.');
      }
    });
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
        <View style={{ opacity: 1 }}>
          <Button title="Kiểm tra" onPress={sendLocation} />
        </View>

      </TouchableOpacity>
    );
  };

  const showStatusChangeModal = (message: string) => {
    setStatusMessage(message);
    setShowStatusModal(true);

    // Reset animations
    modalScale.setValue(0);
    modalOpacity.setValue(0);
    modalTranslateY.setValue(50);

    // Start animations
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      })
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(modalTranslateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        setShowStatusModal(false);
      });
    }, 2000);
  };

  // Xử lý cập nhật trạng thái online
  const handleOnlineStatusChange = async (value: boolean) => {
    if (!user?.shipperId) {
      showStatusChangeModal('Không tìm thấy thông tin người dùng');
      return;
    }

    try {
      // Gửi yêu cầu cập nhật trạng thái
      socket.emit('update_online_status', {
        shipperId: user.shipperId,
        isOnline: value
      });

      // Lắng nghe phản hồi
      socket.once('online_status_response', (response) => {
        if (response.success) {
          setIsOnline(value);
          showStatusChangeModal(
            value ? 'Bạn đã bắt đầu nhận đơn hàng' : 'Bạn đã tạm dừng nhận đơn hàng'
          );
        } else {
          showStatusChangeModal(response.message || 'Không thể cập nhật trạng thái');
        }
      });
    } catch (error) {
      console.error('Error updating online status:', error);
      showStatusChangeModal('Không thể cập nhật trạng thái online');
    }
  };

  // Lắng nghe sự kiện cập nhật trạng thái từ server
  useEffect(() => {
    socket.on('shipper_status_updated', (data) => {
      if (data.shipperId === user?.shipperId) {
        setIsOnline(data.isOnline);
      }
    });

    return () => {
      socket.off('shipper_status_updated');
    };
  }, [user?.shipperId]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchActiveOrders();
    setRefreshing(false);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Đơn hàng đang giao</Text>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={onRefresh}
        >
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {renderLocationStatus()}

      {orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
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
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Package size={60} color={colors.border} />
          <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
          <Text style={styles.emptyDescription}>
            Khi bạn nhận đơn hàng mới, chúng sẽ xuất hiện ở đây.
          </Text>
          <TouchableOpacity
            style={styles.reloadButtonLarge}
            onPress={onRefresh}
          >
            <RefreshCw size={24} color={colors.primary} />
            <Text style={styles.reloadText}>Tải lại</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showStatusModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  { scale: modalScale },
                  { translateY: modalTranslateY }
                ],
                opacity: modalOpacity
              }
            ]}
          >
            <View style={styles.modalIconContainer}>
              {isOnline ? (
                <>
                  <View style={[styles.iconBackground, { backgroundColor: colors.primary + '20' }]}>
                    <Truck size={32} color={colors.primary} />
                  </View>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.iconBackground, { backgroundColor: colors.error + '20' }]}>
                    <Package size={32} color={colors.error} />
                  </View>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
                  </View>
                </>
              )}
            </View>
            <Text style={styles.modalTitle}>
              {isOnline ? 'Sẵn sàng nhận đơn' : 'Đã tạm dừng'}
            </Text>
            <Text style={styles.modalText}>{statusMessage}</Text>
            <View style={styles.modalProgressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isOnline ? colors.primary : colors.error,
                    width: modalScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  iconBackground: {
    padding: 16,
    borderRadius: 50,
    marginBottom: 8,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
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
