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
import { useLocalSearchParams } from "expo-router";
import { 
  Phone, 
  MapPin, 
  Clock, 
  ChevronRight, 
  MessageCircle,
  Navigation
} from "lucide-react-native";
import { colors } from "@/constants/colors";
// Đã loại bỏ: import { useOrderStore } from "@/store/orderStore";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { CustomMapView } from "@/components/MapView";
import { Button } from "@/components/Button";
import { NavigationBar } from "@/components/NavigationBar";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/utils/formatters";
import { OrderStatus } from "@/types";
import * as Haptics from "expo-haptics";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Đã loại bỏ: const { orders, updateOrderStatus } = useOrderStore();
  // Dữ liệu mẫu thay thế cho orders
  const sampleOrders = [
    {
      id: "1001",
      orderNumber: "#1001",
      createdAt: new Date(),
      status: "goingToRestaurant",
      restaurant: {
        name: "Pizza Hut",
        photoUrl: "https://via.placeholder.com/60",
        location: { address: "123 Delivery St, District 1" }
      },
      customer: {
        name: "John Smith",
        phone: "+84 123 456 789",
        photoUrl: "https://via.placeholder.com/60"
      },
      customerLocation: { address: "123 Delivery St, District 1" },
      items: [{ quantity: 2 }, { quantity: 1 }],
      totalAmount: 245000
    }
  ];
  const [order, setOrder] = useState(sampleOrders.find(o => o.id === id));
  useEffect(() => {
    setOrder(sampleOrders.find(o => o.id === id));
  }, [id]);

  // Đã loại bỏ updateOrderStatus, thay thế bằng hàm giả lập
  const updateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrder((prev) => prev ? { ...prev, status: nextStatus } : prev);
  };

  const handleCall = () => {
    if (!order) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const phoneNumber = order.customer.phone;
    if (Platform.OS === "android") {
      Linking.openURL(`tel:${phoneNumber}`);
    } else if (Platform.OS === "ios") {
      Linking.openURL(`telprompt:${phoneNumber}`);
    } else {
      alert(`Call customer at: ${phoneNumber}`);
    }
  };

  const handleUpdateStatus = () => {
    if (!order) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const statusMap: Record<OrderStatus, OrderStatus> = {
      goingToRestaurant: "arrivedAtRestaurant",
      arrivedAtRestaurant: "pickedUp",
      pickedUp: "delivering",
      delivering: "arrivedAtCustomer",
      arrivedAtCustomer: "delivered",
      delivered: "delivered"
    };
    const nextStatus = statusMap[order.status];
    if (nextStatus === "delivered") {
      Alert.alert(
        "Complete Delivery",
        "Are you sure you want to mark this order as delivered?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: () => updateOrderStatus(order.id, nextStatus) }
        ]
      );
    } else {
      updateOrderStatus(order.id, nextStatus);
    }
  };

  const getNextStatusButtonText = (): string => {
    if (!order) return "";
    const statusTextMap: Record<OrderStatus, string> = {
      goingToRestaurant: "Arrived at Restaurant",
      arrivedAtRestaurant: "Picked Up Order",
      pickedUp: "Start Delivery",
      delivering: "Arrived at Customer",
      arrivedAtCustomer: "Complete Delivery",
      delivered: "Completed"
    };
    return statusTextMap[order.status];
  };

  if (!order) {
    return (
      <View style={styles.notFoundContainer}>
        <NavigationBar title="Order Details" showBackButton />
        <Text style={styles.notFoundText}>Order not found</Text>
      </View>
    );
  }
  const isDelivered = order.status === "delivered";
  return (
    <View style={styles.mainContainer}>
      <NavigationBar 
        title={`Order ${order.orderNumber}`} 
        showBackButton 
        rightComponent={<OrderStatusBadge status={order.status} size="small" />}
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          <OrderStatusBadge status={order.status} size="large" />
        </View>
        <CustomMapView 
          currentLocation={order.status === "goingToRestaurant" || order.status === "arrivedAtRestaurant" 
            ? undefined 
            : order.restaurant.location}
          destinationLocation={order.status === "goingToRestaurant" || order.status === "arrivedAtRestaurant" 
            ? order.restaurant.location 
            : order.customerLocation}
          showNavigationButton={!isDelivered}
          height={200}
        />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <OrderStatusStepper currentStatus={order.status} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <View style={styles.locationCard}>
            <Image 
              source={{ uri: order.restaurant.photoUrl }} 
              style={styles.locationImage} 
            />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{order.restaurant.name}</Text>
              <View style={styles.locationAddressRow}>
                <MapPin size={16} color={colors.subtext} />
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {order.restaurant.location.address}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerCard}>
            <Image 
              source={{ uri: order.customer.photoUrl }} 
              style={styles.customerImage} 
            />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customer.name}</Text>
              <TouchableOpacity 
                style={styles.customerPhoneRow}
                onPress={handleCall}
              >
                <Phone size={16} color={colors.primary} />
                <Text style={styles.customerPhone}>
                  {formatPhoneNumber(order.customer.phone)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* ... giữ nguyên các phần còn lại ... */}
      </ScrollView>
      {!isDelivered && (
        <Button 
          title={getNextStatusButtonText()} 
          onPress={handleUpdateStatus}
          style={styles.updateStatusButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  notFoundText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  orderDate: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  locationImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  addressIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.primary + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  locationLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  locationAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationAddress: {
    fontSize: 14,
    color: colors.subtext,
    marginLeft: 4,
    flex: 1,
  },
  customerCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  customerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  customerInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  customerPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerPhone: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  customerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  itemCountBadge: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastOrderItem: {
    borderBottomWidth: 0,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.subtext,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  notesContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  deliveryInfoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  deliveryInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryInfoContent: {
    marginLeft: 12,
  },
  deliveryInfoLabel: {
    fontSize: 14,
    color: colors.subtext,
  },
  deliveryInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  updateButton: {
    marginBottom: 16,
  },
});