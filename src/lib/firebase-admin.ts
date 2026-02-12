import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";

let _app: App | null = null;
let _db: Firestore | null = null;
let _storage: Storage | null = null;
let _auth: Auth | null = null;

function getAdminApp(): App {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  _app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return _app;
}

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) _db = getFirestore(getAdminApp());
    return (_db as any)[prop];
  },
});

export const adminStorage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    if (!_storage) _storage = getStorage(getAdminApp());
    return (_storage as any)[prop];
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = getAuth(getAdminApp());
    return (_auth as any)[prop];
  },
});
