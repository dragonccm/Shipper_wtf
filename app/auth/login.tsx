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
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import {colors} from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { requestOtp, isAuthenticated, login, passwords } = useAuthStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState(true); // true = password login, false = OTP login
  
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
  
  const formatFullPhoneNumber = (number: string) => {
    const cleanedNumber = number.replace(/\s/g, '');
    
    let fullPhoneNumber = cleanedNumber;
    if (!cleanedNumber.startsWith('+84') && !cleanedNumber.startsWith('84')) {
      if (cleanedNumber.startsWith('0')) {
        fullPhoneNumber = `+84${cleanedNumber.substring(1)}`;
      } else {
        fullPhoneNumber = `+84${cleanedNumber}`;
      }
    } else if (cleanedNumber.startsWith('84')) {
      fullPhoneNumber = `+${cleanedNumber}`;
    }
    
    return fullPhoneNumber;
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
    
    setIsLoading(true);
    setError(null);
    
    try {
      function normalizePhoneNumber(phoneNumber: string): string {
        // Bỏ dấu +
        let cleaned = phoneNumber.replace(/^\+/, '');
      
        // Nếu bắt đầu bằng 84 thì thay bằng 0
        if (cleaned.startsWith('84')) {
          cleaned = '0' + cleaned.slice(2);
        }
      
        return cleaned;
      }
      
      const fullPhoneNumber = formatFullPhoneNumber(phoneNumber);
      const success = await login(normalizePhoneNumber(fullPhoneNumber), password);
      console.log('Login success:', success);
      
      if (success) {
        router.replace('/');
      } else {
        setError('Invalid phone number or password');
      }
    } catch (error) {
      console.error('Login error: roi con', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOtpLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fullPhoneNumber = formatFullPhoneNumber(phoneNumber);
      await requestOtp(fullPhoneNumber);
      
      // Navigate to OTP verification screen
      router.push('/auth/verify');
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleLoginMode = () => {
    setLoginMode(!loginMode);
    setError(null);
  };
  
  const handleContinue = () => {
    if (loginMode) {
      handlePasswordLogin();
    } else {
      handleOtpLogin();
    }
  };
  
  const isPhoneRegistered = () => {
    const fullPhoneNumber = formatFullPhoneNumber(phoneNumber);
    return !!passwords[fullPhoneNumber];
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
        
        <Text style={styles.title}>Login or Sign Up</Text>
        <Text style={styles.subtitle}>
          {loginMode 
            ? "Enter your phone number and password to login." 
            : "Enter your phone number to continue. We'll send you a verification code."}
        </Text>
        
        <View style={styles.inputContainer}>
          <View style={styles.phoneInputContainer}>
            <Phone size={20} color={colors.lightText} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              maxLength={13} // +84 xxx xxx xxx format with spaces
            />
          </View>
          
          {loginMode && (
            <View style={styles.passwordInputContainer}>
              <Lock size={20} color={colors.lightText} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.lightText} />
                ) : (
                  <Eye size={20} color={colors.lightText} />
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (!phoneNumber || (loginMode && !password) || isLoading) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!phoneNumber || (loginMode && !password) || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.continueButtonText}>
                {loginMode ? "Login" : "Continue with OTP"}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.switchModeButton}
            onPress={toggleLoginMode}
          >
            <Text style={styles.switchModeText}>
              {loginMode 
                ? "Don't remember password? Login with OTP" 
                : "Already have an account? Login with password"}
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
    color: colors.lightText,
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
    backgroundColor: colors.lightText,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: 18,
  },
});