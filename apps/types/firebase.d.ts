declare module 'firebase/auth' {
    export interface Auth {
        currentUser: User | null;
        app: any;
        config: any;
    }

    export interface User {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
        emailVerified: boolean;
        getIdToken(): Promise<string>;
        getIdTokenResult(): Promise<any>;
    }

    export function getAuth(app?: any): Auth;
    export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<any>;
    export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<any>;
    export function signOut(auth: Auth): Promise<void>;
    export function sendPasswordResetEmail(auth: Auth, email: string): Promise<void>;
    export function confirmPasswordReset(auth: Auth, code: string, newPassword: string): Promise<void>;
    export function applyActionCode(auth: Auth, code: string): Promise<void>;
    export function verifyPasswordResetCode(auth: Auth, code: string): Promise<string>;
    export function signInWithPopup(auth: Auth, provider: any): Promise<any>;
    export function signInWithRedirect(auth: Auth, provider: any): Promise<void>;
    export function getRedirectResult(auth: Auth): Promise<any>;
    export function GoogleAuthProvider(): any;
    export function OAuthProvider(providerId: string): any;
    export function FacebookAuthProvider(): any;
    export function updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<void>;
    export function sendEmailVerification(user: User): Promise<void>;
    export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void): () => void;
}

declare module 'firebase/firestore' {
    export function getFirestore(app?: any): any;
}

declare module 'firebase/storage' {
    export function getStorage(app?: any): any;
}
