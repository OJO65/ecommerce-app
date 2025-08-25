import { Injectable, OnDestroy } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  user,
  updateProfile,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, from, switchMap, of, BehaviorSubject, shareReplay } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Firebase user observable (shared & replayed to avoid leaks)
  user$: Observable<User | null>;

  constructor(private auth: Auth, private firestore: Firestore) {
    this.user$ = user(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (firebaseUser) {
          return from(this.getUserData(firebaseUser.uid)); // ✅ convert promise → observable
        } else {
          this.currentUserSubject.next(null);
          return of(null);
        }
      }),
      shareReplay(1) // ✅ ensures single subscription & caching
    );

    // keep BehaviorSubject in sync
    this.user$.subscribe((userData) => this.currentUserSubject.next(userData));
  }

  ngOnDestroy(): void {
    this.currentUserSubject.complete();
  }

  private async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(this.firestore, `users/${uid}`));

      if (!userDoc.exists()) {
        console.warn(`No user document found for UID: ${uid}`);
        return null;
      }

      const data = userDoc.data();

      if (!data['uid'] || !data['email']) {
        console.error('Invalid user data structure:', data);
        return null;
      }

      return data as User;
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  async register(email: string, password: string, displayName: string): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);

      if (!credential.user) throw new Error('Failed to create user account');

      await updateProfile(credential.user, { displayName });

      const userData: User = {
        uid: credential.user.uid,
        email: credential.user.email || email,
        displayName,
        role: 'customer',
        createdAt: serverTimestamp(), // ✅ server time
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(this.firestore, `users/${credential.user.uid}`), userData);

      this.currentUserSubject.next(userData);
      return userData;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);

      if (!credential.user) throw new Error('Login failed');

      const userData = await this.getUserData(credential.user.uid);

      if (!userData) throw new Error('User data not found');

      this.currentUserSubject.next(userData);
      return userData;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out. Please try again.');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async updateUserProfile(userData: Partial<User>): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) throw new Error('No authenticated user found');

    try {
      await updateDoc(doc(this.firestore, `users/${currentUser.uid}`), {
        ...userData,
        updatedAt: serverTimestamp(), // ✅ server time
      });

      const profileUpdates: { displayName?: string; photoURL?: string } = {};
      if (userData.displayName !== undefined) profileUpdates.displayName = userData.displayName;
      if (userData.photoURL !== undefined) profileUpdates.photoURL = userData.photoURL;

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(currentUser, profileUpdates);
      }

      const updatedUserData = await this.getUserData(currentUser.uid);
      if (updatedUserData) this.currentUserSubject.next(updatedUserData);
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  get isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin' || false;
  }
}