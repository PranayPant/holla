/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  StatusBar,
} from 'react-native';

import {
  Header,
  Colors
} from 'react-native/Libraries/NewAppScreen';

import Geolocation from '@react-native-community/geolocation';
import { Stitch, AnonymousCredential, RemoteMongoClient } from 'mongodb-stitch-react-native-sdk';
import {createClient} from 'react-native-google-maps-services'; 
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';

import {store, all, bounds} from './api'

const config = {
  issuer: 'https://accounts.google.com',
  clientId: '998578964935-9d0usnij1f2ntrq4h9ks4p75d6v1hd0o.apps.googleusercontent.com',
  redirectUrl: 'com.googleusercontent.apps.998578964935-9d0usnij1f2ntrq4h9ks4p75d6v1hd0o:/oauth2redirect/google',
  scopes: ['openid', 'profile', 'email']
};

const oauthGoogleClientId = "898192824118-pckvs88tq5n9fkhcefoafs2qf5df8hc9.apps.googleusercontent.com"

const mongoAppId = "holla-oexwz";
const cluster    = "mongodb-atlas";
const dbName =  "holla"
const collection = "users"
const GOOGLE_API_KEY = "AIzaSyBqj4gMINPa9Z46JgOZu6Q57XBRIMDFqlA";

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      location: null,
      logged_in: false,
      address: null,
      userInfo: null,
      dbPromise: null
    }
    this._getLocation = this._getLocation.bind(this)
    this._signIn = this._signIn.bind(this)
    this.storeUser = this.storeUser.bind(this)
    this._getAddress = this._getAddress.bind(this)
    this._getCompleteLocation = this._getCompleteLocation.bind(this)
  }

  _getLocation = () => {
    return new Promise( (resolve, reject) => {
      Geolocation.getCurrentPosition( (position) => {
        resolve(position.coords)
      }, err => reject(err) )
    })
  }

  _getAddress = (location) => {
    const googleMapsClient = createClient({ key: GOOGLE_API_KEY });
    return new Promise( (resolve, reject) => {
      googleMapsClient.reverseGeocode({
        latlng: [location.latitude, location.longitude],
        result_type: ['country', 'street_address'],
        location_type: ['ROOFTOP', 'APPROXIMATE']
      }, ( err, res) => {
        if(err){
          console.error(err)
          reject(err)
        }
        else {
          address = res.json.results[0].formatted_address;
          resolve(address)
        }
      });
    })
  }

  _getCompleteLocation = async () => {
    location = await this._getLocation()
    address  = await this._getAddress(location)

    console.log(`Location is ${JSON.stringify(location)} at ${address}`)
    return new Promise((resolve, reject) => {
      resolve({location, address})
    });
  }

  componentDidMount = async () => {

    // Configure Google sign in
    GoogleSignin.configure({
      scopes: ['email', 'profile'],
      webClientId: oauthGoogleClientId
    });

    console.log('Mounting....')

    // Store position changes
    Geolocation.watchPosition( () => {
      this._getCompleteLocation()
        .then( newState => {
          console.log('New state is', newState)
          this.setState(newState)
          store({
                location: JSON.stringify(this.state.location), 
                user:JSON.stringify(this.state.userInfo)
              })
        })
        .catch( err => {
          console.log(`Error storing user: ${JSON.stringify(err)}`)
        })
    });

    // Initialize mongo db promise
    const dbPromise = Stitch.initializeDefaultAppClient(mongoAppId)

    this.setState({dbPromise})
  }

  storeUser = () => {
    if(this.state.userInfo != null )
    {
      console.log(`storing name '${this.state.userInfo.user.name}' in mongo`)
      this.state.dbPromise
      .then( client => {
        const mongodb = client.getServiceClient(
          RemoteMongoClient.factory, cluster
        );
        const db = mongodb.db(dbName);
        client.auth
          .loginWithCredential(new AnonymousCredential())
          .then( () => {
            db.collection( collection )
              .insertOne({
                owner_id: client.auth.user.id,
                name: this.state.userInfo.user.name
              })
          })
          .catch(console.error);
      })
      .catch( err => {
        console.error(err)
      })
    }
    else {
      console.log("No name to store in mongo")
    }
  }

  async _signIn () {
    try {
      // Make request to Google to get token
      const userInfo  = await GoogleSignin.signIn();
      const logged_in = await GoogleSignin.isSignedIn();
      this.setState({userInfo, logged_in});
      if( logged_in ){
        this.storeUser()
      }
    } 
    catch (error) {
      console.log('error', error)
    }
  }

  render() {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}
          >
            <Header />

            <View style={styles.body}>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.sectionDescription}>
                  { this.state.location != null && 
                    <Text style={styles.sectionDescription}> 
                      <Text style={styles.highlight}>Latitude: </Text>
                      {this.state.location.latitude} {'\n'}
                      <Text style={styles.highlight}>Longitude: </Text>
                      {this.state.location.longitude} {'\n'}
                      <Text style={styles.highlight}>Address: </Text>
                      {this.state.address}
                    </Text>
                  }
                </Text>
                <Text>
                  {'\n'}
                </Text>
                { this.state.logged_in === false || this.state.userInfo== null ?
                  <>
                    <GoogleSigninButton
                      style={{ width: 192, height: 48 }}
                      size={GoogleSigninButton.Size.Wide}
                      color={GoogleSigninButton.Color.Dark}
                      onPress={this._signIn}
                      disabled={this.state.isSigninInProgress}
                    />
                  </>
                  :
                  <Text style={styles.sectionDescription}>
                    Welcome {this.state.userInfo.user.name} !
                  </Text>
                }
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
