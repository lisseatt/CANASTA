/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Componente de Recomendación Inteligente de Compra (Gemini API).
 * Consume el JSON estructurado y lo presenta como datos numéricos, tablas y métricas (no párrafos).
 */

import React, { useState } from 'react';
import { PriceRecord, SmartRecommendationResult } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Sparkles, 
  Store, 
  TrendingDown, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Check, 
  ChevronRight,
  TestTube2
} from 'lucide-react';

interface SmartSavingsAdvisorProps {
  prices: PriceRecord[];
  onGoToRegister?: () => void;
}

export const SmartSavingsAdvisor: React.FC<SmartSavingsAdvisorProps> = ({
  prices,
  onGoToRegister,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('Consultando precios de la cuadra...');
  const [recommendation, setRecommendation] = useState<SmartRecommendationResult | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{
    type: string;
    text: string;
    details?: string;
  } | null>(null);

  const handleFetchRecommendation = async (useMockMode = false) => {
    setLoading(true);
    setErrorMessage(null);
    setLoadingStage('Analizando diferencias de precios entre tiendas...');

    const stageTimer = setTimeout(() => {
      setLoadingStage('Generando ruta óptima de ahorro con Gemini...');
    }, 3500);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    try {
      const response = await fetch('/api/analyze-savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prices,
          useMock: useMockMode,
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(stageTimer);

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errType = result.errorType || 'ERROR';
        let friendlyText = result.message || 'No se pudo generar la recomendación inteligente.';

        if (errType === 'TIMEOUT') {
          friendlyText = 'La IA tardó demasiado en responder (más de 30 segundos). Podés reintentar o usar los datos de prueba.';
        } else if (errType === 'MISSING_API_KEY') {
          friendlyText = 'Falta configurar la clave GEMINI_API_KEY en las variables de entorno del servidor.';
        } else if (errType === 'SCHEMA_MISMATCH' || errType === 'JSON_PARSE_ERROR') {
          friendlyText = 'La respuesta de la IA no cumplió con el esquema de datos requerido.';
        }

        setErrorMessage({
          type: errType,
          text: friendlyText,
          details: result.message !== friendlyText ? result.message : undefined,
        });
        return;
      }

      setRecommendation(result.data);
      setIsMock(Boolean(result.isMock));
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      clearTimeout(stageTimer);

      const isAbort = err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort'));

      if (isAbort) {
        setErrorMessage({
          type: 'TIMEOUT',
          text: 'La conexión tardó más de 30 segundos en completarse. Verificá tu conexión o utilizá los datos de prueba.',
        });
      } else {
        setErrorMessage({
          type: 'NETWORK_ERROR',
          text: 'Error de conexión con el servidor. Verificá que el backend esté en ejecución.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-neutral-300 space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 border-2 border-purple-400 flex items-center justify-center text-purple-950 font-bold">
            <Sparkles className="w-5 h-5 text-purple-800" />
          </div>
          <div>
            <h3 className="text-xl font-black text-neutral-950 leading-tight">
              Recomendación con IA
            </h3>
            <p className="text-base text-neutral-700 font-medium">
              Gemini analiza tus precios para maximizar tu ahorro
            </p>
          </div>
        </div>

        {isMock && recommendation && (
          <span className="text-base font-extrabold bg-amber-100 text-amber-950 border border-amber-500 px-2.5 py-1 rounded-xl">
            Modo Prueba
          </span>
        )}
      </div>

      {/* Botones de acción */}
      {!recommendation && !loading && (
        <div className="space-y-2.5">
          <p className="text-base text-neutral-800 font-medium">
            Tocá el botón para que Gemini compare los {prices.length} precios registrados en tus tiendas y arme el plan de compra más económico:
          </p>

          <button
            type="button"
            onClick={() => handleFetchRecommendation(false)}
            disabled={prices.length === 0}
            className="w-full min-h-[52px] bg-purple-800 hover:bg-purple-900 active:scale-[0.99] text-white rounded-xl text-base font-extrabold flex items-center justify-center gap-2 shadow-md border-2 border-purple-950 disabled:opacity-50 transition-all"
          >
            <Sparkles className="w-5 h-5 text-purple-200" />
            <span>Generar Plan de Ahorro Inteligente</span>
          </button>

          <button
            type="button"
            onClick={() => handleFetchRecommendation(true)}
            className="w-full min-h-[46px] bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-2 border-neutral-300 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <TestTube2 className="w-4 h-4 text-neutral-700" />
            <span>Probar con datos de prueba (sin gastar llamadas)</span>
          </button>
        </div>
      )}

      {/* Estado de Carga / Spinner con alto contraste y texto >= 16px */}
      {loading && (
        <div className="py-6 px-4 bg-purple-50 border-2 border-purple-300 rounded-xl text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base font-extrabold text-purple-950">
            {loadingStage}
          </p>
          <p className="text-base text-neutral-700">
            Consultando la API de Gemini con salida estructurada en JSON...
          </p>
        </div>
      )}

      {/* Manejo de Fallos visible y sin tecnicismos */}
      {errorMessage && (
        <div className="p-4 bg-red-100 border-2 border-red-700 text-red-950 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-800 shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-extrabold text-red-950">
                No se pudo completar el análisis inteligente
              </div>
              <div className="text-base font-medium text-red-900 mt-1">
                {errorMessage.text}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-red-200">
            <button
              type="button"
              onClick={() => handleFetchRecommendation(false)}
              className="min-h-[44px] px-3 py-2 bg-red-900 hover:bg-red-950 text-white rounded-xl text-base font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar con Gemini</span>
            </button>

            <button
              type="button"
              onClick={() => handleFetchRecommendation(true)}
              className="min-h-[44px] px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-950 border-2 border-neutral-400 rounded-xl text-base font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <TestTube2 className="w-4 h-4 text-purple-800" />
              <span>Usar datos de prueba</span>
            </button>
          </div>
        </div>
      )}

      {/* Visualización de Datos estructurados (como datos, no texto corrido) */}
      {recommendation && (
        <div className="space-y-4 pt-1">
          {/* Tarjeta de métricas de impacto */}
          <div className="bg-emerald-950 text-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold uppercase tracking-wide text-emerald-400">
                Ahorro Máximo Detectado
              </span>
              <span className="text-base font-black bg-emerald-800 text-white px-3 py-1 rounded-xl border border-emerald-500">
                {recommendation.savingsPercentage}% MENOS
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-white tabular-nums">
              Ahorrás {formatCurrency(recommendation.estimatedSavingsAmount)}
            </div>

            {/* Comparativa numérica tabular */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-800/80">
              <div className="bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700">
                <span className="block text-base text-emerald-300 font-medium">Total óptimo:</span>
                <span className="text-xl font-extrabold text-white tabular-nums">
                  {formatCurrency(recommendation.totalEstimatedWithSavings)}
                </span>
              </div>
              <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-700">
                <span className="block text-base text-neutral-300 font-medium">En el más caro:</span>
                <span className="text-xl font-extrabold text-neutral-200 tabular-nums">
                  {formatCurrency(recommendation.totalWithoutOptimizing)}
                </span>
              </div>
            </div>

            {/* Conclusión ejecutiva */}
            <p className="text-base text-emerald-100 font-bold bg-emerald-900/50 p-3 rounded-xl border border-emerald-700/60">
              {recommendation.summaryInsight}
            </p>
          </div>

          {/* Ruta recomendada de paradas por tienda */}
          <div className="space-y-2">
            <h4 className="text-base font-extrabold text-neutral-950 uppercase tracking-wide">
              Ruta por Tienda ({recommendation.storeRoute.length} paradas)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recommendation.storeRoute.map((stop, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-neutral-50 rounded-xl border-2 border-neutral-300 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                    <span className="font-extrabold text-base text-neutral-950 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-800" />
                      {stop.storeName}
                    </span>
                    <span className="font-extrabold text-base text-emerald-900 tabular-nums">
                      {formatCurrency(stop.subtotal)}
                    </span>
                  </div>

                  <ul className="text-base text-neutral-800 space-y-1">
                    {stop.itemsToBuy.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de detalle producto por producto */}
          <div className="space-y-2">
            <h4 className="text-base font-extrabold text-neutral-950 uppercase tracking-wide">
              Detalle Producto por Producto
            </h4>

            <div className="divide-y-2 divide-neutral-200 border-2 border-neutral-300 rounded-xl overflow-hidden">
              {recommendation.itemRecommendations.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-white flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-black text-neutral-950">
                        {item.productName}
                      </div>
                      <div className="text-base text-neutral-700 font-bold flex items-center gap-1 mt-0.5">
                        <span>Comprar en:</span>
                        <strong className="text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                          {item.recommendedStore}
                        </strong>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-emerald-900 tabular-nums">
                        {formatCurrency(item.bestPrice)}
                      </div>
                      <div className="text-base font-bold text-red-800 tabular-nums">
                        Ahorrás {formatCurrency(item.unitSavings)}
                      </div>
                    </div>
                  </div>

                  <div className="text-base text-neutral-700 font-medium pt-1 border-t border-neutral-100 flex items-center justify-between">
                    <span>{item.tip}</span>
                    <span className="text-neutral-500 tabular-nums">
                      vs {formatCurrency(item.alternativePrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción inferior */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleFetchRecommendation(false)}
              className="min-h-[48px] px-3.5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-base font-extrabold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-purple-200" />
              <span>Actualizar con Gemini</span>
            </button>

            <button
              type="button"
              onClick={() => handleFetchRecommendation(true)}
              className="min-h-[48px] px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-2 border-neutral-300 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <TestTube2 className="w-4 h-4 text-purple-800" />
              <span>Ver datos de prueba</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
