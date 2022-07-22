export const environment = {
   production: true,
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
        uri: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/*',
        tokenOptions: {
          // The attached token should target this audience
          audience: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/',
  
          // The attached token should have these scopes
          scope: 'read:current_user'
        }
      }
    ],
    callbackUrl: 'https://umas-sunavan.github.io/geostat-tw'
};
