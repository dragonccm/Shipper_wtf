import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  
  // Nếu người dùng đã đăng nhập, chuyển hướng đến trang chính
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}