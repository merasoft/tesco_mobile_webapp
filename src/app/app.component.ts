// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from './services/cart.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnInit {
  currentRoute = '/';
  cartItemsCount$: Observable<number>;

  constructor(
    private router: Router,
    private cartService: CartService
  ) {
    this.cartItemsCount$ = this.cartService.getCartItems().pipe(
      map(items => items.reduce((count, item) => count + item.quantity, 0))
    );
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
