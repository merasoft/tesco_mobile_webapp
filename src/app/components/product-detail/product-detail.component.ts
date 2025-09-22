import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  product: Product | undefined;
  relatedProducts: Product[] = [];
  selectedColor: string | undefined;
  quantity = 1;
  currentImageIndex = 0;
  loading = true;
  isAddingToCart = false;
  isFavorite = false;
  showToast = false;
  toastMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const productId = +params['id'];
      this.loadProduct(productId);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProduct(productId: number) {
    this.loading = true;

    combineLatest([
      this.productService.getProductById(productId),
      this.productService.getRelatedProducts(productId, 4)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([product, related]) => {
      this.product = product;
      this.relatedProducts = related;
      this.loading = false;

      if (product) {
        if (product.colors && product.colors.length > 0) {
          this.selectedColor = product.colors[0];
        }
        console.log(`📱 Loaded product: ${product.name}`);
      }
    });
  }

  selectColor(color: string) {
    this.selectedColor = color;
  }

  increaseQuantity() {
    if (this.quantity < 10) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  async addToCart() {
    if (!this.product || !this.product.inStock || this.isAddingToCart) return;

    this.isAddingToCart = true;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    this.cartService.addToCart(this.product, this.quantity, this.selectedColor);
    this.isAddingToCart = false;
    this.showToastMessage(`${this.quantity}x ${this.product.name} added to cart!`);
  }

  private showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    const message = this.isFavorite ? 'Added to favorites!' : 'Removed from favorites';
    this.showToastMessage(message);
  }

  viewProduct(productId: number) {
    this.router.navigate(['/product', productId]);
  }

  viewCart() {
    this.router.navigate(['/cart']);
  }

  goBack() {
    if (this.product) {
      this.router.navigate(['/category', this.product.categoryId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop';
  }

}
