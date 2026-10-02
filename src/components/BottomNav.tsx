/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Barra de navegación inferior móvil táctil.
 * Optimizado para navegación con una sola mano (zona ergonómica del pulgar).
 */

import React from 'react';
import { ActiveTab } from '../types';
import { PlusCircle, ArrowLeftRight, ShoppingBag } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  shoppingCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  shoppingCount,
}) => {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center px-2">
        {/* Tab 1: Registrar */}
        <button
          type="button"
          onClick={() => onChangeTab('register')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors rounded-xl relative ${
            activeTab === 'register'
              ? 'text-emerald-700 font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <PlusCircle className={`w-5 h-5 ${activeTab === 'register' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] tracking-tight mt-1 whitespace-nowrap">
            1. Registrar
          </span>
          {activeTab === 'register' && (
            <span className="absolute bottom-1 w-1 h-1 bg-emerald-700 rounded-full" />
          )}
        </button>

        {/* Tab 2: Comparar */}
        <button
          type="button"
          onClick={() => onChangeTab('compare')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors rounded-xl relative ${
            activeTab === 'compare'
              ? 'text-emerald-700 font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <ArrowLeftRight className={`w-5 h-5 ${activeTab === 'compare' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] tracking-tight mt-1 whitespace-nowrap">
            2. Comparar
          </span>
          {activeTab === 'compare' && (
            <span className="absolute bottom-1 w-1 h-1 bg-emerald-700 rounded-full" />
          )}
        </button>

        {/* Tab 3: Lista de compra */}
        <button
          type="button"
          onClick={() => onChangeTab('shoppingList')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition-colors rounded-xl relative ${
            activeTab === 'shoppingList'
              ? 'text-emerald-700 font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${activeTab === 'shoppingList' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {shoppingCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                {shoppingCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-1 whitespace-nowrap">
            3. Lista Compra
          </span>
          {activeTab === 'shoppingList' && (
            <span className="absolute bottom-1 w-1 h-1 bg-emerald-700 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
