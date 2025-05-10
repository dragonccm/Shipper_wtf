import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { User, Mail, Phone, ChevronLeft } from "lucide-react-native";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { colors } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  
  // Nếu người dùng chưa đăng nhập, chuyển hướng về trang profile
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>
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

  const handleSave = async () => {
    const newErrors = {};
    
    if (!name) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    if (!phone) newErrors.phone = "Phone is required";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    await updateProfile({ name, email, phone });
    router.back();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={40} color={colors.white} />
          </View>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
        
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          leftIcon={<User size={20} color={colors.subtext} />}
        />
        
        <Input
          label="Email"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          leftIcon={<Mail size={20} color={colors.subtext} />}
        />
        
        <Input
          label="Phone Number"
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          leftIcon={<Phone size={20} color={colors.subtext} />}
        />
        
        <Button
          title="Save Changes"
          onPress={handleSave}
          style={styles.saveButton}
        />
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
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoBtn: {
    marginTop: 8,
  },
  changePhotoText: {
    color: colors.primary,
    fontWeight: "500",
  },
  saveButton: {
    marginTop: 24,
  },
});