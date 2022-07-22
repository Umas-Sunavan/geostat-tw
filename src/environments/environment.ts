// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  useProductionApi: true,
  firebaseConfig: {
    apiKey: "AIzaSyA5kxlACC7j0H9xEw9mYYF3fiQLmADayOk",
    authDomain: "twgeostat.firebaseapp.com",
    databaseURL: "https://twgeostat-default-rtdb.firebaseio.com",
    projectId: "twgeostat",
    storageBucket: "twgeostat.appspot.com",
    messagingSenderId: "349482155640",
    appId: "1:349482155640:web:0e5f02bf6704ba2b46f78d",
    measurementId: "G-2V417MEC4G"
  },
  auth0HttpAllowedList: [
    {
      // Match any request that starts 'https://dev-a63zgv8t.us.auth0.com/api/v2/' (note the asterisk)
      uri: 'https://dev-a63zgv8t.us.auth0.com/api/v2/*',
      tokenOptions: {
        // The attached token should target this audience
        audience: 'https://dev-a63zgv8t.us.auth0.com/api/v2/',

        // The attached token should have these scopes
        scope: 'read:current_user'
      }
    }, 
    {
      // Match any request that starts 'https://dev-a63zgv8t.us.auth0.com/api/v2/' (note the asterisk)
      uri: 'http://localhost:8081/*',
      tokenOptions: {
        // The attached token should target this audience
        audience: 'http://localhost:8081',

        // The attached token should have these scopes
        scope: 'read:current_user'
      }
    }, 
    {
      // Match any request that starts 'https://dev-a63zgv8t.us.auth0.com/api/v2/' (note the asterisk)
      uri: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/*',
      tokenOptions: {
        // The attached token should target this audience
        audience: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/',

        // The attached token should have these scopes
        scope: 'read:current_user'
      }
    }
  ],
  callbackUrl: 'https://local.auth:4200'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
