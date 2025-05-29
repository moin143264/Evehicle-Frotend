import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useUserContext } from "../UserContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getApp } from "@react-native-firebase/app";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
const ScheduleAlert = ({ navigation }) => {
  const { userId } = useUserContext();
  const [bookings, setBookings] = useState([]);
  const [alertedBookings, setAlertedBookings] = useState(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const app = getApp();

  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          const { status: newStatus } =
            await Notifications.requestPermissionsAsync();
          if (newStatus !== "granted") {
            Alert.alert(
              "Permission Required",
              "Push notifications are required for important updates. Please enable them in your settings."
            );
          }
        }
      } catch (error) {
        console.error("Error requesting notification permissions:", error);
      }
    };

    requestPermissions();
  }, []);

  // Handle incoming FCM messages
  useEffect(() => {
    const unsubscribeFCM = messaging().onMessage(async (remoteMessage) => {
      console.log("A new FCM message arrived!", remoteMessage);
    });

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received!", notification);
      }
    );

    return () => {
      unsubscribeFCM();
      subscription.remove();
    };
  }, []);

  const onDateChange = (event, selected) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selected) {
      setSelectedDate(selected);
      fetchBookings(selected);
    }
  };

  const fetchBookings = async (date) => {
    try {
      if (!userId) {
        console.error("No user ID available");
        return;
      }

      const formattedDate = date.toISOString().split("T")[0];
      const response = await fetch(
        `https://evehicle-vercel.vercel.app/ap/payments?userId=${userId}&date=${formattedDate}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const filteredBookings = result.data.filter((booking) => {
          const bookingDate = new Date(booking.bookingDate)
            .toISOString()
            .split("T")[0];
          return bookingDate === formattedDate;
        });

        setBookings(filteredBookings);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        console.error("No booking data received");
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      Alert.alert(
        "Booking Fetch Error",
        "Unable to retrieve bookings. Please try again later."
      );
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBookings(selectedDate);
    }

    const interval = setInterval(() => {
      const now = new Date();
      bookings.forEach((booking) => {
        const status = getStatus(booking);
        if (!alertedBookings.has(booking._id)) {
          if (status === "Arriving in 10 minutes" || status === "Arrived") {
            setAlertedBookings((prev) => new Set(prev).add(booking._id)); // Mark as alerted
          }
        }
        notificationManager.current.checkAndNotify(booking, now);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [userId, alertedBookings, selectedDate]);

  const formatTimeDisplay = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const createDateFromTime = (date, time) => {
    const [hours, minutes] = time.split(":");
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours));
    newDate.setMinutes(parseInt(minutes));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Arriving in 10 minutes":
        return {
          backgroundColor: "#FFF3E0",
          color: "#FF9800",
          borderColor: "#FFB74D",
        };
      case "Arrived":
        return {
          backgroundColor: "#E8F5E9",
          color: "#4CAF50",
          borderColor: "#81C784",
        };
      case "Expired":
        return {
          backgroundColor: "#FFEBEE",
          color: "#F44336",
          borderColor: "#E57373",
        };
      default:
        return {
          backgroundColor: "#F5F5F5",
          color: "#9E9E9E",
          borderColor: "#BDBDBD",
        };
    }
  };

  const getStatus = (booking) => {
    if (
      !booking ||
      !booking.startTime ||
      !booking.endTime ||
      !booking.bookingDate
    ) {
      return "Pending";
    }

    const now = new Date();
    const bookingDate = new Date(booking.bookingDate);

    try {
      const [startTime, startPeriod] = booking.startTime.split(" ");
      const [endTime, endPeriod] = booking.endTime.split(" ");

      const [startHour, startMinute] = startTime.split(":");
      const [endHour, endMinute] = endTime.split(":");

      const startDateTime = new Date(bookingDate);
      startDateTime.setHours(
        startPeriod === "PM"
          ? startHour === "12"
            ? 12
            : parseInt(startHour) + 12
          : startHour === "12"
          ? 0
          : parseInt(startHour),
        parseInt(startMinute)
      );

      const adjustedEndHour = endHour === "00" ? 24 : parseInt(endHour);
      const endDateTime = new Date(bookingDate);
      endDateTime.setHours(
        endPeriod === "PM"
          ? adjustedEndHour === 12
            ? 12
            : adjustedEndHour + 12
          : adjustedEndHour === 12
          ? 0
          : adjustedEndHour,
        parseInt(endMinute)
      );

      // Check for status
      if (now < startDateTime) {
        return "Pending"; // Booking is in the future
      }

      const tenMinutesBefore = new Date(startDateTime.getTime() - 10 * 60000);

      if (now >= tenMinutesBefore && now < startDateTime) {
        return "Arriving in 10 minutes"; // 10 minutes before start
      } else if (now >= startDateTime && now <= endDateTime) {
        return "Arrived"; // Currently within booking time
      } else if (now > endDateTime) {
        return "Expired"; // Booking has ended
      }
      return "Pending"; // Default case
    } catch (error) {
      console.error("Error calculating status:", error);
      return "Pending";
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="event-busy" size={80} color="#BDBDBD" />
      <Text style={styles.emptyStateText}>No bookings available</Text>
      <Text style={styles.emptyStateSubText}>
        Your future bookings will appear here
      </Text>
      <TouchableOpacity
        style={styles.newBookingButton}
        onPress={() => navigation.navigate("Booking")}
      >
        <Text style={styles.newBookingButtonText}>Make a New Booking</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>EV Charging Station Alerts</Text>
        <Text style={styles.subHeaderText}>
          Stay updated on your EV station bookings
        </Text>
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-today" size={20} color="#4CAF50" />
            <Text style={styles.dateButtonText}>
              {selectedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              style={styles.datePicker}
            />
          )}
        </View>
      </View>

      <Animated.View
        style={[
          styles.cardsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {bookings.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              if (!item) return null;

              const status = getStatus(item);
              const statusStyle = getStatusStyle(status);

              return (
                <TouchableOpacity
                  style={[styles.card]}
                  onPress={() => {
                    /* Handle booking press */
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: statusStyle.backgroundColor },
                      ]}
                    >
                      <Icon
                        name="ev-station"
                        size={24}
                        color={statusStyle.color}
                      />
                    </View>

                    <View style={styles.cardDetails}>
                      <Text style={styles.cardTitle}>
                        {item.stationName || "Unknown Station"}
                      </Text>
                      <View style={styles.detailRow}>
                        <Icon name="location-on" size={16} color="#757575" />
                        <Text style={styles.detailText}>
                          {item.address || "Address not available"}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Icon name="event" size={16} color="#757575" />
                        <Text style={styles.detailText}>
                          {item.bookingDate
                            ? formatDate(item.bookingDate)
                            : "Date not available"}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Icon name="access-time" size={16} color="#757575" />
                        <Text style={styles.detailText}>
                          {item.startTime && item.endTime
                            ? `${item.startTime} - ${item.endTime}`
                            : "Time not available"}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Icon name="electric-car" size={16} color="#757575" />
                        <Text style={styles.detailText}>
                          {item.vehiclePlateNo || "Vehicle not specified"}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.backgroundColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusStyle.color },
                        ]}
                      >
                        {status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </Animated.View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="home" size={24} color="#757575" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <Icon name="notifications" size={24} color="#4CAF50" />
          <Text style={[styles.navText, styles.navTextActive]}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Booking")}
        >
          <Icon name="event" size={24} color="#757575" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 25,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A237E",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subHeaderText: {
    fontSize: 14,
    color: "#5C6BC0",
    textAlign: "center",
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  datePickerContainer: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  datePicker: {
    width: 320,
    backgroundColor: "white",
    marginTop: 10,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 60,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A237E",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#757575",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: "auto",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#BDBDBD",
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    marginTop: 8,
  },
  newBookingButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  newBookingButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
  },
  navButton: {
    alignItems: "center",
  },
  navButtonActive: {
    borderBottomWidth: 2,
    borderColor: "#4CAF50",
  },
  navText: {
    fontSize: 14,
    color: "#757575",
  },
  navTextActive: {
    color: "#4CAF50",
    fontWeight: "600",
  },
});

export default ScheduleAlert;
