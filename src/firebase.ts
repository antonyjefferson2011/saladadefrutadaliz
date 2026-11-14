import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
// Config web do Firebase é pública por design; a segurança vem das regras (firestore.rules).
const app = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY ?? 'AIzaSyBZUT6QtwZUgbrWYZVSC9TtTXfHw2u-zro',
  authDomain: 'saladadefrutadaliz.firebaseapp.com', projectId: 'saladadefrutadaliz',
  storageBucket: 'saladadefrutadaliz.firebasestorage.app', messagingSenderId: '23269626189',
  appId: '1:23269626189:web:5e503d91f07d3a513f2704'});
export const auth = getAuth(app);
export const db = getFirestore(app);
