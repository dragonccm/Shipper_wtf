import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { CustomMapView } from "@/components/MapView";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";
import { useOrderStore } from "@/store/orderStore";
import { Location } from "@/types";
import { Navigation, Power } from "lucide-react-native";

export default function MapScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const toggleOnlineStatus = useAuthStore((state) => state.toggleOnlineStatus);
  const updateUserLocation = useAuthStore((state) => state.updateUserLocation);
  const activeOrders = useOrderStore((state) => state.activeOrders);
  
  const [currentLocation, setCurrentLocation] = useState<Location | undefined>(
    user?.currentLocation
  );
  
  // Simulate location updates
  useEffect(() => {
    if (!user?.isOnline) return;
    
    const interval = setInterval(() => {
      if (currentLocation) {
        const newLocation: Location = {
          latitude: currentLocation.latitude + (Math.random() * 0.001 - 0.0005),
          longitude: currentLocation.longitude + (Math.random() * 0.001 - 0.0005),
        };
        
        setCurrentLocation(newLocation);
        updateUserLocation(newLocation);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentLocation, user?.isOnline]);
  
  const handleToggleOnlineStatus = () => {
    toggleOnlineStatus();
  };
  
  const handleViewActiveOrder = () => {
    if (activeOrders.length > 0) {
      router.push(`/order/${activeOrders[0].id}`);
    }
  };
  
  return (
    <View style={styles.container}>
      <CustomMapView 
        currentLocation={currentLocation}
        destinationLocation={
          activeOrders.length > 0 
            ? (activeOrders[0].status === "goingToRestaurant" || 
               activeOrders[0].status === "arrivedAtRestaurant" || 
               activeOrders[0].status === "pickedUp")
              ? activeOrders[0].restaurant.location
              : activeOrders[0].customerLocation
            : undefined
        }
        showNavigationButton={activeOrders.length > 0}
        height={500}
      />
      
      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Status</Text>
          <TouchableOpacity 
            style={[
              styles.statusToggle, 
              user?.isOnline ? styles.statusOnline : styles.statusOffline
            ]}
            onPress={handleToggleOnlineStatus}
          >
            <Power size={16} color="white" />
            <Text style={styles.statusToggleText}>
              {user?.isOnline ? "Online" : "Offline"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusInfo}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Current Location</Text>
            <Text style={styles.statusValue}>
              {currentLocation 
                ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                : "Unknown"}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Active Orders</Text>
            <Text style={styles.statusValue}>{activeOrders.length}</Text>
          </View>
        </View>
        
        {activeOrders.length > 0 && (
          <View style={styles.activeOrderContainer}>
            <View style={styles.activeOrderHeader}>
              <Text style={styles.activeOrderTitle}>Current Delivery</Text>
              <Text style={styles.activeOrderNumber}>
                {activeOrders[0].orderNumber}
              </Text>
            </View>
            
            <View style={styles.activeOrderDetails}>
              <Text style={styles.activeOrderLabel}>
                {activeOrders[0].status === "goingToRestaurant" || 
                 activeOrders[0].status === "arrivedAtRestaurant"
                  ? "Restaurant"
                  : "Customer"}
              </Text>
              <Text style={styles.activeOrderValue}>
                {activeOrders[0].status === "goingToRestaurant" || 
                 activeOrders[0].status === "arrivedAtRestaurant"
                  ? activeOrders[0].restaurant.name
                  : activeOrders[0].customer.name}
              </Text>
              <Text style={styles.activeOrderAddress}>
                {activeOrders[0].status === "goingToRestaurant" || 
                 activeOrders[0].status === "arrivedAtRestaurant"
                  ? activeOrders[0].restaurant.location.address
                  : activeOrders[0].customerLocation.address}
              </Text>
            </View>
            
            <Button
              title="View Order Details"
              onPress={handleViewActiveOrder}
              fullWidth
              variant="primary"
              style={styles.viewOrderButton}
              leftIcon={<Navigation size={18} color="white" />}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusContainer: {
    flex: 1,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusOnline: {
    backgroundColor: colors.success,
  },
  statusOffline: {
    backgroundColor: colors.subtext,
  },
  statusToggleText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
  },
  statusInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  activeOrderContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activeOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  activeOrderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  activeOrderNumber: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  activeOrderDetails: {
    marginBottom: 16,
  },
  activeOrderLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  activeOrderValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  activeOrderAddress: {
    fontSize: 14,
    color: colors.subtext,
  },
  viewOrderButton: {
    marginTop: 8,
  },
});