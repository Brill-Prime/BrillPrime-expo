import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VehicleType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface TollGate {
  id: string;
  name: string;
  location: string;
  highway: string;
  distance: number;
  pricePerVehicle: {
    motorcycle: number;
    car: number;
    suv: number;
    truck: number;
  };
  operatingHours: string;
  isOpen: boolean;
  estimatedTime: string;
  paymentMethods: string[];
}

export default function TollPaymentScreen() {
  const router = useRouter();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [selectedVehicle, setSelectedVehicle] = useState<string>('car');
  const [selectedTollGate, setSelectedTollGate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const vehicleTypes: VehicleType[] = [
    { id: 'motorcycle', name: 'Motorcycle', icon: '🏍️', description: '2-wheeled vehicles' },
    { id: 'car', name: 'Car', icon: '🚗', description: 'Private cars & sedans' },
    { id: 'suv', name: 'SUV/Bus', icon: '🚙', description: 'SUVs, vans & small buses' },
    { id: 'truck', name: 'Truck', icon: '🚛', description: 'Heavy vehicles & trailers' }
  ];

  const tollGates: TollGate[] = [
    {
      id: 'lagos-ibadan-1',
      name: 'Lagos-Ibadan Toll Plaza',
      location: 'Km 20, Lagos-Ibadan Expressway',
      highway: 'Lagos-Ibadan Expressway',
      distance: 18.5,
      pricePerVehicle: { motorcycle: 300, car: 600, suv: 1000, truck: 1500 },
      operatingHours: '24 hours',
      isOpen: true,
      estimatedTime: '22 mins',
      paymentMethods: ['Cash', 'Card', 'Mobile']
    },
    {
      id: 'abuja-kaduna-1',
      name: 'Abuja-Kaduna Toll Gate',
      location: 'Km 15, Abuja-Kaduna Highway',
      highway: 'Abuja-Kaduna Highway',
      distance: 28.2,
      pricePerVehicle: { motorcycle: 200, car: 400, suv: 700, truck: 1200 },
      operatingHours: '24 hours',
      isOpen: true,
      estimatedTime: '35 mins',
      paymentMethods: ['Cash', 'Card', 'Mobile']
    },
    {
      id: 'lekki-toll',
      name: 'Lekki Toll Gate',
      location: 'Lekki-Epe Expressway, Lagos',
      highway: 'Lekki-Epe Expressway',
      distance: 12.1,
      pricePerVehicle: { motorcycle: 150, car: 300, suv: 500, truck: 800 },
      operatingHours: '5:00 AM - 11:00 PM',
      isOpen: true,
      estimatedTime: '18 mins',
      paymentMethods: ['Card', 'Mobile']
    },
    {
      id: 'kara-bridge',
      name: 'Kara Bridge Toll',
      location: 'Kara, Lagos-Ibadan Expressway',
      highway: 'Lagos-Ibadan Expressway',
      distance: 25.8,
      pricePerVehicle: { motorcycle: 250, car: 500, suv: 800, truck: 1200 },
      operatingHours: '24 hours',
      isOpen: false,
      estimatedTime: '32 mins',
      paymentMethods: ['Cash', 'Card']
    }
  ];

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const filteredTollGates = tollGates.filter(gate =>
    gate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gate.highway.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gate.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTollGateSelect = (gateId: string) => {
    const gate = tollGates.find(g => g.id === gateId);
    if (gate && !gate.isOpen) {
      Alert.alert('Gate Closed', `${gate.name} is currently closed. Operating hours: ${gate.operatingHours}`);
      return;
    }
    setSelectedTollGate(gateId);
  };

  const getSelectedTollGate = () => {
    return tollGates.find(g => g.id === selectedTollGate);
  };

  const handleProceedToPayment = async () => {
    if (!selectedTollGate) {
      Alert.alert('Selection Required', 'Please select a toll gate to proceed.');
      return;
    }

    setLoading(true);

    try {
      const selectedGate = getSelectedTollGate();
      const amount = selectedGate?.pricePerVehicle[selectedVehicle as keyof TollGate['pricePerVehicle']];

      const tollOrderData = {
        type: 'toll',
        tollGate: selectedGate,
        vehicleType: vehicleTypes.find(v => v.id === selectedVehicle),
        amount,
        orderDate: new Date().toISOString(),
      };

      // Save toll order data for confirmation step
      await AsyncStorage.setItem('pendingTollOrder', JSON.stringify(tollOrderData));

      // Navigate to toll confirmation screen
      router.push('/checkout/toll-confirmation');

    } catch (error) {
      console.error('Error processing toll order:', error);
      Alert.alert('Error', 'Failed to process toll payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Toll Gate Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>

          {/* Search Bar */}
          <View style={styles.section}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search toll gates or highways..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Vehicle Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Type</Text>
            <View style={styles.vehicleTypes}>
              {vehicleTypes.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleType,
                    selectedVehicle === vehicle.id && styles.selectedVehicleType
                  ]}
                  onPress={() => setSelectedVehicle(vehicle.id)}
                >
                  <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                  <Text style={[
                    styles.vehicleName,
                    selectedVehicle === vehicle.id && styles.selectedVehicleName
                  ]}>
                    {vehicle.name}
                  </Text>
                  <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Available Toll Gates */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Toll Gates</Text>
              <View style={styles.openGatesCounter}>
                <Text style={styles.counterText}>
                  {filteredTollGates.filter(g => g.isOpen).length} open
                </Text>
              </View>
            </View>

            {filteredTollGates.map((gate) => (
              <TouchableOpacity
                key={gate.id}
                style={[
                  styles.tollGateCard,
                  selectedTollGate === gate.id && styles.selectedTollGateCard,
                  !gate.isOpen && styles.closedTollGateCard
                ]}
                onPress={() => handleTollGateSelect(gate.id)}
                disabled={!gate.isOpen}
              >
                <View style={styles.gateHeader}>
                  <View style={styles.gateInfo}>
                    <Text style={styles.gateName}>{gate.name}</Text>
                    <Text style={styles.gateLocation}>{gate.location}</Text>
                    <View style={styles.gateDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.detailText}>{gate.distance} km away</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.detailText}>{gate.estimatedTime}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.gateStatus}>
                    <View style={[
                      styles.statusBadge,
                      gate.isOpen ? styles.openBadge : styles.closedBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        gate.isOpen ? styles.openText : styles.closedText
                      ]}>
                        {gate.isOpen ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.gateFooter}>
                  <View style={styles.priceInfo}>
                    <Text style={styles.highway}>{gate.highway}</Text>
                    <Text style={styles.operatingHours}>Operating: {gate.operatingHours}</Text>
                  </View>
                  <View style={styles.priceDisplay}>
                    <Text style={styles.price}>
                      ₦{gate.pricePerVehicle[selectedVehicle as keyof TollGate['pricePerVehicle']].toLocaleString()}
                    </Text>
                    <Text style={styles.vehicleTypeLabel}>
                      {vehicleTypes.find(v => v.id === selectedVehicle)?.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentMethods}>
                  {gate.paymentMethods.map((method) => (
                    <View key={method} style={styles.paymentMethodBadge}>
                      <Text style={styles.paymentMethodText}>{method}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}

            {filteredTollGates.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={48} color="#bbb" />
                <Text style={styles.emptyTitle}>No toll gates found</Text>
                <Text style={styles.emptyDescription}>
                  Try adjusting your search or check back later
                </Text>
              </View>
            )}
          </View>

          {/* Purchase Summary */}
          {selectedTollGate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Purchase Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Toll Gate:</Text>
                  <Text style={styles.summaryValue}>{getSelectedTollGate()?.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vehicle Type:</Text>
                  <Text style={styles.summaryValue}>
                    {vehicleTypes.find(v => v.id === selectedVehicle)?.name}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Distance:</Text>
                  <Text style={styles.summaryValue}>{getSelectedTollGate()?.distance} km</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>
                    ₦{getSelectedTollGate()?.pricePerVehicle[selectedVehicle as keyof TollGate['pricePerVehicle']].toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Purchase Button */}
      {selectedTollGate && (
        <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
          <TouchableOpacity
            style={[styles.purchaseButton, loading && styles.disabledButton]}
            onPress={handleProceedToPayment}
            disabled={loading}
          >
            <Ionicons name="card-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.purchaseButtonText}>
              {loading ? 'Processing...' : 'Purchase Toll Pass'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#0c1a2a',
    fontFamily: 'Montserrat',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  openGatesCounter: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  searchInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: 'Montserrat',
  },
  vehicleTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  vehicleType: {
    width: '48%',
    padding: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedVehicleType: {
    borderColor: '#4682B4',
    backgroundColor: '#f0f7ff',
  },
  vehicleIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
    fontFamily: 'Montserrat',
  },
  selectedVehicleName: {
    color: '#4682B4',
    fontWeight: '600',
  },
  vehicleDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  tollGateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTollGateCard: {
    borderColor: '#4682B4',
    backgroundColor: '#f8f9ff',
  },
  closedTollGateCard: {
    opacity: 0.6,
    backgroundColor: '#f8f8f8',
  },
  gateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gateInfo: {
    flex: 1,
  },
  gateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  gateLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  gateDetails: {
    flexDirection: 'row',
    gap: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  gateStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: '#d4edda',
  },
  closedBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  openText: {
    color: '#155724',
  },
  closedText: {
    color: '#721c24',
  },
  gateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginBottom: 10,
  },
  priceInfo: {
    flex: 1,
  },
  highway: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0c1a2a',
    marginBottom: 2,
    fontFamily: 'Montserrat',
  },
  operatingHours: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  priceDisplay: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
    fontFamily: 'Montserrat',
  },
  vehicleTypeLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentMethodText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  summaryValue: {
    fontSize: 16,
    color: '#0c1a2a',
    fontFamily: 'Montserrat',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    fontFamily: 'Montserrat',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
    fontFamily: 'Montserrat',
  },
  footer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  purchaseButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  buttonIcon: {
    marginRight: 8,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
});