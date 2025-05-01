import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  Image,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Order } from "@/types";
import { colors } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatters";
import * as Haptics from "expo-haptics";

interface NewOrderPopupProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onDecline: (orderId: string) => void;
}

const { width } = Dimensions.get("window");

export const NewOrderPopup: React.FC<NewOrderPopupProps> = ({ 
  order, 
  onAccept, 
  onDecline 
}) => {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [timeLeft, setTimeLeft] = useState(30);
  
  useEffect(() => {
    // Play haptic feedback when a new order appears
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
    
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleAccept = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      onAccept(order.id);
      router.push(`/order/${order.id}`);
    });
  };
  
  const handleDecline = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      onDecline(order.id);
    });
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>New Order!</Text>
        <View style={styles.countdownContainer}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.countdownText}>{timeLeft}s</Text>
        </View>
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
      
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Items</Text>
          <Text style={styles.detailValue}>
            {order.items.reduce((sum, item) => sum + item.quantity, 0)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>3.2 km</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Earnings</Text>
          <Text style={styles.detailValue}>{formatCurrency(30000)}</Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${(timeLeft / 30) * 100}%` }
          ]} 
        />
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.declineButton]} 
          onPress={handleDecline}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.acceptButton]} 
          onPress={handleAccept}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    width: width,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  countdownContainer: {
    alignItems: "flex-end",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warning,
    marginTop: 4,
  },
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  restaurantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  address: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.warning,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButton: {
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});