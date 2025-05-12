import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from "react-native";
import * as ExpoLocation from 'expo-location';
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { socket } from "@/utils/socket";

const HomeScreen = () => {
  const [currentLocation, setCurrentLocation] = useState<ExpoLocation.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

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
          // Gửi vị trí lên server khi có thay đổi
          if (user?.id) {
            socket.emit('current_location', {
              shipperId: user.id,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        }
      );

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    })();
  }, [user?.id]);

  // Xử lý cập nhật trạng thái online
  const handleOnlineStatusChange = async (value: boolean) => {
    if (!user?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    try {
      // Gửi yêu cầu cập nhật trạng thái
      socket.emit('update_online_status', {
        shipperId: user.id,
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
      if (data.shipperId === user?.id) {
        setIsOnline(data.isOnline);
      }
    });

    return () => {
      socket.off('shipper_status_updated');
    };
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trang chủ</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
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