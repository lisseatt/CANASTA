/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Función 2: Comparar el precio de un producto entre tiendas.
 * Resuelve: "El mismo producto cuesta distinto en tres tiendas de la misma cuadra".
 */

import React, { useState, useMemo } from 'react';
import { PriceRecord } from '../types';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { 
  Store, 
  Search, 
  TrendingDown, 
  Plus, 
  Check, 
  AlertCircle, 
  ShoppingCart,
  Award
} from 'lucide-react';

interface ComparePricesProps {
  prices: PriceRecord[];
  selectedProductKey: string | null;
  onSelectProduct: (key: string) => void;
  onAddShoppingItem: (productKey: string, productName: string) => void;
  onGoToRegisterWithProduct: (productName: string) => void;
}

export const ComparePrices: React.FC<ComparePricesProps> = ({
  prices,
  selectedProductKey,
  onSelectProduct,
  onAddShoppingItem,
  onGoToRegisterWithProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // ¡PUNTO CRÍTICO 1: AGRUPACIÓN SEGURA POR PRODUCT_KEY!
  // Agrupar por el nombre sin normalizar crearía grupos separados para
  // 'leche' y 'Leche'. Agrupamos siempre usando `productKey`.
  const productsMap = useMemo(() => {
    const map = new Map<string, { productName: string; records: PriceRecord[] }>();
    
    prices.forEach((record) => {
      const existing = map.get(record.productKey);
      if (existing) {
        existing.records.push(record);
      } else {
        map.set(record.productKey, {
          productName: record.productName,
          records: [record],
        });
      }
    });

    return map;
  }, [prices]);

  const allProductKeys = useMemo(() => {
    return Array.from(productsMap.keys());
  }, [productsMap]);

  // Selección por defecto: si no hay ninguno seleccionado o el que estaba seleccionado ya no existe
  const activeKey = useMemo(() => {
    if (selectedProductKey && productsMap.has(selectedProductKey)) {
      return selectedProductKey;
    }
    return allProductKeys.length > 0 ? allProductKeys[0] : null;
  }, [selectedProductKey, productsMap, allProductKeys]);

  // Datos del producto actualmente enfocado
  const currentProductData = useMemo(() => {
    if (!activeKey) return null;
    const item = productsMap.get(activeKey);
    if (!item) return null;

    // ¡PUNTO CRÍTICO 2: NO MUTAR EL ARRAY ORIGINAL AL ORDENAR!
    // `records.sort()` mutaría el estado de React in-place, lo que causa errores
    // silenciosos y fallas de renderizado. Siempre clonar con spread `[...records]`.
    const sortedRecords = [...item.records].sort((a, b) => a.price - b.price);
    const minPrice = sortedRecords[0]?.price ?? 0;
    const maxPrice = sortedRecords[sortedRecords.length - 1]?.price ?? 0;
    const diff = maxPrice - minPrice;

    // ¡PUNTO CRÍTICO 3: EVITAR DIVISIÓN POR CERO EN PORCENTAJES!
    // Si maxPrice es 0, no podemos calcular el porcentaje de ahorro.
    const savingsPercent = maxPrice > 0 ? Math.round((diff / maxPrice) * 100) : 0;

    return {
      productName: item.productName,
      productKey: activeKey,
      records: sortedRecords,
      cheapestRecord: sortedRecords[0],
      mostExpensiveRecord: sortedRecords[sortedRecords.length - 1],
      minPrice,
      maxPrice,
      diff,
      savingsPercent,
      storeCount: sortedRecords.length,
    };
  }, [activeKey, productsMap]);

  // Lista filtrada para el buscador
  const filteredProductKeys = useMemo(() => {
    if (!searchTerm.trim()) return allProductKeys;
    const term = searchTerm.toLowerCase();
    return allProductKeys.filter((key) => {
      const p = productsMap.get(key);
      return p && p.productName.toLowerCase().includes(term);
    });
  }, [allProductKeys, productsMap, searchTerm]);

  const handleAddToList = (productKey: string, productName: string) => {
    onAddShoppingItem(productKey, productName);
    setAddedNotice(productName);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  if (allProductKeys.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center border border-neutral-200">
        <Store className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-neutral-800">
          Aún no hay productos registrados
        </h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
          Comenzá registrando el precio de un artículo en tu primera tienda en la pestaña Registrar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Selector y buscador de productos */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80">
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto para comparar..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Carrusel táctil horizontal de productos */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {filteredProductKeys.map((key) => {
            const prod = productsMap.get(key);
            if (!prod) return null;
            const isSelected = key === activeKey;
            const count = prod.records.length;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectProduct(key)}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span>{prod.productName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {count} {count === 1 ? 'tienda' : 'tiendas'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tarjeta de Comparativa del Producto Activo */}
      {currentProductData && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/80 space-y-4">
          {/* Encabezado del producto */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Comparativa de la cuadra
              </span>
              <h2 className="text-lg font-bold text-neutral-900 leading-snug">
                {currentProductData.productName}
              </h2>
              <div className="text-xs text-neutral-500 mt-0.5">
                Registrado en {currentProductData.storeCount}{' '}
                {currentProductData.storeCount === 1 ? 'tienda' : 'tiendas distintas'}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleAddToList(currentProductData.productKey, currentProductData.productName)
              }
              className="min-h-[40px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
              title="Sumar a la lista de compras"
            >
              {addedNotice === currentProductData.productName ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>A la lista</span>
                </>
              )}
            </button>
          </div>

          {/* Banner de ahorro si hay al menos 2 tiendas */}
          {currentProductData.storeCount >= 2 && currentProductData.diff > 0 ? (
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-emerald-900">
                  Ahorrás {formatCurrency(currentProductData.diff)} por unidad ({currentProductData.savingsPercent}% menos)
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  Comprando en <strong className="font-semibold">{currentProductData.cheapestRecord.storeName}</strong> en vez de {currentProductData.mostExpensiveRecord.storeName}.
                </div>
              </div>
            </div>
          ) : currentProductData.storeCount === 1 ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                Solo tenés el precio de <strong className="font-semibold">{currentProductData.records[0].storeName}</strong>.
                Registrá este producto en otra tienda para ver cuánto podés ahorrar.
              </div>
            </div>
          ) : null}

          {/* Lista de tiendas comparadas (ordenadas de menor a mayor precio) */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Precios encontrados (de menor a mayor)
            </h3>

            {currentProductData.records.map((record, index) => {
              const isCheapest = index === 0;
              const isMostExpensive =
                index === currentProductData.records.length - 1 &&
                currentProductData.records.length > 1;
              const differenceWithCheapest = record.price - currentProductData.minPrice;

              return (
                <div
                  key={record.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isCheapest
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300/60'
                      : 'bg-neutral-50/60 border-neutral-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="font-semibold text-xs text-neutral-900 truncate">
                        {record.storeName}
                      </span>
                      {isCheapest && (
                        <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Award className="w-3 h-3 text-emerald-600" />
                          Más barato
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-2">
                      <span>Actualizado: {formatRelativeDate(record.updatedAt)}</span>
                      {record.unit && <span>· {record.unit}</span>}
                    </div>

                    {!isCheapest && differenceWithCheapest > 0 && (
                      <div className="text-[11px] text-red-600 font-medium mt-1">
                        +{formatCurrency(differenceWithCheapest)} más caro que el líder
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base font-bold tabular-nums ${
                        isCheapest ? 'text-emerald-700' : 'text-neutral-900'
                      }`}
                    >
                      {formatCurrency(record.price)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón para agregar precio de este mismo producto en otra tienda */}
          <button
            type="button"
            onClick={() => onGoToRegisterWithProduct(currentProductData.productName)}
            className="w-full min-h-[44px] py-2.5 px-3 border border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-xs font-semibold text-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-neutral-500" />
            <span>Anotar precio de {currentProductData.productName} en otra tienda</span>
          </button>
        </section>
      )}

      {/* Resumen general rápido de todos los productos y su mejor tienda */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/80">
        <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">
          Todos los Productos de la Cuadra ({allProductKeys.length})
        </h3>

        <div className="divide-y divide-neutral-100">
          {allProductKeys.map((key) => {
            const data = productsMap.get(key);
            if (!data) return null;
            const sorted = [...data.records].sort((a, b) => a.price - b.price);
            const best = sorted[0];
            const worst = sorted[sorted.length - 1];
            const hasMultiple = sorted.length > 1;

            return (
              <div
                key={key}
                onClick={() => onSelectProduct(key)}
                className={`py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50 px-2 rounded-lg transition-colors ${
                  key === activeKey ? 'bg-neutral-50/80 font-medium' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-neutral-900 truncate">
                    {data.productName}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
                    Mejor precio en <strong className="text-emerald-700 font-semibold">{best.storeName}</strong>
                    {hasMultiple && ` (${sorted.length} tiendas)`}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(best.price)}
                  </div>
                  {hasMultiple && worst.price > best.price && (
                    <div className="text-[10px] text-neutral-400 tabular-nums">
                      hasta {formatCurrency(worst.price)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
