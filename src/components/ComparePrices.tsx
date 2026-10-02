/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Función 2: Comparar el precio de un producto entre tiendas.
 * Ajustado para visibilidad al sol, texto >= 16px, etiquetas visibles y un solo botón principal.
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

  const activeKey = useMemo(() => {
    if (selectedProductKey && productsMap.has(selectedProductKey)) {
      return selectedProductKey;
    }
    return allProductKeys.length > 0 ? allProductKeys[0] : null;
  }, [selectedProductKey, productsMap, allProductKeys]);

  const currentProductData = useMemo(() => {
    if (!activeKey) return null;
    const item = productsMap.get(activeKey);
    if (!item) return null;

    const sortedRecords = [...item.records].sort((a, b) => a.price - b.price);
    const minPrice = sortedRecords[0]?.price ?? 0;
    const maxPrice = sortedRecords[sortedRecords.length - 1]?.price ?? 0;
    const diff = maxPrice - minPrice;
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
    setTimeout(() => setAddedNotice(null), 3500);
  };

  // ESTADO VACÍO CLARO CON FRASE DE INVITACIÓN
  if (allProductKeys.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center border-2 border-neutral-300 space-y-3">
        <Store className="w-12 h-12 text-neutral-400 mx-auto" />
        <h3 className="text-xl font-extrabold text-neutral-950">
          No hay productos para comparar todavía
        </h3>
        <p className="text-base text-neutral-700 max-w-xs mx-auto">
          Anotá el precio de tu primer producto en dos tiendas distintas de la cuadra en la pestaña Registrar para ver cuál te conviene más.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Mensaje de confirmación visible en español */}
      {addedNotice && (
        <div className="p-4 bg-emerald-100 border-2 border-emerald-800 text-emerald-950 text-base font-extrabold rounded-xl flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-800 shrink-0" />
          <span>¡Agregaste {addedNotice} a tu lista de compra!</span>
        </div>
      )}

      {/* Buscador con ETIQUETA VISIBLE */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300">
        <label htmlFor="comp-search-input" className="block text-base font-extrabold text-neutral-950 mb-1.5">
          Buscar producto para comparar
        </label>
        <div className="relative mb-3">
          <Search className="w-5 h-5 text-neutral-700 absolute left-3.5 top-3.5" />
          <input
            id="comp-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Escribí para buscar (ejemplo: Leche)"
            className="w-full min-h-[48px] pl-10 pr-3.5 py-3 text-base font-medium text-neutral-950 bg-white border-2 border-neutral-400 rounded-xl focus:outline-none focus:ring-3 focus:ring-emerald-700 focus:border-emerald-800"
          />
        </div>

        {/* Botones secundarios de selección de productos */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                className={`min-h-[48px] px-3.5 py-2.5 text-base font-bold rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-2 border-2 ${
                  isSelected
                    ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-300'
                }`}
              >
                <span>{prod.productName}</span>
                <span
                  className={`text-base font-bold px-2 py-0.5 rounded-lg ${
                    isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-800'
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
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300 space-y-4">
          {/* Encabezado del producto */}
          <div className="flex flex-col gap-2 pb-3 border-b-2 border-neutral-200">
            <span className="text-base font-extrabold text-emerald-900 uppercase tracking-wide">
              Comparativa de la cuadra
            </span>
            <h2 className="text-2xl font-extrabold text-neutral-950 leading-tight">
              {currentProductData.productName}
            </h2>
            <div className="text-base text-neutral-700 font-bold">
              Registrado en {currentProductData.storeCount}{' '}
              {currentProductData.storeCount === 1 ? 'tienda' : 'tiendas distintas'}
            </div>

            {/* ÚNICO BOTÓN PRINCIPAL DE ESTA PANTALLA */}
            <button
              type="button"
              onClick={() =>
                handleAddToList(currentProductData.productKey, currentProductData.productName)
              }
              className="w-full min-h-[50px] mt-1 bg-emerald-800 hover:bg-emerald-900 text-white text-base font-extrabold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md border-2 border-emerald-950"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              <span>Sumar este producto a mi lista</span>
            </button>
          </div>

          {/* Banner de ahorro con alto contraste para leer bajo el sol */}
          {currentProductData.storeCount >= 2 && currentProductData.diff > 0 ? (
            <div className="p-4 bg-emerald-100 border-2 border-emerald-800 rounded-xl flex items-start gap-3">
              <TrendingDown className="w-6 h-6 text-emerald-900 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-extrabold text-emerald-950">
                  Ahorrás {formatCurrency(currentProductData.diff)} por unidad ({currentProductData.savingsPercent}% menos)
                </div>
                <div className="text-base text-emerald-900 font-medium mt-1">
                  Comprando en <strong className="font-extrabold text-neutral-950">{currentProductData.cheapestRecord.storeName}</strong> en vez de {currentProductData.mostExpensiveRecord.storeName}.
                </div>
              </div>
            </div>
          ) : currentProductData.storeCount === 1 ? (
            <div className="p-4 bg-amber-100 border-2 border-amber-600 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-900 shrink-0 mt-0.5" />
              <div className="text-base text-amber-950 font-medium">
                Solo tenés el precio de <strong className="font-extrabold text-neutral-950">{currentProductData.records[0].storeName}</strong>.
                Anotá este producto en otra tienda de la cuadra para ver cuánto podés ahorrar.
              </div>
            </div>
          ) : null}

          {/* Lista de tiendas comparadas de menor a mayor precio */}
          <div className="space-y-3 pt-1">
            <h3 className="text-base font-extrabold text-neutral-950 uppercase tracking-wide">
              Precios encontrados (de menor a mayor)
            </h3>

            {currentProductData.records.map((record, index) => {
              const isCheapest = index === 0;
              const differenceWithCheapest = record.price - currentProductData.minPrice;

              return (
                <div
                  key={record.id}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${
                    isCheapest
                      ? 'bg-emerald-50 border-emerald-700 ring-2 ring-emerald-600'
                      : 'bg-neutral-50 border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Store className="w-4 h-4 text-neutral-700 shrink-0" />
                        <span className="font-extrabold text-base text-neutral-950">
                          {record.storeName}
                        </span>
                        {isCheapest && (
                          <span className="text-base font-extrabold uppercase text-emerald-950 bg-emerald-200 border border-emerald-700 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                            <Award className="w-4 h-4 text-emerald-800" />
                            Más barato
                          </span>
                        )}
                      </div>

                      <div className="text-base text-neutral-700 font-medium mt-1">
                        Actualizado: {formatRelativeDate(record.updatedAt)}
                        {record.unit && <span> · {record.unit}</span>}
                      </div>

                      {!isCheapest && differenceWithCheapest > 0 && (
                        <div className="text-base text-red-800 font-bold mt-1">
                          +{formatCurrency(differenceWithCheapest)} más caro que el líder
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-extrabold text-neutral-950 tabular-nums">
                        {formatCurrency(record.price)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón secundario para registrar en otra tienda */}
          <button
            type="button"
            onClick={() => onGoToRegisterWithProduct(currentProductData.productName)}
            className="w-full min-h-[48px] py-2.5 px-3 border-2 border-neutral-400 bg-white hover:bg-neutral-100 rounded-xl text-base font-extrabold text-neutral-900 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5 text-neutral-800" />
            <span>Anotar precio en otra tienda de la cuadra</span>
          </button>
        </section>
      )}

      {/* Lista general de productos */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300">
        <h3 className="text-base font-extrabold text-neutral-950 uppercase tracking-wide mb-3">
          Todos los Productos Guardados ({allProductKeys.length})
        </h3>

        <div className="divide-y-2 divide-neutral-200">
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
                className={`py-3.5 px-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-100 transition-colors ${
                  key === activeKey ? 'bg-neutral-100 font-bold' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-base font-extrabold text-neutral-950 truncate">
                    {data.productName}
                  </div>
                  <div className="text-base text-neutral-700 font-medium mt-0.5">
                    Mejor en <strong className="text-emerald-900 font-extrabold">{best.storeName}</strong>
                    {hasMultiple && ` (${sorted.length} tiendas)`}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-extrabold text-emerald-950 tabular-nums">
                    {formatCurrency(best.price)}
                  </div>
                  {hasMultiple && worst.price > best.price && (
                    <div className="text-base text-neutral-600 font-medium tabular-nums">
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
