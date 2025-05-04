import React from "react";
import { Stack } from "expo-router";
import { NavigationBar } from "@/components/NavigationBar";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          header: () => <NavigationBar title="Chỉnh sửa thông tin" showBackButton />,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          header: () => <NavigationBar title="Cài đặt" showBackButton />,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          header: () => <NavigationBar title="Thông báo" showBackButton />,
        }}
      />
      <Stack.Screen
        name="earnings-history"
        options={{
          header: () => <NavigationBar title="Lịch sử thu nhập" showBackButton />,
        }}
      />
      <Stack.Screen
        name="working-hours"
        options={{
          header: () => <NavigationBar title="Giờ làm việc" showBackButton />,
        }}
      />
    </Stack>
  );
}