/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Función 3: Armar la lista de compra con el total estimado.
 * Ajustado para visibilidad al sol, texto >= 16px, etiquetas visibles y un solo botón principal.
 */

import React, { useState, useMemo } from 'react';
import { PriceRecord, ShoppingItem } from '../types';
import { formatCurrency, normalizeKey } from '../utils/formatters';
import { 
  Plus, 
  Trash2, 
  Store, 
  ShoppingBag, 
  CheckCircle2,
  Circle,
  Minus,
  AlertTriangle
} from 'lucide-react';

interface ShoppingListProps {
  prices: PriceRecord[];
  shoppingItems: ShoppingItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onToggleComplete: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (productKey: string, productName: string, qty: number) => void;
  onClearCompleted: () => void;
  onGoToRegister: () => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  prices,
  shoppingItems,
  onUpdateQuantity,
  onToggleComplete,
  onRemoveItem,
  onAddItem,
  onClearCompleted,
  onGoToRegister,
}) => {
  const [selectedProductInput, setSelectedProductInput] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [showSingleStoreTotals, setShowSingleStoreTotals] = useState(false);

  const productPricesMap = useMemo(() => {
    const map = new Map<string, PriceRecord[]>();
    prices.forEach((p) => {
      const list = map.get(p.productKey) || [];
      list.push(p);
      map.set(p.productKey, list);
    });
    return map;
  }, [prices]);

  const allStores = useMemo(() => {
    const set = new Set<string>();
    prices.forEach((p) => set.add(p.storeName));
    return Array.from(set);
  }, [prices]);

  const registeredProducts = useMemo(() => {
    const map = new Map<string, string>();
    prices.forEach((p) => {
      if (!map.has(p.productKey)) {
        map.set(p.productKey, p.productName);
      }
    });
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [prices]);

  const optimizedSummary = useMemo(() => {
    let totalEstimated = 0;
    let itemsWithoutPriceCount = 0;
    const storeSplits = new Map<string, { storeName: string; items: { name: string; qty: number; unitPrice: number; subtotal: number }[]; total: number }>();

    shoppingItems.forEach((item) => {
      const records = productPricesMap.get(item.productKey);
      if (!records || records.length === 0) {
        itemsWithoutPriceCount++;
        return;
      }

      const sorted = [...records].sort((a, b) => a.price - b.price);
      const best = sorted[0];
      const itemSubtotal = best.price * item.quantity;
      totalEstimated += itemSubtotal;

      const storeGroup = storeSplits.get(best.storeName) || {
        storeName: best.storeName,
        items: [],
        total: 0,
      };
      storeGroup.items.push({
        name: item.productName,
        qty: item.quantity,
        unitPrice: best.price,
        subtotal: itemSubtotal,
      });
      storeGroup.total += itemSubtotal;
      storeSplits.set(best.storeName, storeGroup);
    });

    return {
      totalEstimated,
      itemsWithoutPriceCount,
      storeSplits: Array.from(storeSplits.values()),
    };
  }, [shoppingItems, productPricesMap]);

  const singleStoreComparisons = useMemo(() => {
    if (shoppingItems.length === 0) return [];

    return allStores.map((store) => {
      let storeTotal = 0;
      let availableItemsCount = 0;
      const missingItems: string[] = [];

      shoppingItems.forEach((item) => {
        const records = productPricesMap.get(item.productKey);
        const recordInStore = records?.find((r) => r.storeName === store);

        if (recordInStore) {
          storeTotal += recordInStore.price * item.quantity;
          availableItemsCount++;
        } else {
          missingItems.push(item.productName);
        }
      });

      const isComplete = missingItems.length === 0;
      const differenceWithOptimal = storeTotal - optimizedSummary.totalEstimated;

      return {
        storeName: store,
        total: storeTotal,
        availableItemsCount,
        missingItems,
        isComplete,
        differenceWithOptimal,
      };
    }).sort((a, b) => {
      if (a.isComplete && !b.isComplete) return -1;
      if (!a.isComplete && b.isComplete) return 1;
      return a.total - b.total;
    });
  }, [allStores, shoppingItems, productPricesMap, optimizedSummary.totalEstimated]);

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = selectedProductInput.trim();
    if (!cleanName) return;

    const key = normalizeKey(cleanName);
    onAddItem(key, cleanName, Math.max(1, newQuantity));
    setSelectedProductInput('');
    setNewQuantity(1);
  };

  const completedCount = shoppingItems.filter((i) => i.completed).length;

  return (
    <div className="space-y-5">
      {/* Tarjeta de TOTAL ESTIMADO con alto contraste */}
      <section className="bg-neutral-950 text-white rounded-2xl p-5 shadow-lg border-2 border-neutral-800">
        <div className="flex items-center justify-between text-base font-bold mb-1">
          <span className="uppercase tracking-wider text-emerald-400">
            Total Estimado
          </span>
          <span className="text-neutral-300 tabular-nums">
            {shoppingItems.length} {shoppingItems.length === 1 ? 'producto' : 'productos'} ({completedCount} listos)
          </span>
        </div>

        <div className="my-2">
          <div className="text-4xl font-black tracking-tight tabular-nums text-white">
            {formatCurrency(optimizedSummary.totalEstimated)}
          </div>
          <div className="text-base text-emerald-400 font-bold mt-1">
            Comprando cada cosa en su mejor precio
          </div>
        </div>

        {optimizedSummary.itemsWithoutPriceCount > 0 ? (
          <div className="mt-3 text-base text-amber-200 bg-amber-950 border-2 border-amber-600 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Hay {optimizedSummary.itemsWithoutPriceCount} producto(s) sin precio registrado en la app. Su importe no está sumado.
            </span>
          </div>
        ) : shoppingItems.length > 0 ? (
          <p className="text-base text-neutral-300 mt-2 font-medium">
            Calculado dividiendo la compra entre las tiendas más baratas de tu cuadra.
          </p>
        ) : (
          <p className="text-base text-neutral-300 mt-2 font-medium">
            Tu lista está vacía. Sumá lo que necesitás comprar para ver el total.
          </p>
        )}

        {/* Botón secundario para alternar comparativa en una sola tienda */}
        {shoppingItems.length > 0 && allStores.length > 1 && (
          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between flex-wrap gap-2">
            <span className="text-base text-neutral-300 font-medium">
              ¿Querés ir a una sola tienda?
            </span>
            <button
              type="button"
              onClick={() => setShowSingleStoreTotals(!showSingleStoreTotals)}
              className="text-base font-extrabold text-emerald-400 hover:text-emerald-300 underline min-h-[44px] flex items-center"
            >
              {showSingleStoreTotals ? 'Ocultar totales por tienda' : 'Ver total en cada tienda'}
            </button>
          </div>
        )}
      </section>

      {/* Sección condicional: Comparación de comprar todo en una sola tienda */}
      {showSingleStoreTotals && shoppingItems.length > 0 && (
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300 space-y-3">
          <div className="pb-2 border-b-2 border-neutral-200">
            <h3 className="text-base font-extrabold text-neutral-950 uppercase tracking-wide">
              Total si comprás todo en una sola tienda
            </h3>
          </div>

          <div className="space-y-3">
            {singleStoreComparisons.map((store) => (
              <div
                key={store.storeName}
                className="p-3.5 rounded-xl border-2 border-neutral-300 bg-neutral-50 flex items-center justify-between gap-3 text-base"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-neutral-950 flex items-center gap-1.5 truncate">
                    <Store className="w-4 h-4 text-neutral-700 shrink-0" />
                    <span className="truncate">{store.storeName}</span>
                  </div>
                  {store.isComplete ? (
                    <div className="text-base text-neutral-700 font-medium mt-0.5">
                      {store.differenceWithOptimal > 0 ? (
                        <span className="text-red-800 font-bold">
                          +{formatCurrency(store.differenceWithOptimal)} más caro que dividir
                        </span>
                      ) : (
                        <span className="text-emerald-900 font-extrabold">
                          ¡Mismo total que el óptimo!
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-base text-neutral-600 font-medium mt-0.5">
                      Tiene precio para {store.availableItemsCount} de {shoppingItems.length}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-extrabold text-neutral-950 tabular-nums">
                    {formatCurrency(store.total)}
                  </div>
                  {!store.isComplete && (
                    <span className="text-base text-amber-800 font-extrabold">Faltan precios</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formulario para agregar con ETIQUETAS VISIBLES y adaptado a 320px */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300">
        <form onSubmit={handleAddNewItem} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="shop-item-name" className="block text-base font-extrabold text-neutral-950 mb-1.5">
                Producto a comprar <span className="text-red-700">*</span>
              </label>
              <input
                id="shop-item-name"
                type="text"
                value={selectedProductInput}
                onChange={(e) => setSelectedProductInput(e.target.value)}
                placeholder="Ejemplo: Leche, Huevos, Yerba"
                className="w-full min-h-[48px] px-3.5 py-3 text-base font-medium text-neutral-950 bg-white border-2 border-neutral-400 rounded-xl focus:outline-none focus:ring-3 focus:ring-emerald-700 focus:border-emerald-800"
                list="shopping-quick-datalist"
              />
              <datalist id="shopping-quick-datalist">
                {registeredProducts.map((p) => (
                  <option key={p.key} value={p.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="shop-item-qty" className="block text-base font-extrabold text-neutral-950 mb-1.5">
                Cantidad
              </label>
              <input
                id="shop-item-qty"
                type="number"
                min="1"
                max="99"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                className="w-full min-h-[48px] px-3.5 py-3 text-center text-base font-extrabold text-neutral-950 bg-white border-2 border-neutral-400 rounded-xl tabular-nums"
              />
            </div>
          </div>

          {/* ÚNICO BOTÓN PRINCIPAL DE ESTA PANTALLA */}
          <button
            type="submit"
            className="w-full min-h-[50px] bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white rounded-xl text-base font-extrabold flex items-center justify-center gap-2 transition-colors shadow-md border-2 border-emerald-950"
          >
            <Plus className="w-5 h-5 text-white" />
            <span>Agregar a la lista</span>
          </button>
        </form>

        {/* Sugerencias secundarias de productos ya registrados */}
        {registeredProducts.length > 0 && (
          <div className="mt-4 pt-3 border-t-2 border-neutral-100 flex flex-wrap gap-2 items-center">
            <span className="text-base font-bold text-neutral-700">Sugeridos:</span>
            {registeredProducts
              .filter((p) => !shoppingItems.some((item) => item.productKey === p.key))
              .slice(0, 3)
              .map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onAddItem(p.key, p.name, 1)}
                  className="min-h-[44px] text-base font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-2 border-neutral-300 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-neutral-700" />
                  <span>{p.name}</span>
                </button>
              ))}
          </div>
        )}
      </section>

      {/* Lista interactiva de compras */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300">
        <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-200 mb-3">
          <h3 className="text-base font-extrabold text-neutral-950 uppercase tracking-wide">
            Artículos a Comprar
          </h3>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="min-h-[44px] px-2.5 text-base font-bold text-red-800 hover:text-red-950 transition-colors"
            >
              Borrar listos ({completedCount})
            </button>
          )}
        </div>

        {/* ESTADO VACÍO CLARO CON FRASE DE INVITACIÓN */}
        {shoppingItems.length === 0 ? (
          <div className="py-8 px-2 text-center space-y-2">
            <ShoppingBag className="w-12 h-12 text-neutral-400 mx-auto" />
            <p className="text-base font-extrabold text-neutral-900">
              Tu lista de compras está vacía.
            </p>
            <p className="text-base text-neutral-700 max-w-xs mx-auto">
              Escribí arriba el primer producto que necesitás comprar para calcular el costo total estimado de tu cuadra.
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-neutral-200">
            {shoppingItems.map((item) => {
              const records = productPricesMap.get(item.productKey) || [];
              const sorted = [...records].sort((a, b) => a.price - b.price);
              const bestRecord = sorted[0];
              const estimatedItemTotal = bestRecord ? bestRecord.price * item.quantity : 0;

              return (
                <div
                  key={item.id}
                  className={`py-3.5 flex flex-col gap-2 transition-opacity ${
                    item.completed ? 'opacity-60 bg-neutral-50' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(item.id)}
                      className="min-h-[48px] min-w-[48px] flex items-center justify-center shrink-0 border-2 border-neutral-300 rounded-xl bg-white hover:bg-neutral-50"
                      title={item.completed ? 'Marcar como pendiente' : 'Marcar como comprado'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-800" />
                      ) : (
                        <Circle className="w-6 h-6 text-neutral-500" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-base font-extrabold text-neutral-950 ${
                          item.completed ? 'line-through text-neutral-600' : ''
                        }`}
                      >
                        {item.productName}
                      </div>

                      {bestRecord ? (
                        <div className="text-base text-neutral-700 font-medium mt-0.5">
                          En: <strong className="text-emerald-950 font-extrabold">{bestRecord.storeName}</strong> ({formatCurrency(bestRecord.price)} c/u)
                        </div>
                      ) : (
                        <div className="text-base text-amber-800 font-bold mt-0.5 flex items-center gap-1.5">
                          <span>Sin precio guardado</span>
                          <button
                            type="button"
                            onClick={onGoToRegister}
                            className="underline font-extrabold text-neutral-950"
                          >
                            Anotar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-neutral-950 tabular-nums">
                        {estimatedItemTotal > 0 ? formatCurrency(estimatedItemTotal) : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Controles secundarios de cantidad y eliminación */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100 pl-14">
                    <div className="flex items-center gap-1 bg-neutral-100 border-2 border-neutral-300 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-neutral-900 disabled:opacity-30 hover:bg-neutral-200 rounded-lg transition-colors font-bold"
                        title="Menos"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-base font-extrabold text-neutral-950 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors font-bold"
                        title="Más"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="min-h-[44px] px-3 py-2 text-base font-bold text-red-800 hover:text-red-950 rounded-xl transition-colors flex items-center gap-1"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Ruta de compra por tienda */}
      {optimizedSummary.storeSplits.length > 0 && (
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-neutral-200">
            <div>
              <h3 className="text-base font-extrabold text-neutral-950 uppercase tracking-wide">
                Ruta de Compra de la Cuadra
              </h3>
              <p className="text-base text-neutral-700 font-medium">
                Qué conviene comprar en cada parada
              </p>
            </div>
            <span className="text-base font-extrabold text-emerald-950 bg-emerald-200 border border-emerald-700 px-3 py-1 rounded-xl">
              {optimizedSummary.storeSplits.length} {optimizedSummary.storeSplits.length === 1 ? 'parada' : 'paradas'}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {optimizedSummary.storeSplits.map((group) => (
              <div
                key={group.storeName}
                className="p-4 rounded-xl border-2 border-neutral-300 bg-neutral-50 space-y-2"
              >
                <div className="flex items-center justify-between text-base">
                  <div className="font-extrabold text-neutral-950 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-emerald-800" />
                    <span>{group.storeName}</span>
                  </div>
                  <span className="font-extrabold text-emerald-950 tabular-nums">
                    Total: {formatCurrency(group.total)}
                  </span>
                </div>

                <ul className="text-base text-neutral-800 divide-y divide-neutral-200 pl-2">
                  {group.items.map((subItem, idx) => (
                    <li key={idx} className="py-1.5 flex justify-between items-center">
                      <span>
                        {subItem.qty}x {subItem.name}
                      </span>
                      <span className="font-extrabold text-neutral-950 tabular-nums">
                        {formatCurrency(subItem.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
