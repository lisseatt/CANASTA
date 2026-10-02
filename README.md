# CANASTA - Comparador de Precios de Barrio y Ahorro Inteligente

> Aplicación web progresiva diseñada para comparar precios entre comercios de cercanía en una misma cuadra, calcular el costo total del changuito y optimizar la ruta de compra para maximizar el ahorro en la economía familiar.

---

## 1. Datos Académicos y Autoría

* **Estudiante:** Tatiana Lissett Menendez Mercado  
* **Nivel / Grado:** Tercer Año de Desarrollo de Software  
* **Sección:** "A"  
* **Proyecto:** CANASTA (Gestión y Comparación Inteligente de Precios de Barrio)  
* **Año Académico:** 2026  

---

## 2. Descripción General del Proyecto

### 2.1. Problema que Resuelve
En épocas de alta inflación y dispersión de precios, las diferencias monetarias entre dos comercios ubicados en la misma cuadra (un supermercado, un minimercado, una verdulería o el almacén de la esquina) pueden superar el 30% en un mismo artículo. Sin embargo, las familias no disponen de una herramienta ágil y sin fricciones que les permita registrar lo que vieron en cada góndola, contrastar precios sin conexión a internet y saber con exactitud cuánto dinero se ahorran al dividir la compra entre locales cercanos.

### 2.2. Propósito y Filosofía de Diseño
**CANASTA** nace bajo el principio de utilidad inmediata:
* **Sin registros forzosos ni contraseñas:** El usuario ingresa y anota en el acto.
* **Resiliente y offline-first:** Funciona al 100% en el pasillo del comercio aunque no haya señal de datos móviles.
* **Ergonomía de una mano (Mobile-First):** Diseñada para usarse con una sola mano desde pantallas compactas de 320 px de ancho, con texto de alto contraste legible bajo luz solar directa.
* **Ahorro como dato medible:** No proporciona consejos abstractos; calcula montos en pesos, porcentajes y listas de compras concretas.

---

## 3. Manual de Usuario (Paso a Paso)

### 3.1. Registrar un producto con su precio y tienda
1. En la barra de navegación inferior, ingresá en la pestaña **"Registrar"**.
2. Completá los campos obligatorios:
   * **Producto o artículo:** Escribí el nombre (ej. *Leche entera 1L*). Si ya lo habías anotado antes, podés seleccionarlo de los atajos sugeridos.
   * **Tienda o almacén:** Indicá el comercio donde lo viste (ej. *Supermercado Norte*, *Almacén Don Tito*).
   * **Precio actual:** Ingresá el importe en pesos (ej. *1250*).
   * *(Opcional)* **Presentación o tamaño:** Podés aclarar la unidad (ej. *Botella 1L*, *Paquete 500g*).
3. Presioná el botón principal verde **"Guardar Precio"**.
4. La app te mostrará un mensaje de confirmación visible en pantalla con el precio registrado.

### 3.2. Modificar o editar precios guardados
1. En la misma pantalla **"Registrar"**, bajá hasta la sección **"Últimos Precios Guardados"**.
2. Buscá el registro que deseás cambiar y tocá el botón **"Editar"** (icono de lápiz).
3. El formulario superior se precargará con los datos del producto y cambiará su título a *"Modificar Precio"*.
4. Modificá el precio o la tienda asignada y tocá **"Actualizar Precio"**. (Si querés descartar los cambios, podés tocar el botón *"Cancelar"*).

### 3.3. Comparar precios entre tiendas de la cuadra
1. Tocá la pestaña inferior **"Comparar"**.
2. Encontrarás la comparativa automática de los productos cargados.
3. Podés utilizar el buscador con etiqueta visible o los botones de selección rápida para elegir qué artículo analizar.
4. La tarjeta del producto te mostrará:
   * **Banner de ahorro:** Cuánto dinero te ahorrás por unidad y qué porcentaje representa comprando en el comercio más conveniente.
   * **Ranking de precios:** Lista ordenada de menor a mayor precio. El local más económico cuenta con la distinción destacada *"Más barato"*, y los demás indican con claridad cuánto más caros son respecto al líder.

### 3.4. Armar la lista de compras con el total estimado
1. Desde la pantalla de comparativa, presioná el botón principal **"Sumar este producto a mi lista"**, o bien andá directamente a la pestaña **"Lista"**.
2. En la pestaña **"Lista"**, ingresá el producto y la cantidad deseada (por defecto 1 unidad) y tocá **"Agregar a la lista"**.
3. En la cabecera verás la tarjeta de **Total Estimado**:
   * Te muestra la suma total si comprás cada cosa en su tienda más barata.
   * Si deseás evitar paradas adicionales, activá la opción **"Ver total en cada tienda"** para comparar cuánto te costaría pagar todo en un único comercio.
4. Conforme realizás la compra en la calle, podés tildar los productos completados tocando el casillero correspondiente.

### 3.5. Exportar, importar o respaldar datos en JSON
1. En el encabezado superior de la app, tocá el botón con icono de base de datos **"Copia"**.
2. **Descargar copia:** Presioná *"Descargar archivo JSON"* para generar un archivo `respaldo_canasta_precios.json` en tu dispositivo con todos tus productos, precios y listas.
3. **Restaurar copia:** Tocá *"Abrir archivo de copia"*, seleccioná tu archivo `.json` previo y tus precios se cargarán de forma inmediata.

### 3.6. Recomendación Inteligente con Inteligencia Artificial (Gemini)
1. En la pestaña **"Comparar"**, desplazate hasta la sección **"Recomendación con IA"**.
2. Tocá el botón **"Generar Plan de Ahorro Inteligente"**.
3. La aplicación se comunicará con la API de Gemini mediante un endpoint seguro de backend, evaluando todas las tiendas registradas.
4. La respuesta se mostrará estructurada en tres bloques de datos:
   * **Tarjeta de Impacto:** Ahorro total máximo en pesos, porcentaje global de rebaja y comparación de totales (óptimo vs. tienda más cara).
   * **Ruta por Tienda:** Qué productos específicos comprar en cada local y qué subtotal pagar en cada parada.
   * **Detalle Producto por Producto:** Tabla con precios óptimos, ahorros unitarios y consejos de compra.
5. *(Modo de desarrollo)* Si querés probar la visualización sin consumir llamadas ni requerir conexión externa, tocá el botón **"Probar con datos de prueba"**.

---

## 4. Bitácora de Prompts y Evolución del Desarrollo

El desarrollo de CANASTA siguió una progresión modular en seis etapas claramente definidas:

### 1. Prompt 0 (P0) — Versión Funcional Base (MVP)
* **Objetivo:** Construir la primera versión de la aplicación para resolver el problema esencial de carga y comparación sin fricción inicial.
* **Alcance:** Sin requerimiento de backend complejo, sin pantalla de registro de usuarios ni login (para garantizar acceso inmediato). Interfaz estructurada en tres pestañas: Registro de precios, Comparación entre tiendas y Lista de compra con cálculo de total estimado óptimo.

### 2. Prompt 1 (P1) — Edición y Mantenimiento de Precios
* **Objetivo:** Permitir que los precios no sean estáticos, reflejando las variaciones cotidianas de góndola.
* **Alcance:** Implementación de la función de modificación de precios sobre el mismo formulario, carga automática de datos en memoria, re-cálculo instantáneo de la comparativa y posibilidad de eliminar registros desactualizados.

### 3. Mejora 2 (M2) — Persistencia de Datos y Respaldo JSON ("Que recuerde")
* **Objetivo:** Evitar la pérdida de información ante cierres del navegador o reinicios del teléfono.
* **Alcance:** Almacenamiento en `localStorage` del navegador bajo claves desacopladas (`canasta_precios_v1`, `canasta_compras_v1`). Incorporación del sistema de respaldo manual (exportación a archivo `.json` descargable y recuperación mediante subida de archivo con validación de estructura).

### 4. Mejora 3 (M3) — Adaptabilidad, Accesibilidad y Usabilidad ("Ajuste de UI")
* **Objetivo:** Adecuar la interfaz a los escenarios reales de uso (caminar por la calle con el teléfono bajo el sol).
* **Alcance:** 
  * Compatibilidad estricta desde 320 px de ancho sin desbordes horizontales ni zooms indeseados (`font-size >= 16px`).
  * Alto contraste visual (textos `#0a0a0a` y bordes de 2 px).
  * Inclusión obligatoria de etiquetas `<label>` visibles en todos los campos de formulario.
  * Jerarquía visual con un único botón principal destacado por vista.
  * Estados vacíos con mensajes de bienvenida y llamadas a la acción en español sin términos técnicos.

### 5. Mejora 4 (M4) — Robustez y Validación Defensiva ("Que no se rompa")
* **Objetivo:** Blindar la aplicación ante entradas inválidas, ataques de prueba destructiva y manipulaciones de datos.
* **Alcance:** Normalización de cadenas, limpieza de signos de moneda y espacios accidentales, control de desbordes en números astronómicos, límites de caracteres (`maxLength`), control de enteros positivos en cantidades y bloqueo de clics simultáneos.

### 6. Mejora 5 (M5) — Recomendador Inteligente con IA ("Que piense")
* **Objetivo:** Incorporar inteligencia artificial para deducir de forma autónoma el mejor plan de ahorro del changuito.
* **Alcance:** Creación del servidor Express (`server.ts`) y conexión con `@google/genai` utilizando el modelo ligero y de baja latencia `gemini-3.1-flash-lite` (sucesor moderno de la serie Flash). Configuración de salida estrictamente estructurada (`responseSchema`), lectura de `GEMINI_API_KEY` por variables de entorno, timeout preventivo de 30 segundos y visualización de datos en formato numérico y tabular (sin párrafos de chatbot).

---

## 5. Tabla de Pruebas de Robustez (M4)

En la fase M4 se aplicaron técnicas de pruebas de caja negra y edge-case testing para identificar vulnerabilidades en la interfaz y garantizar su estabilidad:

| N° | Intento de Rotura / Prueba | Comportamiento Inicial (Antes de validar) | Comportamiento Corregido (Después de validar) | Resultado / Estado |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Texto de 500 caracteres continuos en el nombre** (`"A".repeat(500)`) | Aceptaba el texto. Rompía el contenedor de 320 px forzando un scroll horizontal defectuoso. | Se fijó `maxLength={60}` en los campos y se truncan visualmente los textos desbordados. | **Superado (Blindado)** |
| **2** | **Número astronómico o notación científica** (`$ 999999999999999`) | Pasa la validación de mayor a cero, arruinando los cálculos del total estimado con cifras ilegibles. | Se valida que el precio sea estrictamente menor a `$100.000.000` con mensaje de error claro en español. | **Superado (Blindado)** |
| **3** | **Pegar precio con signo de pesos o espacios** (`$ 1.500,00`) | `parseFloat` devolvía `NaN`, arrojando un error confuso al usuario pese a ser un número real. | Sanitización automática con expresión regular `replace(/[\$\s]/g, '')` antes de convertir. | **Superado (Blindado)** |
| **4** | **Cantidad negativa o decimal manual en la lista** (`-5` o `0`) | `parseInt("-5")` dejaba un saldo negativo que restaba dinero del total estimado de compra. | Aplicación de `Math.max(1, Math.floor(newQuantity) || 1)` asegurando siempre un entero positivo mínimo. | **Superado (Blindado)** |
| **5** | **Doble clic o toques rápidos repetidos en "Guardar"** | Se ejecutaban envíos concurrentes con riesgo de duplicar identificadores en el mismo milisegundo. | Bloqueo temporal del botón y bandera de estado (`isSubmitting`) durante el ciclo de procesamiento. | **Superado (Blindado)** |

---

## 6. Limitaciones Técnicas y Alcance

Para mantener la aplicación ágil, privada y confiable en su contexto de uso, se adoptaron deliberadamente las siguientes decisiones de arquitectura:

1. **Sin base de datos remota en la nube para los precios del usuario:**
   * *Motivo:* Permite que la aplicación funcione en modo 100% offline dentro de las tiendas o supermercados (zonas donde habitualmente no hay señal de datos ni Wi-Fi).
   * *Solución implementada:* Persistencia local mediante `localStorage` combinada con importación/exportación manual en archivos `.json` portables.

2. **Sin sistema de autenticación (Login/Contraseñas):**
   * *Motivo:* Elimina cualquier barrera de fricción. Una persona que está frente a una góndola necesita anotar un precio en tres segundos, sin tener que recordar contraseñas ni verificar correos electrónicos.

3. **Sin geolocalización satelital (GPS):**
   * *Motivo:* El objetivo del proyecto se circunscribe a la **escala de barrio/cuadra** (locales vecinos a distancia caminable). Solicitar permisos de GPS consumiría batería excesiva, aumentaría el tiempo de carga y generaría desconfianza de privacidad en el usuario. La agrupación por nombre de tienda resultó suficiente y precisa.

4. **Procesamiento de IA en Servidor Privado (Proxy Route):**
   * *Motivo:* La API de Gemini no se ejecuta en el navegador del cliente para resguardar la clave de API (`GEMINI_API_KEY`) y evitar bloqueos por políticas CORS, devolviendo al usuario una estructura JSON validada y sanitizada.

---

## 7. Requisitos de Instalación y Ejecución Local

### Prerrequisitos
* Node.js v18 o superior.
* npm o yarn.

### Pasos para iniciar el proyecto
1. Clonar el repositorio o descargar el código fuente.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar la clave de Gemini en el archivo `.env` (opcional si se utiliza el modo de prueba integrado):
   ```bash
   GEMINI_API_KEY="tu_clave_de_google_ai_studio"
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir el navegador en `http://localhost:3000`.

---
*Proyecto desarrollado con fines académicos y de impacto social para la optimización del gasto cotidiano.*
