import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Linking,
} from "react-native";
import * as ExpoLocation from 'expo-location';
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { Navigation } from "lucide-react-native";
import { Location } from "@/types";
import { colors } from "@/constants/colors";

interface CustomMapViewProps {
  currentLocation?: Location;
  destinationLocation?: Location;
  showRoute?: boolean;
  height?: number;
  zoomLevel?: number;
  showNavigationButton?: boolean;
}

export const CustomMapView: React.FC<CustomMapViewProps> = ({
  currentLocation,
  destinationLocation,
  showRoute = false,
  height = 300,
  zoomLevel = 15,
  showNavigationButton = true,
}) => {
  const [hasLocationPermission, setHasLocationPermission] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    })();
  }, []);
  const { width } = Dimensions.get("window");

  const getDeltas = (zoom: number) => {
    const latitudeDelta = 0.0922 * Math.pow(2, 10 - zoom);
    const longitudeDelta = latitudeDelta * (width / height);
    return { latitudeDelta, longitudeDelta };
  };

  const { latitudeDelta, longitudeDelta } = getDeltas(zoomLevel);

  const mapProvider = PROVIDER_DEFAULT;

  const openGoogleMapsNavigation = () => {
    if (!currentLocation || !destinationLocation) return;

    const url = Platform.select({
      ios: `https://maps.apple.com/?saddr=${currentLocation.latitude},${currentLocation.longitude}&daddr=${destinationLocation.latitude},${destinationLocation.longitude}&dirflg=d`,
      android: `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destinationLocation.latitude},${destinationLocation.longitude}&travelmode=driving`,
    });

    if (!url) return;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Không thể mở ứng dụng bản đồ");
      }
    });
  };

  return (
    <View style={[styles.container, { height }]}>
      {(currentLocation || hasLocationPermission) ? (
        <>
          <MapView
            style={styles.map}
            
            initialRegion={currentLocation ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta,
              longitudeDelta,
            } : undefined}
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
                coordinate={currentLocation}
                title="Vị trí hiện tại"
                description="Đây là vị trí hiện tại của bạn"
                pinColor={colors.primary}
              />
            )}
            {destinationLocation && (
              <Marker
                coordinate={destinationLocation}
                title="Điểm đến"
                description="Đây là điểm đến của bạn"
                pinColor={colors.secondary}
              />
            )}
          </MapView>

          {showNavigationButton && destinationLocation && (
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={openGoogleMapsNavigation}
            >
              <Navigation size={20} color="white" />
              <Text style={styles.navigationButtonText}>Dẫn đường</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>Đang tải bản đồ...</Text>
          <Text style={styles.fallbackSubtext}>Vui lòng đợi trong giây lát</Text>
        </View>
      )}
    </View>
  );
};

// Tương thích ngược nếu cần giữ tên MapView
export const MapViewWrapper = CustomMapView;

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
  navigationButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navigationButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
  },
});
