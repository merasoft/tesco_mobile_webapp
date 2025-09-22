import {Component, OnInit, OnDestroy, HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {Subject, takeUntil, combineLatest, map, Observable, debounceTime, distinctUntilChanged} from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product  } from '../../models/product';
import { Category } from '../../models/category';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private performanceTimer = 0;

  categoryId!: number;
  currentCategory: Category | undefined;
  displayedProducts: Product[] = [];
  totalProducts = 0;
  loading = true;
  loadingMore = false;
  searchLoading = false;
  loadTime = 0;

  // Pagination
  currentPage = 0;
  pageSize = 50;
  hasMoreProducts = false;

  // Search and Filter
  showSearchBar = false;
  searchQuery = '';
  sortBy = 'default';
  filters = {
    inStock: false,
    highRated: false,
    priceRange: false
  };

  // UI States
  showToast = false;
  toastMessage = '';
  addingToCart: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {
    // Debounce search for performance
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnInit() {
    this.performanceTimer = performance.now();

    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.categoryId = +params['id'];
      this.resetAndLoadData();
    });

    // Get product statistics
    this.productService.getProductStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      console.log('📊 Product Statistics:', stats);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    // Infinite scroll (alternative to Load More button)
    if (!this.hasMoreProducts || this.loadingMore || this.searchQuery) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - 1000) {
      this.loadMoreProducts();
    }
  }

  private resetAndLoadData() {
    this.displayedProducts = [];
    this.currentPage = 0;
    this.hasMoreProducts = false;
    this.searchQuery = '';
    this.showSearchBar = false;
    this.loading = true;

    this.loadCategoryData();
  }

  private loadCategoryData() {
    this.loading = true;
    const startTime = performance.now();

    combineLatest([
      this.productService.getCategories(),
      this.productService.getProductsByCategoryPaginated(this.categoryId, 0, this.pageSize)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([categories, paginatedData]) => {
      this.currentCategory = categories.find(c => c.id === this.categoryId);
      this.displayedProducts = paginatedData.products;
      this.totalProducts = paginatedData.total;
      this.hasMoreProducts = paginatedData.hasMore;
      this.loading = false;

      this.loadTime = Math.round(performance.now() - startTime);
      this.applyFiltersAndSort();

      console.log(`📱 Loaded ${this.displayedProducts.length}/${this.totalProducts} products for ${this.currentCategory?.name} in ${this.loadTime}ms`);
    });
  }

  loadMoreProducts() {
    if (!this.hasMoreProducts || this.loadingMore) return;

    this.loadingMore = true;
    this.currentPage++;

    this.productService.getProductsByCategoryPaginated(this.categoryId, this.currentPage, this.pageSize).pipe(
      takeUntil(this.destroy$)
    ).subscribe(paginatedData => {
      this.displayedProducts = [...this.displayedProducts, ...paginatedData.products];
      this.hasMoreProducts = paginatedData.hasMore;
      this.loadingMore = false;
      this.applyFiltersAndSort();

      console.log(`📱 Loaded more: ${this.displayedProducts.length}/${this.totalProducts} products`);
    });
  }

  toggleSearch() {
    this.showSearchBar = !this.showSearchBar;
    if (!this.showSearchBar) {
      this.clearSearch();
    } else {
      // Focus search input after animation
      setTimeout(() => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 200);
    }
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(query: string) {
    if (!query.trim()) {
      this.resetAndLoadData();
      return;
    }

    this.searchLoading = true;
    const startTime = performance.now();

    this.productService.searchProducts(query, this.categoryId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.displayedProducts = results;
      this.hasMoreProducts = false; // No "Load More" for search results
      this.searchLoading = false;
      this.loadTime = Math.round(performance.now() - startTime);
      this.applyFiltersAndSort();

      console.log(`🔍 Search "${query}": ${results.length} results in ${this.loadTime}ms`);
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.resetAndLoadData();
  }

  toggleFilter(filterName: keyof typeof this.filters) {
    this.filters[filterName] = !this.filters[filterName];
    this.applyFiltersAndSort();
  }

  onSortChange() {
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort() {
    let filtered = [...this.displayedProducts];

    // Apply filters
    if (this.filters.inStock) {
      filtered = filtered.filter(product => product.inStock);
    }

    if (this.filters.highRated) {
      filtered = filtered.filter(product => (product.rating || 0) >= 4.0);
    }

    if (this.filters.priceRange) {
      filtered = filtered.filter(product => product.price < 50);
    }

    // Apply sorting
    filtered = this.productService.sortProducts(filtered, this.sortBy);

    this.displayedProducts = filtered;
  }

  async addToCart(product: Product) {
    if (!product.inStock || this.addingToCart === product.id) return;

    this.addingToCart = product.id;

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600));

    this.cartService.addToCart(product, 1);
    this.addingToCart = null;
    this.showToastMessage(`${product.name} added to cart!`);
  }

  private showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  viewProduct(productId: number) {
    this.router.navigate(['/product', productId]);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  trackByProduct(index: number, product: Product): number {
    return product.id;
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop';
  }

}
