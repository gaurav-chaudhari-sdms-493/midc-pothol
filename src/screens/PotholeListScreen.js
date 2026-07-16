import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getPotholes } from '../utils/api';

const PotholeListScreen = ({ navigation }) => {
  const [potholes, setPotholes] = useState([]);

  useEffect(() => {
    const fetchPotholes = async () => {
      try {
        // TODO: Replace "string" with dynamic user data if available
        const response = await getPotholes("string", "Pending Analysis");
        setPotholes(response.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch potholes.');
        console.error(error);
      }
    };

    fetchPotholes();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PotholeDetail', { potholeId: item.id })}>
      <View style={styles.item}>
        <Text style={styles.address}>{item.address || 'No address provided'}</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.status}>{item.status}</Text>
          <Text style={styles.date}>{new Date(item.reportedDate).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pothole Reports</Text>
      <FlatList
        data={potholes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 16,
    color: '#333',
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  address: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800', // A shade of orange for "Pending"
  },
  date: {
    fontSize: 14,
    color: '#777',
  },
});

export default PotholeListScreen;