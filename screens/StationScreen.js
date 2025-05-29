import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const AmenityIcon = ({ name }) => {
  const iconMap = {
    Parking: { icon: "local-parking", type: "material" },
    Restroom: { icon: "wc", type: "material" },
    WiFi: { icon: "wifi", type: "material" },
    Cafe: { icon: "coffee", type: "font-awesome" },
    WaitingArea: { icon: "chair", type: "font-awesome" },
    Shopping: { icon: "shopping-cart", type: "material" },
    Security: { icon: "security", type: "material" },
    AirFilling: { icon: "air", type: "material" },
  };

  const iconConfig = iconMap[name];

  return (
    <View style={styles.amenityIconContainer}>
      {iconConfig.type === "material" ? (
        <Icon name={iconConfig.icon} size={20} color="#4CAF50" />
      ) : (
        <FontAwesome5 name={iconConfig.icon} size={20} color="#4CAF50" />
      )}
      <Text style={styles.amenityIconText}>{name}</Text>
    </View>
  );
};

const ChargingPointCard = ({ point }) => (
  <View style={styles.chargingPointCard}>
    <LinearGradient
      colors={["#E8F5E9", "#C8E6C9"]}
      style={styles.chargingPointHeader}
    >
      <MaterialCommunityIcons
        name={point.type === "DC" ? "lightning-bolt" : "power-plug"}
        size={24}
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
    </LinearGradient>

    <View style={styles.chargingPointDetails}>
      <View style={styles.specRow}>
        <View style={styles.specItem}>
          <MaterialCommunityIcons name="flash" size={20} color="#666" />
          <Text style={styles.specLabel}>Type</Text>
          <Text style={styles.specValue}>{point.type}</Text>
        </View>
        <View style={styles.specItem}>
          <MaterialCommunityIcons
            name="electric-switch"
            size={20}
            color="#666"
          />
          <Text style={styles.specLabel}>Connector</Text>
          <Text style={styles.specValue}>{point.connectorType}</Text>
        </View>
      </View>

      <View style={styles.specRow}>
        <View style={styles.specItem}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={20}
            color="#666"
          />
          <Text style={styles.specLabel}>Power</Text>
          <Text style={styles.specValue}>{point.power} kW</Text>
        </View>
        <View style={styles.specItem}>
          <MaterialCommunityIcons name="sine-wave" size={20} color="#666" />
          <Text style={styles.specLabel}>Voltage</Text>
          <Text style={styles.specValue}>{point.inputVoltage}V</Text>
        </View>
      </View>

      <View style={styles.specRow}>
        <View style={styles.specItem}>
          <MaterialCommunityIcons name="current-ac" size={20} color="#666" />
          <Text style={styles.specLabel}>Current</Text>
          <Text style={styles.specValue}>{point.maxCurrent}A</Text>
        </View>
        <View style={styles.specItem}>
          <MaterialCommunityIcons name="currency-inr" size={20} color="#666" />
          <Text style={styles.specLabel}>Price</Text>
          <Text style={styles.specValue}>₹{point.price}/kWh</Text>
        </View>
      </View>

      <View style={styles.vehicleContainer}>
        <Text style={styles.vehicleLabel}>Supported Vehicles:</Text>
        <View style={styles.vehicleList}>
          {point.supportedVehicles.map((vehicle, index) => (
            <View key={index} style={styles.vehicleChip}>
              <FontAwesome5
                name={
                  vehicle === "Car"
                    ? "car"
                    : vehicle === "Bus"
                    ? "bus"
                    : vehicle === "Truck"
                    ? "truck"
                    : "motorcycle"
                }
                size={14}
                color="#4CAF50"
              />
              <Text style={styles.vehicleText}>{vehicle}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  </View>
);

const StationScreen = ({ route }) => {
  const { latitude, longitude, userEmail } = route.params;
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://evehicle-vercel.vercel.app/api/stations/nearby?latitude=${latitude}&longitude=${longitude}&radius=10`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching stations:", error);
      setStations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchStations();
    }
  }, [latitude, longitude]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStations();
  };

  const handleBook = (station) => {
    navigation.navigate("BookingScreen", {
      station,
      userEmail,
      stationLatitude: station.location?.latitude || "0",
      stationLongitude: station.location?.longitude || "0",
    });
  };

  const renderOperationalStatus = (status) => {
    const statusConfig = {
      Active: { color: "#4CAF50", icon: "check-circle" },
      Maintenance: { color: "#FFA000", icon: "build" },
      Offline: { color: "#F44336", icon: "error" },
      "Coming Soon": { color: "#2196F3", icon: "upcoming" },
    };

    const config = statusConfig[status] || statusConfig["Offline"];

    return (
      <View
        style={[
          styles.statusContainer,
          { backgroundColor: `${config.color}15` },
        ]}
      >
        <Icon name={config.icon} size={24} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {status}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Finding nearby stations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Charging Stations</Text>
        <Text style={styles.headerSubtitle}>
          {stations.length} stations found
        </Text>
      </View>

      {stations.length > 0 ? (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        >
          {stations.map((station, index) => (
            <View key={station._id || index} style={styles.stationCard}>
              <LinearGradient
                colors={["#4CAF50", "#2E7D32"]}
                style={styles.stationHeader}
              >
                <Text style={styles.stationName}>{station.name}</Text>
                {renderOperationalStatus(station.operationalStatus)}
              </LinearGradient>

              <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                  <Icon name="location-on" size={24} color="#4CAF50" />
                  <Text style={styles.infoValue}>{station.address}</Text>
                </View>

                <View style={styles.timeContainer}>
                  <View style={styles.timeRow}>
                    <Icon name="access-time" size={24} color="#4CAF50" />
                    <Text style={styles.timeText}>
                      Operating Hours: {station.operatingHours.open} -{" "}
                      {station.operatingHours.close}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Charging Points</Text>
                {station.chargingPoints.map((point, idx) => (
                  <ChargingPointCard key={idx} point={point} />
                ))}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {station.amenities.map((amenity, idx) => (
                    <AmenityIcon key={idx} name={amenity} />
                  ))}
                </View>

                <View style={styles.locationSection}>
                  <Text style={styles.sectionTitle}>Location</Text>
                  <View style={styles.coordinatesContainer}>
                    <View style={styles.coordinate}>
                      <Icon
                        name="location-searching"
                        size={20}
                        color="#4CAF50"
                      />
                      <Text style={styles.coordinateLabel}>Latitude</Text>
                      <Text style={styles.coordinateValue}>
                        {parseFloat(station.location.latitude).toFixed(4)}
                      </Text>
                    </View>
                    <View style={styles.coordinate}>
                      <Icon
                        name="location-searching"
                        size={20}
                        color="#4CAF50"
                      />
                      <Text style={styles.coordinateLabel}>Longitude</Text>
                      <Text style={styles.coordinateValue}>
                        {parseFloat(station.location.longitude).toFixed(4)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBook(station)}
              >
                <Icon name="electric-car" size={24} color="#FFF" />
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="location-off" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            No charging stations found nearby
          </Text>
          <Text style={styles.emptySubtext}>
            Try expanding your search area
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Icon name="refresh" size={20} color="#FFF" />
            <Text style={styles.retryButtonText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      )}

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
          onPress={() => navigation.navigate("Schedule")}
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
          style={[styles.navButton, styles.activeNavButton]}
          onPress={() =>
            navigation.navigate("Station", {
              latitude: latitude,
              longitude: longitude,
            })
          }
        >
          <Icon name="ev-station" size={24} color="#4CAF50" />
          <Text style={styles.activeNavText}>Stations</Text>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#E8F5E9",
    marginTop: 4,
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
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  stationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    overflow: "hidden",
  },
  stationHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stationName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  infoContainer: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoValue: {
    fontSize: 16,
    color: "#2D3748",
    marginLeft: 12,
    flex: 1,
  },
  timeContainer: {
    backgroundColor: "#F7FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    color: "#2D3748",
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 12,
  },
  chargingPointCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginVertical: 8,
    elevation: 2,
    overflow: "hidden",
  },
  chargingPointHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
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
  chargingPointDetails: {
    padding: 12,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  specItem: {
    flex: 1,
    alignItems: "center",
  },
  specLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  specValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
  },
  vehicleContainer: {
    marginTop: 12,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 8,
  },
  vehicleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vehicleChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  vehicleText: {
    fontSize: 12,
    color: "#2E7D32",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 12,
  },
  amenityIconContainer: {
    alignItems: "center",
    width: (width - 80) / 4,
  },
  amenityIconText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  locationSection: {
    marginTop: 16,
  },
  coordinatesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F7FAFC",
    padding: 16,
    borderRadius: 12,
  },
  coordinate: {
    alignItems: "center",
  },
  coordinateLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#718096",
    marginTop: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 8,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeNavButton: {
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
    backgroundColor: "#F5F5F5",
  },
  navText: {
    fontSize: 12,
    color: "#2c3e50",
    marginTop: 4,
  },
  activeNavText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 4,
  },
});

export default StationScreen;
