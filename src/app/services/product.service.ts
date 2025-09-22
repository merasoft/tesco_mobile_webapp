import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of, tap } from 'rxjs';
import { Product } from '../models/product';
import { Category } from '../models/category';

interface ProductDatabase {
  categories: Category[];
  products: Product[];
  metadata?: {
    totalProducts: number;
    generatedAt: string;
    version: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private allProducts: Product[] = [];
  private categories: Category[] = [];
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private isDataLoaded = false;
  private loadingSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadProductData();
  }

  private loadProductData(): void {
    this.loadingSubject.next(true);

    this.http.get<ProductDatabase>('/assets/data/products.json').pipe(
      tap(data => {
        console.log('📊 Database metadata:', data.metadata);
      }),
      catchError(error => {
        console.error('❌ Error loading products from JSON:', error);
        return of(this.getFallbackData());
      })
    ).subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.allProducts = data.products;

        this.categoriesSubject.next(this.categories);
        this.productsSubject.next(this.allProducts);
        this.isDataLoaded = true;
        this.loadingSubject.next(false);

        console.log(`✅ Loaded ${this.allProducts.length} products from JSON`);
        this.logStatistics();
      },
      error: (error) => {
        console.error('❌ Failed to load product data:', error);
        this.loadingSubject.next(false);
      }
    });
  }

  private getFallbackData(): ProductDatabase {
    console.log('🔄 Using fallback data...');
    return {
      categories: [
        { id: 1, name: 'Чехлы', icon: '📱', image: '', color: '#FEF3E2' },
        { id: 2, name: 'Зарядчики', icon: '🔌', image: '', color: '#E8F5E8' },
        { id: 3, name: 'Наушники', icon: '🎧', image: '', color: '#FFE5CC' },
        { id: 4, name: 'Защитники', icon: '🛡️', image: '', color: '#F0F8FF' },
        { id: 5, name: 'Кабелы', icon: '🔌', image: '', color: '#1F2937' },
        { id: 6, name: 'Power bank', icon: '🔋', image: '', color: '#FFD4B3' }
      ],
      products: [
        {
          id: 1,
          name: 'iPhone 15 Pro Case',
          description: 'Premium case for iPhone 15 Pro',
          price: 29.99,
          images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop'],
          category: 'Cases',
          categoryId: 1,
          colors: ['#000000', '#4F46E5'],
          inStock: true,
          rating: 4.5
        }
      ]
    };
  }

  private logStatistics(): void {
    const stats: { [key: string]: number } = {};
    this.categories.forEach(category => {
      stats[category.name] = this.allProducts.filter(p => p.categoryId === category.id).length;
    });

    console.log('📈 Products by category:', stats);
    console.log(`💰 Price range: $${Math.min(...this.allProducts.map(p => p.price)).toFixed(2)} - $${Math.max(...this.allProducts.map(p => p.price)).toFixed(2)}`);
    console.log(`📦 In stock: ${this.allProducts.filter(p => p.inStock).length}/${this.allProducts.length}`);
  }

  // Public API Methods

  getCategories(): Observable<Category[]> {
    return this.categoriesSubject.asObservable();
  }

  getProducts(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.productsSubject.pipe(
      map(products => products.filter(p => p.categoryId === categoryId))
    );
  }

  getProductsByCategoryPaginated(
    categoryId: number,
    page: number = 0,
    pageSize: number = 50
  ): Observable<{products: Product[], total: number, hasMore: boolean}> {
    return this.productsSubject.pipe(
      map(allProducts => {
        const categoryProducts = allProducts.filter(p => p.categoryId === categoryId);
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const products = categoryProducts.slice(startIndex, endIndex);

        return {
          products,
          total: categoryProducts.length,
          hasMore: endIndex < categoryProducts.length
        };
      })
    );
  }

  searchProducts(query: string, categoryId?: number): Observable<Product[]> {
    return this.productsSubject.pipe(
      map(products => {
        let filtered = products;

        if (categoryId) {
          filtered = filtered.filter(p => p.categoryId === categoryId);
        }

        if (query.trim()) {
          const searchQuery = query.toLowerCase().trim();
          filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery) ||
            product.category.toLowerCase().includes(searchQuery)
          );
        }

        return filtered;
      })
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    return this.productsSubject.pipe(
      map(products => products.find(p => p.id === id))
    );
  }

  getProductStats(): Observable<{
    total: number;
    byCategory: { [key: string]: number };
    inStock: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
  }> {
    return this.productsSubject.pipe(
      map(products => {
        const byCategory: { [key: string]: number } = {};
        const inStock = products.filter(p => p.inStock).length;
        const prices = products.map(p => p.price);

        this.categories.forEach(category => {
          byCategory[category.name] = products.filter(p => p.categoryId === category.id).length;
        });

        return {
          total: products.length,
          byCategory,
          inStock,
          averagePrice: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices)
          }
        };
      })
    );
  }

  getRelatedProducts(productId: number, limit: number = 4): Observable<Product[]> {
    return this.productsSubject.pipe(
      map(products => {
        const currentProduct = products.find(p => p.id === productId);
        if (!currentProduct) return [];

        const relatedProducts = products
          .filter(p => p.categoryId === currentProduct.categoryId && p.id !== productId)
          .sort(() => Math.random() - 0.5)
          .slice(0, limit);

        return relatedProducts;
      })
    );
  }

  getFeaturedProducts(limit: number = 6): Observable<Product[]> {
    return this.productsSubject.pipe(
      map(products => {
        return products
          .filter(p => p.inStock && (p.rating || 0) >= 4.5)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, limit);
      })
    );
  }

  isLoading(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  isDataReady(): boolean {
    return this.isDataLoaded;
  }

  // Filter and sort utilities
  filterProducts(
    products: Product[],
    filters: {
      inStock?: boolean;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      categoryId?: number;
    }
  ): Product[] {
    let filtered = [...products];

    if (filters.inStock) {
      filtered = filtered.filter(p => p.inStock);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.minRating !== undefined) {
      filtered = filtered.filter(p => (p.rating || 0) >= filters.minRating!);
    }

    if (filters.categoryId !== undefined) {
      filtered = filtered.filter(p => p.categoryId === filters.categoryId);
    }

    return filtered;
  }

  sortProducts(products: Product[], sortBy: string): Product[] {
    const sorted = [...products];

    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return sorted.sort((a, b) => b.id - a.id);
      default:
        return sorted;
    }
  }

  // Admin/Debug methods
  reloadData(): void {
    this.isDataLoaded = false;
    this.loadProductData();
  }

  getLoadingState(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }
}
