import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width } = Dimensions.get("window");

export default function PaymentManagementScreen() {
  // State Management
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Date Filter States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  // Fetch Payments Function
  const fetchPayments = async () => {
    try {
      setLoading(true);

      const dateParam = selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : null;

      const url = dateParam
        ? `https://evehicle-vercel.vercel.app/payments?date=${dateParam}`
        : "https://evehicle-vercel.vercel.app/payments";

      const response = await axios.get(url);

      setPayments(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError("Error fetching payments. Please try again.");
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();

    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    setSelectedDate(currentDate);
    setIsFiltered(true);
  };

  const clearDateFilter = () => {
    setIsFiltered(false);
    setSelectedDate(null);
  };

  const renderPaymentItem = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100)}
      layout={Layout.springify()}
      style={styles.paymentCardContainer}
    >
      <View style={styles.paymentCard}>
        {/* Payment Header */}
        <View style={styles.paymentHeader}>
          <View style={styles.amountContainer}>
            <Icon name="" size={24} color="#2ecc71" />
            <Text style={styles.amountText}>₹{item.amount}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Icon name="calendar-today" size={20} color="#7f8c8d" />
            <Text style={styles.dateText}>
              {new Date(item.bookingDate).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentDetails}>
          {[
            { icon: "email", label: "User Email", value: item.userEmail },
            { icon: "location-on", label: "Station ID", value: item.stationId },
            {
              icon: "timer",
              label: "Booking Duration",
              value: `${item.duration} mins`,
            },
            {
              icon:
                item.paymentStatus === "succeeded" ? "check-circle" : "error",
              label: "Payment Status",
              value: item.paymentStatus,
              color: item.paymentStatus === "succeeded" ? "#2ecc71" : "#e74c3c",
            },
          ].map((detail, idx) => (
            <View key={idx} style={styles.detailRow}>
              <View style={styles.iconLabelContainer}>
                <Icon
                  name={detail.icon}
                  size={20}
                  color={detail.color || "#3498db"}
                />
                <Text style={styles.labelText}>{detail.label}:</Text>
              </View>
              <Text
                style={[
                  styles.valueText,
                  detail.label === "Payment Status" &&
                    (detail.value === "succeeded"
                      ? styles.successStatus
                      : styles.failedStatus),
                ]}
              >
                {detail.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  // Loading State
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <View style={styles.loadingTextContainer}>
          <Icon name="hourglass-empty" size={30} color="#3498db" />
          <Text style={styles.loadingText}>Loading Payments...</Text>
        </View>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Icon name="error-outline" size={50} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Icon name="refresh" size={20} color="#3498db" />
          <Text style={styles.retryText}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title and Filter Section */}
      <View style={styles.titleContainer}>
        <Icon name="payment" size={30} color="#00796b" />
        <Text style={styles.title}>Payment Management</Text>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="filter-list" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Date Filter Indicator */}
      {isFiltered && selectedDate && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterText}>
            Showing payments for {selectedDate.toLocaleDateString()}
          </Text>
          <TouchableOpacity onPress={clearDateFilter}>
            <Icon name="close" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      )}

      {/* Payments List */}
      <FlatList
        data={payments}
        keyExtractor={(item) => item._id}
        renderItem={renderPaymentItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3498db"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centeredContainer}>
            <Icon name="inbox" size={50} color="#bdc3c7" />
            <Text style={styles.emptyText}>
              {isFiltered
                ? "No payments found for selected date"
                : "No payments available"}
            </Text>
          </View>
        }
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedDate || new Date()}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#00796b",
  },
  paymentCardContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
  },
  paymentCard: {
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: "#f9f9f9",
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 10,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2ecc71",
    marginLeft: 5,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#7f8c8d",
    marginLeft: 5,
  },
  paymentDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  iconLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelText: {
    color: "#34495e",
    fontWeight: "600",
    marginLeft: 10,
  },
  valueText: {
    color: "#00796b",
    fontWeight: "500",
  },
  statusText: {
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  successStatus: {
    color: "#2ecc71",
  },
  failedStatus: {
    color: "#e74c3c",
  },
  loadingTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#3498db",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  retryText: {
    color: "#3498db",
    marginTop: 10,
    textAlign: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    color: "#7f8c8d",
  },
  filterButton: {
    position: "absolute",
    right: 15,
  },
  filterIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  filterText: {
    color: "#00796b",
  },
});
