import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const PotholeDetailScreen = ({ route }) => {
  const { pothole } = route.params;

  return (
    <View style={styles.container}>
      <Text>{pothole.description}</Text>
      <Text>{pothole.location}</Text>
      <Image source={{ uri: pothole.imageUrl }} style={styles.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 10,
  },
});

export default PotholeDetailScreen;