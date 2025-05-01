import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { Location } from "@/types";
import { colors } from "@/constants/colors";
import MapView from "react-native-maps";
import { Marker, PROVIDER_OSMDROID, PROVIDER_DEFAULT } from "react-native-maps";

interface CustomMapViewProps {
  currentLocation?: Location;
  destinationLocation?: Location;
  showRoute?: boolean;
  height?: number;
  zoomLevel?: number;
}

// Export với tên CustomMapView để sử dụng trong các file mới
export const CustomMapView: React.FC<CustomMapViewProps> = ({
 
  currentLocation,
  destinationLocation,
  showRoute = false,
  height = 300,
  zoomLevel = 15
}) => {
  // Tính toán delta dựa trên mức zoom
  const getDeltas = (zoom: number) => {
    const latitudeDelta = 0.0922 * (Math.pow(2, 10 - zoom));
    const longitudeDelta = latitudeDelta * (width / height);
    return { latitudeDelta, longitudeDelta };
  };

  const { latitudeDelta, longitudeDelta } = getDeltas(zoomLevel);
  
  // Xác định provider dựa trên nền tảng
  const mapProvider = Platform.select({
    android: PROVIDER_OSMDROID,
    ios: PROVIDER_DEFAULT, // iOS sẽ sử dụng Apple Maps mặc định
    default: PROVIDER_DEFAULT,
  });

  return (
    <View style={[styles.container, { height }]}>
      {currentLocation ? (
        <MapView
          style={styles.map}
          provider={mapProvider}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta,
            longitudeDelta,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          rotateEnabled={true}
          zoomEnabled={true}
          scrollEnabled={true}
        >
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Vị trí hiện tại"
              description="Đây là vị trí hiện tại của bạn"
              pinColor={colors.primary}
            />
          )}
          
          {destinationLocation && (
            <Marker
              coordinate={{
                latitude: destinationLocation.latitude,
                longitude: destinationLocation.longitude,
              }}
              title="Điểm đến"
              description="Đây là điểm đến của bạn"
              pinColor={colors.secondary}
            />
          )}
          
          {showRoute && currentLocation && destinationLocation && (
            // Trong tương lai có thể thêm Polyline để vẽ đường đi
            <></>  
          )}
        </MapView>
      ) : (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>Đang tải bản đồ...</Text>
          <Text style={styles.fallbackSubtext}>Vui lòng đợi trong giây lát</Text>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get("window");

// Export với tên MapView để tương thích ngược với các file cũ
export const MapView = CustomMapView;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  fallbackSubtext: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 4,
  },
});