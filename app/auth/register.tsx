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
import { ChevronLeft, Phone, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { colors } from '@/constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser, setToken, setAuthenticated, setLoading, isAuthenticated } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleRegister = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Normalize phone number by removing spaces and non-numeric characters
      const normalizedPhone = phoneNumber.replace(/\s/g, '').replace(/\D/g, '');

      // Register API call
      const registerRes = await fetch("https://f3f8-2a09-bac5-d44d-2646-00-3d0-64.ngrok-free.app/api/register_phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          password,
          name,
          username: `user_${normalizedPhone}`,
        }),
      });

      let registerData;
      try {
        const text = await registerRes.text();
        console.log("Raw register response:", text);
        registerData = JSON.parse(text);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        setError('Invalid response from server');
        setLoading(false);
        return;
      }

      console.log("Register response:", registerData);

      if (registerData.EC === "0") {
        // Auto login after successful registration
        const loginRes = await fetch("https://f3f8-2a09-bac5-d44d-2646-00-3d0-64.ngrok-free.app", {
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
        console.log("Auto login response:", loginData);

        if (loginData.EC === "0" && loginData.DT) {
          await setToken(loginData.DT.access_token);
          setUser(loginData.DT.account);
          setAuthenticated(true);
          router.replace('/');
        } else {
          setError(loginData.EM || 'Login failed after registration');
        }
      } else {
        setError(registerData.EM || 'Registration failed');
      }
    } catch (error) {
      console.error('Register error:', error);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: "Register",
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

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Enter your details to create an account.
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

          <View style={styles.nameInputContainer}>
            <User size={20} color={colors.subtext} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.subtext}
              value={name}
              onChangeText={setName}
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

          <View style={styles.passwordInputContainer}>
            <Lock size={20} color={colors.subtext} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
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
              (!phoneNumber || !password || !confirmPassword || !name) && styles.disabledButton
            ]}
            onPress={handleRegister}
            disabled={!phoneNumber || !password || !confirmPassword || !name}
          >
            {useAuthStore.getState().isLoading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.continueButtonText}>
                Register
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>
              Already have an account? Login
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
  nameInputContainer: {
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
  loginButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: colors.subtext,
    textAlign: 'center',
    lineHeight: 18,
  },
});