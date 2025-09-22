import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  getCartItems(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  addToCart(product: Product, quantity: number = 1, selectedColor?: string): void {
    const existingItem = this.cartItems.find(
      item => item.product.id === product.id && item.selectedColor === selectedColor
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cartItems.push({
        product,
        quantity,
        selectedColor
      });
    }

    this.cartSubject.next([...this.cartItems]);
  }

  removeFromCart(productId: number, selectedColor?: string): void {
    this.cartItems = this.cartItems.filter(
      item => !(item.product.id === productId && item.selectedColor === selectedColor)
    );
    this.cartSubject.next([...this.cartItems]);
  }

  updateQuantity(productId: number, quantity: number, selectedColor?: string): void {
    const item = this.cartItems.find(
      item => item.product.id === productId && item.selectedColor === selectedColor
    );

    if (item) {
      item.quantity = quantity;
      if (quantity <= 0) {
        this.removeFromCart(productId, selectedColor);
      } else {
        this.cartSubject.next([...this.cartItems]);
      }
    }
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  getCartItemsCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  clearCart(): void {
    this.cartItems = [];
    this.cartSubject.next([]);
  }
}
