import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";

const { width } = Dimensions.get("window");
const API_BASE_URL = "https://evehicle-vercel.vercel.app/api";

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

const convertTimeStringToHour = (timeString) => {
  const [time, period] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours;
};

const ChargingPointCard = ({ point, isSelected, onSelect }) => {
  const calculatePriceDisplay = (price) => {
    return `₹${price.toFixed(2)}/kWh`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.chargingPointCard,
        isSelected && styles.selectedChargingPoint,
        point.status !== "Available" && styles.disabledChargingPoint,
      ]}
      onPress={() => point.status === "Available" && onSelect(point)}
      disabled={point.status !== "Available"}
    >
      <View style={styles.chargingPointMainInfo}>
        <View style={styles.pointIdContainer}>
          <MaterialCommunityIcons
            name={point.type === "DC" ? "lightning-bolt" : "power-plug"}
            size={20}
            color="#2E7D32"
          />
          <Text style={styles.chargingPointTitle}>{point.pointId}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  point.status === "Available"
                    ? "#4CAF50"
                    : point.status === "Occupied"
                    ? "#FFA000"
                    : point.status === "Maintenance"
                    ? "#F44336"
                    : "#757575",
              },
            ]}
          >
            <Text style={styles.statusText}>{point.status}</Text>
          </View>
        </View>

        <View style={styles.mainSpecs}>
          <View style={styles.specItemCompact}>
            <MaterialCommunityIcons name="flash" size={16} color="#666" />
            <Text style={styles.specValueCompact}>{point.type}</Text>
          </View>
          <View style={styles.specItemCompact}>
            <MaterialCommunityIcons
              name="electric-switch"
              size={16}
              color="#666"
            />
            <Text style={styles.specValueCompact}>{point.connectorType}</Text>
          </View>
          <View style={styles.specItemCompact}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={16}
              color="#666"
            />
            <Text style={styles.specValueCompact}>{point.power}</Text>
          </View>
          <View style={styles.specItemCompact}>
            <MaterialCommunityIcons
              name="currency-inr"
              size={16}
              color="#666"
            />
            <Text style={styles.specValueCompact}>
              {calculatePriceDisplay(point.price)}
            </Text>
          </View>
        </View>

        <View style={styles.vehicleListCompact}>
          {point.supportedVehicles.map((vehicle, index) => (
            <View key={index} style={styles.vehicleChipCompact}>
              <FontAwesome5
                name={
                  vehicle === "Car"
                    ? "car"
                    : vehicle === "Bus"
                    ? "bus"
                    : vehicle === "Truck"
                    ? "truck"
                    : vehicle === "Three Wheeler"
                    ? "truck-pickup"
                    : "motorcycle"
                }
                size={12}
                color="#4CAF50"
              />
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const BookingScreen = ({ route, navigation }) => {
  const { station, userEmail } = route.params;
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [endTime, setEndTime] = useState("");
  const [vehiclePlateNo, setVehiclePlateNo] = useState("");
  const [availableStartTimesByPoint, setAvailableStartTimesByPoint] = useState(
    {}
  );
  const [selectedChargingPoint, setSelectedChargingPoint] = useState(null);
  const [chargingPoints, setChargingPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    setSelectedDate(today);
    setChargingPoints(station.chargingPoints || []);
  }, [station]);
  useEffect(() => {
    if (selectedDate && selectedChargingPoint) {
      fetchBookedSlots(selectedChargingPoint.pointId);
    }
  }, [selectedDate, selectedChargingPoint]);

  const fetchBookedSlots = async (pointId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/bookings/slots`, {
        params: {
          date: selectedDate,
          chargingPointId: pointId,
          stationId: station._id,
        },
      });

      const slots = response.data;
      console.log("Fetched booked slots:", slots); // Log fetched booked slots
      generateTimeSlots(new Date(), pointId, slots);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      Alert.alert("Error", "Failed to fetch available time slots");
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (now, pointId, bookedSlots) => {
    const timeSlots = [];
    const bookedTimeMap = new Map();

    bookedSlots.forEach((booking) => {
      console.log("Processing booking:", booking);
      if (booking.chargingPointId === pointId) {
        const startHour = convertTimeStringToHour(booking.startTime);
        const endHour = convertTimeStringToHour(booking.endTime);

        // Adjust endHour if it is 0 (12 AM)
        const adjustedEndHour = endHour === 0 ? 24 : endHour;

        console.log(
          `Start Hour: ${startHour}, Adjusted End Hour: ${adjustedEndHour}`
        ); // Log start and adjusted end hours

        // Mark all hours in the booked range as booked, including the adjusted end hour
        for (let hour = startHour; hour < adjustedEndHour; hour++) {
          bookedTimeMap.set(hour, true);
        }
      }
    });

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let startHour;
    const endHour = 23;
    // Set startHour based on current time
    if (currentMinute < 30) {
      startHour = currentHour; // Use current hour if minutes are less than 30
    } else {
      startHour = currentHour + 1; // Increment hour if minutes are 30 or more
    }
    for (let i = startHour; i <= endHour; i++) {
      const time24 = `${String(i).padStart(2, "0")}:00`;
      const time12 = convertTo12Hour(time24);

      const availableDurations = [];
      const isBooked = bookedTimeMap.has(i);

      console.log(`Checking time: ${time12}, Is Booked: ${isBooked}`); // Log each time check

      if (!isBooked) {
        [60, 120, 180].forEach((duration) => {
          const hoursNeeded = duration / 60;
          let available = true;

          for (let h = i; h < i + hoursNeeded && h <= 24; h++) {
            if (bookedTimeMap.has(h)) {
              available = false;
              break;
            }
          }

          if (available) {
            availableDurations.push(duration);
          }
        });
      }

      console.log(`Available Durations for ${time12}: ${availableDurations}`); // Log available durations

      timeSlots.push({
        time24,
        time12,
        isBooked,
        availableDurations,
      });
    }

    setAvailableStartTimesByPoint((prev) => ({
      ...prev,
      [pointId]: timeSlots,
    }));
  };
  const handleVehiclePlateChange = (text) => {
    const formattedText = text.toUpperCase().replace(/\s/g, "");
    setVehiclePlateNo(formattedText);
  };

  const handleChargingPointSelect = (point) => {
    setSelectedChargingPoint(point);
    setStartTime("");
    setDuration("");
    setEndTime("");
    if (selectedDate) {
      fetchBookedSlots(point.pointId);
    }
  };
  const handleStartTimeChange = (selectedTime12) => {
    setStartTime(selectedTime12);
    const selectedTime24 = convertTo24Hour(selectedTime12);
    const selectedSlot = availableStartTimesByPoint[
      selectedChargingPoint.pointId
    ]?.find((slot) => slot.time12 === selectedTime12);

    if (selectedSlot && selectedSlot.availableDurations) {
      let filteredDurations = selectedSlot.availableDurations;

      // Apply filtering based on the selected start time only for PM
      if (selectedTime12.endsWith("PM")) {
        if (selectedTime12.startsWith("10:")) {
          // 10 PM
          filteredDurations = filteredDurations.filter(
            (d) => d === 60 || d === 120
          );
        } else if (selectedTime12.startsWith("11:")) {
          // 11 PM
          filteredDurations = filteredDurations.filter((d) => d === 60);
        }
      }

      // Update the available durations for the picker
      setDuration("");
      setEndTime("");
      setAvailableStartTimesByPoint((prev) => ({
        ...prev,
        [selectedChargingPoint.pointId]: prev[
          selectedChargingPoint.pointId
        ].map((slot) =>
          slot.time12 === selectedTime12
            ? { ...slot, availableDurations: filteredDurations }
            : slot
        ),
      }));
    }
  };

  const handleDurationChange = (duration) => {
    setDuration(duration);
    const time24 = convertTo24Hour(startTime);
    calculateEndTime(time24, duration);
  };

  const calculateEndTime = (startTime24, duration) => {
    if (!startTime24 || !duration || !selectedDate) return;

    const [hours, minutes] = startTime24.split(":");
    const startDateTime = new Date(`${selectedDate}T${hours}:${minutes}:00`);

    if (isNaN(startDateTime)) {
      console.error(
        "Invalid start date-time:",
        `${selectedDate}T${hours}:${minutes}:00`
      );
      return;
    }

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(duration));

    const endHours = String(endDateTime.getHours()).padStart(2, "0");
    const endMinutes = String(endDateTime.getMinutes()).padStart(2, "0");
    const endTime24 = `${endHours}:${endMinutes}`;
    const endTime12 = convertTo12Hour(endTime24);

    setEndTime(endTime12);
  };

  const calculateTotalAmount = () => {
    if (!selectedChargingPoint || !duration) return 0;
    const hours = duration / 60;
    return selectedChargingPoint.price * hours;
  };

  const handleBooking = async () => {
    if (!vehiclePlateNo.trim()) {
      Alert.alert("Error", "Please enter your vehicle plate number");
      return;
    }

    if (!selectedChargingPoint) {
      Alert.alert("Error", "Please select a charging point");
      return;
    }

    try {
      const totalAmount = calculateTotalAmount();

      navigation.navigate("PaymentScreen", {
        stationName: station.name,
        Address: station.Address,
        station,
        selectedDate,
        startTime: startTime,
        duration,
        totalAmount,
        vehiclePlateNo,
        chargingPoint: selectedChargingPoint,
        latitude: station.location.latitude,
        longitude: station.location.longitude,
        userEmail,
      });
    } catch (error) {
      console.error("Error during booking:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />

      <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.header}>
        <Text style={styles.headerTitle}>Book Your Charging Slot</Text>
        <Text style={styles.stationName}>{station.name}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <View style={styles.cardTitleContainer}>
            <Icon name="event" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Select Date</Text>
          </View>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => {
              if (day.dateString === selectedDate) {
                setSelectedDate(day.dateString);
                setStartTime("");
                setDuration("");
                setEndTime("");
                if (selectedChargingPoint) {
                  fetchBookedSlots(selectedChargingPoint.pointId);
                }
              }
            }}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: "#4CAF50" },
            }}
            minDate={selectedDate} // Disable dates before today
            maxDate={selectedDate} // Disable dates after today
            theme={{
              todayTextColor: "#4CAF50",
              selectedDayBackgroundColor: "#4CAF50",
              selectedDayTextColor: "#ffffff",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
              arrowColor: "#4CAF50",
            }}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <Icon name="directions-car" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Vehicle Details</Text>
          </View>
          <Text style={styles.inputLabel}>Vehicle Plate Number</Text>
          <Text style={styles.inputFormat}>Format: XX00XX0000</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Vehicle Plate Number"
            value={vehiclePlateNo}
            onChangeText={handleVehiclePlateChange}
            placeholderTextColor="#A0AEC0"
            autoCapitalize="characters"
            maxLength={10}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <Icon name="ev-station" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Select Charging Point</Text>
          </View>
          {chargingPoints.map((point, index) => (
            <ChargingPointCard
              key={index}
              point={point}
              isSelected={selectedChargingPoint?.pointId === point.pointId}
              onSelect={handleChargingPointSelect}
            />
          ))}
        </View>
        {selectedChargingPoint && (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <Icon name="access-time" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Select Start Time</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={startTime}
                  style={styles.picker}
                  onValueChange={handleStartTimeChange}
                >
                  <Picker.Item label="Choose start time" value="" />
                  {availableStartTimesByPoint[
                    selectedChargingPoint.pointId
                  ]?.map((slot, index) => (
                    <Picker.Item
                      key={index}
                      label={`${slot.time12}${
                        slot.isBooked ? " (Booked)" : ""
                      }`}
                      value={slot.time12}
                      enabled={!slot.isBooked}
                      color={slot.isBooked ? "#A0AEC0" : "#2D3748"}
                    />
                  ))}
                </Picker>
              </View>
            )}
          </View>
        )}
        {startTime && (
          <View style={styles.card}>
            <View style={styles.cardTitleContainer}>
              <Icon name="timer" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Select Duration</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={duration}
                style={styles.picker}
                onValueChange={handleDurationChange}
              >
                <Picker.Item label="Choose duration" value="" />
                {availableStartTimesByPoint[selectedChargingPoint.pointId]
                  ?.find((slot) => slot.time12 === startTime)
                  ?.availableDurations.map((durationOption) => (
                    <Picker.Item
                      key={durationOption}
                      label={`${durationOption} minutes`}
                      value={durationOption}
                      color="#2D3748"
                    />
                  ))}
              </Picker>
            </View>
          </View>
        )}

        {startTime && duration && endTime && selectedChargingPoint && (
          <View style={styles.summaryCard}>
            <View style={styles.cardTitleContainer}>
              <Icon name="summarize" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Booking Summary</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{selectedDate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vehicle:</Text>
              <Text style={styles.summaryValue}>{vehiclePlateNo}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Charging Point:</Text>
              <Text style={styles.summaryValue}>
                {selectedChargingPoint.pointId}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Start Time:</Text>
              <Text style={styles.summaryValue}>{startTime}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{duration} minutes</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>End Time:</Text>
              <Text style={styles.summaryValue}>{endTime}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>
                ₹{calculateTotalAmount().toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBooking}
              activeOpacity={0.8}
            >
              <Icon name="bolt" size={24} color="#FFF" />
              <Text style={styles.bookButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {(!startTime ||
          !duration ||
          !vehiclePlateNo ||
          !selectedChargingPoint) && (
          <Text style={styles.warning}>
            Please complete all booking details above
          </Text>
        )}
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
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  stationName: {
    fontSize: 16,
    color: "#E8F5E9",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: "#4A5568",
    marginBottom: 4,
    fontWeight: "500",
  },
  inputFormat: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 8,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2D3748",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chargingPointCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  selectedChargingPoint: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  disabledChargingPoint: {
    opacity: 0.5,
    backgroundColor: "#F5F5F5",
  },
  chargingPointMainInfo: {
    gap: 8,
  },
  pointIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  chargingPointTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
  mainSpecs: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  specItemCompact: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  specValueCompact: {
    fontSize: 12,
    color: "#2D3748",
    fontWeight: "500",
  },
  vehicleListCompact: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  vehicleChipCompact: {
    backgroundColor: "#E8F5E9",
    padding: 6,
    borderRadius: 8,
  },
  pickerContainer: {
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#718096",
  },
  summaryValue: {
    fontSize: 16,
    color: "#2D3748",
    fontWeight: "500",
  },
  bookButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    elevation: 2,
  },
  bookButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 8,
  },
  warning: {
    fontSize: 14,
    color: "#F56565",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
});

export default BookingScreen;
