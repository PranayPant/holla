/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {useState, useEffect} from 'react';
import  { Navigation } from 'react-native-navigation';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  StatusBar,
} from 'react-native';
import {Header} from 'react-native/Libraries/NewAppScreen';
import Geolocation from '@react-native-community/geolocation';
import {createClient} from 'react-native-google-maps-services';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';
import {
  LoginButton,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
  LoginManager,
} from 'react-native-fbsdk';
import {store, all, bounds} from '../api';
import config from './config';
import styles from './styles';
import {APP_STATE} from './defaults';

export default function App(props) {
  const [state, setState] = useState(APP_STATE);
  const {androidClientId, GOOGLE_API_KEY} = config;

  const fbLoginCb = (error, result) => {
    if (error) {
      console.log('Error fetching FB profile:', error);
    }
    else {
      console.log('FB log in success:', result);
      setState(prev => ({
        user: {
          ...prev.user,
          oauthClient: 'facebook',
          name: result.name,
          email: result.email,
          profileId: result.id,
          loggedIn: true,
        },
      }));
    }
  };

  const googleSignIn = async () => {
    try {
      // Make request to Google to get token
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const result = await GoogleSignin.signIn();
      const loggedIn = await GoogleSignin.isSignedIn();
      setState(prev => ({
        user: {
          ...prev.user,
          oauthClient: 'google',
          name: result.user.name,
          email: result.user.email,
          profile_id: result.user.id,
          loggedIn,
        },
      }));
    }
    catch (error) {
      console.log('Error signing in:', error);
    }
  };

  const _getCoords = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve(position.coords);
        },
        err => reject(err),
      );
    });
  };

  const _getAddress = location => {
    const googleMapsClient = createClient({key: GOOGLE_API_KEY});
    return new Promise((resolve, reject) => {
      googleMapsClient.reverseGeocode(
        {
          latlng: [location.latitude, location.longitude],
          result_type: ['country', 'street_address'],
          location_type: ['ROOFTOP', 'APPROXIMATE'],
        },
        (err, res) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            const address = res.json.results[0].formatted_address;
            resolve(address);
          }
        },
      );
    });
  };

  const getLocation = async () => {
    const coords = await _getCoords();
    const address = await _getAddress(coords);
    return new Promise((resolve, reject) => {
      resolve({coords, address});
    });
  };

  const logout = (clean = false) => {
    if (state.user.loggedIn){
      if (state.user.oauthClient === 'google'){
        GoogleSignin.signOut();
      } else if (state.user.oauthClient === 'facebook') {
        LoginManager.logOut();
      }
      if (!clean){
        setState(prev => ({
          user: {
            ...prev.user,
            loggedIn: false,
            oauthClient: '',
          },
        }));
      }
    }
  };

  useEffect(() => {

    console.log('Initializing App with state', state);

    // Configure Google sign in
    GoogleSignin.configure({
      scopes: ['email', 'profile'],
      androidClientId,
    });
    // Watch and store position changes
    Geolocation.watchPosition(() => {
      getLocation()
        .then(({coords, address}) => {
          setState(prev => ({
            user: {
              ...prev.user,
              location: {
                ...coords,
                address,
                isKnown: true,
              },
            },
          }));
        })
        .catch(err => {
          console.log('Error getting location:', err);
        });
    });
    // Logout on unmount if still logged in
    return () => logout(true);
  }, []);

  useEffect(() => {
    if ( (state.user.email
      || state.user.profileId)
      && state.user.loggedIn
      && state.user.location.isKnown
    ) {
      store({
        location: state.user.location,
        user: state.user,
      });
    }
  }, [state.user]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.sectionDescription}>
                {state.user.location.isKnown && (
                  <Text style={styles.sectionDescription}>
                    <Text style={styles.highlight}>Latitude: </Text>
                    {state.user.location.latitude} {'\n'}
                    <Text style={styles.highlight}>Longitude: </Text>
                    {state.user.location.longitude} {'\n'}
                    <Text style={styles.highlight}>Address: </Text>
                    {state.user.location.address}
                  </Text>
                )}
              </Text>
              <Text>{'\n'}</Text>
              {!state.user.loggedIn ? (
                <>
                  <GoogleSigninButton
                    style={{width: 192, height: 48}}
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={googleSignIn}
                    disabled={state.user.loggedIn}
                  />
                  <LoginButton
                    publishPermissions={['publish_actions']}
                    onLoginFinished={(error, result) => {
                      if (error) {
                        alert('Login failed with error: ' + error);
                      } else if (result.isCancelled) {
                        alert('Login was cancelled');
                      } else {
                        AccessToken.getCurrentAccessToken().then(data => {
                          const infoRequest = new GraphRequest(
                            '/me?fields=name,picture,email',
                            null,
                            fbLoginCb,
                          );
                          // Start the graph request.
                          new GraphRequestManager()
                            .addRequest(infoRequest)
                            .start();
                        });
                      }
                    }}
                    onLogoutFinished={() => console.log('User logged out')}
                  />
                </>
              ) : (
                <Text style={styles.sectionDescription}>
                  Welcome {state.user.name} !
                </Text>
              )}
              {state.user.loggedIn && (
                <>
                <Button
                  style={styles.logoutButton}
                  onPress={() => logout(false)}
                  title="Logout"
                />
                <Button
                title='Push Settings Screen'
                color='#710ce3'
                onPress={() => Navigation.push(props.componentId, {
                  component: {
                    name: 'Settings',
                    options: {
                      topBar: {
                        title: {
                          text: 'Settings'
                        }
                      }
                    }
                  }
                })}/>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}


