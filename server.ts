/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Servidor Express con Vite y endpoint Gemini API.
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// Esquema estructurado (responseSchema) para recomendación inteligente de compras
export const smartRecommendationSchema = {
  type: Type.OBJECT,
  properties: {
    totalEstimatedWithSavings: {
      type: Type.NUMBER,
      description: 'Total en pesos gastado comprando cada producto en su opción más barata',
    },
    totalWithoutOptimizing: {
      type: Type.NUMBER,
      description: 'Total en pesos si se compraran todos los productos en la tienda más cara',
    },
    estimatedSavingsAmount: {
      type: Type.NUMBER,
      description: 'Monto total en pesos ahorrado respecto a comprar en la opción más cara',
    },
    savingsPercentage: {
      type: Type.NUMBER,
      description: 'Porcentaje de ahorro entero de 0 a 100',
    },
    itemRecommendations: {
      type: Type.ARRAY,
      description: 'Recomendación puntual por cada producto',
      items: {
        type: Type.OBJECT,
        properties: {
          productName: {
            type: Type.STRING,
            description: 'Nombre del producto',
          },
          recommendedStore: {
            type: Type.STRING,
            description: 'Tienda de la cuadra recomendada para comprar este producto',
          },
          bestPrice: {
            type: Type.NUMBER,
            description: 'El mejor precio encontrado',
          },
          alternativePrice: {
            type: Type.NUMBER,
            description: 'El precio más alto registrado en otra tienda para este producto',
          },
          unitSavings: {
            type: Type.NUMBER,
            description: 'Ahorro por unidad en pesos',
          },
          tip: {
            type: Type.STRING,
            description: 'Dato breve y claro (ej: 25% más barato que en Almacén Don Tito)',
          },
        },
        required: [
          'productName',
          'recommendedStore',
          'bestPrice',
          'alternativePrice',
          'unitSavings',
          'tip',
        ],
      },
    },
    storeRoute: {
      type: Type.ARRAY,
      description: 'Paradas de compra agrupadas por tienda para optimizar el recorrido',
      items: {
        type: Type.OBJECT,
        properties: {
          storeName: {
            type: Type.STRING,
            description: 'Nombre de la tienda',
          },
          itemsToBuy: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Productos que conviene comprar exclusivamente en esta tienda',
          },
          subtotal: {
            type: Type.NUMBER,
            description: 'Subtotal en pesos a gastar en esta tienda',
          },
        },
        required: ['storeName', 'itemsToBuy', 'subtotal'],
      },
    },
    summaryInsight: {
      type: Type.STRING,
      description: 'Conclusión concreta de ahorro en 1 sola frase para el comprador',
    },
  },
  required: [
    'totalEstimatedWithSavings',
    'totalWithoutOptimizing',
    'estimatedSavingsAmount',
    'savingsPercentage',
    'itemRecommendations',
    'storeRoute',
    'summaryInsight',
  ],
};

// Ejemplo de prueba fijo para desarrollar y testear sin gastar llamadas de API
export const MOCK_RECOMMENDATION_DATA = {
  totalEstimatedWithSavings: 3650,
  totalWithoutOptimizing: 5100,
  estimatedSavingsAmount: 1450,
  savingsPercentage: 28,
  itemRecommendations: [
    {
      productName: 'Leche entera 1L',
      recommendedStore: 'Supermercado Norte',
      bestPrice: 1100,
      alternativePrice: 1450,
      unitSavings: 350,
      tip: '24% más económica que en Minimarket El Sol',
    },
    {
      productName: 'Pan lactal 500g',
      recommendedStore: 'Almacén Don Tito',
      bestPrice: 1350,
      alternativePrice: 1800,
      unitSavings: 450,
      tip: 'Ahorrás $450 respecto al supermercado',
    },
    {
      productName: 'Aceite girasol 900ml',
      recommendedStore: 'Supermercado Norte',
      bestPrice: 1200,
      alternativePrice: 1850,
      unitSavings: 650,
      tip: '35% más barato que en la tienda de enfrente',
    },
  ],
  storeRoute: [
    {
      storeName: 'Supermercado Norte',
      itemsToBuy: ['Leche entera 1L', 'Aceite girasol 900ml'],
      subtotal: 2300,
    },
    {
      storeName: 'Almacén Don Tito',
      itemsToBuy: ['Pan lactal 500g'],
      subtotal: 1350,
    },
  ],
  summaryInsight:
    'Dividiendo tu compra entre Supermercado Norte y Almacén Don Tito ahorrás $1.450 (un 28% del costo total).',
};

// Endpoint para análisis inteligente de compras con Gemini API
app.post('/api/analyze-savings', async (req: Request, res: Response) => {
  const { prices, useMock } = req.body;

  // Si se solicita modo de prueba, devolvemos el mock inmediatamente
  if (useMock) {
    return res.json({
      success: true,
      data: MOCK_RECOMMENDATION_DATA,
      isMock: true,
    });
  }

  // Validación de entrada
  if (!Array.isArray(prices) || prices.length === 0) {
    return res.status(400).json({
      success: false,
      errorType: 'INVALID_INPUT',
      message: 'No hay precios registrados para analizar.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(500).json({
      success: false,
      errorType: 'MISSING_API_KEY',
      message: 'No se encontró configurada la clave GEMINI_API_KEY en las variables de entorno del servidor.',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Reducimos el payload al mínimo para consumir menos tokens y responder al instante
    const compactPrices = prices.map((p: any) => ({
      item: p.productName,
      tienda: p.storeName,
      precio: p.price,
    }));

    // Prompt simplificado y directo
    const prompt = `Analiza estos precios de barrio: ${JSON.stringify(compactPrices)}.
Determina la tienda más barata para cada producto, el ahorro frente a la opción más cara y los subtotales por tienda. Devuelve estrictamente el JSON según el esquema.`;

    // Timeout ampliado a 30 segundos usando AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Usamos el modelo ultra rápido y ligero gemini-3.1-flash-lite (sucesor de flash 1.5/2.0)
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: smartRecommendationSchema,
        systemInstruction:
          'Experto en ahorro del hogar. Analiza precios de barrio y devuelve el plan más económico en formato JSON estructurado sin rodeos.',
      },
    });

    clearTimeout(timeoutId);

    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error('Respuesta vacía de la API de Gemini');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonText);
    } catch {
      return res.status(502).json({
        success: false,
        errorType: 'JSON_PARSE_ERROR',
        message: 'La IA devolvió una respuesta que no es un JSON válido.',
      });
    }

    // Validación defensiva del esquema mínimo recibido
    if (
      typeof parsedResult.totalEstimatedWithSavings !== 'number' ||
      !Array.isArray(parsedResult.itemRecommendations) ||
      !Array.isArray(parsedResult.storeRoute)
    ) {
      return res.status(502).json({
        success: false,
        errorType: 'SCHEMA_MISMATCH',
        message: 'La respuesta de la IA no cumplió con los campos requeridos del esquema de compra.',
      });
    }

    return res.json({
      success: true,
      data: parsedResult,
      isMock: false,
    });
  } catch (error: unknown) {
    console.error('Error al llamar a Gemini API:', error);

    const isAbort =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('abort'));

    if (isAbort) {
      return res.status(504).json({
        success: false,
        errorType: 'TIMEOUT',
        message: 'La IA tardó más de 30 segundos en responder. Podés reintentar o usar los datos de prueba.',
      });
    }

    const errorDetails = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(502).json({
      success: false,
      errorType: 'GEMINI_CALL_FAILED',
      message: `No se pudo conectar con el servicio de análisis inteligente: ${errorDetails}`,
    });
  }
});

// Inicialización de Vite en desarrollo o estáticos en producción
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CANASTA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
