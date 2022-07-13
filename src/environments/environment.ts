// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
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
        audience: 'http://localhost:8081/maps',

        // The attached token should have these scopes
        scope: 'read:current_user'
      }
    }, 
    {
      // Match any request that starts 'https://dev-a63zgv8t.us.auth0.com/api/v2/' (note the asterisk)
      uri: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/*',
      tokenOptions: {
        // The attached token should target this audience
        audience: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/maps',

        // The attached token should have these scopes
        scope: 'read:current_user'
      }
    }
  ],
  callbackUrl: 'http://localhost:4200/dashboard'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
