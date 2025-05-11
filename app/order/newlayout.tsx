"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Alert, Image } from "react-native"
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import * as Location from "expo-location"

// Mock restaurant data since it's not in the provided JSON
const RESTAURANT_PHONE = "0123456789" // Replace with actual restaurant phone from your API
const RESTAURANT_NAME = "Nhà hàng Việt Cuisine" // Replace with actual restaurant name
const RESTAURANT_ADDRESS = "123 Đường Lê Lợi, Quận 1, TP.HCM" // Replace with actual address

// Order status steps
const ORDER_STATUSES = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  picked_up: 4,
  delivering: 5,
  delivered: 6,
  cancelled: 7,
}

export default function OrderDetailScreen({ route }) {
  // In a real app, you would get this from route.params or API
  // For this example, I'll use the provided JSON data
  const orderData = {
    EC: "0",
    DT: {
      discount: {
        voucherId: "681c9b3b9a23041dbc3027fb",
        amount: 5000,
      },
      _id: "681efd2e50ac2b9eea6f13de",
      user: {
        _id: "6814a71243a532607e592b08",
        phone: "0944034769",
        username: "Hưng Thịnh",
      },
      items: [
        {
          food: "67e9245d7959b1f43adf7cd5",
          quantity: 2,
          price: 50000,
          toppings: [
            {
              topping: "681639d05a56620ec0753f7a",
              item: [
                {
                  id: "67f2568e6b37cd0a94655e07",
                  price: 2200,
                  _id: "681efd2e50ac2b9eea6f13e1",
                },
              ],
              _id: "681efd2e50ac2b9eea6f13e0",
            },
          ],
          _id: "681efd2e50ac2b9eea6f13df",
        },
        {
          food: "67ded2611dfb8dafb9200be4",
          quantity: 1,
          price: 50000,
          toppings: [
            {
              topping: "6819d35fd9108757680e6e88",
              item: [
                {
                  id: "67f2568e6b37cd0a94655e07",
                  price: 2200,
                  _id: "681efd2e50ac2b9eea6f13e4",
                },
                {
                  id: "67f931be611cc9ec963e6933",
                  price: 2000,
                  _id: "681efd2e50ac2b9eea6f13e5",
                },
                {
                  id: "67f93203611cc9ec963e693e",
                  price: 1000,
                  _id: "681efd2e50ac2b9eea6f13e6",
                },
              ],
              _id: "681efd2e50ac2b9eea6f13e3",
            },
            {
              topping: "6819d35fd9108757680e6e89",
              item: [
                {
                  id: "67f265978eb487399d88560b",
                  price: 10000,
                  _id: "681efd2e50ac2b9eea6f13e8",
                },
              ],
              _id: "681efd2e50ac2b9eea6f13e7",
            },
          ],
          _id: "681efd2e50ac2b9eea6f13e2",
        },
        {
          food: "67eba7ffed2cdc702b33a907",
          quantity: 1,
          price: 20000,
          toppings: [
            {
              topping: "6819d4b9d9108757680e6f49",
              item: [
                {
                  id: "67f93203611cc9ec963e693e",
                  price: 1000,
                  _id: "681efd2e50ac2b9eea6f13eb",
                },
                {
                  id: "67f931be611cc9ec963e6933",
                  price: 2000,
                  _id: "681efd2e50ac2b9eea6f13ec",
                },
              ],
              _id: "681efd2e50ac2b9eea6f13ea",
            },
          ],
          _id: "681efd2e50ac2b9eea6f13e9",
        },
      ],
      totalPrice: 199600,
      shippingFee: 12000,
      finalAmount: 199600,
      paymentMethod: "cash",
      paymentStatus: "pending",
      orderStatus: "delivering",
      createdAt: "2025-05-10T07:15:58.746Z",
      updatedAt: "2025-05-10T07:15:58.746Z",
      note: "nhớ mua thêm trứng",
      isRated: false,
      __v: 0,
      shipper: "65f7b1a4e01c6f2d542a7777",
    },
  }

  const order = orderData.DT
  const [currentLocation, setCurrentLocation] = useState(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission denied", "Permission to access location was denied")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setCurrentLocation(location)
    })()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ"
  }

  const makePhoneCall = (phoneNumber) => {
    const url = Platform.OS === "android" ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Thông báo", "Không thể thực hiện cuộc gọi trên thiết bị này")
        } else {
          return Linking.openURL(url)
        }
      })
      .catch((err) => Alert.alert("Lỗi", "Không thể thực hiện cuộc gọi: " + err))
  }

  const openMapsWithDirections = (destination, isRestaurant) => {
    if (!currentLocation) {
      Alert.alert("Thông báo", "Đang lấy vị trí hiện tại của bạn. Vui lòng thử lại sau.")
      return
    }

    const { latitude, longitude } = currentLocation.coords
    const label = isRestaurant ? RESTAURANT_NAME : `Khách hàng: ${order.user.username}`

    // For demo purposes, using mock coordinates
    const destLat = isRestaurant ? 10.7769 : 10.8231 // Replace with actual coordinates
    const destLng = isRestaurant ? 106.7009 : 106.6297 // Replace with actual coordinates

    const scheme = Platform.select({ ios: "maps:0,0?q=", android: "geo:0,0?q=" })
    const latLng = `${destLat},${destLng}`
    const url = Platform.select({
      ios: `maps://app?saddr=${latitude},${longitude}&daddr=${latLng}`,
      android: `google.navigation:q=${latLng}&mode=d`,
    })

    Linking.openURL(url).catch((err) => Alert.alert("Lỗi", "Không thể mở ứng dụng bản đồ: " + err))
  }

  // Determine which location to show based on order status
  const showRestaurantLocation = ["pending", "confirmed", "preparing", "ready"].includes(order.orderStatus)
  const showCustomerLocation = ["picked_up", "delivering"].includes(order.orderStatus)

  // Get food names (in a real app, you would fetch these from your API)
  const getFoodName = (foodId) => {
    const foodNames = {
      "67e9245d7959b1f43adf7cd5": "Cơm Sườn Nướng",
      "67ded2611dfb8dafb9200be4": "Phở Bò Tái",
      "67eba7ffed2cdc702b33a907": "Trà Sữa Trân Châu",
    }
    return foodNames[foodId] || "Món ăn"
  }

  // Get topping names (in a real app, you would fetch these from your API)
  const getToppingName = (toppingId) => {
    const toppingNames = {
      "681639d05a56620ec0753f7a": "Nước sốt",
      "6819d35fd9108757680e6e88": "Gia vị",
      "6819d35fd9108757680e6e89": "Thêm thịt",
      "6819d4b9d9108757680e6f49": "Topping",
    }
    return toppingNames[toppingId] || "Topping"
  }

  // Get topping item names (in a real app, you would fetch these from your API)
  const getToppingItemName = (itemId) => {
    const itemNames = {
      "67f2568e6b37cd0a94655e07": "Tương ớt",
      "67f931be611cc9ec963e6933": "Hành phi",
      "67f93203611cc9ec963e693e": "Rau thơm",
      "67f265978eb487399d88560b": "Thịt bò",
    }
    return itemNames[itemId] || "Item"
  }

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
                order.orderStatus === "delivered"
                  ? styles.statusDelivered
                  : order.orderStatus === "cancelled"
                    ? styles.statusCancelled
                    : styles.statusActive,
              ]}
            >
              <Text style={styles.statusText}>
                {order.orderStatus === "pending"
                  ? "Chờ xác nhận"
                  : order.orderStatus === "confirmed"
                    ? "Đã xác nhận"
                    : order.orderStatus === "preparing"
                      ? "Đang chuẩn bị"
                      : order.orderStatus === "ready"
                        ? "Sẵn sàng giao"
                        : order.orderStatus === "picked_up"
                          ? "Đã lấy hàng"
                          : order.orderStatus === "delivering"
                            ? "Đang giao hàng"
                            : order.orderStatus === "delivered"
                              ? "Đã giao hàng"
                              : "Đã hủy"}
              </Text>
            </View>
          </View>

          {/* Status Timeline */}
          <View style={styles.timeline}>
            {["pending", "confirmed", "preparing", "delivering", "delivered"].map((status, index) => {
              const isActive = ORDER_STATUSES[order.orderStatus] >= ORDER_STATUSES[status]
              const isLast = index === 4

              return (
                <View key={status} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, isActive ? styles.activeDot : {}]} />
                  {!isLast && <View style={[styles.timelineLine, isActive ? styles.activeLine : {}]} />}
                  <Text style={[styles.timelineText, isActive ? styles.activeTimelineText : {}]}>
                    {status === "pending"
                      ? "Đặt hàng"
                      : status === "confirmed"
                        ? "Xác nhận"
                        : status === "preparing"
                          ? "Chuẩn bị"
                          : status === "delivering"
                            ? "Giao hàng"
                            : "Hoàn thành"}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thông tin nhà hàng</Text>
            {showRestaurantLocation && (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => openMapsWithDirections(RESTAURANT_ADDRESS, true)}
              >
                <MaterialIcons name="directions" size={16} color="#fff" />
                <Text style={styles.locationButtonText}>Chỉ đường</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.restaurantInfo}>
            <View style={styles.restaurantImageContainer}>
              <Image source={{ uri: "https://via.placeholder.com/60" }} style={styles.restaurantImage} />
            </View>
            <View style={styles.restaurantDetails}>
              <Text style={styles.restaurantName}>{RESTAURANT_NAME}</Text>
              <Text style={styles.restaurantAddress}>{RESTAURANT_ADDRESS}</Text>
              <TouchableOpacity style={styles.phoneButton} onPress={() => makePhoneCall(RESTAURANT_PHONE)}>
                <Ionicons name="call" size={14} color="#FF5722" />
                <Text style={styles.phoneButtonText}>{RESTAURANT_PHONE}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            {showCustomerLocation && (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => openMapsWithDirections("Customer Address", false)}
              >
                <MaterialIcons name="directions" size={16} color="#fff" />
                <Text style={styles.locationButtonText}>Chỉ đường</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.customerInfo}>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{order.user.username}</Text>
              <TouchableOpacity style={styles.phoneButton} onPress={() => makePhoneCall(order.user.phone)}>
                <Ionicons name="call" size={14} color="#FF5722" />
                <Text style={styles.phoneButtonText}>{order.user.phone}</Text>
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
          <Text style={styles.sectionTitle}>Món ăn đã đặt</Text>

          {order.items.map((item, index) => (
            <View key={item._id} style={styles.orderItem}>
              <View style={styles.orderItemHeader}>
                <View style={styles.orderItemQuantity}>
                  <Text style={styles.quantityText}>{item.quantity}x</Text>
                </View>
                <View style={styles.orderItemDetails}>
                  <Text style={styles.orderItemName}>{getFoodName(item.food)}</Text>
                  <Text style={styles.orderItemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
                </View>
              </View>

              {item.toppings.length > 0 && (
                <View style={styles.toppingsContainer}>
                  {item.toppings.map((topping) => (
                    <View key={topping._id} style={styles.toppingGroup}>
                      <Text style={styles.toppingGroupName}>{getToppingName(topping.topping)}:</Text>
                      {topping.item.map((toppingItem) => (
                        <View key={toppingItem._id} style={styles.toppingItem}>
                          <Text style={styles.toppingItemName}>- {getToppingItemName(toppingItem.id)}</Text>
                          <Text style={styles.toppingItemPrice}>{formatCurrency(toppingItem.price)}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {index < order.items.length - 1 && <View style={styles.itemDivider} />}
            </View>
          ))}
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tổng tiền hàng</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.totalPrice - order.shippingFee)}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
            <Text style={styles.paymentValue}>{formatCurrency(order.shippingFee)}</Text>
          </View>

          {order.discount && (
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

          <View style={styles.paymentMethodContainer}>
            <Text style={styles.paymentMethodLabel}>Phương thức thanh toán:</Text>
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

          <View style={styles.paymentStatusContainer}>
            <Text style={styles.paymentStatusLabel}>Trạng thái thanh toán:</Text>
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

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>

          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Mã đơn hàng:</Text>
            <Text style={styles.orderInfoValue}>#{order._id.slice(-8)}</Text>
          </View>

          <View style={styles.orderInfoRow}>
            <Text style={styles.orderInfoLabel}>Thời gian đặt:</Text>
            <Text style={styles.orderInfoValue}>{formatDate(order.createdAt)}</Text>
          </View>

          {order.shipper && (
            <View style={styles.orderInfoRow}>
              <Text style={styles.orderInfoLabel}>Người giao hàng:</Text>
              <Text style={styles.orderInfoValue}>#{order.shipper.slice(-8)}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#FF5722",
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
  statusCancelled: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF5722",
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
  activeDot: {
    backgroundColor: "#FF5722",
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
  activeLine: {
    backgroundColor: "#FF5722",
  },
  timelineText: {
    fontSize: 10,
    color: "#757575",
    textAlign: "center",
  },
  activeTimelineText: {
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
    backgroundColor: "#FF5722",
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
  restaurantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  restaurantImageContainer: {
    marginRight: 12,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
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
    color: "#FF5722",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
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
    color: "#FF5722",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: "#212529",
  },
  orderItem: {
    marginBottom: 12,
  },
  orderItemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  orderItemQuantity: {
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212529",
  },
  orderItemDetails: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
  },
  toppingsContainer: {
    marginLeft: 42,
    marginTop: 8,
  },
  toppingGroup: {
    marginBottom: 8,
  },
  toppingGroupName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c757d",
    marginBottom: 4,
  },
  toppingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 8,
    marginBottom: 2,
  },
  toppingItemName: {
    fontSize: 13,
    color: "#6c757d",
  },
  toppingItemPrice: {
    fontSize: 13,
    color: "#6c757d",
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
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
    color: "#FF5722",
  },
  paymentMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 8,
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
  paymentStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  paymentStatusLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginRight: 8,
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
  orderInfoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: "#6c757d",
    width: 120,
  },
  orderInfoValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "500",
  },
})
