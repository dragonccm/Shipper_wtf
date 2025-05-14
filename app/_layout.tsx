import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator, Text, Alert, TouchableOpacity } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { colors } from "@/constants/colors";
import { socket } from '@/utils/socket';
import { useAuthStore } from '@/store/authStore';
import { NewOrderPopup } from "@/components/NewOrderPopup";
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [showNewOrderPopup, setShowNewOrderPopup] = useState(false);
  const [newOrder, setNewOrder] = useState<any>(null);

  // Kiểm tra xác thực khi ứng dụng khởi động
  useEffect(() => {
    async function verifyAuthentication() {
      if (loaded) {
        try {
          // await checkAuth();
        } catch (error) {
          console.error("Lỗi khi kiểm tra xác thực:", error);
        } finally {
          setIsCheckingAuth(false);
          SplashScreen.hideAsync();
        }
      }
    }

    verifyAuthentication();
  }, [loaded]);

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (!user?.shipperId) return;

    const handleNewOrder = (data: { orderId: string; orderDetails: any }) => {
      setNewOrder({
        _id: data.orderId,
        ...data.orderDetails
      });
      setShowNewOrderPopup(true);
    };

    socket.on('new_order_assigned', handleNewOrder);

    return () => {
      socket.off('new_order_assigned', handleNewOrder);
    };
  }, [user?.shipperId]);
  socket.on('new_order_assigned', (data) => {
    alert('Có đơn hàng mới!');
  });

  // Lắng nghe trạng thái online từ server (nếu có)
  useEffect(() => {
    if (!user?.shipperId) return;
    const handleStatus = (data: { shipperId: string; isOnline: boolean }) => {
      if (data.shipperId === user.shipperId) setIsOnline(data.isOnline);
    };
    socket.on('shipper_status_updated', handleStatus);
    return () => socket.off('shipper_status_updated', handleStatus);
  }, [user?.shipperId]);

  // Gửi vị trí lên server định kỳ nếu online
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    const sendLocation = async () => {
      if (!user?.shipperId || !isOnline) return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!isUnmounted) setCurrentLocation(loc);
        socket.emit('current_location', {
          shipperId: user.shipperId,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (err) {
        // ignore
      }
    };

    if (user?.shipperId && isOnline) {
      sendLocation(); // gửi ngay lần đầu
      intervalId = setInterval(sendLocation, 5000);
    }

    return () => {
      isUnmounted = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.shipperId, isOnline]);

  if (!loaded || isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Đang tải...</Text>
      </View>
    );
  }

  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <RootLayoutNav />
       
     
        {showNewOrderPopup && newOrder && (
          <NewOrderPopup
            order={newOrder}
            onAccept={() => {
              socket.emit('accept_order', {
                orderId: newOrder._id,
                shipperId: user?.shipperId,
              });
              setShowNewOrderPopup(false);
              router.push(`/order/${newOrder._id}`);
            }}
            onDecline={() => {
              setShowNewOrderPopup(false);
            }}
          />
        )}
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const router = useRouter();

  // Chuyển hướng người dùng dựa trên trạng thái xác thực
  useEffect(() => {
    // if (isAuthenticated) {
    //   router.replace('/(tabs)');
    // } else {
    //   router.replace('/auth/login');
    // }
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="order/[id]"
        options={{
          headerShown: true,
          title: "Chi tiết đơn hàng",
          headerBackTitle: "Quay lại"
        }}
      />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}