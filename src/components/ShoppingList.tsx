/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Función 3: Armar la lista de compra con el total estimado.
 */

import React, { useState, useMemo } from 'react';
import { PriceRecord, ShoppingItem } from '../types';
import { formatCurrency, normalizeKey } from '../utils/formatters';
import { 
  Plus, 
  Trash2, 
  Check, 
  Store, 
  ShoppingBag, 
  Sparkles, 
  HelpCircle,
  CheckCircle2,
  Circle,
  PlusCircle,
  Minus
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

  // Mapeo de precios por productKey
  const productPricesMap = useMemo(() => {
    const map = new Map<string, PriceRecord[]>();
    prices.forEach((p) => {
      const list = map.get(p.productKey) || [];
      list.push(p);
      map.set(p.productKey, list);
    });
    return map;
  }, [prices]);

  // Lista de todas las tiendas conocidas
  const allStores = useMemo(() => {
    const set = new Set<string>();
    prices.forEach((p) => set.add(p.storeName));
    return Array.from(set);
  }, [prices]);

  // Lista de productos registrados en la app para el selector
  const registeredProducts = useMemo(() => {
    const map = new Map<string, string>();
    prices.forEach((p) => {
      if (!map.has(p.productKey)) {
        map.set(p.productKey, p.productName);
      }
    });
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [prices]);

  /**
   * CÁLCULO 1: Total estimado optimizado (comprando cada ítem en la tienda más barata).
   * 
   * ¡PUNTO CRÍTICO 1: PRODUCTOS SIN PRECIO REGISTRADO!
   * Si el usuario agrega un ítem del cual no tenemos ningún precio registrado todavía,
   * el cálculo del total no debe romperse con NaN. Debemos identificar ítems sin precio.
   */
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

      // Ordenar por precio ascendente para encontrar la tienda más barata
      const sorted = [...records].sort((a, b) => a.price - b.price);
      const best = sorted[0];
      const itemSubtotal = best.price * item.quantity;
      totalEstimated += itemSubtotal;

      // Agrupamos en el desglose de compras por tienda
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

  /**
   * CÁLCULO 2: Total estimado si se compra TODO en una sola tienda.
   * 
   * ¡PUNTO CRÍTICO 2: COMPARAR MANZANAS CON MANZANAS!
   * Si la Tienda A tiene precios para los 5 ítems pero la Tienda B solo tiene para 2,
   * la suma de la Tienda B parecería erróneamente más barata si no indicamos
   * que tiene productos faltantes.
   */
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
      // Priorizar las tiendas que tienen todos los productos, luego ordenar por total
      if (a.isComplete && !b.isComplete) return -1;
      if (!a.isComplete && b.isComplete) return 1;
      return a.total - b.total;
    });
  }, [allStores, shoppingItems, productPricesMap, optimizedSummary.totalEstimated]);

  // Manejar el submit del formulario de agregar a la lista
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
      {/* Banner del TOTAL ESTIMADO de la lista */}
      <section className="bg-neutral-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span className="font-semibold uppercase tracking-wider text-emerald-400">
            Total Estimado de Compra
          </span>
          <span>
            {shoppingItems.length} {shoppingItems.length === 1 ? 'ítem' : 'ítems'} ({completedCount} listos)
          </span>
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <div className="text-3xl font-extrabold tracking-tight tabular-nums text-white">
            {formatCurrency(optimizedSummary.totalEstimated)}
          </div>
          <span className="text-xs text-emerald-400 font-medium">
            (con mejor precio por tienda)
          </span>
        </div>

        {optimizedSummary.itemsWithoutPriceCount > 0 ? (
          <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded-lg p-2">
            ⚠️ Hay {optimizedSummary.itemsWithoutPriceCount} artículo(s) sin precio registrado en la app. Su importe no está sumado.
          </div>
        ) : shoppingItems.length > 0 ? (
          <p className="text-xs text-neutral-400 mt-2">
            Comprando cada cosa donde está más barata en tu cuadra.
          </p>
        ) : (
          <p className="text-xs text-neutral-400 mt-2">
            Tu lista está vacía. Sumá los productos que necesitas comprar.
          </p>
        )}

        {/* Toggle para ver comparativa de comprar todo en una sola tienda */}
        {shoppingItems.length > 0 && allStores.length > 1 && (
          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-300">
              ¿Preferís no recorrer varias tiendas?
            </span>
            <button
              type="button"
              onClick={() => setShowSingleStoreTotals(!showSingleStoreTotals)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {showSingleStoreTotals ? 'Ocultar totales por tienda' : 'Ver total en cada tienda'}
            </button>
          </div>
        )}
      </section>

      {/* Tarjeta condicional: Comparación de comprar TODO en una sola tienda */}
      {showSingleStoreTotals && shoppingItems.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Total si comprás todo en una sola tienda
            </h3>
          </div>

          <div className="space-y-2">
            {singleStoreComparisons.map((store) => (
              <div
                key={store.storeName}
                className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-neutral-900 flex items-center gap-1.5 truncate">
                    <Store className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{store.storeName}</span>
                  </div>
                  {store.isComplete ? (
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {store.differenceWithOptimal > 0 ? (
                        <span className="text-amber-700">
                          +{formatCurrency(store.differenceWithOptimal)} más caro que dividir la compra
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">
                          ¡Mismo total que el óptimo!
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Tiene precio para {store.availableItemsCount} de {shoppingItems.length} ítems
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-neutral-900 tabular-nums">
                    {formatCurrency(store.total)}
                  </div>
                  {!store.isComplete && (
                    <span className="text-[10px] text-amber-600 font-medium">Incompleto</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formulario rápido para sumar a la lista */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80">
        <form onSubmit={handleAddNewItem} className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={selectedProductInput}
              onChange={(e) => setSelectedProductInput(e.target.value)}
              placeholder="Agregar a la lista (ej: Leche, Yerba...)"
              className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              list="shopping-quick-datalist"
            />
            <datalist id="shopping-quick-datalist">
              {registeredProducts.map((p) => (
                <option key={p.key} value={p.name} />
              ))}
            </datalist>
          </div>

          <div className="w-16">
            <input
              type="number"
              min="1"
              max="99"
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-2 py-2.5 text-center text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl tabular-nums"
              title="Cantidad"
            />
          </div>

          <button
            type="submit"
            className="min-h-[42px] px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Sugerencias rápidas de productos cargados que no están en la lista */}
        {registeredProducts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-neutral-400">Sugeridos:</span>
            {registeredProducts
              .filter((p) => !shoppingItems.some((item) => item.productKey === p.key))
              .slice(0, 4)
              .map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onAddItem(p.key, p.name, 1)}
                  className="text-[11px] px-2 py-1 bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 text-neutral-700 rounded-md transition-colors flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{p.name}</span>
                </button>
              ))}
          </div>
        )}
      </section>

      {/* Lista interactiva de compras */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/80">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Artículos a Comprar
          </h3>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="text-[11px] text-neutral-500 hover:text-red-600 transition-colors"
            >
              Borrar comprados ({completedCount})
            </button>
          )}
        </div>

        {shoppingItems.length === 0 ? (
          <div className="py-8 text-center text-neutral-400 text-xs">
            <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <span>No tenés productos en la lista todavía.</span>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {shoppingItems.map((item) => {
              const records = productPricesMap.get(item.productKey) || [];
              const sorted = [...records].sort((a, b) => a.price - b.price);
              const bestRecord = sorted[0];
              const estimatedItemTotal = bestRecord ? bestRecord.price * item.quantity : 0;

              return (
                <div
                  key={item.id}
                  className={`py-3.5 flex items-center justify-between gap-3 transition-opacity ${
                    item.completed ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  {/* Checkbox táctil amplio */}
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item.id)}
                    className="min-h-[44px] min-w-[36px] flex items-center justify-center shrink-0"
                    title={item.completed ? 'Marcar como pendiente' : 'Marcar como comprado'}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-neutral-300 hover:text-neutral-400" />
                    )}
                  </button>

                  {/* Nombre y detalles de tienda recomendada */}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-semibold text-neutral-900 truncate ${
                        item.completed ? 'line-through text-neutral-500' : ''
                      }`}
                    >
                      {item.productName}
                    </div>

                    {bestRecord ? (
                      <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1.5 truncate">
                        <span>Más barato en:</span>
                        <strong className="text-emerald-700 font-semibold truncate">
                          {bestRecord.storeName}
                        </strong>
                        <span className="tabular-nums">({formatCurrency(bestRecord.price)} c/u)</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-600 mt-0.5 flex items-center gap-1">
                        <span>Sin precio guardado</span>
                        <button
                          type="button"
                          onClick={onGoToRegister}
                          className="underline hover:text-amber-800"
                        >
                          Cargar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Controles de cantidad (+ / -) y subtotal */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center text-neutral-600 disabled:opacity-30 hover:bg-neutral-200 rounded transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-neutral-800 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[65px]">
                      <div className="text-xs font-bold text-neutral-900 tabular-nums">
                        {estimatedItemTotal > 0 ? formatCurrency(estimatedItemTotal) : '-'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Hoja de ruta de compras por tienda: resuelve ir a las 3 tiendas de la cuadra con qué comprar en cada una */}
      {optimizedSummary.storeSplits.length > 0 && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Ruta de Compra Recomendada
              </h3>
              <p className="text-[11px] text-neutral-500">
                Qué conviene comprar en cada tienda de la cuadra
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              {optimizedSummary.storeSplits.length} paradas
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {optimizedSummary.storeSplits.map((group) => (
              <div
                key={group.storeName}
                className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{group.storeName}</span>
                  </div>
                  <span className="font-bold text-emerald-800 tabular-nums">
                    Total: {formatCurrency(group.total)}
                  </span>
                </div>

                <ul className="text-[11px] text-neutral-600 divide-y divide-neutral-200/60 pl-2">
                  {group.items.map((subItem, idx) => (
                    <li key={idx} className="py-1 flex justify-between items-center">
                      <span>
                        {subItem.qty}x {subItem.name}
                      </span>
                      <span className="font-medium text-neutral-700 tabular-nums">
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
