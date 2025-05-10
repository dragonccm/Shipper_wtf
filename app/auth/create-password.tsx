import React, { useState } from 'react';
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
import { useAuthStore } from '@/store/useAuthStore';
import { colors } from "@/constants/colors";

export default function CreatePasswordScreen() {
  const router = useRouter();
  const { createPassword, phoneNumber, isVerifying, isNewUser } = useAuthStore();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if not in verification mode or not a new user
  React.useEffect(() => {
    if (!isVerifying || !isNewUser || !phoneNumber) {
      router.replace('/auth/login');
    }
  }, [isVerifying, isNewUser, phoneNumber]);
  
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
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: "Create Password",
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
              styles.createButton,
              (!password || !confirmPassword || isLoading) && styles.disabledButton
            ]}
            onPress={handleCreatePassword}
            disabled={!password || !confirmPassword || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.createButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.termsText}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
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
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  createButton: {
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
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  termsText: {
    fontSize: 12,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 20,
  },
});