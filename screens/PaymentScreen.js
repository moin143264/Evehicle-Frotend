import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import * as Notifications from "expo-notifications";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import Config from "react-native-config";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserContext } from "../UserContext"; // Import the UserContext

const API_URL = "https://evehicle-vercel.vercel.app/api";
const COLORS = {
  PRIMARY: "#4CAF50",
  SECONDARY: "#388E3C",
  SUCCESS: "#10B981",
  WHITE: "#FFFFFF",
};

const convertTo12Hour = (time24) => {
  const [hours24, minutes] = time24.split(":");
  const hours = parseInt(hours24);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`;
};

const convertTo24Hour = (time12) => {
  if (!time12) return "";
  const [time, period] = time12.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} mins`;
  return `${hours}h ${remainingMinutes}m`;
};
const scheduleNotification = async (title, body, trigger) => {
  console.log(
    `Scheduling notification: ${title} - ${body} with trigger:`,
    trigger
  );
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
    },
    trigger: trigger,
  });

  console.log(`Notification scheduled: ${title} - ${body}`);
};

const PaymentScreen = ({ route, navigation }) => {
  const {
    station,
    selectedDate,
    startTime,
    duration,
    totalAmount,
    latitude,
    longitude,
    userEmail,
    vehiclePlateNo,
    chargingPoint,
    stationName,
    Address,
  } = route.params;
  console.log(station.address);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [endTime, setEndTime] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [pushToken, setPushToken] = useState(null); // State to store push token
  const { userId } = useUserContext(); // Get userId from UserContext
  console.log(pushToken);
  useEffect(() => {
    if (userId) {
      console.log("Fetched userId:", userId);
    } else {
      console.log("User ID not available");
    }
  }, [userId]);

  useEffect(() => {
    const fetchPushToken = async () => {
      const token = await AsyncStorage.getItem("pushToken");
      setPushToken(token); // Store the token in state
    };

    fetchPushToken();
    if (startTime && duration) {
      const time24 = convertTo24Hour(startTime);
      const [hours, minutes] = time24.split(":").map(Number);

      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours >= 24 ||
        minutes < 0 ||
        minutes >= 60
      ) {
        console.error("Invalid start time format:", startTime);
        setEndTime("Invalid Time");
        return;
      }

      const startDate = new Date();
      startDate.setHours(hours);
      startDate.setMinutes(minutes);
      startDate.setMinutes(startDate.getMinutes() + parseInt(duration));

      const endHours = startDate.getHours().toString().padStart(2, "0");
      const endMinutes = startDate.getMinutes().toString().padStart(2, "0");
      const endTime24 = `${endHours}:${endMinutes}`;
      setEndTime(convertTo12Hour(endTime24));
    }
  }, [startTime, duration]);

  const sendPushNotification = async (bookingData) => {
    if (!pushToken || !userId) return; // Exit if there's no token or user ID

    console.log("Sending push notification with token:", pushToken);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Payment Successful && Slot Is Booked.",
          body: `Your payment of ₹${bookingData.payment.amount} was successful. Booking ID: ${bookingData.payment.bookingId}.Charging Point:${bookingData.payment.chargingPoint.pointId}.`,
          data: { userId: userId }, // Optionally include userId in the data payload
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  };

  const fetchPaymentIntent = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${API_URL}/payments/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100),
            station: station.name || station,
            chargingPointId: chargingPoint.pointId,
            vehiclePlateNo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || "Failed to create payment intent"
        );
      }

      return data;
    } catch (error) {
      console.error("Payment Intent Error:", error);
      throw error;
    }
  };
  // Email sending function
  const sendEmail = async (emailData) => {
    try {
      console.log("Sending email with data:", emailData);

      // Get the authentication token
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Log the complete URL being called
      const emailEndpoint = `${API_URL}/send-email`;
      console.log("Calling API endpoint:", emailEndpoint);

      const response = await fetch(emailEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">Booking Confirmation</h2>
              <p>Dear Customer,</p>
              <p>${emailData.body}</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Station:</strong> ${stationName}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${selectedDate}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${formatDuration(
                  duration
                )}</p>
                <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${vehiclePlateNo}</p>
                <p style="margin: 5px 0;"><strong>Charging Point:</strong> ${
                  chargingPoint.pointId
                }</p>
              </div>
              <p style="color: #666;">Thank you for choosing our service!</p>
            </div>
          `,
        }),
      });

      // Log complete response details
      console.log("Response status:", response.status);
      console.log("Response headers:", {
        contentType: response.headers.get("content-type"),
        status: response.status,
        statusText: response.statusText,
      });

      if (response.status === 404) {
        throw new Error(
          "Email service endpoint not found. Please check API configuration."
        );
      }

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error(
          `Invalid response format. Expected JSON, got: ${responseText.substring(
            0,
            100
          )}...`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message || `Email sending failed with status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("Email Sending Error:", error);

      // Provide more specific error messages based on the error type
      if (error.message.includes("endpoint not found")) {
        throw new Error(
          "Email service is temporarily unavailable. Please try again later."
        );
      } else if (error.message.includes("Invalid response format")) {
        throw new Error("Server communication error. Please contact support.");
      } else {
        throw new Error(
          "Failed to send confirmation email. Please check your booking details in the app."
        );
      }
    }
  };
  const handlePayment = async () => {
    try {
      setLoading(true);
      const paymentData = await fetchPaymentIntent();

      if (!paymentData?.clientSecret) {
        throw new Error("Failed to get payment details");
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentData.clientSecret,
        merchantDisplayName: paymentData.merchantName || "EV Charging Point",
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      // After successful payment, fetch booking details
      const token = await AsyncStorage.getItem("token");
      const bookingResponse = await fetch(
        `${API_URL}/payments/confirm-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentIntentId: paymentData.paymentIntentId,
            stationId: station.id || station,
            chargingPoint: chargingPoint,
            bookingDate: selectedDate,
            startTime: startTime,
            endTime: endTime,
            duration,
            stationName: stationName,
            address: station.address,
            amount: totalAmount,
            latitude,
            longitude,
            userEmail,
            vehiclePlateNo,
          }),
        }
      );

      const bookingData = await bookingResponse.json();
      // Extract startTime and duration from bookingData
      // Log the bookingData for debugging
      console.log("Booking Data:", bookingData);

      if (!bookingData || !bookingData.payment) {
        throw new Error("Failed to confirm booking");
      }

      // Set payment summary
      setPaymentSummary({
        bookingId: bookingData.payment.bookingId,
        paymentStatus: bookingData.payment.paymentStatus,
        startTime: bookingData.payment.startTime,
        endTime: bookingData.payment.endTime,
        duration: bookingData.payment.duration,
        amount: bookingData.payment.amount,
        vehiclePlateNo: bookingData.payment.vehiclePlateNo,
        bookingDate: bookingData.payment.bookingDate,
        chargingPoint: bookingData.payment.chargingPoint,
      });

      // Show payment summary modal
      setShowSummary(true); // <-- Add this line to show the summary modal

      console.log("User Email:", userEmail);
      // Send email after successful payment
      await sendEmail({
        to: userEmail,
        subject: "Payment Successful & Slot Is Booked",
        body: `Your payment of ₹${totalAmount.toFixed(
          2
        )} was successful. Booking ID: ${bookingData.payment.bookingId}.`,
      });
      await sendPushNotification(bookingData); // Call to send the notification
    } catch (error) {
      console.error("Payment Error:", error);
      Alert.alert(
        "Payment Error",
        error.message || "An error occurred during payment processing"
      );
    } finally {
      setLoading(false);
    }
  };

  const scheduleReminders = async (userId, startTime, duration) => {
    console.log("Start Time:", startTime);

    // Convert startTime from 12-hour format to 24-hour format
    const [startHours, startMinutes] = convertTo24Hour(startTime)
      .split(":")
      .map(Number);
    const startDate = new Date();
    startDate.setHours(startHours);
    startDate.setMinutes(startMinutes);

    // Calculate end time using the duration
    const endTime = new Date(startDate.getTime() + duration * 60 * 1000);
    console.log(
      "End Time:",
      convertTo12Hour(`${endTime.getHours()}:${endTime.getMinutes()}`)
    );

    // Calculate arrival time (5 minutes before start time)
    const arrivalTime = new Date(startDate.getTime() - 5 * 60 * 1000);
    console.log("Current Time:", new Date().toLocaleString());
    console.log("Arrival Time:", arrivalTime.toLocaleString());

    // Calculate seconds until each notification
    const arrivalSeconds = Math.max(
      0,
      (arrivalTime.getTime() - Date.now()) / 1000
    );
    const startSeconds = Math.max(0, (startDate.getTime() - Date.now()) / 1000);
    const expireSeconds = Math.max(0, (endTime.getTime() - Date.now()) / 1000);

    console.log("Arrival Seconds:", arrivalSeconds);
    console.log("Start Seconds:", startSeconds);
    console.log("Expire Seconds:", expireSeconds);

    // Function to send notifications after a delay
    const sendNotificationAfterDelay = async (title, body, delay) => {
      if (delay > 0) {
        console.log(
          `Waiting for ${delay} seconds to send notification: ${title}`
        );
        setTimeout(async () => {
          await scheduleNotification(title, body, { seconds: 0 }); // Send immediately after waiting
        }, delay * 1000);
      } else {
        await scheduleNotification(title, body, { seconds: 0 }); // Send immediately
      }
    };

    // Schedule reminders
    await sendNotificationAfterDelay(
      "Reminder: Upcoming Booking",
      "Your booking is in 5 minutes!",
      arrivalSeconds
    );
    await sendNotificationAfterDelay(
      "Booking Started",
      "Your booking has started!",
      startSeconds
    );
    await sendNotificationAfterDelay(
      "Booking Expired",
      "Your booking has expired!",
      expireSeconds
    );
  };

  const scheduleRemindersAfterSummary = async () => {
    if (paymentSummary) {
      await scheduleReminders(
        userId,
        paymentSummary.startTime,
        paymentSummary.duration
      );
    }
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Processing payment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Details</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Summary</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🔌 Station</Text>
            <Text style={styles.detailValue}>{station.name || station}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🚗 Vehicle</Text>
            <Text style={styles.detailValue}>{vehiclePlateNo}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⚡ Charging Point</Text>
            <Text style={styles.detailValue}>{chargingPoint.pointId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Date</Text>
            <Text style={styles.detailValue}>{selectedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🕒 Start Time</Text>
            <Text style={styles.detailValue}>{startTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏱️ Duration</Text>
            <Text style={styles.detailValue}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏰ End Time</Text>
            <Text style={styles.detailValue}>{endTime}</Text>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>Pay Securely</Text>
        </TouchableOpacity>

        <Text style={styles.secureText}>
          🔒 Your payment is secure and encrypted
        </Text>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSummary}
        onRequestClose={() => {
          setShowSummary(false);
          navigation.navigate("Home");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalInner}>
              <View style={styles.modalHeader}>
                <View style={styles.successIconContainer}>
                  <Icon name="check-circle" size={50} color={COLORS.WHITE} />
                </View>
                <Text style={styles.modalTitle}>Payment Successful!</Text>
                <Text style={styles.bookingId}>
                  Booking ID: {paymentSummary?.bookingId}
                </Text>
              </View>

              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Station</Text>
                  <Text style={styles.summaryValue}>
                    {station.name || station}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>{selectedDate}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryValue}>
                    {startTime} - {endTime}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>
                    {formatDuration(duration)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vehicle</Text>
                  <Text style={styles.summaryValue}>{vehiclePlateNo}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount Paid</Text>
                  <Text style={[styles.summaryValue, styles.amountText]}>
                    ₹{totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={async () => {
                  setShowSummary(false); // Close the modal
                  navigation.navigate("Home"); // Navigate to Home immediately

                  // Schedule reminders after navigating
                  try {
                    await scheduleRemindersAfterSummary();
                    console.log("Reminders scheduled successfully.");
                  } catch (error) {
                    console.error("Error scheduling reminders:", error);
                    Alert.alert(
                      "Error",
                      "Failed to schedule reminders. Please try again."
                    );
                  }
                }}
              >
                <View style={styles.closeButtonContainer}>
                  <Text style={styles.closeButtonText}>Done</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="home" size={24} color="#2c3e50" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Notification")}
        >
          <Icon name="notifications" size={24} color="#2c3e50" />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Booking")}
        >
          <Icon name="event" size={24} color="#2c3e50" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Station")}
        >
          <Icon name="ev-station" size={24} color="#2c3e50" />
          <Text style={styles.navText}>Stations</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "#4CAF50",
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#718096",
  },
  detailValue: {
    fontSize: 16,
    color: "#2D3748",
    fontWeight: "500",
  },
  amountContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#E2E8F0",
  },
  amountLabel: {
    fontSize: 18,
    color: "#2D3748",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 24,
    color: "#4CAF50",
    fontWeight: "700",
    marginTop: 8,
  },
  payButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    elevation: 2,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secureText: {
    textAlign: "center",
    color: "#718096",
    fontSize: 14,
    marginTop: 16,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: "#2c3e50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    elevation: 5,
  },
  modalInner: {
    padding: 24,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryContainer: {
    marginTop: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#4B5563",
  },
  summaryValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  amountText: {
    color: COLORS.SUCCESS,
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 32,
  },
  closeButtonContainer: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default PaymentScreen;
