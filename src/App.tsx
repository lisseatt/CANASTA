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
      {/* Contenedor adaptado desde 320px de ancho */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col pb-24 px-2.5 sm:px-4 pt-3">
        {/* Cabecera con alto contraste y texto >= 16px */}
        <header className="flex items-center justify-between py-3 mb-2 border-b-2 border-neutral-300">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-neutral-950 leading-tight">
                CANASTA
              </h1>
              <p className="text-base text-neutral-700 font-bold">
                Comparador de la cuadra
              </p>
            </div>
          </div>

          {/* Botones secundarios de cabecera */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowBackupModal(true)}
              title="Copia de seguridad"
              className="min-h-[44px] flex items-center gap-1.5 text-base font-bold text-neutral-950 bg-white hover:bg-neutral-100 border-2 border-neutral-300 px-3 py-2 rounded-xl transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-800" />
              <span>Copia</span>
            </button>

            <button
              type="button"
              onClick={handleResetData}
              title="Reiniciar a datos de prueba"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-700 hover:text-neutral-950 bg-white hover:bg-neutral-100 border-2 border-neutral-300 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Notificación visible sin tecnicismos */}
        {backupNotice && (
          <div className="mb-3 p-3 bg-neutral-950 text-white text-base font-bold rounded-xl flex items-center justify-between shadow-md">
            <span>{backupNotice}</span>
            <button
              type="button"
              onClick={() => setBackupNotice(null)}
              className="text-neutral-300 hover:text-white ml-2 text-lg font-bold min-h-[44px] min-w-[36px] flex items-center justify-center"
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

      {/* Modal de Copia de Seguridad sin tecnicismos */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-[310px] sm:max-w-sm p-4 sm:p-5 shadow-2xl border-2 border-neutral-300 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-neutral-200">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-800" />
                <h3 className="text-lg font-extrabold text-neutral-950">
                  Copia de tus datos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="text-neutral-700 hover:text-neutral-950 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-base text-neutral-800 font-medium leading-relaxed">
              Tus precios y tu lista están guardados en este teléfono. Si cambiás de celular o querés una copia de seguridad, podés descargar un archivo y volver a abrirlo cuando quieras.
            </p>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full min-h-[48px] px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-base font-extrabold flex items-center justify-center gap-2 transition-colors border-2 border-emerald-950 shadow-sm"
              >
                <Download className="w-5 h-5" />
                <span>Guardar archivo de copia</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[48px] px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 rounded-xl text-base font-extrabold flex items-center justify-center gap-2 transition-colors border-2 border-neutral-300"
              >
                <Upload className="w-5 h-5 text-neutral-700" />
                <span>Abrir archivo de copia</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            <div className="pt-3 border-t-2 border-neutral-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearAll}
                className="min-h-[44px] text-base text-red-800 hover:text-red-950 font-extrabold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar todo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="min-h-[44px] px-3 text-base text-neutral-700 hover:text-neutral-950 font-bold"
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
