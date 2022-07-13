export const environment = {
   production: true,
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
        uri: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/*',
        tokenOptions: {
          // The attached token should target this audience
          audience: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/maps/',
  
          // The attached token should have these scopes
          scope: 'read:current_user'
        }
      }
    ]
};
