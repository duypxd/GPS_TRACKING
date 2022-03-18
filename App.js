import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Dimensions, View, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import Geolocation from '@react-native-community/geolocation';
import MapViewDirections from 'react-native-maps-directions';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 1;
const LONGITUDE = 1;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const initialRegion = {
  latitude: LATITUDE,
  longitude: LONGITUDE,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

const App = () => {
  const _refMap = useRef();
  const [region, setRegion] = useState(initialRegion);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [trackingData, setTrackingData] = useState([]);

  useEffect(() => {
    BackgroundGeolocation.configure({
      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
      locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
      interval: 10000,
      fastestInterval: 10000,
      activitiesInterval: 10000,
      stopOnStillActivity: false,
      activityType: 'Other',
    });

    BackgroundGeolocation.on('location', (location) => {
      setCurrentLocation(location);
      setTrackingData((state) => [
        ...state,
        { latitude: location.latitude, longitude: location.longitude },
      ]);
      BackgroundGeolocation.startTask((taskKey) => {
        BackgroundGeolocation.endTask(taskKey);
      });
    });
    BackgroundGeolocation.on('stationary', (stationaryLocation) => {
      console.log('stationary', stationaryLocation);
    });

    BackgroundGeolocation.on('error', (error) => {
      console.log('[ERROR] BackgroundGeolocation error:', error);
    });

    BackgroundGeolocation.on('start', () => {
      console.log('[INFO] BackgroundGeolocation service has been started');
    });

    BackgroundGeolocation.on('stop', () => {
      console.log('[INFO] BackgroundGeolocation service has been stopped');
    });

    BackgroundGeolocation.on('authorization', (status) => {
      console.log('[INFO] BackgroundGeolocation authorization status: ' + status);
      if (status !== BackgroundGeolocation.AUTHORIZED) {
        // we need to set delay or otherwise alert may not be shown
        setTimeout(
          () =>
            Alert.alert(
              'App requires location tracking permission',
              'Would you like to open app settings?',
              [
                { text: 'Yes', onPress: () => BackgroundGeolocation.showAppSettings() },
                { text: 'No', onPress: () => console.log('No Pressed'), style: 'cancel' },
                ,
              ],
            ),
          1000,
        );
      }
    });

    BackgroundGeolocation.on('background', () => {
      console.log('[INFO] App is in background');
    });

    BackgroundGeolocation.on('foreground', () => {
      console.log('[INFO] App is in foreground');
    });

    BackgroundGeolocation.on('abort_requested', () => {
      console.log('[INFO] Server responded with 285 Updates Not Required');
    });

    BackgroundGeolocation.on('http_authorization', () => {
      console.log('[INFO] App needs to authorize the http requests');
    });

    BackgroundGeolocation.checkStatus((status) => {
      if (!status.isRunning) {
        BackgroundGeolocation?.start(); //triggers start on start event
      }
    });

    return () => BackgroundGeolocation.removeAllListeners();
  }, []);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      ({ coords }) => {
        let geoRegion = {
          ...region,
          latitude: coords.latitude || 0,
          longitude: coords.longitude || 0,
        };
        setRegion(geoRegion);
        animateToRegion(geoRegion);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  }, []);

  const animateToRegion = (geoRegion) => {
    _refMap?.current?.animateToRegion(geoRegion, 500);
  };

  const onGeoLocation = () => {
    if (region?.latitude && region?.longitude) {
      _refMap?.current?.animateToRegion(region, 500);
    }
  };

  const onClear = () => {
    setTrackingData([]);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={_refMap}
        provider={PROVIDER_GOOGLE}
        style={[StyleSheet.absoluteFill]}
        showsUserLocation
        show
        followsUserLocation
        initialRegion={region}
        onMapReady={() => {}}
      >
        {trackingData?.map((marker, index) => (
          <Marker
            key={`${index}-index`}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
          />
        ))}
        {currentLocation !== null && <MapViewDirections
          optimizeWaypoints
          origin={region}
          destination={currentLocation}
          apikey='API_KEY'
          precision="high"
          strokeWidth={4}
          strokeColor="hotpink"
        />}
      </MapView>
      <TouchableOpacity style={styles.buttonGPS} onPress={onGeoLocation}>
        <Text style={styles.text}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonClear} onPress={onClear}>
        <Text style={{ fontSize: 16, color: '#000000' }}>Clear {trackingData.length}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonGPS: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 24,
    color: '#000000',
  },
  buttonClear: {
    position: 'absolute',
    top: 20,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
