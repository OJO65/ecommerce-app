import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collectionData,
  getDocs,
} from '@angular/fire/firestore';
import { Auth, authState, User } from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';

export interface CartItem {
  id?: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  cart$ = new BehaviorSubject<CartItem[]>([]);
  private localStorageKey = 'guest_cart';
  private currentUser: User | null = null; // cache user

  constructor(private firestore: Firestore, private auth: Auth) {
    this.initCart();
  }

  private initCart() {
    authState(this.auth).subscribe(async (user) => {
      this.currentUser = user; // keep cached user

      if (user) {
        // merge guest cart into Firestore
        const guestCart = this.getGuestCart();
        for (const item of guestCart) {
          await this.addToFirestoreCart(item);
        }
        this.clearGuestCart();

        // subscribe to Firestore cart
        const ref = collection(this.firestore, `users/${user.uid}/cart`);
        collectionData(ref, { idField: 'id' }).subscribe((cart) => {
          this.cart$.next(cart as CartItem[]);
        });
      } else {
        // load guest cart
        this.cart$.next(this.getGuestCart());
      }
    });
  }

  // =============================
  // Guest cart (localStorage)
  // =============================
  private getGuestCart(): CartItem[] {
    const data = localStorage.getItem(this.localStorageKey);
    return data ? JSON.parse(data) : [];
  }

  private saveGuestCart(cart: CartItem[]) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(cart));
    this.cart$.next(cart);
  }

  private clearGuestCart() {
    localStorage.removeItem(this.localStorageKey);
    this.cart$.next([]);
  }

  // =============================
  // Firestore helpers
  // =============================
  private getUserId(): string {
    if (!this.currentUser) throw new Error('User not logged in');
    return this.currentUser.uid;
  }

  private async addToFirestoreCart(item: CartItem) {
    const userId = this.getUserId();
    const ref = doc(this.firestore, `users/${userId}/cart/${item.productId}`);
    // Always increment instead of overwriting
    await setDoc(ref, { ...item }, { merge: true });
  }

  // =============================
  // Public methods
  // =============================
  async addToCart(item: CartItem) {
    const normalizedItem: CartItem = {
      productId: item.productId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: 1, // always add 1
    };

    if (this.currentUser) {
      await this.addToFirestoreCart(normalizedItem);
    } else {
      const cart = this.getGuestCart();
      const existing = cart.find((c) => c.productId === normalizedItem.productId);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push(normalizedItem);
      }
      this.saveGuestCart(cart);
    }
  }

  async updateQuantity(itemId: string, quantity: number) {
    if (this.currentUser) {
      const ref = doc(this.firestore, `users/${this.currentUser.uid}/cart/${itemId}`);
      await updateDoc(ref, { quantity });
    } else {
      const cart = this.getGuestCart();
      const item = cart.find((c) => c.productId === itemId);
      if (item) item.quantity = quantity;
      this.saveGuestCart(cart);
    }
  }

  async removeFromCart(itemId: string) {
    if (this.currentUser) {
      const ref = doc(this.firestore, `users/${this.currentUser.uid}/cart/${itemId}`);
      await deleteDoc(ref);
    } else {
      const cart = this.getGuestCart().filter((c) => c.productId !== itemId);
      this.saveGuestCart(cart);
    }
  }

  async clearCart() {
    if (this.currentUser) {
      const ref = collection(this.firestore, `users/${this.currentUser.uid}/cart`);
      const snap = await getDocs(ref);
      const batch: Promise<void>[] = [];
      snap.forEach((docSnap) => {
        batch.push(this.removeFromCart(docSnap.id));
      });
      await Promise.all(batch);
    } else {
      this.clearGuestCart();
    }
  }
}
