import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Settings, Moon, Bell, Lock, HelpCircle } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";

export default function SettingsScreen() {
  const router = useRouter();
  // const logout = useAuthStore((state) => state.logout);
  
  // Mock data - replace with actual data from your API/store
  const [settings, setSettings] = useState([
    { id: 1, title: 'Chế độ tối', icon: <Moon size={20} color={colors.primary} />, enabled: false },
    { id: 2, title: 'Thông báo', icon: <Bell size={20} color={colors.primary} />, enabled: true },
    { id: 3, title: 'Riêng tư', icon: <Lock size={20} color={colors.primary} />, enabled: true },
  ]);

  const toggleSwitch = (id: number) => {
    setSettings(prev => 
      prev.map(item => 
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Cài đặt</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {settings.map((item) => (
          <View key={item.id} style={styles.settingItem}>
            {item.icon}
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              onValueChange={() => toggleSwitch(item.id)}
              value={item.enabled}
            />
          </View>
        ))}
        
        <TouchableOpacity style={styles.supportItem}>
          <HelpCircle size={20} color={colors.primary} />
          <Text style={styles.settingTitle}>Trợ giúp & Hỗ trợ</Text>
          <ChevronLeft size={20} color={colors.subtext} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            // logout();
            router.replace('/');
          }}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  content: {
    padding: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  logoutText: {
    color: colors.white,
    fontWeight: "600",
  },
});