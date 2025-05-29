import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axiosInstance from "../utils/axiosInstance";

const { width } = Dimensions.get("window");

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

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

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

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

  const sendOtp = async () => {
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/send-otp", { email });
      setIsOtpSent(true);
      startOtpTimer();
      Alert.alert("Success", "OTP has been sent to your email");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/verify-otp", { email, otp });
      if (response.data.success) {
        await handleRegister();
      } else {
        Alert.alert("Error", "Invalid OTP");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to verify OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const registrationData = {
        name,
        email,
        password,
        pushToken,
        deviceInfo: {
          ...deviceInfo,
          lastUpdated: new Date(),
        },
      };
      const response = await axiosInstance.post("/register", registrationData);
      await AsyncStorage.multiSet([
        ["name", name],
        ["email", email],
        ["pushToken", pushToken || ""],
        ["deviceInfo", JSON.stringify(deviceInfo)],
      ]);
      Alert.alert(
        "Success",
        "Registration successful! Please login to continue.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Registration failed";
      Alert.alert("Error", errorMessage);
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
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerContainer}
        >
          <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="car-electric"
                size={50}
                color="#FFFFFF"
              />
              <MaterialCommunityIcons
                name="lightning-bolt"
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.formContainer,
              { transform: [{ translateX: slideAnim }], opacity: fadeAnim },
            ]}
          >
            <View style={styles.welcomeSection}>
              <MaterialCommunityIcons
                name="shield-check"
                size={28}
                color="#34a853"
              />
              <Text style={styles.welcomeText}>Create Account</Text>
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color="#1a73e8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#666"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
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
              <MaterialCommunityIcons
                name="lock"
                size={24}
                color="#1a73e8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={passwordVisible ? "eye" : "eye-off"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-check"
                size={24}
                color="#1a73e8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
                style={styles.eyeIcon}
              >
                <MaterialCommunityIcons
                  name={confirmPasswordVisible ? "eye" : "eye-off"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {isOtpSent ? (
              <>
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
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={verifyOtp}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#1a73e8", "#34a853"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={24}
                          color="#FFF"
                        />
                        <Text style={styles.buttonText}>Verify OTP</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={sendOtp}
                disabled={isLoading || otpTimer > 0}
              >
                <LinearGradient
                  colors={["#1a73e8", "#34a853"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <MaterialCommunityIcons
                        name="email-send"
                        size={24}
                        color="#FFF"
                      />
                      <Text style={styles.buttonText}>
                        {otpTimer > 0
                          ? `Resend OTP in ${otpTimer}s`
                          : "Send OTP"}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

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
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={styles.loginButton}
              >
                <MaterialCommunityIcons
                  name="login"
                  size={20}
                  color="#1a73e8"
                />
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
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
  headerContainer: {
    height: "35%",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    marginBottom: 15,
  },
  headerContent: {
    alignItems: "center",
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
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    width: "60%",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subHeader: {
    fontSize: 18,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
  eyeIcon: {
    padding: 12,
  },
  button: {
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    marginTop: 8,
  },
  gradientButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
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
  loginButton: {
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
});

export default RegisterScreen;
