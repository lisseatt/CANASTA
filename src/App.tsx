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
  resetToDemoData,
  exportBackupFile,
  importBackupFromJSON,
  clearAllStorageData 
} from './utils/storage';
import { RegisterPrice } from './components/RegisterPrice';
import { ComparePrices } from './components/ComparePrices';
import { ShoppingList } from './components/ShoppingList';
import { BottomNav } from './components/BottomNav';
import { ShoppingBag, RotateCcw, Download, Upload, Database, X, Trash2 } from 'lucide-react';

export default function App() {
  // Estado local sincronizado con localStorage
  const [prices, setPrices] = useState<PriceRecord[]>(() => loadPriceRecords());
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => loadShoppingList());
  const [activeTab, setActiveTab] = useState<ActiveTab>('register');
  const [selectedCompareKey, setSelectedCompareKey] = useState<string | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ¡PUNTO CRÍTICO 1: SINCRONIZACIÓN PERSISTENTE!
  // Guardamos en localStorage cada vez que el estado cambia para que el usuario
  // no pierda sus datos al recargar la página o cerrar el navegador en el móvil.
  useEffect(() => {
    savePriceRecords(prices);
  }, [prices]);

  useEffect(() => {
    saveShoppingList(shoppingItems);
  }, [shoppingItems]);

  // Funciones de Respaldo (Exportar / Importar / Limpiar)
  const handleExportBackup = () => {
    try {
      exportBackupFile();
      setBackupNotice('¡Respaldo JSON descargado con éxito!');
      setTimeout(() => setBackupNotice(null), 4000);
    } catch {
      alert('No se pudo generar el archivo de respaldo.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const restored = importBackupFromJSON(text);
        setPrices(restored.prices);
        setShoppingItems(restored.shopping);
        setSelectedCompareKey(null);
        setBackupNotice('¡Datos restaurados con éxito desde el archivo JSON!');
        setTimeout(() => setBackupNotice(null), 4000);
        setShowBackupModal(false);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Formato no compatible';
        alert('Error al leer el archivo JSON: ' + errorMsg);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que querés borrar TODOS los precios y la lista de compras? Esta acción es irreversible si no tenés un respaldo JSON.')) {
      clearAllStorageData();
      setPrices([]);
      setShoppingItems([]);
      setSelectedCompareKey(null);
      setShowBackupModal(false);
      setBackupNotice('Datos borrados de localStorage.');
      setTimeout(() => setBackupNotice(null), 4000);
    }
  };

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
      setBackupNotice('Datos restablecidos a la demo.');
      setTimeout(() => setBackupNotice(null), 4000);
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

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowBackupModal(true)}
              title="Respaldo y Opciones de Datos"
              className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 px-2.5 py-1.5 rounded-lg transition-colors shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-emerald-700" />
              <span>Respaldo</span>
            </button>

            <button
              type="button"
              onClick={handleResetData}
              title="Reiniciar datos de prueba"
              className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-200 p-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
        </header>

        {/* Notificación flotante de respaldo */}
        {backupNotice && (
          <div className="mb-3 p-2.5 bg-neutral-900 text-white text-xs rounded-xl flex items-center justify-between animate-fade-in">
            <span>{backupNotice}</span>
            <button
              type="button"
              onClick={() => setBackupNotice(null)}
              className="text-neutral-400 hover:text-white ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

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

      {/* Modal de Gestión de Respaldo */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Respaldo de Datos (JSON)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Tus precios y lista están guardados en el navegador (<strong className="font-semibold text-neutral-800">localStorage</strong>). Si cambiás de celular o limpiás el navegador, podés descargar un archivo de copia y restaurarlo cuando quieras.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full min-h-[44px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Exportar y Descargar JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[44px] px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-neutral-200"
              >
                <Upload className="w-4 h-4 text-neutral-600" />
                <span>Importar / Restaurar JSON</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar todo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de navegación inferior móvil táctil */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        shoppingCount={shoppingItems.length}
      />
    </div>
  );
}
