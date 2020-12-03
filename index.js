/**
 * @format
 */

import React from 'react'
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  StatusBar,
} from 'react-native';
import App from './App/App.js';
import Amplify from 'aws-amplify'
import config from './aws-exports'
import { Navigation } from "react-native-navigation";

Amplify.configure(config)
Navigation.registerComponent('com.holla.WelcomeScreen', () => App);
const SettingsScreen = () => {
  return (
    <View>
      <Text>Settings Screen</Text>
    </View>
  );
}
Navigation.registerComponent('Settings', () => SettingsScreen);
Navigation.events().registerAppLaunchedListener(() => {
   Navigation.setRoot({
     root: {
       stack: {
         children: [
           {
             component: {
               name: 'com.holla.WelcomeScreen'
             }
           }
         ]
       }
     }
  });
});
