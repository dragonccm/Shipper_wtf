import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Clock, Plus } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";

export default function WorkingHoursScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  // Mock data - replace with actual data from your API/store
  const [workingHours, setWorkingHours] = useState([
    { id: 1, day: 'Monday', startTime: '08:00', endTime: '17:00' },
    { id: 2, day: 'Tuesday', startTime: '08:00', endTime: '17:00' },
    { id: 3, day: 'Wednesday', startTime: '08:00', endTime: '17:00' },
  ]);

  const handleAddHours = () => {
    // Logic to add new working hours
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Giờ làm việc</Text>
        <Text style={styles.subtitle}>Bạn cần đăng nhập để xem thông tin</Text>
        <Text style={styles.emptyText}>Không có dữ liệu</Text>
        <Button 
          title="Đăng nhập / Đăng ký" 
          onPress={handleLoginPress}
          style={styles.button}
        />
        <Button 
          title="Đăng xuất" 
          onPress={handleLogout}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Working Hours</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddHours}
        >
          <Plus size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add Working Hours</Text>
        </TouchableOpacity>
        
        {workingHours.map((item) => (
          <View key={item.id} style={styles.hoursItem}>
            <Clock size={20} color={colors.primary} />
            <View style={styles.hoursDetails}>
              <Text style={styles.dayText}>{item.day}</Text>
              <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: "500",
    marginLeft: 8,
  },
  hoursItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  hoursDetails: {
    flex: 1,
    marginLeft: 12,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  timeText: {
    fontSize: 14,
    color: colors.subtext,
  },
  editButton: {
    padding: 8,
  },
  editText: {
    color: colors.primary,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.subtext,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
});