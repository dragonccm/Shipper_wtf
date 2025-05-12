import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Modal, Animated, Dimensions } from "react-native";
import * as ExpoLocation from 'expo-location';
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { socket } from "@/utils/socket";
import { CheckCircle2, XCircle, Package, Truck } from "lucide-react-native";

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [currentLocation, setCurrentLocation] = useState<ExpoLocation.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [modalScale] = useState(new Animated.Value(0));
  const [modalOpacity] = useState(new Animated.Value(0));
  const [modalTranslateY] = useState(new Animated.Value(50));
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
          if (user?.shipperId) {
            socket.emit('current_location', {
              shipperId: user.shipperId,
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
  }, [user?.shipperId]);

  const showStatusChangeModal = (message: string) => {
    setStatusMessage(message);
    setShowStatusModal(true);
    
    // Reset animations
    modalScale.setValue(0);
    modalOpacity.setValue(0);
    modalTranslateY.setValue(50);

    // Start animations
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      })
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(modalTranslateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        setShowStatusModal(false);
      });
    }, 2000);
  };

  // Xử lý cập nhật trạng thái online
  const handleOnlineStatusChange = async (value: boolean) => {
    alert(user);
    if (!user?.shipperId) {
      showStatusChangeModal(JSON.stringify(user));
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
          showStatusChangeModal(
            value ? 'Bạn đã bắt đầu nhận đơn hàng' : 'Bạn đã tạm dừng nhận đơn hàng'
          );
        } else {
          showStatusChangeModal(response.message || 'Không thể cập nhật trạng thái');
        }
      });
    } catch (error) {
      console.error('Error updating online status:', error);
      showStatusChangeModal('Không thể cập nhật trạng thái online');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trang chủ</Text>
        <View style={[styles.onlineStatusContainer, isOnline && styles.onlineStatusActive]}>
          <Text style={[styles.onlineStatusText, isOnline && styles.onlineStatusTextActive]}>
            {isOnline ? 'Đang hoạt động' : 'Tạm dừng'}
          </Text>
          <Button
            title={isOnline ? 'Tắt hoạt động' : 'Bắt đầu hoạt động'}
            onPress={() => handleOnlineStatusChange(!isOnline)}
            style={[
              styles.toggleButton,
              isOnline ? styles.toggleButtonActive : styles.toggleButtonInactive
            ]}
            textStyle={{
              color: isOnline ? colors.white : colors.primary,
              fontWeight: 'bold'
            }}
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

      <Modal
        visible={showStatusModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              { 
                transform: [
                  { scale: modalScale },
                  { translateY: modalTranslateY }
                ],
                opacity: modalOpacity
              }
            ]}
          >
            <View style={styles.modalIconContainer}>
              {isOnline ? (
                <>
                  <View style={[styles.iconBackground, { backgroundColor: colors.primary + '20' }]}>
                    <Truck size={32} color={colors.primary} />
                  </View>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.iconBackground, { backgroundColor: colors.error + '20' }]}>
                    <Package size={32} color={colors.error} />
                  </View>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
                  </View>
                </>
              )}
            </View>
            <Text style={styles.modalTitle}>
              {isOnline ? 'Sẵn sàng nhận đơn' : 'Đã tạm dừng'}
            </Text>
            <Text style={styles.modalText}>{statusMessage}</Text>
            <View style={styles.modalProgressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: isOnline ? colors.primary : colors.error,
                    width: modalScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} 
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  onlineStatusActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  onlineStatusText: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
  },
  onlineStatusTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  toggleButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    minWidth: 120,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  iconBackground: {
    padding: 16,
    borderRadius: 50,
    marginBottom: 8,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default HomeScreen;