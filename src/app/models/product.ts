export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  categoryId: number;
  colors?: string[];
  inStock: boolean;
  rating?: number;
}
