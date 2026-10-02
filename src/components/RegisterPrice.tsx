/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Función 1: Registrar precio por producto y tienda.
 * Ajustado para visibilidad al sol, texto >= 16px, etiquetas visibles y uso con una mano desde 320px.
 */

import React, { useState, useMemo } from 'react';
import { PriceRecord } from '../types';
import { normalizeKey, formatCurrency, formatRelativeDate } from '../utils/formatters';
import { PlusCircle, CheckCircle, Store, ArrowRight, Trash2, Pencil, X, AlertTriangle } from 'lucide-react';

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
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
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

  // Funciones para iniciar y cancelar edición
  const handleStartEdit = (record: PriceRecord) => {
    setEditingRecordId(record.id);
    setProductName(record.productName);
    setStoreName(record.storeName);
    setPriceInput(record.price.toString());
    setUnit(record.unit || '');
    setErrorMsg(null);
    setFeedbackMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setProductName('');
    setStoreName('');
    setPriceInput('');
    setUnit('');
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanProductName = productName.trim();
    const cleanStoreName = storeName.trim();

    // Mensajes de error claros, en español y sin tecnicismos
    if (!cleanProductName) {
      setErrorMsg('Falta escribir el nombre del producto.');
      return;
    }
    if (!cleanStoreName) {
      setErrorMsg('Falta escribir el nombre de la tienda o almacén.');
      return;
    }

    let sanitizedPriceStr = priceInput.trim();
    if (sanitizedPriceStr.includes('.') && sanitizedPriceStr.includes(',')) {
      sanitizedPriceStr = sanitizedPriceStr.replace(/\./g, '').replace(',', '.');
    } else if (sanitizedPriceStr.includes(',')) {
      sanitizedPriceStr = sanitizedPriceStr.replace(',', '.');
    }

    const parsedPrice = parseFloat(sanitizedPriceStr);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Ingresá un precio en números que sea mayor a cero.');
      return;
    }

    const productKey = normalizeKey(cleanProductName);
    const storeKey = normalizeKey(cleanStoreName);

    const existing = prices.find(
      (p) => p.productKey === productKey && p.storeKey === storeKey
    );

    const recordId = editingRecordId
      ? editingRecordId
      : existing
      ? existing.id
      : 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newRecord: PriceRecord = {
      id: recordId,
      productName: cleanProductName,
      productKey,
      storeName: cleanStoreName,
      storeKey,
      price: parsedPrice,
      unit: unit.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSavePrice(newRecord);

    const wasEditing = Boolean(editingRecordId);
    setEditingRecordId(null);

    // Mensaje de éxito claro, sin términos técnicos
    setFeedbackMsg({
      text: wasEditing
        ? `Precio modificado: ${cleanProductName} en ${cleanStoreName} ahora vale ${formatCurrency(parsedPrice)}`
        : existing
        ? `Precio actualizado para ${cleanProductName} en ${cleanStoreName} (${formatCurrency(parsedPrice)})`
        : `Guardado: ${cleanProductName} en ${cleanStoreName} por ${formatCurrency(parsedPrice)}`,
      productKey,
    });
    setProductName('');
    setPriceInput('');
    setUnit('');
    if (wasEditing) {
      setStoreName('');
    }

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta principal del formulario con alto contraste */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300">
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-neutral-200">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              editingRecordId
                ? 'bg-amber-100 text-amber-950 border-2 border-amber-500'
                : 'bg-emerald-100 text-emerald-950 border-2 border-emerald-600'
            }`}>
              {editingRecordId ? (
                <Pencil className="w-5 h-5 text-amber-900" />
              ) : (
                <PlusCircle className="w-5 h-5 text-emerald-900" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-neutral-950 leading-tight">
                {editingRecordId ? 'Modificar Precio' : 'Registrar Precio'}
              </h2>
              <p className="text-base text-neutral-700 font-medium">
                {editingRecordId
                  ? 'Cambiá el precio o la tienda asignada'
                  : 'Anotá lo que cuesta en cada tienda'}
              </p>
            </div>
          </div>

          {/* Botón secundario para cancelar edición */}
          {editingRecordId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="min-h-[44px] px-3 py-2 text-base font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-400 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <X className="w-4 h-4 text-neutral-700" />
              <span>Cancelar</span>
            </button>
          )}
        </div>

        {/* Mensaje de error visible, con texto grande y alto contraste */}
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-700 text-red-950 text-base font-bold rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-800 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mensaje de éxito visible con texto grande y alto contraste */}
        {feedbackMsg && (
          <div className="mb-4 p-4 bg-emerald-100 border-2 border-emerald-800 text-emerald-950 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-base font-extrabold">
              <CheckCircle className="w-5 h-5 text-emerald-800 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
            {/* Botón secundario de acceso a la comparativa */}
            <button
              type="button"
              onClick={() => onGoToCompare(feedbackMsg.productKey)}
              className="min-h-[44px] px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-950 border-2 border-emerald-700 text-base font-bold rounded-xl flex items-center justify-between transition-colors"
            >
              <span>Ver comparativa de este producto</span>
              <ArrowRight className="w-4 h-4 text-emerald-900" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo 1: Producto con etiqueta visible obligatoria */}
          <div>
            <label htmlFor="reg-product-name" className="block text-base font-extrabold text-neutral-950 mb-1.5">
              Producto o artículo <span className="text-red-700">*</span>
            </label>
            <input
              id="reg-product-name"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ejemplo: Leche entera 1L"
              className="w-full min-h-[48px] px-3.5 py-3 text-base font-medium text-neutral-950 bg-white border-2 border-neutral-400 rounded-xl focus:outline-none focus:ring-3 focus:ring-emerald-700 focus:border-emerald-800 transition-all"
              list="products-datalist"
            />
            <datalist id="products-datalist">
              {knownProducts.map((p) => (
                <option key={p.key} value={p.name} />
              ))}
            </datalist>

            {/* Botones secundarios de sugerencias de productos */}
            {knownProducts.length > 0 && !productName && (
              <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                <span className="text-base font-bold text-neutral-700">Ya cargados:</span>
                {knownProducts.slice(0, 3).map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setProductName(p.name)}
                    className="min-h-[44px] text-base font-bold px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-2 border-neutral-300 rounded-xl transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campo 2: Tienda con etiqueta visible obligatoria */}
          <div>
            <label htmlFor="reg-store-name" className="block text-base font-extrabold text-neutral-950 mb-1.5">
              Tienda o almacén <span className="text-red-700">*</span>
            </label>
            <input
              id="reg-store-name"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ejemplo: Almacén Don Tito"
              className="w-full min-h-[48px] px-3.5 py-3 text-base font-medium text-neutral-950 bg-white border-2 border-neutral-400 rounded-xl focus:outline-none focus:ring-3 focus:ring-emerald-700 focus:border-emerald-800 transition-all"
              list="stores-datalist"
            />
            <datalist id="stores-datalist">
              {knownStores.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>

            {/* Botones secundarios de selección rápida de tiendas */}
            {knownStores.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                <span className="text-base font-bold text-neutral-700">Tiendas:</span>
                {knownStores.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStoreName(s)}
                    className={`min-h-[44px] text-base font-bold px-3 py-2 rounded-xl border-2 transition-colors ${
                      storeName === s
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campo 3 y 4: Precio y Unidad (diseñado para 320px en columna) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-product-price" className="block text-base font-extrabold text-neutral-950 mb-1.5">
                Precio actual <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-700 font-extrabold text-base">
                  $
                </span>
                <input
                  id="reg-product-price"
                  type="text"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="1250"
                  className="w-full min-h-[48px] pl-8 pr-3.5 py-3 text-base font-extrabold text-neutral-950 bg-white border-2 border-neutral-400 rounded-xl focus:outline-none focus:ring-3 focus:ring-emerald-700 focus:border-emerald-800 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-product-unit" className="block text-base font-extrabold text-neutral-950 mb-1.5">
                Presentación o tamaño (opcional)
              </label>
              <input
                id="reg-product-unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ejemplo: 1 Litro, 500g"
                className="w-full min-h-[48px] px-3.5 py-3 text-base font-medium text-neutral-950 bg-white border-2 border-neutral-400 rounded-xl focus:outline-none focus:ring-3 focus:ring-emerald-700 focus:border-emerald-800"
              />
            </div>
          </div>

          {/* ÚNICO BOTÓN PRINCIPAL DE ESTA PANTALLA */}
          <button
            type="submit"
            className="w-full min-h-[52px] mt-3 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-extrabold text-lg rounded-xl flex items-center justify-center gap-2 shadow-md border-2 border-emerald-950 transition-all"
          >
            <CheckCircle className="w-5 h-5 text-white" />
            <span>{editingRecordId ? 'Actualizar Precio' : 'Guardar Precio'}</span>
          </button>
        </form>
      </section>

      {/* Sección: Últimos precios guardados */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300">
        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-neutral-200">
          <h3 className="text-base font-extrabold text-neutral-950 uppercase tracking-wide">
            Últimos Precios Guardados
          </h3>
          <span className="text-base font-bold text-neutral-700 tabular-nums">
            Total: {prices.length}
          </span>
        </div>

        {/* ESTADO VACÍO CLARO CON FRASE DE INVITACIÓN */}
        {recentRecords.length === 0 ? (
          <div className="py-8 px-2 text-center space-y-2">
            <Store className="w-12 h-12 text-neutral-400 mx-auto" />
            <p className="text-base font-extrabold text-neutral-900">
              Todavía no anotaste ningún precio en tu cuadra.
            </p>
            <p className="text-base text-neutral-700 max-w-xs mx-auto">
              Escribí arriba el primer producto que quieras comparar y guardalo para ver la diferencia entre tiendas.
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-neutral-200">
            {recentRecords.map((r) => {
              const isBeingEdited = editingRecordId === r.id;

              return (
                <div
                  key={r.id}
                  className={`py-3.5 px-2 rounded-xl flex flex-col gap-2 transition-colors ${
                    isBeingEdited ? 'bg-amber-50 border-2 border-amber-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-base text-neutral-950 leading-snug">
                        {r.productName}
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-800 text-base font-medium mt-1">
                        <Store className="w-4 h-4 text-neutral-700 shrink-0" />
                        <span className="font-bold">{r.storeName}</span>
                        <span>·</span>
                        <span className="text-neutral-700">{formatRelativeDate(r.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-xl text-neutral-950 tabular-nums">
                        {formatCurrency(r.price)}
                      </div>
                      {r.unit && (
                        <div className="text-base font-semibold text-neutral-700">{r.unit}</div>
                      )}
                    </div>
                  </div>

                  {/* Fila de botones secundarios cómodos para una sola mano */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(r)}
                      title="Editar este precio"
                      className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border-2 font-bold text-base flex items-center justify-center gap-1.5 transition-colors ${
                        isBeingEdited
                          ? 'bg-amber-200 text-amber-950 border-amber-600'
                          : 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300'
                      }`}
                    >
                      <Pencil className="w-4 h-4 text-neutral-800" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onGoToCompare(r.productKey)}
                      title="Comparar este producto"
                      className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-700 font-bold text-base flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 text-emerald-900" />
                      <span>Comparar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeletePrice(r.id)}
                      title="Eliminar este precio"
                      className="min-h-[44px] min-w-[44px] p-2 rounded-xl border-2 bg-white hover:bg-red-50 text-red-800 border-neutral-300 hover:border-red-400 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
