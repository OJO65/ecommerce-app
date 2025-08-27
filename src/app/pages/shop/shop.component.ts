import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  description: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatGridListModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css'],
})
export class ShopComponent {
  firestore: Firestore = inject(Firestore);
  products$: Observable<Product[]>;

 constructor() {
  const productsRef = collection(this.firestore, 'products');
  this.products$ = collectionData(productsRef, { idField: 'id' }) as Observable<Product[]>;

  this.products$.subscribe(data => {
    console.log("Products from Firestore:", data);
  });
}

  addToCart(product: Product) {
    console.log('Added to cart:', product);
    // TODO: Hook into your Cart service
  }

  removeFromCart(product: Product) {
    console.log('Removed from cart:', product);
    // TODO: Hook into your Cart service
  }

}
