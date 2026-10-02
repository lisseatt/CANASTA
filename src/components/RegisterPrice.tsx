/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Función 1: Registrar precio por producto y tienda.
 */

import React, { useState, useMemo } from 'react';
import { PriceRecord } from '../types';
import { normalizeKey, formatCurrency, formatRelativeDate } from '../utils/formatters';
import { PlusCircle, CheckCircle, Store, Tag, Sparkles, ArrowRight, Trash2 } from 'lucide-react';

interface RegisterPriceProps {
  prices: PriceRecord[];
  onSavePrice: (record: PriceRecord) => void;
  onDeletePrice: (id: string) => void;
  onGoToCompare: (productKey: string) => void;
}

export const RegisterPrice: React.FC<RegisterPriceProps> = ({
  prices,
  onSavePrice,
  onDeletePrice,
  onGoToCompare,
}) => {
  const [productName, setProductName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [unit, setUnit] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; productKey: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extraemos listas únicas de productos y tiendas para sugerencias en pantalla
  const knownProducts = useMemo(() => {
    const map = new Map<string, string>();
    prices.forEach((p) => {
      if (!map.has(p.productKey)) {
        map.set(p.productKey, p.productName);
      }
    });
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [prices]);

  const knownStores = useMemo(() => {
    const set = new Set<string>();
    prices.forEach((p) => set.add(p.storeName));
    return Array.from(set);
  }, [prices]);

  // Últimos 5 precios registrados o actualizados (orden descendente por fecha)
  const recentRecords = useMemo(() => {
    return [...prices]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [prices]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // ¡PUNTO CRÍTICO 1: VALIDACIÓN Y SANITIZACIÓN!
    // Alguien suele olvidarse del trim y guardar registros vacíos o con espacios invisibles.
    const cleanProductName = productName.trim();
    const cleanStoreName = storeName.trim();

    if (!cleanProductName) {
      setErrorMsg('Por favor ingresá el nombre del producto.');
      return;
    }
    if (!cleanStoreName) {
      setErrorMsg('Por favor ingresá el nombre de la tienda o almacén.');
      return;
    }

    // ¡PUNTO CRÍTICO 2: PARSEO DE PRECIOS DECIMALES!
    // En teclados móviles hispanos, los usuarios suelen tipear coma (ej: 1250,50 o 1.250).
    // Si pasamos directamente `Number("1250,50")` da NaN.
    // Limpiamos los puntos de miles si existen y reemplazamos coma por punto decimal.
    let sanitizedPriceStr = priceInput.trim();
    // Si contiene coma y punto (ej: 1.500,50), quitamos el punto y cambiamos la coma por punto
    if (sanitizedPriceStr.includes('.') && sanitizedPriceStr.includes(',')) {
      sanitizedPriceStr = sanitizedPriceStr.replace(/\./g, '').replace(',', '.');
    } else if (sanitizedPriceStr.includes(',')) {
      sanitizedPriceStr = sanitizedPriceStr.replace(',', '.');
    }

    const parsedPrice = parseFloat(sanitizedPriceStr);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Por favor ingresá un precio válido mayor a 0.');
      return;
    }

    const productKey = normalizeKey(cleanProductName);
    const storeKey = normalizeKey(cleanStoreName);

    // ¡PUNTO CRÍTICO 3: EVITAR DUPLICADOS INCONSISTENTES EN LA MISMA TIENDA!
    // Si el usuario vuelve a registrar la leche en la misma tienda con nuevo precio,
    // debemos actualizar el ID existente en vez de crear 2 precios conflictivos para la misma tienda.
    const existing = prices.find(
      (p) => p.productKey === productKey && p.storeKey === storeKey
    );

    const newRecord: PriceRecord = {
      id: existing ? existing.id : 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      productName: cleanProductName,
      productKey,
      storeName: cleanStoreName,
      storeKey,
      price: parsedPrice,
      unit: unit.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSavePrice(newRecord);

    // Feedback visual y reseteo suave (mantenemos la tienda si el usuario está cargando varios productos allí)
    setFeedbackMsg({
      text: existing
        ? `Precio actualizado para ${cleanProductName} en ${cleanStoreName} (${formatCurrency(parsedPrice)})`
        : `Registrado: ${cleanProductName} en ${cleanStoreName} por ${formatCurrency(parsedPrice)}`,
      productKey,
    });
    setProductName('');
    setPriceInput('');
    setUnit('');

    // Limpia el mensaje después de 6 segundos
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta principal del formulario */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/80">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900 leading-tight">
              Registrar Precio
            </h2>
            <p className="text-xs text-neutral-500">
              Anotá lo que cuesta en cada tienda de la cuadra
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
            <span className="font-bold">Error:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {feedbackMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToCompare(feedbackMsg.productKey)}
              className="inline-flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-900 pt-1 border-t border-emerald-200/60"
            >
              <span>Ver comparativa de este producto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo: Producto */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Producto o artículo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej: Leche entera 1L, Arroz largo..."
                className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                list="products-datalist"
              />
              <datalist id="products-datalist">
                {knownProducts.map((p) => (
                  <option key={p.key} value={p.name} />
                ))}
              </datalist>
            </div>
            {/* Sugerencias rápidas táctiles para evitar tipear de más en móvil */}
            {knownProducts.length > 0 && !productName && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-neutral-400">Existentes:</span>
                {knownProducts.slice(0, 4).map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setProductName(p.name)}
                    className="text-[11px] px-2 py-1 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-md transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campo: Tienda */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Tienda / Almacén / Super <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ej: Supermercado Norte, Almacén Don Tito..."
                className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                list="stores-datalist"
              />
              <datalist id="stores-datalist">
                {knownStores.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            {/* Botones de selección rápida de tiendas existentes */}
            {knownStores.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-neutral-400">Tiendas:</span>
                {knownStores.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStoreName(s)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                      storeName === s
                        ? 'bg-emerald-600 text-white font-medium'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fila: Precio y Presentación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Precio actual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 font-semibold text-sm">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="1250"
                  className="w-full pl-7 pr-3 py-2.5 text-sm font-semibold bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Presentación / Unidad
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="1 Litro, 500g..."
                className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[46px] mt-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Guardar Precio</span>
          </button>
        </form>
      </section>

      {/* Sección: Últimos precios guardados */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/80">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Últimos Precios Registrados
          </h3>
          <span className="text-[11px] text-neutral-400">
            Total cargados: {prices.length}
          </span>
        </div>

        {recentRecords.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">
            No hay precios registrados todavía.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentRecords.map((r) => (
              <div
                key={r.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-neutral-900 truncate">
                    {r.productName}
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mt-0.5">
                    <Store className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate">{r.storeName}</span>
                    <span>·</span>
                    <span className="text-neutral-400 shrink-0">
                      {formatRelativeDate(r.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="font-bold text-sm text-neutral-900 tabular-nums">
                      {formatCurrency(r.price)}
                    </span>
                    {r.unit && (
                      <div className="text-[10px] text-neutral-400">{r.unit}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onGoToCompare(r.productKey)}
                    title="Comparar este producto"
                    className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePrice(r.id)}
                    title="Eliminar este precio"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
