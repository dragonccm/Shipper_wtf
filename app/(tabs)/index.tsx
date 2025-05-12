import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Switch, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '@/constants/colors';
import { MapPin, Navigation, Power, Clock } from 'lucide-react-native';
import { socket } from '@/utils/socket';
import { useAuthStore } from '@/store/authStore';

export default function HomeScreen() {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workTime, setWorkTime] = useState(0);
  const mapRef = useRef<MapView>(null);
  const { user } = useAuthStore();
  const workTimerRef = useRef<NodeJS.Timeout>();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);

      // Start watching position
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setCurrentLocation(newLocation);
          // Emit location update to server
          if (user?._id) {
            socket.emit('current_location', {
              shipperId: user._id,
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
          }
        }
      );
    })();

    return () => {
      if (workTimerRef.current) {
        clearInterval(workTimerRef.current);
      }
    };
  }, [user?._id]);

  const handleCenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const toggleWorkStatus = () => {
    setIsWorking(!isWorking);
    if (!isWorking) {
      // Start work timer
      workTimerRef.current = setInterval(() => {
        setWorkTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop work timer
      if (workTimerRef.current) {
        clearInterval(workTimerRef.current);
      }
      setWorkTime(0);
    }
  };

  const formatWorkTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Xử lý cập nhật trạng thái online
  const handleOnlineStatusChange = async (value: boolean) => {
    if (!user?.shipperId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    try {
      // Gửi yêu cầu cập nhật trạng thái
      socket.emit('update_online_status', {
        shipperId: user.shipperId,
        isOnline: value
      });

      // Lắng nghe phản hồi
      socket.once('online_status_response', (response) => {
        if (response.success) {
          setIsOnline(value);
          Alert.alert(
            'Thành công',
            value ? 'Bạn đã bắt đầu nhận đơn hàng' : 'Bạn đã tạm dừng nhận đơn hàng'
          );
        } else {
          Alert.alert('Lỗi', response.message || 'Không thể cập nhật trạng thái');
        }
      });
    } catch (error) {
      console.error('Error updating online status:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái online');
    }
  };

  // Lắng nghe sự kiện cập nhật trạng thái từ server
  useEffect(() => {
    socket.on('shipper_status_updated', (data) => {
      if (data.shipperId === user?.shipperId) {
        setIsOnline(data.isOnline);
      }
    });

    return () => {
      socket.off('shipper_status_updated');
    };
  }, [user?.shipperId]);

  if (!currentLocation) {
    return (
      <View style={styles.container}>
        <Text>Loading location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trang chủ</Text>
        <View style={styles.onlineStatusContainer}>
          <Text style={styles.onlineStatusText}>
            {isOnline ? 'Đang hoạt động' : 'Tạm dừng'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={handleOnlineStatusChange}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isOnline ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={{
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          }}
        >
          <View style={styles.markerContainer}>
            <MapPin size={24} color={colors.primary} />
          </View>
        </Marker>
      </MapView>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsWrapper}>
          <TouchableOpacity style={styles.controlButton} onPress={handleCenterMap}>
            <Navigation size={24} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, isWorking ? styles.workingButton : styles.notWorkingButton]} 
            onPress={toggleWorkStatus}
          >
            <Power size={24} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.workTimeContainer}>
            <Clock size={20} color={colors.white} />
            <Text style={styles.workTimeText}>{formatWorkTime(workTime)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 20,
  },
  onlineStatusText: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  workingButton: {
    backgroundColor: colors.success,
  },
  notWorkingButton: {
    backgroundColor: colors.danger,
  },
  workTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  workTimeText: {
    color: colors.white,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  markerContainer: {
    backgroundColor: colors.white,
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});