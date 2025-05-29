import { enableScreens } from "react-native-screens";
enableScreens(); // Ensure this is called before other imports
import { SafeAreaProvider } from "react-native-safe-area-context";

import React, { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { UserProvider, useUser } from "./UserContext";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import axios from "axios";
import { StationsProvider } from "./StationsContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
// Screens imports
import UserProfileScreen from "./screens/UserProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import AdminPanel from "./screens/AdminPanel";
import ManageUsers from "./screens/ManageUsers";
import ManageStations from "./screens/ManageStations";
import AddStation from "./screens/AddStation";
import StationList from "./screens/StationList";
import StationScreen from "./screens/StationScreen";
import BookingScreen from "./screens/BookingScreen";
import PaymentScreen from "./screens/PaymentScreen";
import BookingConfirmation from "./screens/BookingConfirmation";
import UserBookings from "./screens/UserBookings";
import UserBookingDetails from "./screens/UserBookingDetails";
import { BookingAlertProvider } from "./BookingAlertContext";
import ScheduleAlert from "./screens/ScheduleAlert";
import PaymentManagementScreen from "./screens/PaymentManagementScreen ";
import StartPage from "./screens/StartPage";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Ensure AsyncStorage is imported
import ForgotPassword from "./screens/ForgotPassword";
import ResetPassword from "./screens/ResetPassword";
// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createStackNavigator();

// Navigation reference for use outside of components
export const navigationRef = React.createRef();

const App = () => {
  const [notification, setNotification] = useState(false);
  const responseListener = React.useRef();
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      // Store token in your backend or context if needed
      console.log("Push Token:", token);
      alert(token);
    });

    // Handle notification when app is in background and user taps it
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        handleNotificationResponse(data);
      });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Handle notification response
  const handleNotificationResponse = (data) => {
    if (data?.type === "booking" && data?.bookingId) {
      // Navigate to booking details
      navigationRef.current?.navigate("UserBookingDetails", {
        bookingId: data.bookingId,
      });
    }
  };

  // Register for push notifications
  async function registerForPushNotificationsAsync() {
    let token;

    if (!Device.isDevice) {
      // Return a dummy token for emulators
      return "emulator-" + Math.random().toString(36).substring(7);
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission Required",
        "Push notifications are required for important updates. Please enable them in your settings."
      );
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    // Store the push token in AsyncStorage
    await AsyncStorage.setItem("pushToken", token);
    // Store the token in your backend or context
    async function sendTokenToBackend(token) {
      try {
        const response = await fetch(
          "https://evehicle.up.railway.app/api/push-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }), // Send only the token
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        console.log("Token sent successfully:", data);
      } catch (error) {
        console.error("Error sending token to backend:", error);
        throw error; // Re-throw the error to handle it in the calling function
      }
    }
    await sendTokenToBackend(token); // Call the function here

    // Configure Android channel if needed
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StripeProvider publishableKey="pk_test_51Q8uua07CIuzAORvOPkNphnVDvfztI3AGlwMeVXceeQZrHsnAEvF0wOzvTvqLylyZTZ1puQVzotwQOIbFABkAoRS00BR5GdjVN">
          <UserProvider>
            <StationsProvider>
              <BookingAlertProvider>
                <Stack.Navigator
                  initialRouteName="StartPage"
                  screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: "#fff" },
                    cardStyleInterpolator: ({ current: { progress } }) => ({
                      cardStyle: {
                        opacity: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                      overlayStyle: {
                        opacity: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.5],
                          extrapolate: "clamp",
                        }),
                      },
                    }),
                  }}
                >
                  <Stack.Screen name="StartPage" component={StartPage} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen
                    name="UserProfile"
                    component={UserProfileScreen}
                  />
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="AdminPanel" component={AdminPanel} />
                  <Stack.Screen name="ManageUsers" component={ManageUsers} />
                  <Stack.Screen
                    name="ManageStations"
                    component={ManageStations}
                  />
                  <Stack.Screen name="AddStation" component={AddStation} />
                  <Stack.Screen name="StationList" component={StationList} />
                  <Stack.Screen name="Station" component={StationScreen} />
                  <Stack.Screen
                    name="BookingScreen"
                    component={BookingScreen}
                  />
                  <Stack.Screen
                    name="PaymentScreen"
                    component={PaymentScreen}
                  />
                  <Stack.Screen
                    name="BookingConfirmation"
                    component={BookingConfirmation}
                  />
                  <Stack.Screen name="Booking" component={UserBookings} />
                  <Stack.Screen
                    name="UserBookingDetails"
                    component={UserBookingDetails}
                  />
                  <Stack.Screen name="Schedule" component={ScheduleAlert} />
                  <Stack.Screen
                    name="ManagePayment"
                    component={PaymentManagementScreen}
                  />
                  <Stack.Screen
                    name="ForgotPassword"
                    component={ForgotPassword}
                  />
                  <Stack.Screen
                    name="ResetPassword"
                    component={ResetPassword}
                  />
                </Stack.Navigator>
              </BookingAlertProvider>
            </StationsProvider>
          </UserProvider>
        </StripeProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
