import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { 
  User, 
  Mail, 
  Phone, 
  LogOut, 
  Settings, 
  Bell, 
  HelpCircle, 
  ChevronRight,
  DollarSign,
  Clock
} from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";
import { formatPhoneNumber } from "@/utils/formatters";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const handleLogout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: () => logout(),
          style: "destructive"
        }
      ]
    );
  };
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.profileImage} />
        <Text style={styles.name}>Khách</Text>
      </View>
      
      <View style={styles.earningsSection}>
        <Text style={styles.sectionTitle}>Today's Earnings</Text>
        <View style={styles.earningsCard}>
          <View style={styles.earningsItem}>
            <Text style={styles.earningsValue}>0đ</Text>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsItem}>
            <Text style={styles.earningsValue}>0</Text>
            <Text style={styles.earningsLabel}>Deliveries</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsItem}>
            <Text style={styles.earningsValue}>0</Text>
            <Text style={styles.earningsLabel}>Rating</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Mail size={20} color={colors.primary} />
          <Text style={styles.infoText}>guest@example.com</Text>
        </View>
        <View style={styles.infoItem}>
          <Phone size={20} color={colors.primary} />
          <Text style={styles.infoText}>+84 123 456 789</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/edit-profile')}>
          <View style={styles.menuItemLeft}>
            <User size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/earnings-history')}>
          <View style={styles.menuItemLeft}>
            <DollarSign size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Earnings History</Text>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/working-hours')}>
          <View style={styles.menuItemLeft}>
            <Clock size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Working Hours</Text>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/notifications')}>
          <View style={styles.menuItemLeft}>
            <Bell size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/settings')}>
          <View style={styles.menuItemLeft}>
            <Settings size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Settings</Text>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <HelpCircle size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Help Center</Text>
          </View>
          <ChevronRight size={20} color={colors.subtext} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        onPress={() => router.push("/auth/AuthScreen")}
        style={{position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center'}}>
        <Text style={{color: colors.white, fontWeight: 'bold', fontSize: 14}}>Đăng nhập / Đăng ký</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusOnline: {
    backgroundColor: colors.success + "20",
  },
  statusOffline: {
    backgroundColor: colors.subtext + "20",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  earningsSection: {
    marginBottom: 24,
  },
  earningsCard: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsItem: {
    flex: 1,
    alignItems: "center",
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  earningsLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  earningsDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 8,
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.error + "10",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
    marginLeft: 8,
  },
  versionText: {
    textAlign: "center",
    fontSize: 14,
    color: colors.subtext,
  },
});