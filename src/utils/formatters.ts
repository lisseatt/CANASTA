/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Funciones de formateo y normalización para CANASTA.
 */

/**
 * Normaliza un texto para indexación y comparación de productos/tiendas.
 * 
 * ¡PUNTO CRÍTICO DONDE ALGUIEN SUELE EQUIVOCARSE!
 * Si comparamos directamente `p1.name === p2.name`, los usuarios que escriben
 * "Leche 1L", "leche 1l", "Leche 1L " o "Lèche 1L" generarían 4 productos distintos
 * en la base de datos y la comparación de precios fallaría silenciosamente.
 */
export function normalizeKey(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Descompone caracteres con tildes (á -> a, é -> e)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplaza múltiples espacios consecutivos por uno solo
    .replace(/\s+/g, ' ');
}

/**
 * Formatea un número como importe en moneda local.
 * 
 * ¡PUNTO CRÍTICO!
 * En inputs numéricos web, algunos navegadores o teclados móviles envían coma `,` y otros punto `.`.
 * Además, JavaScript puede producir errores de coma flotante (ej: 0.1 + 0.2 = 0.30000000000000004).
 * Esta función asegura presentación limpia con separador de miles.
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0';
  }
  // Redondeo seguro para evitar decimales infinitos
  const rounded = Math.round(amount * 100) / 100;
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/**
 * Formatea fecha ISO para mostrar cuándo se registró el precio.
 */
export function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}
