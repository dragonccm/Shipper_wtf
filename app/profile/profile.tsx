import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { Button } from "@/components/Button";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLoginPress = () => {
    router.push("/auth/AuthScreen");
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Trang cá nhân</Text>
        <Text style={styles.subtitle}>Bạn cần đăng nhập để xem thông tin</Text>
        
        <Button 
          title="Đăng nhập / Đăng ký" 
          onPress={handleLoginPress}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('/profile/edit-profile')}
        >
          <Feather name="edit" size={24} color={colors.text} />
          <Text style={styles.tabText}>Chỉnh sửa thông tin</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('/profile/earnings-history')}
        >
          <Feather name="shopping-bag" size={24} color={colors.text} />
          <Text style={styles.tabText}>Đơn hàng của tôi</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.push('/profile/settings')}
        >
          <Feather name="settings" size={24} color={colors.text} />
          <Text style={styles.tabText}>Cài đặt</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Số điện thoại:</Text>
          <Text style={styles.infoValue}>{user.phone}</Text>
        </View>
      </View>

      <Button 
        title="Đăng xuất" 
        onPress={handleLogout}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: colors.subtext,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginTop: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.subtext,
  },
  profileInfo: {
    width: '100%',
    marginBottom: 24,
  },
  tabContainer: {
    width: '100%',
    marginVertical: 24,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.subtext,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});