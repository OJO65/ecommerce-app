import { FieldValue } from "@angular/fire/firestore";

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'customer' | 'admin';
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}