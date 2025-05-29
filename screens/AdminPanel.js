import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const AdminPanel = ({ navigation }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Logout function to navigate back to login page
  const handleLogout = () => {
    navigation.navigate("Login");
  };

  // Card data with updated theme
  const cardData = [
    {
      id: 1,
      title: "Charging Stations",
      subtitle: "Manage EV Charging Infrastructure",
      icon: "bolt",
      backgroundColor: "#00796b",
      screen: "ManageStations",
      borderColor: "#004d40", // Darker teal for border
    },
    {
      id: 2,
      title: "User Management",
      subtitle: "User Accounts & Permissions",
      icon: "users",
      backgroundColor: "#4A90E2",
      screen: "ManageUsers",
      borderColor: "#003d5b", // Darker blue for border
    },
    {
      id: 3,
      title: "Payment System",
      subtitle: "Billing & Transactions",
      icon: "credit-card",
      backgroundColor: "#48DBFB",
      screen: "ManagePayment",
      borderColor: "#007bb8", // Darker blue for border
    },
  ];

  const renderCard = (card) => (
    <TouchableOpacity
      key={card.id}
      style={[
        styles.cardContainer,
        {
          backgroundColor: card.backgroundColor,
          borderColor: card.borderColor,
        },
      ]}
      onPress={() => navigation.navigate(card.screen)}
    >
      <View style={styles.cardContent}>
        <Icon name={card.icon} size={40} color="#fff" style={styles.cardIcon} />
        <View>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#2C3E50"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerText}>EV Admin Hub</Text>
            <Text style={styles.subHeaderText}>
              Electric Mobility Management
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="sign-out" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards Container */}
      <Animated.View style={[styles.cardsContainer, { opacity: fadeAnim }]}>
        {cardData.map(renderCard)}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f7fa",
  },
  header: {
    backgroundColor: "#00796b",
    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingTop: 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subHeaderText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 50,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 3, // Added border width
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    marginRight: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
});

export default AdminPanel;
