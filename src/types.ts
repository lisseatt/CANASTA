/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Modelos de Datos
 */

export interface PriceRecord {
  id: string;
  // OJO AQUÍ: Guardamos tanto el nombre tal como lo escribió el usuario
  // como una clave normalizada (en minúsculas, sin acentos superfluos)
  // para que 'Leche La Serenísima' y 'leche la serenisima' agrupen al mismo producto.
  productName: string;
  productKey: string;
  storeName: string;
  storeKey: string;
  price: number;
  unit?: string; // Ej: "1L", "1kg", "500g", "unidad"
  notes?: string;
  updatedAt: string; // ISO 8601 string
}

export interface ShoppingItem {
  id: string;
  productKey: string;
  productName: string;
  quantity: number;
  completed: boolean;
}

export type ActiveTab = 'register' | 'compare' | 'shoppingList';

export interface ItemRecommendation {
  productName: string;
  recommendedStore: string;
  bestPrice: number;
  alternativePrice: number;
  unitSavings: number;
  tip: string;
}

export interface StoreStop {
  storeName: string;
  itemsToBuy: string[];
  subtotal: number;
}

export interface SmartRecommendationResult {
  totalEstimatedWithSavings: number;
  totalWithoutOptimizing: number;
  estimatedSavingsAmount: number;
  savingsPercentage: number;
  itemRecommendations: ItemRecommendation[];
  storeRoute: StoreStop[];
  summaryInsight: string;
}
