import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Participant } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firestore Helpers for Participants
export const getParticipantsFromFirestore = async (): Promise<Participant[]> => {
  try {
    const q = query(collection(db, 'participants'));
    const querySnapshot = await getDocs(q);
    const list: Participant[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Participant);
    });
    return list;
  } catch (error) {
    console.error('Error fetching participants from Firestore:', error);
    throw error;
  }
};

export const saveParticipantToFirestore = async (p: Participant): Promise<Participant> => {
  try {
    if (!p.id) {
      p.id = "p_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    }
    const docRef = doc(db, 'participants', p.id);
    await setDoc(docRef, p);
    return p;
  } catch (error) {
    console.error('Error saving participant to Firestore:', error);
    throw error;
  }
};

export const deleteParticipantFromFirestore = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'participants', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting participant from Firestore:', error);
    throw error;
  }
};

export const provider = new GoogleAuthProvider();
// Request Google Drive & Google Sheets scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Listeners to notify application on token changes
const tokenListeners: ((token: string | null) => void)[] = [];

export const registerTokenListener = (listener: (token: string | null) => void) => {
  tokenListeners.push(listener);
  listener(cachedAccessToken); // call immediately with current token
  return () => {
    const index = tokenListeners.indexOf(listener);
    if (index > -1) {
      tokenListeners.splice(index, 1);
    }
  };
};

const notifyTokenListeners = (token: string | null) => {
  tokenListeners.forEach((listener) => listener(token));
};

// Global configuration sharing via backend proxy endpoints
export const getGlobalSpreadsheetId = async (): Promise<string | null> => {
  try {
    const res = await fetch('/api/global-config');
    if (res.ok) {
      const data = await res.json();
      return data.spreadsheetId || null;
    }
  } catch (error) {
    console.error('Error fetching global spreadsheet ID from server:', error);
  }
  return null;
};

export const setGlobalSpreadsheetId = async (id: string): Promise<void> => {
  try {
    await fetch('/api/global-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spreadsheetId: id }),
    });
  } catch (error) {
    console.error('Error setting global spreadsheet ID on server:', error);
  }
};

// Initialize Auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Try retrieving temporary token from session storage (safe for refreshes)
  const savedToken = sessionStorage.getItem('g_access_token');
  if (savedToken) {
    cachedAccessToken = savedToken;
    notifyTokenListeners(savedToken);
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // user is logged into Firebase but we don't have the Google Access Token anymore
        // we will need them to re-click sign in to fetch a fresh token
        cachedAccessToken = null;
        sessionStorage.removeItem('g_access_token');
        notifyTokenListeners(null);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('g_access_token');
      notifyTokenListeners(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In with popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token from credentials.');
    }
    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('g_access_token', cachedAccessToken);
    notifyTokenListeners(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Firebase Auth sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || sessionStorage.getItem('g_access_token');
};

export const logout = async () => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem('g_access_token');
  notifyTokenListeners(null);
};
