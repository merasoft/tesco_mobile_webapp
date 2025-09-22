import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 pt-4">
      <div class="px-4">
        <h1 class="text-2xl font-bold mb-4">Checkout</h1>
        <p class="text-gray-600">Coming soon...</p>
      </div>
    </div>
  `
})
export class CheckoutComponent {}
