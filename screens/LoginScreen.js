import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import {
  MaterialIcons as Icon,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../utils/axiosInstance";
import { useUserContext } from "../UserContext";

const { width } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [role, setRole] = useState("user");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Initialize animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const { setUser } = useUserContext();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const startOtpTimer = () => {
    setOtpTimer(30);
    const interval = setInterval(() => {
      setOtpTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please fill in all fields");
      return;
    }

    if (isOtpSent && !otp) {
      Alert.alert("Missing OTP", "Please enter the OTP sent to your email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/login", {
        email,
        password,
        role,
        otp: isOtpSent ? otp : undefined,
      });

      if (response.data.requireOtp) {
        setIsOtpSent(true);
        startOtpTimer();
        Alert.alert("OTP Sent", "Please check your email for the OTP");
        setIsLoading(false);
        return;
      }

      setUser(response.data._id, response.data.token, response.data.role);

      await AsyncStorage.multiSet([
        ["token", response.data.token],
        ["name", response.data.name],
        ["role", response.data.role],
        ["_id", response.data._id],
      ]);

      if (response.data.role === "user") {
        navigation.navigate("Home", { userId: response.data._id, email });
      } else {
        navigation.navigate("AdminPanel");
      }
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error.response?.data?.error || "Please check your credentials"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a73e8" barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={["#1a73e8", "#34a853"]}
          style={styles.headerContainer}
        >
          <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="car-electric"
                size={50}
                color="#FFFFFF"
              />
              <Icon
                name="flash-on"
                size={40}
                color="#FFFFFF"
                style={styles.flashIcon}
              />
            </View>
            <Text style={styles.header}>EV Charging</Text>
            <Text style={styles.subHeader}>Power your journey</Text>
            <View style={styles.iconRow}>
              <MaterialCommunityIcons
                name="battery-charging"
                size={24}
                color="#FFFFFF"
              />
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={24}
                color="#FFFFFF"
              />
              <MaterialCommunityIcons
                name="ev-station"
                size={24}
                color="#FFFFFF"
              />
            </View>
          </Animated.View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.formContainer,
            {
              transform: [{ translateX: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.welcomeSection}>
            <MaterialCommunityIcons
              name="shield-check"
              size={28}
              color="#34a853"
            />
            <Text style={styles.welcomeText}>Secure Login</Text>
          </View>

          <View style={styles.inputContainer}>
            <Icon
              name="email"
              size={24}
              color="#1a73e8"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon
              name="lock"
              size={24}
              color="#1a73e8"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              placeholderTextColor="#666"
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.eyeIcon}
            >
              <Icon
                name={passwordVisible ? "visibility" : "visibility-off"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {isOtpSent && (
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="numeric"
                size={24}
                color="#1a73e8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor="#666"
              />
              {otpTimer > 0 && (
                <Text style={styles.timerText}>{otpTimer}s</Text>
              )}
            </View>
          )}

          <View style={styles.dropdownWrapper}>
            <View style={styles.roleIconContainer}>
              <MaterialCommunityIcons
                name="account-cog"
                size={24}
                color="#1a73e8"
              />
            </View>
            <DropDownPicker
              open={open}
              value={role}
              items={[
                { label: "User", value: "user" },
                { label: "Admin", value: "admin" },
              ]}
              setOpen={setOpen}
              setValue={setRole}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              placeholder="Select Role"
              placeholderStyle={styles.dropdownPlaceholder}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#1a73e8", "#34a853"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <MaterialCommunityIcons
                    name="battery-charging-100"
                    size={24}
                    color="#FFF"
                    style={[styles.loadingIcon, styles.rotating]}
                  />
                  <Text style={styles.buttonText}>Charging Up...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <MaterialCommunityIcons
                    name="power-plug"
                    size={24}
                    color="#FFF"
                  />
                  <Text style={styles.buttonText}>Power Up</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={24}
              color="#1a73e8"
            />
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to EV Charging?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              style={styles.registerButton}
            >
              <MaterialCommunityIcons
                name="account-plus"
                size={20}
                color="#1a73e8"
              />
              <Text style={styles.link}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  forgotPasswordButton: {
    marginTop: 12,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#1a73e8",
    fontSize: 16,
    fontWeight: "600",
  },
  headerContainer: {
    height: "35%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 16,
  },
  flashIcon: {
    position: "absolute",
    right: -20,
    top: -10,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    width: "60%",
    justifyContent: "space-between",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  subHeader: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 8,
  },
  welcomeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#34a853",
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E8FF",
    marginBottom: 16,
    height: 56,
    elevation: 2,
  },
  roleIconContainer: {
    position: "absolute",
    left: 12,
    top: 16,
    zIndex: 3001,
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: "#2D3748",
    paddingLeft: 8,
  },
  gradientButton: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    marginTop: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rotating: {
    transform: [{ rotate: "360deg" }],
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    justifyContent: "center",
  },
  dividerLine: {
    width: 80,
    height: 1,
    backgroundColor: "#E1E8FF",
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  footerText: {
    fontSize: 16,
    color: "#718096",
  },
  link: {
    fontSize: 16,
    color: "#1a73e8",
    fontWeight: "600",
    marginLeft: 4,
  },
  dropdownWrapper: {
    marginBottom: 20,
    zIndex: 3000,
  },
  dropdown: {
    borderRadius: 12,
    borderColor: "#E1E8FF",
    height: 56,
    backgroundColor: "#F8FAFF",
    paddingLeft: 40,
  },
  dropdownContainer: {
    borderColor: "#E1E8FF",
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 16,
    color: "#2D3748",
  },
  timerText: {
    color: "#1a73e8",
    marginRight: 12,
    fontSize: 14,
  },
});

export default LoginScreen;
