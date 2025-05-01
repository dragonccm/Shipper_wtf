import React from "react";
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
  View
} from "react-native";
import { colors } from "@/constants/colors";
import * as Haptics from "expo-haptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  leftIcon,
  rightIcon
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  const getButtonStyle = () => {
    let buttonStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case "primary":
        buttonStyle.backgroundColor = colors.primary;
        break;
      case "secondary":
        buttonStyle.backgroundColor = colors.secondary;
        break;
      case "outline":
        buttonStyle.backgroundColor = "transparent";
        buttonStyle.borderWidth = 1;
        buttonStyle.borderColor = colors.primary;
        break;
      case "danger":
        buttonStyle.backgroundColor = colors.error;
        break;
    }
    
    // Size styles
    switch (size) {
      case "small":
        buttonStyle.paddingVertical = 8;
        buttonStyle.paddingHorizontal = 16;
        buttonStyle.borderRadius = 8;
        break;
      case "medium":
        buttonStyle.paddingVertical = 12;
        buttonStyle.paddingHorizontal = 24;
        buttonStyle.borderRadius = 10;
        break;
      case "large":
        buttonStyle.paddingVertical = 16;
        buttonStyle.paddingHorizontal = 32;
        buttonStyle.borderRadius = 12;
        break;
    }
    
    // Disabled state
    if (disabled) {
      buttonStyle.opacity = 0.5;
    }
    
    // Full width
    if (fullWidth) {
      buttonStyle.width = "100%";
    }
    
    return buttonStyle;
  };

  const getTextStyle = () => {
    let style: TextStyle = {
      fontWeight: "600",
    };
    
    // Size styles
    switch (size) {
      case "small":
        style.fontSize = 14;
        break;
      case "medium":
        style.fontSize = 16;
        break;
      case "large":
        style.fontSize = 18;
        break;
    }
    
    // Variant styles
    switch (variant) {
      case "primary":
      case "secondary":
      case "danger":
        style.color = "white";
        break;
      case "outline":
        style.color = colors.primary;
        break;
    }
    
    return style;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator 
            color={variant === "outline" ? colors.primary : "white"} 
            size="small" 
          />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <Text style={[getTextStyle(), textStyle]}>
              {title}
            </Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  }
});