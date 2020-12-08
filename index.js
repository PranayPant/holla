/**
 * @format
 */

import App from './src/App';
import Profile from './src/Profile';
import Amplify from 'aws-amplify'
import config from './aws-exports'
import { Navigation } from "react-native-navigation";

Amplify.configure(config)
Navigation.registerComponent('App', () => App);
Navigation.registerComponent('Profile', () => Profile);
Navigation.events().registerAppLaunchedListener(() => {
   Navigation.setRoot({
     root: {
       stack: {
         children: [
           {
             component: {
               name: 'App'
             }
           }
         ]
       }
     }
  });
});
