import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as ExpoLocation from 'expo-location';
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { Button } from "@/components/Button";
const HomeScreen = () => {
  const [currentLocation, setCurrentLocation] = useState<ExpoLocation.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    (async () => {
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Lấy vị trí hiện tại ngay lập tức
      let location = await ExpoLocation.getCurrentPositionAsync({});
      setCurrentLocation(location);

      // Theo dõi vị trí liên tục
      const locationSubscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation(location);
        }
      );

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang chủ</Text>

      {currentLocation ? (
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>Vị trí hiện tại:</Text>
          <Text style={styles.coordinates}>
            {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
          </Text>
        </View>
      ) : (
        <Text style={styles.errorText}>{errorMsg || 'Đang tải vị trí...'}</Text>
      )}

      <Button
        title="Xem đơn hàng"
        onPress={() => router.push('/orders')}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  locationContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  locationText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 14,
    color: colors.subtext,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
});

export default HomeScreen;