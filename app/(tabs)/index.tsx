import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { MapPin, Navigation, Search } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
  const [selectedAddress, setSelectedAddress] = useState("123 Delivery St, City");
  
  const initialRegion = {
    latitude: 10.762622,
    longitude: 106.660172,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const nearbyLocations = [
    {
      id: '1',
      name: 'Shopping Mall',
      address: '123 Shopping St',
      distance: '1.2 km',
    },
    {
      id: '2',
      name: 'Downtown Market',
      address: '456 Market Ave',
      distance: '2.5 km',
    },
    {
      id: '3',
      name: 'City Center',
      address: '789 Main St',
      distance: '3.7 km',
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
        >
          <Marker
            coordinate={{
              latitude: 10.762622,
              longitude: 106.660172,
            }}
            title="Your Location"
          />
        </MapView>
        
        <View style={styles.searchBar}>
          <Search size={20} color={colors.subtext} />
          <Text style={styles.searchText}>Find destinations</Text>
        </View>
      </View>
      
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
        
        <View style={styles.currentLocationContainer}>
          <MapPin size={20} color={colors.primary} />
          <Text style={styles.currentLocationText}>{selectedAddress}</Text>
          <TouchableOpacity style={styles.navigationButton}>
            <Navigation size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionTitle}>Nearby Pickup Locations</Text>
        
        {nearbyLocations.map(location => (
          <TouchableOpacity 
            key={location.id}
            style={styles.locationItem}
            onPress={() => setSelectedAddress(location.address)}
          >
            <View style={styles.locationContent}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
            </View>
            <Text style={styles.locationDistance}>{location.distance}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.availabilityButton}>
          <Text style={styles.availabilityText}>I'm Available for Delivery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    width: '100%',
    height: '60%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchText: {
    marginLeft: 10,
    color: colors.subtext,
    fontSize: 16,
  },
  bottomSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 10,
    height: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  currentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  currentLocationText: {
    flex: 1,
    marginLeft: 10,
    color: colors.text,
    fontSize: 16,
  },
  navigationButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
  },
  locationItem: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 4,
  },
  locationDistance: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  availabilityButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  availabilityText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
});