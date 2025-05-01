import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Order } from "@/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { colors } from "@/constants/colors";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface OrderCardProps {
  order: Order;
  compact?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, compact = false }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/order/${order.id}`);
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: order.restaurant.photoUrl }} 
          style={styles.compactImage} 
        />
        <View style={styles.compactContent}>
          <Text style={styles.compactOrderNumber}>{order.orderNumber}</Text>
          <Text style={styles.compactRestaurantName}>{order.restaurant.name}</Text>
          <OrderStatusBadge status={order.status} size="small" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>
      
      <View style={styles.restaurantRow}>
        <Image 
          source={{ uri: order.restaurant.photoUrl }} 
          style={styles.restaurantImage} 
        />
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
          <Text style={styles.address} numberOfLines={1}>
            {order.restaurant.location.address}
          </Text>
        </View>
      </View>
      
      <View style={styles.customerRow}>
        <Image 
          source={{ uri: order.customer.photoUrl }} 
          style={styles.customerImage} 
        />
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.customer.name}</Text>
          <Text style={styles.address} numberOfLines={1}>
            {order.customerLocation.address}
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.itemCount}>
          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
        </Text>
        <Text style={styles.totalAmount}>
          {formatCurrency(order.totalAmount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  restaurantImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  restaurantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  customerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  customerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  address: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemCount: {
    fontSize: 14,
    color: colors.subtext,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  compactImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  compactContent: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "space-between",
  },
  compactOrderNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  compactRestaurantName: {
    fontSize: 14,
    color: colors.text,
    marginVertical: 4,
  },
});