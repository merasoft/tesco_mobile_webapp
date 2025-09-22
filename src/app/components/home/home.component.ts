// src/app/components/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Category } from '../../models/category';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  categories$: Observable<Category[]>;
  featuredProducts = [
    { id: 1, name: 'Protective Phone Case', price: 19.99 },
    { id: 2, name: 'Wireless Earbuds', price: 59.99 },
    { id: 1, name: 'Screen Protector', price: 12.99 },
    { id: 1, name: 'Phone Stand', price: 15.99 }
  ];

  constructor(
    private productService: ProductService,
    private router: Router
  ) {
    this.categories$ = this.productService.getCategories();
  }

  ngOnInit() {}

  navigateToCategory(categoryId: number) {
    this.router.navigate(['/category', categoryId]);
  }

  navigateToProduct(productId: number) {
    this.router.navigate(['/product', productId]);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  trackByCategory(index: number, category: Category): number {
    return category.id;
  }
}
