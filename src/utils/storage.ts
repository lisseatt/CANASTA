/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Manejo de almacenamiento local (localStorage).
 * No requiere backend ni servidor en esta versión inicial.
 */

import { PriceRecord, ShoppingItem } from '../types';
import { normalizeKey } from './formatters';

const STORAGE_KEY_PRICES = 'canasta_prices_v1';
const STORAGE_KEY_SHOPPING = 'canasta_shopping_v1';

// Datos de demostración iniciales para ilustrar el problema exacto:
// "El mismo producto cuesta distinto en tres tiendas de la misma cuadra".
const INITIAL_DEMO_PRICES: PriceRecord[] = [
  // Leche 1L
  {
    id: 'demo-1',
    productName: 'Leche entera 1L',
    productKey: normalizeKey('Leche entera 1L'),
    storeName: 'Supermercado Norte',
    storeKey: normalizeKey('Supermercado Norte'),
    price: 1200,
    unit: '1 Litro',
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'demo-2',
    productName: 'Leche entera 1L',
    productKey: normalizeKey('Leche entera 1L'),
    storeName: 'Almacén Don Tito',
    storeKey: normalizeKey('Almacén Don Tito'),
    price: 1350,
    unit: '1 Litro',
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'demo-3',
    productName: 'Leche entera 1L',
    productKey: normalizeKey('Leche entera 1L'),
    storeName: 'Minimarket El Sol',
    storeKey: normalizeKey('Minimarket El Sol'),
    price: 1150, // Más barato aquí
    unit: '1 Litro',
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },

  // Arroz largo fino 1kg
  {
    id: 'demo-4',
    productName: 'Arroz largo fino 1kg',
    productKey: normalizeKey('Arroz largo fino 1kg'),
    storeName: 'Supermercado Norte',
    storeKey: normalizeKey('Supermercado Norte'),
    price: 1400,
    unit: '1 Kilo',
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'demo-5',
    productName: 'Arroz largo fino 1kg',
    productKey: normalizeKey('Arroz largo fino 1kg'),
    storeName: 'Almacén Don Tito',
    storeKey: normalizeKey('Almacén Don Tito'),
    price: 1250, // Más barato aquí
    unit: '1 Kilo',
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'demo-6',
    productName: 'Arroz largo fino 1kg',
    productKey: normalizeKey('Arroz largo fino 1kg'),
    storeName: 'Minimarket El Sol',
    storeKey: normalizeKey('Minimarket El Sol'),
    price: 1500,
    unit: '1 Kilo',
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },

  // Aceite de girasol 900ml
  {
    id: 'demo-7',
    productName: 'Aceite de girasol 900ml',
    productKey: normalizeKey('Aceite de girasol 900ml'),
    storeName: 'Supermercado Norte',
    storeKey: normalizeKey('Supermercado Norte'),
    price: 2100, // Más barato aquí
    unit: '900 ml',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'demo-8',
    productName: 'Aceite de girasol 900ml',
    productKey: normalizeKey('Aceite de girasol 900ml'),
    storeName: 'Almacén Don Tito',
    storeKey: normalizeKey('Almacén Don Tito'),
    price: 2400,
    unit: '900 ml',
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'demo-9',
    productName: 'Aceite de girasol 900ml',
    productKey: normalizeKey('Aceite de girasol 900ml'),
    storeName: 'Minimarket El Sol',
    storeKey: normalizeKey('Minimarket El Sol'),
    price: 2250,
    unit: '900 ml',
    updatedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
  },

  // Huevos x12
  {
    id: 'demo-10',
    productName: 'Huevos docena',
    productKey: normalizeKey('Huevos docena'),
    storeName: 'Supermercado Norte',
    storeKey: normalizeKey('Supermercado Norte'),
    price: 2800,
    unit: '12 un.',
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'demo-11',
    productName: 'Huevos docena',
    productKey: normalizeKey('Huevos docena'),
    storeName: 'Almacén Don Tito',
    storeKey: normalizeKey('Almacén Don Tito'),
    price: 2500, // Más barato aquí
    unit: '12 un.',
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'demo-12',
    productName: 'Huevos docena',
    productKey: normalizeKey('Huevos docena'),
    storeName: 'Minimarket El Sol',
    storeKey: normalizeKey('Minimarket El Sol'),
    price: 2700,
    unit: '12 un.',
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  }
];

const INITIAL_DEMO_SHOPPING: ShoppingItem[] = [
  {
    id: 'shop-1',
    productKey: normalizeKey('Leche entera 1L'),
    productName: 'Leche entera 1L',
    quantity: 2,
    completed: false,
  },
  {
    id: 'shop-2',
    productKey: normalizeKey('Arroz largo fino 1kg'),
    productName: 'Arroz largo fino 1kg',
    quantity: 1,
    completed: false,
  },
  {
    id: 'shop-3',
    productKey: normalizeKey('Aceite de girasol 900ml'),
    productName: 'Aceite de girasol 900ml',
    quantity: 1,
    completed: false,
  },
];

/**
 * Carga los registros de precios desde localStorage.
 * 
 * ¡PUNTO CRÍTICO!
 * Si localStorage contiene JSON corrupto o tipos inesperados, la app
 * crashearía al inicio. Por eso siempre envolvemos en try/catch y validamos.
 */
export function loadPriceRecords(): PriceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRICES);
    if (!raw) {
      // Primera vez que se abre la app: sembramos los datos demo
      localStorage.setItem(STORAGE_KEY_PRICES, JSON.stringify(INITIAL_DEMO_PRICES));
      return INITIAL_DEMO_PRICES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_DEMO_PRICES;
  } catch (error) {
    console.error('Error al leer precios de localStorage:', error);
    return INITIAL_DEMO_PRICES;
  }
}

/**
 * Guarda los registros de precios en localStorage.
 */
export function savePriceRecords(records: PriceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PRICES, JSON.stringify(records));
  } catch (error) {
    console.error('Error al guardar precios en localStorage:', error);
  }
}

/**
 * Carga los artículos de la lista de compras desde localStorage.
 */
export function loadShoppingList(): ShoppingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHOPPING);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SHOPPING, JSON.stringify(INITIAL_DEMO_SHOPPING));
      return INITIAL_DEMO_SHOPPING;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_DEMO_SHOPPING;
  } catch (error) {
    console.error('Error al leer lista de compras de localStorage:', error);
    return INITIAL_DEMO_SHOPPING;
  }
}

/**
 * Guarda los artículos de la lista de compras en localStorage.
 */
export function saveShoppingList(items: ShoppingItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHOPPING, JSON.stringify(items));
  } catch (error) {
    console.error('Error al guardar lista de compras en localStorage:', error);
  }
}

/**
 * Reinicia los datos a los valores de demostración iniciales
 */
export function resetToDemoData(): { prices: PriceRecord[]; shopping: ShoppingItem[] } {
  localStorage.setItem(STORAGE_KEY_PRICES, JSON.stringify(INITIAL_DEMO_PRICES));
  localStorage.setItem(STORAGE_KEY_SHOPPING, JSON.stringify(INITIAL_DEMO_SHOPPING));
  return {
    prices: INITIAL_DEMO_PRICES,
    shopping: INITIAL_DEMO_SHOPPING,
  };
}
