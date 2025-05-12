import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { Button } from "@/components/Button";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/utils/formatters";
import { socket } from "@/services/socket";
import { API_URL } from "@/constants/config";

interface WalletData {
  shipperId: string;
  balance: number;
}

interface OrderData {
  activeOrders: any[];
  completedOrders: any[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    fetchWalletBalance();
    fetchShipperOrders();
    
    // Lắng nghe cập nhật số dư từ socket
    const handleWalletUpdate = (data: WalletData) => {
      if (data.shipperId === user?.shipperId) {
        setBalance(data.balance);
      }
    };

    socket.on('walletBalance', handleWalletUpdate);

    return () => {
      socket.off('walletBalance', handleWalletUpdate);
    };
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      if (user?.shipperId) {
        const response = await fetch(`${API_URL}/api/wallet/balance/${user.shipperId}`);
        const data = await response.json();
        
        if (data.EC === "0" && data.DT) {
          setBalance(data.DT.balance);
        } else {
          console.error('Error fetching wallet balance:', data.EM);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShipperOrders = async () => {
    try {
      if (user?.shipperId) {
        const response = await fetch(`${API_URL}/api/shipper/orders/${user.shipperId}`);
        const data = await response.json();
        
        if (data.EC === "0" && data.DT) {
          setOrderData(data.DT);
        } else {
          console.error('Error fetching shipper orders:', data.EM);
        }
      }
    } catch (error) {
      console.error('Error fetching shipper orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleOrdersPress = () => {
    if (!orderData) return;

    if (orderData.activeOrders.length > 0) {
      router.push('/orders');
    } else if (orderData.completedOrders.length > 0) {
      router.push('/history');
    } else {
      // Hiển thị thông báo không có đơn hàng
      Alert.alert('Thông báo', 'Bạn chưa có đơn hàng nào');
    }
  };

  const handleLoginPress = () => {
    router.push("/auth/login");
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.container}>
          <Text style={styles.title}>Trang cá nhân</Text>
          <Text style={styles.subtitle}>Bạn cần đăng nhập để xem thông tin</Text>
          
          <Button 
            title="Đăng nhập / Đăng ký" 
            onPress={handleLoginPress}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {/* {user.name.charAt(0).toUpperCase()} */}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        <View style={styles.walletSection}>
          <View style={styles.walletHeader}>
            <Feather name="credit-card" size={24} color={colors.primary} />
            <Text style={styles.walletTitle}>Ví điện tử</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.balance}>{formatCurrency(balance)}</Text>
          )}
          <View style={styles.walletActions}>
            <TouchableOpacity 
              style={[styles.walletButton, styles.depositButton]}
              onPress={() => router.push('/profile/wallet')}
            >
              <Text style={styles.walletButtonText}>Nạp tiền</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.walletButton, styles.withdrawButton]}
              onPress={() => router.push('/profile/wallet')}
            >
              <Text style={styles.walletButtonText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={styles.tabItem}
            onPress={handleOrdersPress}
          >
            <Feather name="shopping-bag" size={24} color={colors.text} />
            <View style={styles.tabContent}>
              <Text style={styles.tabText}>Đơn hàng của tôi</Text>
              {isLoadingOrders ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.tabSubtext}>
                  {orderData?.activeOrders.length 
                    ? `${orderData.activeOrders.length} đơn hàng đang thực hiện`
                    : orderData?.completedOrders.length 
                      ? `${orderData.completedOrders.length} đơn hàng đã hoàn thành`
                      : 'Chưa có đơn hàng nào'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          {/* Thẻ lịch sử giao dịch */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => router.push('/profile/transactions')}
          >
            <Feather name="repeat" size={24} color={colors.text} />
            <View style={styles.tabContent}>
              <Text style={styles.tabText}>Lịch sử giao dịch</Text>
              <Text style={styles.tabSubtext}>Xem các giao dịch nạp/rút tiền</Text>
            </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
    textAlign: 'center',
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 16,
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
  walletSection: {
    padding: 24,
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  walletButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  depositButton: {
    backgroundColor: colors.primary,
  },
  withdrawButton: {
    backgroundColor: colors.secondary,
  },
  walletButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  profileInfo: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
  },
  tabContainer: {
    width: '100%',
    marginVertical: 24,
    padding: 16,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabContent: {
    flex: 1,
    marginLeft: 16,
  },
  tabText: {
    fontSize: 16,
    color: colors.text,
  },
  tabSubtext: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
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