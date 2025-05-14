import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { socket } from '@/utils/socket';
import { Feather } from '@expo/vector-icons';
import { API_URL } from '@/constants/config';
import BankSelectionModal from '@/components/BankSelectionModal';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import ViewShot, { captureRef } from 'react-native-view-shot';

interface WalletData {
  shipperId: string;
  balance: number;
}

interface DepositResponse {
  success: boolean;
  message: string;
  newBalance?: number;
}

interface Bank {
  id: string;
  name: string;
  logo: string;
  accountNumber: string;
  accountName: string;
}

interface TransactionNotification {
  visible: boolean;
  type: 'deposit' | 'withdraw';
  amount: number;
  bankName: string;
  status: 'success' | 'error';
  message: string;
}

interface ReceiptData {
  visible: boolean;
  transactionId: string;
  amount: number;
  bankName: string;
  bankLogo: string;
  accountNumber: string;
  accountName: string;
  date: Date;
}

export default function WalletScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [notification, setNotification] = useState<TransactionNotification>({
    visible: false,
    type: 'deposit',
    amount: 0,
    bankName: '',
    status: 'success',
    message: ''
  });
  const [receipt, setReceipt] = useState<ReceiptData>({
    visible: false,
    transactionId: '',
    amount: 0,
    bankName: '',
    bankLogo: '',
    accountNumber: '',
    accountName: '',
    date: new Date()
  });

  // Lấy số dư ban đầu từ API
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        if (user?.shipperId) {
          const response = await fetch(`https://dark-rabbits-enjoy.loca.lt/api/wallet/balance/${user.shipperId}`);
          const data = await response.json();
          
          if (data.EC === "0" && data.DT) {
            setBalance(data.DT.balance);
          } else {
            Alert.alert('Lỗi', 'Không thể lấy thông tin ví');
          }
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        Alert.alert('Lỗi', 'Không thể kết nối đến server');
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchWalletBalance();
  }, [user]);

  // Lắng nghe cập nhật số dư từ socket
  useEffect(() => {
    if (user) {
      const handleWalletUpdate = (data: WalletData) => {
        if (data.shipperId === user?.shipperId) {
          setBalance(data.balance);
        }
      };

      socket.on('walletBalance', handleWalletUpdate);

      return () => {
        socket.off('walletBalance', handleWalletUpdate);
      };
    }
  }, [user]);

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setShowBankModal(false);
    handleTransaction();
  };

  const showBankSelection = (type: 'deposit' | 'withdraw') => {
    setTransactionType(type);
    setShowBankModal(true);
  };

  const showTransactionNotification = (type: 'deposit' | 'withdraw', amount: number, bankName: string, status: 'success' | 'error', message: string) => {
    setNotification({
      visible: true,
      type,
      amount,
      bankName,
      status,
      message
    });

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  const showReceipt = (amount: number, bank: Bank) => {
    // Tạo mã giao dịch ngẫu nhiên
    const transactionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    setReceipt({
      visible: true,
      transactionId,
      amount,
      bankName: bank.name,
      bankLogo: bank.logo,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      date: new Date()
    });
  };

  const handleTransaction = async () => {
    if (!selectedBank || !amount || isNaN(Number(amount))) {
      showTransactionNotification(
        transactionType,
        Number(amount),
        selectedBank?.name || '',
        'error',
        'Vui lòng nhập số tiền hợp lệ'
      );
      return;
    }

    // Chỉ kiểm tra số dư và số tiền > 0 khi rút tiền
    if (transactionType === 'withdraw') {
      if (Number(amount) <= 0) {
        showTransactionNotification(
          transactionType,
          Number(amount),
          selectedBank.name,
          'error',
          'Số tiền rút phải lớn hơn 0'
        );
        return;
      }
      if (Number(amount) > balance) {
        showTransactionNotification(
          transactionType,
          Number(amount),
          selectedBank.name,
          'error',
          `Số dư không đủ. Số dư hiện tại: ${formatCurrency(balance)}`
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      // Gửi request qua socket
      socket.emit(
        transactionType === 'deposit' ? 'wallet_deposit' : 'wallet_withdraw',
        {
          shipperId: user?.shipperId,
          amount: Number(amount),
          bankId: selectedBank.id,
          bankName: selectedBank.name,
          accountNumber: selectedBank.accountNumber,
          accountName: selectedBank.accountName
        }
      );

      socket.once(
        transactionType === 'deposit' ? 'wallet_deposit_response' : 'wallet_withdraw_response',
        (response: DepositResponse) => {
          setIsLoading(false);
          if (response.success) {
            showTransactionNotification(
              transactionType,
              Number(amount),
              selectedBank.name,
              'success',
              transactionType === 'deposit' 
                ? `Bạn đã nạp ${formatCurrency(Number(amount))} vào ví WTF Food qua ${selectedBank.name}`
                : `Bạn đã rút ${formatCurrency(Number(amount))} từ ví WTF Food về ${selectedBank.name}`
            );
            
            // Hiển thị hóa đơn nếu là rút tiền thành công
            if (transactionType === 'withdraw') {
              showReceipt(Number(amount), selectedBank);
            }
            
            setAmount('');
            if (response.newBalance) {
              setBalance(response.newBalance);
              socket.emit('walletBalance', {
                shipperId: user?.id,
                balance: response.newBalance
              });
            }
          } else {
            showTransactionNotification(
              transactionType,
              Number(amount),
              selectedBank.name,
              'error',
              response.message || `Có lỗi xảy ra khi ${transactionType === 'deposit' ? 'nạp' : 'rút'} tiền`
            );
          }
        }
      );
    } catch (error) {
      setIsLoading(false);
      showTransactionNotification(
        transactionType,
        Number(amount),
        selectedBank.name,
        'error',
        'Có lỗi xảy ra, vui lòng thử lại sau'
      );
    }
  };

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin ví...</Text>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ví điện tử</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nhập số tiền</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>₫</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.subtext}
            />
          </View>
      </View>

        <View style={styles.actionButtons}>
        <TouchableOpacity
            style={[styles.actionButton, styles.depositButton]}
            onPress={() => showBankSelection('deposit')}
            disabled={isLoading}
        >
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Đang xử lý...' : 'Nạp tiền'}
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => showBankSelection('withdraw')}
            disabled={isLoading}
        >
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Đang xử lý...' : 'Rút tiền'}
            </Text>
        </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/profile/transactions')}
        >
          <Feather name="clock" size={20} color={colors.primary} />
          <Text style={styles.historyButtonText}>Xem lịch sử giao dịch</Text>
        </TouchableOpacity>
      </ScrollView>

      <BankSelectionModal
        visible={showBankModal}
        onClose={() => setShowBankModal(false)}
        onSelectBank={handleBankSelect}
        type={transactionType}
      />

      {/* Transaction Notification Modal */}
      <Modal
        visible={notification.visible}
        transparent
        animationType="fade"
      >
        <View style={styles.notificationOverlay}>
          <View style={[
            styles.notificationContent,
            notification.status === 'success' ? styles.successNotification : styles.errorNotification
          ]}>
            <View style={styles.notificationHeader}>
              <Feather 
                name={notification.status === 'success' ? 'check-circle' : 'alert-circle'} 
                size={24} 
                color={notification.status === 'success' ? colors.success : colors.error} 
              />
              <Text style={styles.notificationTitle}>
                {notification.status === 'success' ? 'Giao dịch thành công' : 'Giao dịch thất bại'}
              </Text>
      </View>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDetail}>
                <Text style={styles.detailLabel}>Ngân hàng: </Text>
                {notification.bankName}
              </Text>
              <Text style={styles.transactionDetail}>
                <Text style={styles.detailLabel}>Số tiền: </Text>
                {formatCurrency(notification.amount)}
              </Text>
              <Text style={styles.transactionDetail}>
                <Text style={styles.detailLabel}>Thời gian: </Text>
                {new Date().toLocaleString('vi-VN')}
              </Text>
        </View>
      </View>
    </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={receipt.visible}
        transparent
        animationType="fade"
      >
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptContent}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>HÓA ĐƠN RÚT TIỀN</Text>
              <TouchableOpacity 
                style={styles.closeReceiptButton}
                onPress={() => setReceipt(prev => ({ ...prev, visible: false }))}
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptLogoContainer}>
              <View style={styles.receiptLogo}>
                <Text style={styles.receiptLogoText}>WTF</Text>
              </View>
              <Text style={styles.receiptCompanyName}>WTF FOOD</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptStatusContainer}>
              <Feather name="check-circle" size={40} color={colors.success} />
              <Text style={styles.receiptStatusText}>THÀNH CÔNG</Text>
            </View>

            <View style={styles.receiptAmountContainer}>
              <Text style={styles.receiptAmountLabel}>Số tiền đã rút</Text>
              <Text style={styles.receiptAmount}>{formatCurrency(receipt.amount)}</Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptDetailsContainer}>
              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptDetailLabel}>Mã giao dịch</Text>
                <Text style={styles.receiptDetailValue}>{receipt.transactionId}</Text>
              </View>

              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptDetailLabel}>Thời gian</Text>
                <Text style={styles.receiptDetailValue}>
                  {receipt.date.toLocaleString('vi-VN')}
                </Text>
              </View>

              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptDetailLabel}>Phương thức</Text>
                <Text style={styles.receiptDetailValue}>Rút tiền về tài khoản ngân hàng</Text>
              </View>

              <View style={styles.receiptBankContainer}>
                <View style={styles.receiptBankHeader}>
                  <Text style={styles.receiptBankTitle}>Thông tin ngân hàng</Text>
                </View>

                <View style={styles.receiptBankContent}>
                  <Image 
                    source={{ uri: receipt.bankLogo }} 
                    style={styles.receiptBankLogo} 
                    resizeMode="contain"
                  />
                  <View style={styles.receiptBankDetails}>
                    <Text style={styles.receiptBankName}>{receipt.bankName}</Text>
                    <Text style={styles.receiptAccountNumber}>{receipt.accountNumber}</Text>
                    <Text style={styles.receiptAccountName}>{receipt.accountName}</Text>
                  </View>
                </View>
              </View>
            </View>


            <View style={styles.receiptActions}>
              <TouchableOpacity style={styles.receiptActionButton} onPress={async () => {
                try {
                  const { status } = await MediaLibrary.requestPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập bộ nhớ để lưu hóa đơn.');
                    return;
                  }
                  const uri = await captureRef(receiptRef, {
                    format: 'png',
                    quality: 1,
                  });
                  const asset = await MediaLibrary.createAssetAsync(uri);
                  await MediaLibrary.createAlbumAsync('WTF Receipts', asset, false);
                  Alert.alert('Thành công', 'Hóa đơn đã được lưu vào thư viện ảnh.');
                } catch (error) {
                  Alert.alert('Lỗi', 'Không thể lưu hóa đơn. Vui lòng thử lại.');
                }
              }}>
                <Feather name="download" size={20} color={colors.white} />
                <Text style={styles.receiptActionText}>Lưu hóa đơn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  balanceCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
  },
  currencySymbol: {
    fontSize: 20,
    color: colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: colors.text,
    padding: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  depositButton: {
    backgroundColor: colors.primary,
  },
  withdrawButton: {
    backgroundColor: colors.secondary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    gap: 8,
  },
  historyButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  successNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  errorNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  transactionDetails: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
  },
  transactionDetail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: colors.subtext,
  },
  // Receipt styles
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  closeReceiptButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 4,
  },
  receiptLogoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptLogoText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  receiptCompanyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  receiptStatusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 8,
  },
  receiptAmountContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptAmountLabel: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  receiptDetailsContainer: {
    marginBottom: 16,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receiptDetailLabel: {
    fontSize: 14,
    color: colors.subtext,
  },
  receiptDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  receiptBankContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  receiptBankHeader: {
    backgroundColor: colors.primary + '20',
    padding: 8,
  },
  receiptBankTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  receiptBankContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  receiptBankLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  receiptBankDetails: {
    flex: 1,
  },
  receiptBankName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  receiptAccountNumber: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 2,
  },
  receiptAccountName: {
    fontSize: 12,
    color: colors.subtext,
  },
  receiptQRContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptQRCode: {
    width: 120,
    height: 120,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptQRText: {
    fontSize: 12,
    color: colors.subtext,
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  receiptActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  receiptActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
