import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { OrderStatus } from "@/types";
import { colors } from "@/constants/colors";

const statusLabels: Record<OrderStatus, string> = {
  goingToRestaurant: "Going to Restaurant",
  arrivedAtRestaurant: "At Restaurant",
  pickedUp: "Picked Up",
  delivering: "Delivering",
  arrivedAtCustomer: "Arrived",
  delivered: "Delivered"
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "small" | "medium" | "large";
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  size = "medium" 
}) => {
  const badgeColor = colors.statusColors[status];
  
  return (
    <View style={[
      styles.badge, 
      { backgroundColor: badgeColor + "20" },
      size === "small" && styles.badgeSmall,
      size === "large" && styles.badgeLarge
    ]}>
      <Text style={[
        styles.text, 
        { color: badgeColor },
        size === "small" && styles.textSmall,
        size === "large" && styles.textLarge
      ]}>
        {statusLabels[status]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  textSmall: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
  }
});