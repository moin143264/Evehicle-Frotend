import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axiosInstance from '../utils/axiosInstance';
import { useUserContext } from '../UserContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const UserBookings = ({ navigation, route }) => {
  const { userId } = useUserContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { latitude, longitude } = route.params || {};
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selected) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selected) {
      setSelectedDate(selected);
      fetchBookings(selected);
    }
  };

  const fetchBookings = async (date) => {
    try {
      setLoading(true);
      if (userId) {
        const formattedDate = date.toISOString().split('T')[0];
        const response = await axiosInstance.get(`/bookings?userId=${userId}&date=${formattedDate}`);
        const filteredBookings = response.data.bookings.filter(booking => {
          const bookingDate = new Date(booking.selectedDate).toISOString().split('T')[0];
          return bookingDate === formattedDate;
        });
        setBookings(filteredBookings || []);
      } else {
        console.error("User ID is missing");
      }
    } catch (error) {
      console.error('Error fetching bookings:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBookings(selectedDate);
    }
  }, [userId]);

  const renderDatePicker = () => (
    <View style={styles.datePickerContainer}>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Icon name="calendar-today" size={20} color="#FFFFFF" />
        <Text style={styles.dateButtonText}>
          {selectedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          style={styles.datePicker}
        />
      )}
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.stationInfo}>
            <Icon name="ev-station" size={24} color="#4CAF50" style={styles.stationIcon} />
            <Text style={styles.stationName} numberOfLines={1}>{item.stationName}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.paymentStatus === 'Paid' ? styles.paidBadge : styles.unpaidBadge,
            ]}
          >
            <Icon 
              name={item.paymentStatus === 'Paid' ? 'check-circle' : 'error'} 
              size={16} 
              color={item.paymentStatus === 'Paid' ? '#43A047' : '#E53995'} 
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: item.paymentStatus === 'Paid' ? '#43A047' : '#E53935' }]}>
              {item.paymentStatus}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <View style={styles.infoItem}>
              <Icon name="event" size={18} color="#666" />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {new Date(item.selectedDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="schedule" size={18} color="#666" />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{item.duration} mins</Text>
            </View>
          </View>
          
          <View style={styles.infoColumn}>
            <View style={styles.infoItem}>
              <Icon name="access-time" size={18} color="#666" />
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{item.startTime} - {item.endTime}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="payment" size={18} color="#666" />
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={styles.infoValue}>₹{item.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.addressContainer}>
          <Icon name="location-on" size={18} color="#666" />
          <Text style={styles.addressText} numberOfLines={2}>{item.stationAddrres}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.bookingId}>Booking ID: {item.bookingId}</Text>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => {
              navigation.navigate('UserBookingDetails', {
                booking: item,
                latitude: item.latitude,
                longitude: item.longitude,
                stationAdrres: item.stationAddrres
              });
            }}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
            <Icon name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#388E3C" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Bookings</Text>
        <Text style={styles.headerSubtitle}>Manage your charging sessions</Text>
        {renderDatePicker()}
      </View>

      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.bookingId}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/2748/2748558.png',
            }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>Start booking a station now!</Text>
          <TouchableOpacity 
            style={styles.bookNowButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.bookNowButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="home" size={24} color="#666" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('Schedule')}
        >
          <Icon name="notifications" size={24} color="#666" />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]} 
          onPress={() => navigation.navigate('Booking')}
        >
          <Icon name="event" size={24} color="#4CAF50" />
          <Text style={styles.activeNavText}>Bookings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#4CAF50',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  datePickerContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  flatListContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  stationIcon: {
    marginRight: 8,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paidBadge: {
    backgroundColor: '#E8F5E9',
  },
  unpaidBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  infoColumn: {
    flex: 1,
  },
  infoItem: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingId: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
    opacity: 0.9,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    elevation: 2,
  },
  bookNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minWidth: 80,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeNavButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  activeNavText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
});



export default UserBookings;