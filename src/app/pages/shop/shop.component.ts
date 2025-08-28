import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../services/cart.service';
import { T } from '@angular/cdk/keycodes';

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
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css'],
})
export class ShopComponent {
  firestore: Firestore = inject(Firestore);
  products$: Observable<Product[]>;
  isLoading = true;

  constructor(private cartService: CartService) {
    const productsRef = collection(this.firestore, 'products');
    this.products$ = collectionData(productsRef, { idField: 'id' }) as Observable<Product[]>;

    const minLoadingTime = 3000; // 3 seconds minimum
    const startTime = Date.now();

    this.products$.subscribe({
      next: (data) => {
        console.log('Products from Firestore:', data);

        // Calculate remaining time to reach minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        // Wait for remaining time before hiding loading spinner
        setTimeout(() => {
          this.isLoading = false;
          // Trigger animations after products show
          setTimeout(() => {
            this.animateProductsIn();
          }, 100);
        }, remainingTime);
      },
      error: (err) => {
        console.error('Error fetching products:', err);

        // Even on error, respect minimum loading time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        setTimeout(() => {
          this.isLoading = false;
        }, remainingTime);
      },
    });
  }

  addToCart(product: Product) {
    this.cartService.addToCart({
      productId: product.id!,
      name: product.name,
      price: product.price,
      quantity: product.stock,
      imageUrl: product.imageUrl,
    });
    console.log('Added to cart:', product);
  }

  removeFromCart(product: Product) {
    if (!product.id) return;
    this.cartService.removeFromCart(product.id);
    console.log('Removed from cart:', product);
  }

  animateProductsIn() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-in');
      }, index * 200); // 200ms delay between each card
    });
  }
}
