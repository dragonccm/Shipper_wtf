import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { Button } from "@/components/Button";

const AuthScreen = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const router = useRouter();

  const handleSendOtp = () => {
    // Logic to send OTP
    setShowOtpField(true);
  };

  const handleLogin = () => {
    // Logic for login
    router.push('/');
  };

  const handleRegister = () => {
    // Logic for registration
    router.push('/');
  };

  const handleForgotPassword = () => {
    // Logic for forgot password
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.logo}
        />
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'login' && styles.activeTab]}
            onPress={() => setActiveTab('login')}
          >
            <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Đăng nhập</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'register' && styles.activeTab]}
            onPress={() => setActiveTab('register')}
          >
            <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'login' ? (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại hoặc Email"
              value={phone || email}
              onChangeText={(text) => {
                if (text.includes('@')) {
                  setEmail(text);
                  setPhone('');
                } else {
                  setPhone(text);
                  setEmail('');
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            {showOtpField ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Mã OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
                <Button 
                  title="Xác nhận" 
                  onPress={handleLogin}
                  style={styles.button}
                />
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <Button 
                  title="Đăng nhập" 
                  onPress={handleLogin}
                  style={styles.button}
                />
                <TouchableOpacity onPress={handleSendOtp}>
                  <Text style={styles.otpText}>Đăng nhập bằng OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            {showOtpField ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Mã OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
                <Button 
                  title="Xác nhận" 
                  onPress={handleRegister}
                  style={styles.button}
                />
              </>
            ) : (
              <Button 
                title="Gửi OTP" 
                onPress={handleSendOtp}
                style={styles.button}
              />
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    marginBottom: 16,
  },
  otpText: {
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  forgotPasswordText: {
    color: colors.subtext,
    textAlign: 'center',
  },
});

export default AuthScreen;