import {writeFile} from 'fs';

const targetPath = './src/environments/environment.prod.ts';

const envConfigFile = `export const environment = {
   production: true,
   firebaseConfig: {
      apiKey: "${process.env['API_KEY']}",
      authDomain: "${process.env['AUTH_DOMAIN']}",
      databaseURL: "${process.env['DATABASE_URL']}",
      projectId: "${process.env['PROJECT_ID']}",
      storageBucket: "${process.env['STORAGE_BUCKET']}",
      messagingSenderId: "${process.env['MESSAGING_SENDER_ID']}",
      appId: "${process.env['APP_ID']}",
      measurementId: "${process.env['MEASUREMENT_ID']}"
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
          audience: 'https://us-central1-twgeostat.cloudfunctions.net/getDB/maps',
  
          // The attached token should have these scopes
          scope: 'read:current_user'
        }
      }
    ],
    callbackUrl: 'https://umas-sunavan.github.io/geostat-tw'
};
`;

writeFile(targetPath, envConfigFile, 'utf8', (err) => {
  if (err) {
    return console.log(err);
  }
});