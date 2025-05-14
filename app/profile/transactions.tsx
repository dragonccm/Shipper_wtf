import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { Feather } from '@expo/vector-icons';
import { API_URL } from '@/constants/config';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  bankName: string;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      if (user?.shipperId) {
        const response = await fetch(`https://dark-rabbits-enjoy.loca.lt/api/wallet/transactions/${user.shipperId}`);
        const data = await response.json();
        
        if (data.EC === "0" && data.DT) {
          setTransactions(data.DT.transactions);
        } else {
          console.error('Error fetching transactions:', data.EM);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionType}>
          <Feather 
            name={item.type === 'deposit' ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color={item.type === 'deposit' ? colors.success : colors.error} 
          />
          <Text style={[
            styles.transactionTypeText,
            { color: item.type === 'deposit' ? colors.success : colors.error }
          ]}>
            {item.type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
          </Text>
        </View>
        <Text style={[
          styles.amount,
          { color: item.type === 'deposit' ? colors.success : colors.error }
        ]}>
          {item.type === 'deposit' ? '+' : ''}{formatCurrency(item.amount)}
        </Text>
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.bankName}>{item.bankName}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử giao dịch...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={48} color={colors.subtext} />
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
  listContainer: {
    padding: 16,
  },
  transactionItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionTypeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionDetails: {
    marginBottom: 12,
  },
  bankName: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: colors.subtext,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.subtext,
    textAlign: 'center',
  },
}); 