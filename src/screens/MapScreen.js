import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MapScreen = () => {
  const potholes = [
    { id: '1', latitude: 37.78825, longitude: -122.4324, title: 'Pothole 1', description: 'Large pothole' },
    { id: '2', latitude: 37.75825, longitude: -122.4624, title: 'Pothole 2', description: 'Deep pothole' },
  ];

  return (
    <View style={styles.container}>
      <MapView style={styles.map}>
        {potholes.map(pothole => (
          <Marker
            key={pothole.id}
            coordinate={{ latitude: pothole.latitude, longitude: pothole.longitude }}
            title={pothole.title}
            description={pothole.description}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapScreen;