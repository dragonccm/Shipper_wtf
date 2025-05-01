import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Platform,
  SafeAreaView
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { ArrowLeft, Bell, Menu } from "lucide-react-native";
import { colors } from "@/constants/colors";

interface NavigationBarProps {
  title: string;
  showBackButton?: boolean;
  showNotification?: boolean;
  showMenu?: boolean;
  rightComponent?: React.ReactNode;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  title,
  showBackButton = false,
  showNotification = false,
  showMenu = false,
  rightComponent,
  onMenuPress,
  onNotificationPress
}) => {
  const router = useRouter();
  const navigation = useNavigation();
  
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/");
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={colors.card}
      />
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={handleBackPress}
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          
          {showMenu && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={onMenuPress}
            >
              <Menu size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        <View style={styles.rightContainer}>
          {showNotification && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={onNotificationPress}
            >
              <Bell size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          
          {rightComponent}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.card,
    zIndex: 100,
  },
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: 80,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
});