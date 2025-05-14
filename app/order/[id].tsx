import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  Linking
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/colors";
import { Button } from "@/components/Button";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/utils/formatters";
import { OrderStatus, Location as LocationType } from "@/types";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useOrderStore } from "@/store/orderStore";
import { useRouter } from "expo-router";
import { socket } from "@/utils/socket";
import { Order } from '../../types';
import { useAuthStore } from "@/store/authStore";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<string | null>(null);
  const router = useRouter();

  // Lấy vị trí hiện tại của shipper
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền truy cập", "Không thể truy cập vị trí của bạn");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    })();
  }, []);

  // Đăng ký lắng nghe socket chỉ một lần
  useEffect(() => {
    if (!socket) return;

    const handleResponse = (response: any) => {
      if (
        response &&
        response.success &&
        response.orderDetails &&
        Array.isArray(response.orderDetails.items) &&
        response.orderDetails.items.length > 0
      ) {
        // Đảm bảo luôn đồng bộ status với orderStatus từ backend
        setOrder({
          ...response.orderDetails,
          status: response.orderDetails.orderStatus
        });
        setIsUpdating(false);
        setPendingUpdate(null);
        if (response.orderDetails.orderStatus === 'delivered') {
          AsyncStorage.removeItem(`order_${response.orderDetails._id}`);
        } else {
          AsyncStorage.setItem(`order_${response.orderDetails._id}`, JSON.stringify({
            ...response.orderDetails,
            status: response.orderDetails.orderStatus
          }));
        }
      } else {
        setIsUpdating(false);
        setPendingUpdate(null);
        Alert.alert('Lỗi', response?.message || 'Cập nhật trạng thái thất bại');
      }
    };

    socket.on('order_status_update_response', handleResponse);

    return () => {
      socket.off('order_status_update_response', handleResponse);
    };
  }, [socket, pendingUpdate]);

  // Lấy order từ cache trước, nếu không có thì fetch từ server
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchOrder = async () => {
      try {
        // Luôn thử lấy từ AsyncStorage trước
        const cachedOrder = await AsyncStorage.getItem(`order_${id}`);
        if (cachedOrder) {
          const parsedOrder = JSON.parse(cachedOrder);
          if (isMounted) {
            setOrder(parsedOrder);
            setLoading(false);
          }
        }

        // Luôn fetch mới để đảm bảo dữ liệu cập nhật
        const response = await fetch(`https://wise-apes-wear.loca.lt/api/getorder/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (!response.ok) throw new Error('Failed to fetch order');
        const data = await response.json();
        
        if (data.EC === "0" && data.DT) {
          // Xử lý dữ liệu nhà hàng
          const restaurantData = data.DT.restaurant || data.DT.items[0]?.food?.restaurant || {};
          const restaurantLocation = restaurantData.address?.location?.coordinates || 
                                    restaurantData.location?.coordinates || 
                                    [0, 0];
          
          const orderData: Order = {
            ...data.DT,
            user: data.DT.user,
            customer: {
              name: data.DT.address?.name || '',
              phone: data.DT.address?.phoneNumber || '',
              address: data.DT.address?.address || ''
            },
            restaurant: {
              _id: restaurantData._id || '',
              name: restaurantData.name || 'Không xác định',
              phone: restaurantData.phone || '',
              location: {
                latitude: restaurantLocation[1] || 0,
                longitude: restaurantLocation[0] || 0
              },
              address: restaurantData.address?.fullAddress || ''
            },
            items: data.DT.items.map((item: any) => ({
              _id: item._id,
              name: item.food?.name || 'Không xác định',
              quantity: item.quantity,
              price: item.price,
              toppings: item.toppings?.map((topping: any) => ({
                ...topping,
                item: topping.item
              })) || []
            })),
            discount: data.DT.discount,
            status: data.DT.orderStatus,
            orderStatus: data.DT.orderStatus,
            paymentMethod: data.DT.paymentMethod,
            paymentStatus: data.DT.paymentStatus,
            totalPrice: data.DT.totalPrice,
            shippingFee: data.DT.shippingFee,
            finalAmount: data.DT.finalAmount,
            createdAt: data.DT.createdAt,
            updatedAt: data.DT.updatedAt,
            note: data.DT.note || '',
            isRated: data.DT.isRated,
            shipper: data.DT.shipper,
            __v: data.DT.__v
          };
          
          await AsyncStorage.setItem(`order_${id}`, JSON.stringify(orderData));
          if (isMounted) setOrder(orderData);
        } else {
          throw new Error(data.EM || 'Failed to fetch order');
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        if (isMounted) setError(error instanceof Error ? error.message : 'Failed to fetch order');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchOrder();
    // Thêm debounce để giới hạn tần suất gọi API
    timeoutId = setTimeout(fetchOrder, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [id, isUpdating]);

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber || !order) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const url = Platform.OS === "android" ? `tel:${phoneNumber}` : Platform.OS === "ios" ? `telprompt:${phoneNumber}` : '';
    
    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (!supported) {
            Alert.alert("Thông báo", "Không thể thực hiện cuộc gọi trên thiết bị này");
          } else {
            return Linking.openURL(url);
          }
        })
        .catch((err) => Alert.alert("Lỗi", "Không thể thực hiện cuộc gọi: " + err));
    } else {
      alert(`Gọi số: ${phoneNumber}`);
    }
  };

  // Sửa ánh xạ trạng thái để đúng logic chuyển tiếp
  const statusWorkflow: OrderStatus[] = [
    "goingToRestaurant",
    "arrivedAtRestaurant",
    "pickedUp",
    "delivering",
    "arrivedAtCustomer",
    "delivered"
  ];

  const handleStatusUpdate = async () => {
    if (!socket || !order || isUpdating) return;

    try {
      const currentStatus = order.orderStatus || order.status;
      const currentIndex = statusWorkflow.indexOf(currentStatus);
      const nextStatus = statusWorkflow[currentIndex + 1];
      
      if (!nextStatus || nextStatus === currentStatus) {
        Alert.alert('Lỗi', 'Không thể chuyển sang trạng thái tiếp theo');
        return;
      }

      setIsUpdating(true);
      setPendingUpdate(order._id);

      socket.emit('order_status_update', {
        orderId: order._id,
        status: nextStatus,
        shipperId: user?.shipperId
      });

      setTimeout(() => {
        if (isUpdating) {
          setIsUpdating(false);
          setPendingUpdate(null);
          Alert.alert('Lỗi', 'Không nhận được phản hồi từ máy chủ');
        }
      }, 10000);
    } catch (error) {
      setIsUpdating(false);
      setPendingUpdate(null);
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể cập nhật trạng thái đơn hàng');
    }
  };

  // Sửa lại nút cập nhật trạng thái để lấy text theo orderStatus
  const getNextStatusButtonText = (): string => {
    if (!order) return "";
    const currentStatus = order.orderStatus || order.status;
    const statusTextMap: Record<OrderStatus, string> = {
      goingToRestaurant: "Đã đến nhà hàng",
      arrivedAtRestaurant: "Đã lấy hàng",
      pickedUp: "Bắt đầu giao hàng",
      delivering: "Đã đến nơi giao",
      arrivedAtCustomer: "Hoàn thành giao hàng",
      delivered: "Đã hoàn thành"
    };
    return statusTextMap[currentStatus];
  };

  if (loading || isUpdating) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>{isUpdating ? "Đang cập nhật trạng thái..." : "Đang tải thông tin đơn hàng..."}</Text>
        </View>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Không tìm thấy đơn hàng"}</Text>
        </View>
      </View>
    );
  }

  const currentStatus = order.orderStatus || order.status;
  const isDelivered = currentStatus === "delivered";
  
  // Ánh xạ trạng thái đơn hàng sang các bước trong timeline
  const ORDER_STATUSES: Record<OrderStatus, number> = {
    goingToRestaurant: 0,
    arrivedAtRestaurant: 1,
    pickedUp: 2,
    delivering: 3,
    arrivedAtCustomer: 4,
    delivered: 5
  };

  // Danh sách các trạng thái theo thứ tự
  const statusList: OrderStatus[] = [
    'goingToRestaurant',
    'arrivedAtRestaurant',
    'pickedUp',
    'delivering',
    'delivered'
  ];

  // Tính tổng tiền topping cho mỗi món
  const calculateToppingPrice = (toppings: any[]) => {
    if (!toppings || toppings.length === 0) return 0;
    
    return toppings.reduce((total, topping) => {
      if (!topping.item || !Array.isArray(topping.item)) return total;
      
      const toppingPrice = topping.item.reduce((sum, item) => {
        return sum + (item.price || 0);
      }, 0);
      
      return total + toppingPrice;
    }, 0);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <Text style={styles.orderId}>#{order._id.slice(-8)}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Trạng thái đơn hàng</Text>
            <View
              style={[
                styles.statusBadge,
                currentStatus === "delivered"
                  ? styles.statusDelivered
                  : styles.statusActive,
              ]}
            >
              <Text style={styles.statusText}>
                {currentStatus === "goingToRestaurant"
                  ? "Đang đến nhà hàng"
                  : currentStatus === "arrivedAtRestaurant"
                    ? "Đã đến nhà hàng"
                    : currentStatus === "pickedUp"
                      ? "Đã lấy hàng"
                      : currentStatus === "delivering"
                        ? "Đang giao hàng"
                        : currentStatus === "arrivedAtCustomer"
                          ? "Đã đến nơi giao"
                          : "Đã giao hàng"}
              </Text>
            </View>
          </View>

          {/* Status Timeline */}
          <View style={styles.timeline}>
            {statusList.map((status, index) => {
              const isActive = ORDER_STATUSES[currentStatus] >= ORDER_STATUSES[status];
              const isLast = index === statusList.length - 1;

              return (
                <View key={status} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, isActive && styles.timelineDotActive]} />
                  {!isLast && <View style={[styles.timelineLine, isActive && styles.timelineLineActive]} />}
                  <Text style={[styles.timelineText, isActive && styles.timelineTextActive]}>
                    {status === "goingToRestaurant"
                      ? "Đang đến nhà hàng"
                      : status === "arrivedAtRestaurant"
                        ? "Tại nhà hàng"
                        : status === "pickedUp"
                          ? "Lấy hàng"
                          : status === "delivering"
                            ? "Đang giao hàng"
                            : "Hoàn thành"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>Mã đơn:</Text>
            <Text style={styles.orderSummaryValue}>#{order._id.slice(-8)}</Text>
          </View>
          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>Thời gian đặt:</Text>
            <Text style={styles.orderSummaryValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>Tổng tiền:</Text>
            <Text style={styles.orderSummaryValue}>{formatCurrency(order.finalAmount)}</Text>
          </View>
          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>Thanh toán:</Text>
            <View style={styles.paymentMethod}>
              <FontAwesome5
                name={order.paymentMethod === "cash" ? "money-bill-wave" : "credit-card"}
                size={16}
                color="#4CAF50"
              />
              <Text style={styles.paymentMethodText}>
                {order.paymentMethod === "cash" ? "Tiền mặt" : "Thẻ tín dụng"}
              </Text>
            </View>
          </View>
          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>Trạng thái thanh toán:</Text>
            <View
              style={[
                styles.paymentStatusBadge,
                order.paymentStatus === "completed" ? styles.paymentCompleted : styles.paymentPending,
              ]}
            >
              <Text style={styles.paymentStatusText}>
                {order.paymentStatus === "completed" ? "Đã thanh toán" : "Chưa thanh toán"}
              </Text>
            </View>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thông tin nhà hàng</Text>
            {order?.restaurant?.location?.latitude && order?.restaurant?.location?.longitude && (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${order.restaurant.location.latitude},${order.restaurant.location.longitude}`;
                  Linking.openURL(url);
                }}
              >
                <MaterialIcons name="directions" size={16} color="#fff" />
                <Text style={styles.locationButtonText}>Chỉ đường</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.restaurantInfo}>
            <View style={styles.restaurantDetails}>
              <Text style={styles.restaurantName}>{order.restaurant?.name || 'Nhà hàng không xác định'}</Text>
              <Text style={styles.restaurantAddress}>
                {order.restaurant?.address || 
                 (order.restaurant?.location ? 
                  `Tọa độ: ${order.restaurant.location.latitude}, ${order.restaurant.location.longitude}` : 
                  'Không có địa chỉ')}
              </Text>
              <TouchableOpacity 
                style={styles.phoneButton} 
                onPress={() => handleCall(order.restaurant?.phone || '')}
              >
                <Ionicons name="call" size={14} color={colors.primary} />
                <Text style={styles.phoneButtonText}>
                  {formatPhoneNumber(order.restaurant?.phone || '')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            {order?.address?.latitude && order?.address?.longitude && (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`;
                  Linking.openURL(url);
                }}
              >
                <MaterialIcons name="directions" size={16} color="#fff" />
                <Text style={styles.locationButtonText}>Chỉ đường</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.customerInfo}>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{order.address?.name || 'Khách hàng không xác định'}</Text>
              <Text style={styles.customerAddress}>{order.address?.address || 'Không có địa chỉ'}</Text>
              <TouchableOpacity 
                style={styles.phoneButton} 
                onPress={() => handleCall(order.address?.phoneNumber || '')}
              >
                <Ionicons name="call" size={14} color={colors.primary} />
                <Text style={styles.phoneButtonText}>
                  {formatPhoneNumber(order.address?.phoneNumber || '')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {order.note && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>Ghi chú:</Text>
              <Text style={styles.noteText}>{order.note}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
          
          {order.items.map((item, index) => {
            const toppingPrice = calculateToppingPrice(item.toppings);
            const totalItemPrice = (item.price * item.quantity) + toppingPrice;
            
            return (
              <View key={item._id || index} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                </View>
                
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPriceLabel}>Đơn giá:</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                </View>
                
                {item.toppings && item.toppings.length > 0 && (
                  <>
                    <Text style={styles.toppingsTitle}>Topping:</Text>
                    {item.toppings.map((topping, toppingIndex) => (
                      <View key={topping._id || toppingIndex}>
                        {topping.item && topping.item.map((toppingItem, itemIndex) => (
                          <View key={toppingItem.id || itemIndex} style={styles.toppingRow}>
                            <Text style={styles.toppingName}>- Topping {itemIndex + 1}</Text>
                            <Text style={styles.toppingPrice}>{formatCurrency(toppingItem.price)}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </>
                )}
                
                <View style={styles.itemTotalRow}>
                  <Text style={styles.itemTotalLabel}>Tổng:</Text>
                  <Text style={styles.itemTotalPrice}>{formatCurrency(totalItemPrice)}</Text>
                </View>
                
                {index < order.items.length - 1 && <View style={styles.itemDivider} />}
              </View>
            );
          })}
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tổng tiền hàng</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.totalPrice)}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.shippingFee)}</Text>
          </View>

          {order.discount && order.discount.amount > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Giảm giá</Text>
              <Text style={styles.discountValue}>-{formatCurrency(order.discount.amount)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.paymentRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.finalAmount)}</Text>
          </View>
        </View>

        {/* Shipper Info */}
        {order.shipper && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin người giao hàng</Text>
            
            <View style={styles.shipperInfoRow}>
              <Text style={styles.shipperInfoLabel}>Tên:</Text>
              <Text style={styles.shipperInfoValue}>{order.shipper.Account?.username || 'Không xác định'}</Text>
            </View>
            
            <View style={styles.shipperInfoRow}>
              <Text style={styles.shipperInfoLabel}>Số điện thoại:</Text>
              <TouchableOpacity onPress={() => handleCall(order.shipper.phone || '')}>
                <Text style={styles.shipperInfoValueLink}>{formatPhoneNumber(order.shipper.phone || '')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.shipperInfoRow}>
              <Text style={styles.shipperInfoLabel}>Phương tiện:</Text>
              <Text style={styles.shipperInfoValue}>
                {order.shipper.transportation === 'bicycle' ? 'Xe đạp' : 
                 order.shipper.transportation === 'motorbike' ? 'Xe máy' : 
                 order.shipper.transportation}
              </Text>
            </View>
            
            <View style={styles.shipperInfoRow}>
              <Text style={styles.shipperInfoLabel}>Trạng thái:</Text>
              <View style={styles.shipperStatusBadge}>
                <Text style={styles.shipperStatusText}>
                  {order.shipper.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {!isDelivered && (
        <Button
          title={getNextStatusButtonText()}
          onPress={handleStatusUpdate}
          style={styles.updateButton}
          disabled={isUpdating}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  orderId: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  statusContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: "#FFF3E0",
  },
  statusDelivered: {
    backgroundColor: "#E8F5E9",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  timelineItem: {
    alignItems: "center",
    position: "relative",
    flex: 1,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    marginBottom: 8,
    zIndex: 1,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    position: "absolute",
    top: 8,
    right: "50%",
    left: "50%",
    height: 2,
    backgroundColor: "#E0E0E0",
    zIndex: 0,
  },
  timelineLineActive: {
    backgroundColor: colors.primary,
  },
  timelineText: {
    fontSize: 10,
    color: "#757575",
    textAlign: "center",
  },
  timelineTextActive: {
    color: "#212529",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Order Summary Styles
  orderSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderSummaryLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  orderSummaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
  },
  // Restaurant Styles
  restaurantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  // Customer Styles
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  noteContainer: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: "#212529",
  },
  // Item Styles
  itemContainer: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6c757d",
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemPriceLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  itemPrice: {
    fontSize: 14,
    color: "#212529",
  },
  toppingsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6c757d",
    marginTop: 4,
    marginBottom: 2,
  },
  toppingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 8,
    marginBottom: 2,
  },
  toppingName: {
    fontSize: 13,
    color: "#6c757d",
  },
  toppingPrice: {
    fontSize: 13,
    color: "#212529",
  },
  itemTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  // Payment Styles
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  paymentValue: {
    fontSize: 14,
    color: "#212529",
  },
  discountValue: {
    fontSize: 14,
    color: "#4CAF50",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 6,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  paymentCompleted: {
    backgroundColor: "#E8F5E9",
  },
  paymentPending: {
    backgroundColor: "#FFF3E0",
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  // Shipper Styles
  shipperInfoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  shipperInfoLabel: {
    fontSize: 14,
    color: "#6c757d",
    width: 120,
  },
  shipperInfoValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "500",
  },
  shipperInfoValueLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  shipperStatusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  shipperStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  updateButton: {
    margin: 16,
  },
});