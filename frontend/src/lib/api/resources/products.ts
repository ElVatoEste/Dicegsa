import { api, PATHS } from '../client';

export interface Product {
  id: string;
  code: string;
  barcode: string | null;
  name: string;
  manufacturer: string | null;
  zone: string | null;
  lot: string | null;
  expiresOn: string | null;
  quantity: number;
}

export const productsApi = {
  list: (token: string) => api.get<Product[]>(PATHS.products.root, { token }),
};
