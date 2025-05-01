import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { OrderStatus } from "@/types";
import { colors } from "@/constants/colors";

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
}

const statuses: OrderStatus[] = [
  "goingToRestaurant",
  "arrivedAtRestaurant",
  "pickedUp",
  "delivering",
  "arrivedAtCustomer",
  "delivered"
];

const statusLabels: Record<OrderStatus, string> = {
  goingToRestaurant: "Going to Restaurant",
  arrivedAtRestaurant: "At Restaurant",
  pickedUp: "Picked Up",
  delivering: "Delivering",
  arrivedAtCustomer: "Arrived",
  delivered: "Delivered"
};

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ 
  currentStatus 
}) => {
  const currentIndex = statuses.indexOf(currentStatus);
  
  return (
    <View style={styles.container}>
      {statuses.map((status, index) => {
        const isActive = index <= currentIndex;
        const isLast = index === statuses.length - 1;
        
        return (
          <View key={status} style={styles.stepContainer}>
            <View style={styles.stepRow}>
              <View style={[
                styles.circle,
                isActive ? styles.activeCircle : styles.inactiveCircle
              ]}>
                {isActive && <View style={styles.innerCircle} />}
              </View>
              
              {!isLast && (
                <View style={[
                  styles.line,
                  index < currentIndex ? styles.activeLine : styles.inactiveLine
                ]} />
              )}
            </View>
            
            <Text style={[
              styles.label,
              isActive ? styles.activeLabel : styles.inactiveLabel
            ]}>
              {statusLabels[status]}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  activeCircle: {
    borderColor: colors.primary,
  },
  inactiveCircle: {
    borderColor: colors.border,
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  line: {
    flex: 1,
    height: 2,
    marginLeft: 8,
  },
  activeLine: {
    backgroundColor: colors.primary,
  },
  inactiveLine: {
    backgroundColor: colors.border,
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  activeLabel: {
    color: colors.text,
  },
  inactiveLabel: {
    color: colors.subtext,
  },
});