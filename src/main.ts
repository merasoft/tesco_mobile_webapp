import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import {provideHttpClient} from '@angular/common/http';

const routes = [
  {
    path: '',
    loadComponent: () => import('./app/components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'category/:id',
    loadComponent: () => import('./app/components/category/category.component').then(m => m.CategoryComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./app/components/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./app/components/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./app/components/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./app/components/orders/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    importProvidersFrom(CommonModule)
  ]
}).catch(err => console.error(err));
