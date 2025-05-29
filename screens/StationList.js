import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Animated 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAllStations, deleteStation } from '../services/stationService';

const StationList = () => {
  const [stations, setStations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
        const data = await getAllStations();
        setStations(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};
  const handleDelete = async (stationId, stationName) => {
    Alert.alert(
      "Delete Station",
      `Are you sure you want to delete "${stationName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await deleteStation(stationId);
              setStations(stations.filter((station) => station._id !== stationId));
              Alert.alert("Success", "Station deleted successfully");
            } catch (err) {
              setError('Failed to delete the station: ' + err.message);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderStation = ({ item, index }) => {
    const translateY = fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [50 * (index + 1), 0],
    });
    return (
      <Animated.View
      style={[
          styles.cardWrapper,
          {
              opacity: fadeAnim,
              transform: [{ translateY }],
          }
      ]}
  >
      <View style={styles.card}>
          <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                  <Icon name="ev-station" size={24} color="#fff" />
                  <Text style={styles.cardTitle}>{item.name}</Text>
              </View>
              <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item._id, item.name)}
              >
                  <Icon name="delete-outline" size={24} color="#fff" />
              </TouchableOpacity>
          </View>

          <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                  <Icon name="location-on" size={20} color="#666" />
                  <Text style={styles.infoText}>{item.address}</Text>
              </View>

              <View style={styles.infoRow}>
                  <Icon name="flash-on" size={20} color="#666" />
                  <Text style={styles.infoText}>Type: {item.chargingPoints.map(point => point.type).join(', ')}</Text>
                  <Icon name="ev-station" size={20} color="#666" />
                  <Text style={styles.infoText}>Chargers: {item.chargingPoints.length}</Text>
              </View>

              <View style={styles.infoRow}>
                  <Icon name="attach-money" size={20} color="#666" />
                  <Text style={styles.infoText}>Price/Hour: ${item.chargingPoints.map(point => point.price).join(', ')}</Text>
              </View>

              <View style={styles.infoRow}>
                  <Icon name="my-location" size={20} color="#666" />
                  <Text style={styles.infoText}>Location: {item.location.latitude}, {item.location.longitude}</Text>
              </View>

              <View style={styles.infoRow}>
                  <Icon name="info" size={20} color="#666" />
                  <Text style={styles.infoText}>Status: {item.operationalStatus}</Text>
              </View>

              <View style={styles.infoRow}>
                  <Icon name="access-time" size={20} color="#666" />
                  <Text style={styles.infoText}>Hours: {item.operatingHours.open} - {item.operatingHours.close}</Text>
              </View>

              <View style={styles.infoRow}>
                  <Icon name="check-circle" size={20} color="#666" />
                  <Text style={styles.infoText}>Amenities: {item.amenities.join(', ')}</Text>
              </View>
          </View>
      </View>
  </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Charging Stations</Text>
        <Text style={styles.subHeader}>
          {stations.length} {stations.length === 1 ? 'Station' : 'Stations'} Available
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={24} color="#dc3545" />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={stations}
          renderItem={renderStation}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
    
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f7fa', // Light teal background
  },
  headerContainer: {
    backgroundColor: '#00796b', // Dark teal header
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#ffe6e6',
    margin: 15,
    borderRadius: 10,
  },
  error: {
    color: '#dc3545',
    marginLeft: 10,
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
  },
  cardWrapper: {
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    padding: 15, // Added padding for better spacing
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 10,
  },
  cardContent: {
    paddingTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginRight: 20,
  },
  deleteButton: {
    backgroundColor: '#ff4757',
    padding: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StationList;