import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { colors } from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, setAuthenticated, setUser, setToken } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  const formatPhoneNumber = (text: string) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Format as Vietnamese phone number
    let formatted = cleaned;
    if (cleaned.length > 0) {
      if (cleaned.length <= 4) {
        formatted = cleaned;
      } else if (cleaned.length <= 7) {
        formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      } else {
        formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
      }
    }

    setPhoneNumber(formatted);
  };

  const validatePhoneNumber = (number: string) => {
    const cleanedNumber = number.replace(/\s/g, '');
    return cleanedNumber.length >= 9 && cleanedNumber.length <= 10;
  };

  const handlePasswordLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError(null);

    try {
      // Normalize phone number by removing spaces and non-numeric characters
      const normalizedPhone = phoneNumber.replace(/\s/g, '').replace(/\D/g, '');

      // Login API call
      const loginRes = await fetch("https://3025-14-240-55-19.ngrok-free.app/api/login_phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valueLogin: normalizedPhone,
          password,
        }),
      });

      const loginData = await loginRes.json();
      console.log("Login response:", loginData);

      if (loginData.EC === "0" && loginData.DT) {
        await setToken(loginData.DT.access_token);
        setUser(loginData.DT.account);
        setAuthenticated(true);
        router.replace('/');
      } else {
        setError(loginData.EM || 'Invalid phone number or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: "Login",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D' }}
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>
          Enter your phone number and password to login.
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.phoneInputContainer}>
            <Phone size={20} color={colors.subtext} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={colors.subtext}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              maxLength={13}
            />
          </View>

          <View style={styles.passwordInputContainer}>
            <Lock size={20} color={colors.subtext} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.subtext} />
              ) : (
                <Eye size={20} color={colors.subtext} />
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.continueButton,
              (!phoneNumber || !password || authLoading) && styles.disabledButton
            ]}
            onPress={handlePasswordLogin}
            disabled={!phoneNumber || !password || authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.continueButtonText}>
                Login
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>
              Don't have an account? Register
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 30,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: colors.subtext,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  termsText: {
    fontSize: 12,
    color: colors.subtext,
    textAlign: 'center',
    lineHeight: 18,
  },
  registerButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});