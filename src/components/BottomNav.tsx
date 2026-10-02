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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-neutral-300 pb-[env(safe-area-inset-bottom)] shadow-lg"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 h-18 items-center px-1">
        {/* Tab 1: Registrar */}
        <button
          type="button"
          onClick={() => onChangeTab('register')}
          className={`min-h-[52px] flex flex-col items-center justify-center transition-colors rounded-xl mx-0.5 ${
            activeTab === 'register'
              ? 'text-neutral-950 font-extrabold bg-emerald-50 border-b-4 border-emerald-800'
              : 'text-neutral-700 font-bold hover:text-neutral-950'
          }`}
        >
          <PlusCircle className={`w-5 h-5 ${activeTab === 'register' ? 'stroke-[2.5] text-emerald-800' : 'stroke-2 text-neutral-600'}`} />
          <span className="text-base tracking-tight leading-tight mt-0.5 whitespace-nowrap">
            Registrar
          </span>
        </button>

        {/* Tab 2: Comparar */}
        <button
          type="button"
          onClick={() => onChangeTab('compare')}
          className={`min-h-[52px] flex flex-col items-center justify-center transition-colors rounded-xl mx-0.5 ${
            activeTab === 'compare'
              ? 'text-neutral-950 font-extrabold bg-emerald-50 border-b-4 border-emerald-800'
              : 'text-neutral-700 font-bold hover:text-neutral-950'
          }`}
        >
          <ArrowLeftRight className={`w-5 h-5 ${activeTab === 'compare' ? 'stroke-[2.5] text-emerald-800' : 'stroke-2 text-neutral-600'}`} />
          <span className="text-base tracking-tight leading-tight mt-0.5 whitespace-nowrap">
            Comparar
          </span>
        </button>

        {/* Tab 3: Lista de compra */}
        <button
          type="button"
          onClick={() => onChangeTab('shoppingList')}
          className={`min-h-[52px] flex flex-col items-center justify-center transition-colors rounded-xl mx-0.5 relative ${
            activeTab === 'shoppingList'
              ? 'text-neutral-950 font-extrabold bg-emerald-50 border-b-4 border-emerald-800'
              : 'text-neutral-700 font-bold hover:text-neutral-950'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag className={`w-5 h-5 ${activeTab === 'shoppingList' ? 'stroke-[2.5] text-emerald-800' : 'stroke-2 text-neutral-600'}`} />
            {shoppingCount > 0 && (
              <span className="absolute -top-2 -right-3.5 bg-emerald-800 text-white text-base font-extrabold px-1.5 py-0.2 rounded-full tabular-nums border border-white">
                {shoppingCount}
              </span>
            )}
          </div>
          <span className="text-base tracking-tight leading-tight mt-0.5 whitespace-nowrap">
            Lista
          </span>
        </button>
      </div>
    </nav>
  );
};

