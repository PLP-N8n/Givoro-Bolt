export type Product = {
  asin: string;
  title: string;
  image?: string;
  price?: string;
  url: string;
};

export type Suggestion = {
  title: string;
  reason: string;
  keywords: string[];
  products: Product[];
};
