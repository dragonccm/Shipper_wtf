import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants/colors';

interface Bank {
  id: string;
  name: string;
  logo: string;
  accountNumber: string;
  accountName: string;
}

interface BankSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBank: (bank: Bank) => void;
  type: 'deposit' | 'withdraw';
}

const BANKS: Bank[] = [
  {
    id: 'VCB',
    name: 'Vietcombank',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/80/Vietcombank_logo.svg/1200px-Vietcombank_logo.svg.png',
    accountNumber: '1234567890',
    accountName: 'CONG TY TNHH WTF FOOD'
  },
  {
    id: 'TCB',
    name: 'Techcombank',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/8a/Techcombank_logo.svg/1200px-Techcombank_logo.svg.png',
    accountNumber: '9876543210',
    accountName: 'CONG TY TNHH WTF FOOD'
  },
  {
    id: 'MB',
    name: 'MB Bank',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/8a/MB_Bank_logo.svg/1200px-MB_Bank_logo.svg.png',
    accountNumber: '4567891230',
    accountName: 'CONG TY TNHH WTF FOOD'
  },
  {
    id: 'ACB',
    name: 'ACB',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/8/8a/ACB_logo.svg/1200px-ACB_logo.svg.png',
    accountNumber: '7891234560',
    accountName: 'CONG TY TNHH WTF FOOD'
  }
];

export default function BankSelectionModal({ visible, onClose, onSelectBank, type }: BankSelectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {type === 'deposit' ? 'Chọn ngân hàng để nạp tiền' : 'Chọn ngân hàng để rút tiền'}
          </Text>
          
          <View style={styles.bankList}>
            {BANKS.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={styles.bankItem}
                onPress={() => onSelectBank(bank)}
              >
                <Image
                  source={{ uri: bank.logo }}
                  style={styles.bankLogo}
                  resizeMode="contain"
                />
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>{bank.name}</Text>
                  <Text style={styles.accountNumber}>{bank.accountNumber}</Text>
                  <Text style={styles.accountName}>{bank.accountName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  bankList: {
    gap: 12,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 2,
  },
  accountName: {
    fontSize: 12,
    color: colors.subtext,
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 