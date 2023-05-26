import {version, APP_ID} from '../../manifest.json';

export const environment = {
  production: true,
  api: 'http://life.intrans.io',
  apiBox: 'http://192.168.88.248:3007',
  APP_ID: APP_ID,
  version: version,
  firebase: {
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: ''
  }
};
