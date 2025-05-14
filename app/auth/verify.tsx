import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import{ colors } from '@/constants/colors';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { verifyOtp, phoneNumber, isVerifying, requestOtp, isNewUser, createPassword } = useAuthStore();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [otpVerified, setOtpVerified] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  // Redirect if not in verification mode
  // useEffect(() => {
  //   if (!isVerifying || !phoneNumber) {
  //     router.replace('/auth/login');
  //   }
  // }, [isVerifying, phoneNumber]);
  
  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);
  
  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      // If pasting multiple digits
      const digits = text.split('').slice(0, 6);
      const newOtp = [...otp];
      
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus on the next empty input or the last input
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Single digit input
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };
  
  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const isValid = await verifyOtp(otpString);
      console.log('OTP verification result:', isValid);
      console.log(isNewUser);
      
      if (isValid) {
          setOtpVerified(true);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreatePassword = async () => {
    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await createPassword(password);
      
      if (success) {
        router.replace('/');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Error creating password:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (resendTimer > 0 || !phoneNumber) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await requestOtp(phoneNumber);
      setResendTimer(30);
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: otpVerified ? "Create Password" : "Verification",
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                if (otpVerified) {
                  setOtpVerified(false);
                } else {
                  router.back();
                }
              }}
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
        {!otpVerified ? 
        (
          // OTP Verification Screen
          <>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              We've sent a verification code to {phoneNumber}
            </Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            
            <TouchableOpacity 
              style={[
                styles.verifyButton,
                (otp.some(digit => !digit) || isLoading) && styles.disabledButton
              ]}
              onPress={handleVerify}
              disabled={otp.some(digit => !digit) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity 
                onPress={handleResendOtp}
                disabled={resendTimer > 0 || isLoading}
              >
                <Text style={[
                  styles.resendButtonText,
                  resendTimer > 0 && styles.disabledText
                ]}>
                  Resend {resendTimer > 0 ? `(${resendTimer}s)` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Password Creation Screen
          <>
            <Text style={styles.title}>Create Password</Text>
            <Text style={styles.subtitle}>
              Create a password for your new account
            </Text>
            
            <View style={styles.passwordContainer}>
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
              
              <View style={styles.passwordInputContainer}>
                <Lock size={20} color={colors.lightText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
              
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.verifyButton,
                  (!password || !confirmPassword || isLoading) && styles.disabledButton
                ]}
                onPress={handleCreatePassword}
                disabled={!password || !confirmPassword || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // <-- changed from colors.text
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.lightText,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: colors.lightText,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: 14,
    color: colors.lightText,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  disabledText: {
    color: colors.lightText,
  },
  passwordContainer: {
    width: '100%',
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
});