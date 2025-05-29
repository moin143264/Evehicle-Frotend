import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { stationService } from "../services/stationService";
import FontAwesome from "react-native-vector-icons/FontAwesome";
const chargingSpecifications = {
  AC: {
    CCS2: {
      maxPower: 22,
      inputVoltage: 400,
      maxCurrent: 32,
      basePrice: 10,
      supportedVehicles: ["Car", "Bus"],
    },
    "Type 2": {
      maxPower: 43,
      inputVoltage: 400,
      maxCurrent: 63,
      basePrice: 12,
      supportedVehicles: ["Car", "Three Wheeler"],
    },
    "GB/T": {
      maxPower: 19,
      inputVoltage: 380,
      maxCurrent: 28,
      basePrice: 9,
      supportedVehicles: ["Car", "Bus", "Truck"],
    },
  },
  DC: {
    CCS2: {
      maxPower: 350,
      inputVoltage: 1000,
      maxCurrent: 500,
      basePrice: 18,
      supportedVehicles: ["Car", "Bus", "Truck"],
    },
    CHAdeMO: {
      maxPower: 150,
      inputVoltage: 500,
      maxCurrent: 350,
      basePrice: 15,
      supportedVehicles: ["Car"],
    },
    "GB/T": {
      maxPower: 250,
      inputVoltage: 750,
      maxCurrent: 400,
      basePrice: 16,
      supportedVehicles: ["Car", "Bus", "Truck"],
    },
  },
  Hybrid: {
    CCS2: {
      maxPower: 200,
      inputVoltage: 800,
      maxCurrent: 400,
      basePrice: 16,
      supportedVehicles: ["Car", "Bus"],
    },
    "Type 2": {
      maxPower: 50,
      inputVoltage: 500,
      maxCurrent: 100,
      basePrice: 14,
      supportedVehicles: ["Car", "Three Wheeler"],
    },
  },
};

const amenityOptions = [
  { id: "Parking", icon: "local-parking", type: "material", label: "Parking" },
  { id: "Restroom", icon: "wc", type: "material", label: "Restroom" },
  { id: "WiFi", icon: "wifi", type: "material", label: "WiFi" },
  { id: "Cafe", icon: "local-cafe", type: "material", label: "Cafe" },
  {
    id: "WaitingArea",
    icon: "weekend",
    type: "material",
    label: "Waiting Area",
  },
  {
    id: "Shopping",
    icon: "shopping-cart",
    type: "material",
    label: "Shopping",
  },
  {
    id: "Security",
    icon: "security",
    type: "material",
    label: "24/7 Security",
  },
  { id: "AirFilling", icon: "air", type: "material", label: "Air Filling" },
];

const sampleStationData = {
  name: "EV Charge Hub Central",
  address: "123 Main Street, Tech Park, Pune, Maharashtra 411014",
  operationalStatus: "Active",
  operatingHours: {
    open: "06:00",
    close: "23:00",
  },
  chargingPoints: [
    {
      pointId: "CP1",
      type: "DC",
      connectorType: "CCS2",
      power: "350",
      status: "Available",
      inputVoltage: "1000",
      maxCurrent: "500",
      price: 18,
      supportedVehicles: ["Car", "Bus", "Truck"],
    },
    {
      pointId: "CP2",
      type: "AC",
      connectorType: "Type 2",
      power: "43",
      status: "Available",
      inputVoltage: "400",
      maxCurrent: "63",
      price: 12,
      supportedVehicles: ["Car", "Three Wheeler"],
    },
  ],
  amenities: ["Parking", "Restroom", "WiFi", "Cafe", "WaitingArea"],
  location: {
    latitude: "18.5204",
    longitude: "73.8567",
  },
};

const AddStation = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    operationalStatus: "Active",
    operatingHours: {
      open: "06:00",
      close: "22:00",
    },
    chargingPoints: [],
    amenities: [],
    location: {
      latitude: "",
      longitude: "",
    },
  });

  const operationalStatuses = [
    "Active",
    "Maintenance",
    "Offline",
    "Coming Soon",
  ];
  const connectorTypes = ["CCS2", "CHAdeMO", "Type 2", "GB/T"];
  const chargingTypes = ["AC", "DC", "Hybrid"];

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSampleData = () => {
    setFormData(sampleStationData);
  };

  const calculatePowerSpecs = (type, connector) => {
    return chargingSpecifications[type]?.[connector] || null;
  };

  const getSupportedVehicles = (type, connector) => {
    return chargingSpecifications[type]?.[connector]?.supportedVehicles || [];
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.name ||
        !formData.address ||
        formData.chargingPoints.length === 0
      ) {
        Alert.alert(
          "Error",
          "Please fill in all required fields and add at least one charging point"
        );
        return;
      }

      const stationData = {
        ...formData,
        chargingPoints: formData.chargingPoints.map((point) => {
          const specs =
            chargingSpecifications[point.type]?.[point.connectorType];
          return {
            ...point,
            price: specs?.basePrice || 0,
            supportedVehicles: specs?.supportedVehicles || [],
            specifications: {
              maxPower: specs?.maxPower || 0,
              inputVoltage: specs?.inputVoltage || 0,
              maxCurrent: specs?.maxCurrent || 0,
            },
          };
        }),
        location: {
          latitude: parseFloat(formData.location.latitude),
          longitude: parseFloat(formData.location.longitude),
        },
      };

      const response = await stationService.addStation(stationData);

      Alert.alert("Success", "Station added successfully!", [
        {
          text: "OK",
          onPress: () =>
            setFormData({
              name: "",
              address: "",
              operationalStatus: "Active",
              operatingHours: { open: "06:00", close: "22:00" },
              chargingPoints: [],
              amenities: [],
              location: { latitude: "", longitude: "" },
            }),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add station");
    }
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const addChargingPoint = () => {
    const newPoint = {
      pointId: `CP${formData.chargingPoints.length + 1}`,
      type: "AC",
      connectorType: "CCS2",
      status: "Available",
    };

    const specs = calculatePowerSpecs(newPoint.type, newPoint.connectorType);
    if (specs) {
      newPoint.power = specs.maxPower.toString();
      newPoint.inputVoltage = specs.inputVoltage.toString();
      newPoint.maxCurrent = specs.maxCurrent.toString();
      newPoint.price = specs.basePrice;
      newPoint.supportedVehicles = specs.supportedVehicles;
    }

    setFormData((prev) => ({
      ...prev,
      chargingPoints: [...prev.chargingPoints, newPoint],
    }));
  };

  const handleChargingPointChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedPoints = prev.chargingPoints.map((point, i) => {
        if (i === index) {
          const updatedPoint = { ...point, [field]: value };
          if (field === "type" || field === "connectorType") {
            const specs = calculatePowerSpecs(
              field === "type" ? value : point.type,
              field === "connectorType" ? value : point.connectorType
            );
            if (specs) {
              updatedPoint.power = specs.maxPower.toString();
              updatedPoint.inputVoltage = specs.inputVoltage.toString();
              updatedPoint.maxCurrent = specs.maxCurrent.toString();
              updatedPoint.price = specs.basePrice;
              updatedPoint.supportedVehicles = specs.supportedVehicles;
            }
          }
          return updatedPoint;
        }
        return point;
      });

      return { ...prev, chargingPoints: updatedPoints };
    });
  };

  const renderAmenityIcon = (amenity) => {
    const IconComponent =
      amenity.type === "material" ? Icon : MaterialCommunityIcons;
    return (
      <IconComponent
        name={amenity.icon}
        size={24}
        color={formData.amenities.includes(amenity.id) ? "#2c3e50" : "#666"}
      />
    );
  };

  const handleArrayToggle = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Add Charging Station</Text>
        <TouchableOpacity
          style={styles.loadSampleButton}
          onPress={loadSampleData}
        >
          <Text style={styles.loadSampleButtonText}>Load Sample Data</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Station Name"
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
            allowFontScaling={false}
            InputLeftElement={
              <FontAwesome
                name="building"
                size={20}
                color="#333"
                style={{ marginLeft: 10 }}
              />
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={formData.address}
            onChangeText={(text) => handleChange("address", text)}
            multiline
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.operationalStatus}
              onValueChange={(value) =>
                handleChange("operationalStatus", value)
              }
              style={styles.picker}
            >
              {operationalStatuses.map((status) => (
                <Picker.Item key={status} label={status} value={status} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                style={styles.input}
                placeholder="Opening Time"
                value={formData.operatingHours.open}
                onChangeText={(text) =>
                  handleNestedChange("operatingHours", "open", text)
                }
              />
            </View>
            <View style={styles.halfWidth}>
              <TextInput
                style={styles.input}
                placeholder="Closing Time"
                value={formData.operatingHours.close}
                onChangeText={(text) =>
                  handleNestedChange("operatingHours", "close", text)
                }
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charging Points</Text>
          {formData.chargingPoints.map((point, index) => (
            <View key={point.pointId} style={styles.chargingPoint}>
              <Text style={styles.chargingPointTitle}>Point {index + 1}</Text>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={point.type}
                  onValueChange={(value) =>
                    handleChargingPointChange(index, "type", value)
                  }
                  style={styles.picker}
                >
                  {chargingTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={point.connectorType}
                  onValueChange={(value) =>
                    handleChargingPointChange(index, "connectorType", value)
                  }
                  style={styles.picker}
                >
                  {connectorTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>

              <View style={styles.powerSpecsContainer}>
                <Text>Power: {point.power} kW</Text>
                <Text>Voltage: {point.inputVoltage} V</Text>
                <Text>Current: {point.maxCurrent} A</Text>
              </View>

              <View style={styles.supportedAndPriceContainer}>
                <Text style={styles.supportedVehiclesText}>
                  Supported:{" "}
                  {getSupportedVehicles(point.type, point.connectorType).join(
                    ", "
                  )}
                </Text>
                <Text style={styles.priceText}>
                  Price: ₹
                  {chargingSpecifications[point.type]?.[point.connectorType]
                    ?.basePrice || 0}
                  /hour
                </Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addChargingPoint}>
            <Icon name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Charging Point</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {amenityOptions.map((amenity) => (
              <TouchableOpacity
                key={amenity.id}
                style={[
                  styles.amenityItem,
                  formData.amenities.includes(amenity.id) &&
                    styles.amenityItemSelected,
                ]}
                onPress={() => handleArrayToggle("amenities", amenity.id)}
              >
                {renderAmenityIcon(amenity)}
                <Text style={styles.amenityLabel}>{amenity.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Latitude"
            value={formData.location.latitude}
            onChangeText={(text) =>
              handleNestedChange("location", "latitude", text)
            }
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Longitude"
            value={formData.location.longitude}
            onChangeText={(text) =>
              handleNestedChange("location", "longitude", text)
            }
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Icon name="add-location-alt" size={24} color="#fff" />
          <Text style={styles.submitButtonText}>Add Station</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0f7fa", // Light teal background for a fresh look
  },
  headerContainer: {
    backgroundColor: "#00796b", // Dark teal header
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  loadSampleButton: {
    backgroundColor: "#004d40", // Darker teal for buttons
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: "center",
  },
  loadSampleButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: "#ffffff", // White background for sections
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000", // Shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#00796b", // Teal for titles
  },
  input: {
    borderWidth: 1,
    borderColor: "#b2dfdb", // Light teal border
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#f1f8e9", // Light green background for inputs
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#b2dfdb",
    borderRadius: 10,
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  chargingPoint: {
    borderWidth: 1,
    borderColor: "#b2dfdb",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#f0f4c3", // Light lime for charging points
  },
  chargingPointTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#004d40", // Darker teal for point titles
  },
  powerSpecsContainer: {
    backgroundColor: "#e8f5e9", // Very light green for specs
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  supportedAndPriceContainer: {
    marginTop: 10,
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 10,
  },
  supportedVehiclesText: {
    color: "#666",
    marginBottom: 5,
  },
  priceText: {
    fontSize: 16,
    color: "#00796b", // Teal for prices
    fontWeight: "bold",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  amenityItem: {
    width: "48%",
    backgroundColor: "#e0f7fa", // Light teal for amenities
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  amenityItemSelected: {
    backgroundColor: "#b2ebf2", // Selected state color
    borderColor: "#00796b",
    borderWidth: 1,
  },
  amenityLabel: {
    marginTop: 5,
    fontSize: 14,
    textAlign: "center",
    color: "#004d40", // Darker teal for labels
  },
  addButton: {
    backgroundColor: "#00796b",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: "#388e3c", // Green for submit button
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default AddStation;
