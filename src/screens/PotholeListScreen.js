import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getPotholes } from '../utils/api';

const PotholeListScreen = ({ navigation }) => {
  const [potholes, setPotholes] = useState([]);

  useEffect(() => {
    const fetchPotholes = async () => {
      try {
        const response = await getPotholes();
        setPotholes(response.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch potholes.');
      }
    };

    fetchPotholes();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PotholeDetail', { pothole: item })}>
      <View style={styles.item}>
        <Text>{item.description}</Text>
        <Text>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text>Pothole List</Text>
      <FlatList
        data={potholes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
});

export default PotholeListScreen;