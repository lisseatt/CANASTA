/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANASTA - Aplicación de Comparación de Precios de Barrio
 * Primera versión funcional con las 3 funciones clave:
 * 1. Registrar precio por producto y tienda
 * 2. Comparar el precio de un producto entre tiendas
 * 3. Armar la lista de compra con el total estimado
 */

import React, { useState, useEffect } from 'react';
import { PriceRecord, ShoppingItem, ActiveTab } from './types';
import { 
  loadPriceRecords, 
  savePriceRecords, 
  loadShoppingList, 
  saveShoppingList,
  resetToDemoData 
} from './utils/storage';
import { RegisterPrice } from './components/RegisterPrice';
import { ComparePrices } from './components/ComparePrices';
import { ShoppingList } from './components/ShoppingList';
import { BottomNav } from './components/BottomNav';
import { ShoppingBag, RotateCcw } from 'lucide-react';

export default function App() {
  // Estado local sincronizado con localStorage
  const [prices, setPrices] = useState<PriceRecord[]>(() => loadPriceRecords());
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => loadShoppingList());
  const [activeTab, setActiveTab] = useState<ActiveTab>('register');
  const [selectedCompareKey, setSelectedCompareKey] = useState<string | null>(null);

  // ¡PUNTO CRÍTICO 1: SINCRONIZACIÓN PERSISTENTE!
  // Guardamos en localStorage cada vez que el estado cambia para que el usuario
  // no pierda sus datos al recargar la página o cerrar el navegador en el móvil.
  useEffect(() => {
    savePriceRecords(prices);
  }, [prices]);

  useEffect(() => {
    saveShoppingList(shoppingItems);
  }, [shoppingItems]);

  // Función 1: Guardar o actualizar un precio registrado
  const handleSavePrice = (newRecord: PriceRecord) => {
    setPrices((prev) => {
      // Verificamos si ya existía el registro por su ID para actualizarlo
      const exists = prev.some((p) => p.id === newRecord.id);
      if (exists) {
        return prev.map((p) => (p.id === newRecord.id ? newRecord : p));
      }
      return [newRecord, ...prev];
    });
  };

  const handleDeletePrice = (id: string) => {
    setPrices((prev) => prev.filter((p) => p.id !== id));
  };

  // Función 2: Comparar y navegar directamente al producto
  const handleGoToCompare = (productKey: string) => {
    setSelectedCompareKey(productKey);
    setActiveTab('compare');
    // Desplazamiento suave al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función 3: Gestión de la lista de compras
  const handleAddShoppingItem = (productKey: string, productName: string, qty: number = 1) => {
    setShoppingItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productKey === productKey);
      if (existingIndex >= 0) {
        // Si ya está en la lista, aumentamos la cantidad
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        return updated;
      }
      // Si es nuevo, lo creamos
      const newItem: ShoppingItem = {
        id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        productKey,
        productName,
        quantity: qty,
        completed: false,
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) return;
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleToggleComplete = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveShoppingItem = (id: string) => {
    setShoppingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCompleted = () => {
    setShoppingItems((prev) => prev.filter((item) => !item.completed));
  };

  const handleResetData = () => {
    if (window.confirm('¿Deseas reiniciar los datos a la demostración inicial de las tiendas de la cuadra?')) {
      const data = resetToDemoData();
      setPrices(data.prices);
      setShoppingItems(data.shopping);
      setSelectedCompareKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Contenedor ergonómico mobile-first (máximo 480px) */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col pb-24 px-4 pt-3">
        {/* Cabecera compacta de la app */}
        <header className="flex items-center justify-between py-3 mb-2 border-b border-neutral-200/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-neutral-900 leading-tight">
                CANASTA
              </h1>
              <p className="text-[11px] text-neutral-500 font-medium">
                Comparador de precios de la cuadra
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            title="Reiniciar datos de prueba"
            className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-200 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-neutral-400" />
            <span>Reiniciar demo</span>
          </button>
        </header>

        {/* Contenido principal según la pestaña activa */}
        <main className="flex-1 mt-1">
          {activeTab === 'register' && (
            <RegisterPrice
              prices={prices}
              onSavePrice={handleSavePrice}
              onDeletePrice={handleDeletePrice}
              onGoToCompare={handleGoToCompare}
            />
          )}

          {activeTab === 'compare' && (
            <ComparePrices
              prices={prices}
              selectedProductKey={selectedCompareKey}
              onSelectProduct={setSelectedCompareKey}
              onAddShoppingItem={(key, name) => handleAddShoppingItem(key, name, 1)}
              onGoToRegisterWithProduct={() => {
                setActiveTab('register');
              }}
            />
          )}

          {activeTab === 'shoppingList' && (
            <ShoppingList
              prices={prices}
              shoppingItems={shoppingItems}
              onUpdateQuantity={handleUpdateQuantity}
              onToggleComplete={handleToggleComplete}
              onRemoveItem={handleRemoveShoppingItem}
              onAddItem={handleAddShoppingItem}
              onClearCompleted={handleClearCompleted}
              onGoToRegister={() => setActiveTab('register')}
            />
          )}
        </main>
      </div>

      {/* Barra de navegación inferior móvil táctil */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        shoppingCount={shoppingItems.length}
      />
    </div>
  );
}
