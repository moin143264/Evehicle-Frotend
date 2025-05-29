import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import gmapstyle from "../utils/gmapstyle";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MapView, { Marker, Polyline } from "react-native-maps";
import polyline from "@mapbox/polyline";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../utils/axiosInstance";
import {
  MaterialIcons as Icon,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
const { width } = Dimensions.get("window");

const MIN_ZOOM_DELTA = 0.0001;
const MAX_ZOOM_DELTA = 0.05;
const ZOOM_FACTOR = 0.5;

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [region, setRegion] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUserZooming, setIsUserZooming] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.005); // Initialize zoomLevel state
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [stations, setStations] = useState([]);
  const mapRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

  const fetchStations = async () => {
    try {
      const response = await axiosInstance.get("/stations/all");
      if (response.data && response.data.length > 0) {
        setStations(response.data);
      } else {
        setStations([]);
      }
    } catch (error) {
      setStations([]);
    }
  };

  const fetchUserEmail = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const response = await axiosInstance.get("/user-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserEmail(response.data.email);
    } catch (error) {}
  };

  const handleZoomIn = () => {
    if (region) {
      setIsUserZooming(true);
      const newZoomLevel = Math.max(zoomLevel * ZOOM_FACTOR, MIN_ZOOM_DELTA);
      setZoomLevel(newZoomLevel);
      mapRef.current?.animateToRegion(
        {
          ...region,
          latitudeDelta: newZoomLevel,
          longitudeDelta: newZoomLevel,
        },
        300
      );
      setTimeout(() => setIsUserZooming(false), 1000);
    }
  };

  const handleZoomOut = () => {
    if (region) {
      setIsUserZooming(true);
      const newZoomLevel = Math.min(zoomLevel / ZOOM_FACTOR, MAX_ZOOM_DELTA);
      setZoomLevel(newZoomLevel);
      mapRef.current?.animateToRegion(
        {
          ...region,
          latitudeDelta: newZoomLevel,
          longitudeDelta: newZoomLevel,
        },
        300
      );
      setTimeout(() => setIsUserZooming(false), 1000);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "name"]);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
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
      const storedUserName = await AsyncStorage.getItem("name");
      setUserName(storedUserName || "User");
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          Alert.alert("Permission Denied", "Location access is required.");
        }
      } else {
        setHasPermission(true);
      }
      await fetchUserEmail();
      await fetchStations();
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      if (hasPermission) {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") return;
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Best,
          });
          const { latitude, longitude } = location.coords;
          const initialRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setRegion(initialRegion);
          mapRef.current?.animateToRegion(initialRegion, 1000);
        } catch (error) {}
        setLoading(false);
      }
    };

    if (hasPermission) {
      fetchLocation();
    }
  }, [hasPermission]);

  const getDirections = async (startLat, startLng, endLat, endLng) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const points = polyline.decode(data.routes[0].geometry);
        const coordinates = points.map((coord) => ({
          latitude: coord[0],
          longitude: coord[1],
        }));
        return coordinates;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleStationSelect = async (station) => {
    if (region && station) {
      const points = await getDirections(
        region.latitude,
        region.longitude,
        Number(station.location.latitude),
        Number(station.location.longitude)
      );
      if (points) {
        setRouteCoordinates(points);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a73e8", "#34a853"]} style={styles.header}>
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => navigation.navigate("UserProfile")}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userName?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
      <Animated.View
        style={[
          styles.mapContainer,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Finding your location...</Text>
          </View>
        ) : region ? (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={region}
              customMapStyle={gmapstyle}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              onRegionChangeComplete={(newRegion) => {
                if (!isUserZooming) {
                  setRegion(newRegion);
                }
              }}
            >
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
                title="Your Location"
              >
                <View style={styles.markerContainer}>
                  <MaterialIcons name="electric-car" size={40} color="green" />
                </View>
              </Marker>
              {stations.map((station) => (
                <Marker
                  key={station._id}
                  coordinate={{
                    latitude: Number(station.location.latitude),
                    longitude: Number(station.location.longitude),
                  }}
                  onPress={() => handleStationSelect(station)}
                >
                  <View style={styles.markerContainer}>
                    <FontAwesome5
                      name="charging-station"
                      size={30}
                      color="green"
                    />
                  </View>
                </Marker>
              ))}
              {routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeWidth={6}
                  strokeColor="blue"
                />
              )}
            </MapView>
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={[styles.zoomButton, styles.zoomInButton]}
                onPress={handleZoomIn}
              >
                <MaterialIcons name="add" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <View style={styles.zoomLevelIndicator}>
                <Text style={styles.zoomLevelText}>
                  {`${Math.round((1 - zoomLevel / MAX_ZOOM_DELTA) * 100)}%`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={handleZoomOut}
              >
                <MaterialIcons name="remove" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#FF5252" />
            <Text style={styles.errorText}>Failed to load map</Text>
          </View>
        )}
      </Animated.View>
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonActive]}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialIcons name="home" size={24} color="#4CAF50" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Schedule")}
        >
          <MaterialIcons name="notifications" size={24} color="#718096" />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Booking")}
        >
          <MaterialIcons name="event" size={24} color="#718096" />
          <Text style={styles.navText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() =>
            navigation.navigate("Station", {
              latitude: region?.latitude,
              longitude: region?.longitude,
              userEmail: userEmail,
            })
          }
        >
          <MaterialIcons name="ev-station" size={24} color="#718096" />
          <Text style={styles.navText}>Stations</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 20 : 10,

    elevation: 10,
    backgroundColor: "transparent", // Set to transparent
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  headerContent: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userTextContainer: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  logoutButton: {
    position: "absolute",
    right: 20,
    top: Platform.OS === "ios" ? 50 : 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 12,
  },
  mapContainer: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#FF5252",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  zoomControls: {
    position: "absolute",
    right: 16,
    bottom: 100,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    elevation: 3,
  },
  zoomButton: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomLevelIndicator: {
    padding: 8,
    alignItems: "center",
  },
  zoomLevelText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "space-between",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navButtonActive: {
    borderRadius: 12,
    padding: 8,
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  navTextActive: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    flex: 1,
  },
  navText: {
    marginTop: 4,
    fontSize: 12,
    color: "#718096",
  },
});

export default HomeScreen;
