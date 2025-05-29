import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { useUserContext } from "../UserContext"; // Import UserContext

const BookingConfirmation = ({ route, navigation }) => {
  const {
    stationName,
    userEmail,
    stationId,
    stationAdrres,
    selectedDate,
    startTime,
    duration,
    totalAmount,
    paymentId,
    paymentStatus,
    bookingDetails,
    paymentIntentId,
    endTime,
    latitude,
    longitude,
  } = route.params;
  const { userId } = useUserContext(); // Get userId from context
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState(null); // New state for storing booking ID

  useEffect(() => {
    saveBookingDetails();
  }, []);

  const saveBookingDetails = async () => {
    if (!userId) {
      Alert.alert("Error", "User is not logged in.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        "https://evehicle-vercel.vercel.app/api/bookings",
        {
          stationName,
          userEmail,
          stationId,
          stationAdrres,
          selectedDate,
          startTime,
          duration,
          totalAmount,
          paymentId,
          paymentStatus,
          bookingDetails,
          paymentIntentId,
          userId,
          endTime,
          latitude,
          longitude,
        }
      );

      console.log("Booking saved:", response.data);
      setIsLoading(false);

      const { bookingId } = response.data;
      setBookingId(bookingId);

      Alert.alert("Success", "Your booking has been saved successfully.");
    } catch (error) {
      console.error("Error saving booking:", error);
      setIsLoading(false);
      Alert.alert("Error", "There was an error saving your booking.");
    }
  };

  return (
    // <ScrollView style={styles.container}> {/* Wrap content in ScrollView */}
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <MaterialIcons name="check-circle" size={80} color="#FFFFFF" />
        <Text style={styles.headerText}>Booking Confirmed!</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="ev-station" size={24} color="#4CAF50" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Charging Station</Text>
              <Text style={styles.detailValue}>{stationName}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="ev-station" size={24} color="#4CAF50" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Charging Station Address</Text>
              <Text style={styles.detailValue}>{stationAdrres}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="event" size={24} color="#4CAF50" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {selectedDate || bookingDetails?.bookingDate || "Not available"}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="access-time" size={24} color="#4CAF50" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time & Duration</Text>
              <Text style={styles.detailValue}>
                {startTime || bookingDetails?.startTime} (
                {duration || bookingDetails?.duration} minutes)
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <MaterialIcons
                name="confirmation-number"
                size={24}
                color="#4CAF50"
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Booking ID</Text>
              <Text style={styles.detailValue}>
                {bookingId ? `${bookingId}` : "Not available"}
              </Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amountValue}>
              ₹
              {totalAmount?.toFixed(2) ||
                bookingDetails?.amount?.toFixed(2) ||
                "0.00"}
            </Text>
            {paymentStatus && (
              <Text style={[styles.paymentStatus, { color: "#4CAF50" }]}>
                Payment Successful
              </Text>
            )}
          </View>
        </View>

        <View style={styles.noteCard}>
          <MaterialIcons name="info" size={24} color="#4CAF50" />
          <Text style={styles.noteText}>
            A confirmation has been sent to your registered email address
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="home"
              size={24}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewBookingsButton}
            onPress={() => navigation.navigate("Booking")}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="list-alt"
              size={24}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>View Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: "center",
    padding: 40,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  headerText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#2D3748",
    fontWeight: "600",
  },
  amountContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 16,
    color: "#718096",
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4CAF50",
  },
  paymentStatus: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: "500",
  },
  noteCard: {
    backgroundColor: "#E8F5E9",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  noteText: {
    flex: 1,
    marginLeft: 12,
    color: "#2D3748",
    fontSize: 14,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  homeButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  viewBookingsButton: {
    backgroundColor: "#388E3C",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default BookingConfirmation;
