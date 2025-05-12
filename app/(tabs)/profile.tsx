import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { User, Wallet, ArrowRight, LogOut } from 'lucide-react-native';
import { formatCurrency } from '@/utils/formatters';
import { socket } from '@/services/socket';

interface WalletData {
  shipperId: string;
  balance: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore((state) => ({
    user: state.user,
    logout: state.logout
  }));
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (user) {
      socket.emit('getWalletBalance', { shipperId: user.id });
    }

    const handleWalletUpdate = (data: WalletData) => {
      if (data.shipperId === user?.id) {
        setBalance(data.balance);
      }
    };

    socket.on('walletBalance', handleWalletUpdate);

    return () => {
      socket.off('walletBalance', handleWalletUpdate);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Trang cá nhân</Text>
        <Text style={styles.subtitle}>Bạn cần đăng nhập để xem thông tin</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.buttonText}>Đăng nhập / Đăng ký</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <User size={50} color={colors.primary} />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userDetails}>ID: {user.id}</Text>
        <Text style={styles.userDetails}>SĐT: {user.phone}</Text>
      </View>

      <View style={styles.walletSection}>
        <View style={styles.walletHeader}>
          <Wallet size={24} color={colors.primary} />
          <Text style={styles.walletTitle}>Ví tài xế</Text>
        </View>
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>
        <View style={styles.walletActions}>
          <TouchableOpacity 
            style={[styles.walletButton, styles.depositButton]}
            onPress={() => router.push('./wallet')}
          >
            <Text style={styles.walletButtonText}>Nạp tiền</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.walletButton, styles.withdrawButton]}
            onPress={() => router.push('./wallet')}
          >
            <Text style={styles.walletButtonText}>Rút tiền</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('./transactions')}
        >
          <Text style={styles.menuText}>Lịch sử giao dịch</Text>
          <ArrowRight size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('./edit-profile')}
        >
          <Text style={styles.menuText}>Chỉnh sửa thông tin</Text>
          <ArrowRight size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('./settings')}
        >
          <Text style={styles.menuText}>Cài đặt</Text>
          <ArrowRight size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <LogOut size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  userDetails: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 4,
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
  menuSection: {
    margin: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});