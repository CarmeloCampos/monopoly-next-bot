# MonopolyFunBot - Documento del Proyecto

**Fecha:** 9 de enero de 2026  
**Participantes:** Carmelo Campos, Oscar  
**Proyecto:** Bot de juego de Telegram inspirado en Monopoly

---

## 📋 Resumen Ejecutivo

MonopolyFunBot es un proyecto para crear un bot de juego de Telegram inspirado en Monopoly que combina elementos de inversión, juegos de azar y sistema de referidos. El proyecto incluye una estrategia de marketing agresiva basada en Telegram Ads y un User Bot con IA, con un presupuesto mensual de $100 USD para publicidad.

**Objetivo:** Generar ingresos a través de un modelo de inversión de usuarios, aprovechando el bajo costo actual de publicidad en Telegram Ads en español.

---

## 1. Concepto General

El proyecto consiste en un juego estilo "Monopoly" integrado en un bot de Telegram que combina mecánicas de **estrategia e inversión**.

El objetivo es crear una experiencia progresiva donde el usuario construye un imperio inmobiliario, con propiedades inspiradas en lugares famosos del mundo.

### Características Clave (USP)

- **Lugares Famosos:** Cada propiedad está inspirada en lugares reales y famosos del mundo.
- **Economía Real:** Escala directa entre dinero del juego y moneda fiat (1 USD Real = 1,000 MonopolyCoins).
- **Mecánicas de Casino:** Integración nativa con los juegos de azar de Telegram (dados, dardos, etc.) para la progresión.

---

## 2. Estrategia de Marketing

### 2.1 Publicidad en Telegram Ads

- **Presupuesto:** $100 USD/mes ($50 Carmelo + $50 Oscar)
- **Modalidades:** 3 tipos de anuncios (en línea, patrocinados, formato especial)
- **Canales objetivo:** Canales de Telegram en español con alta audiencia
  - Ejemplos: Shataka (51k suscriptores), Alerta24 (225k), Patria, canales de cripto
- **Objetivo:** 10 millones de impresiones mensuales
- **Ventaja:** Poca competencia en español = costo muy bajo

### 2.2 Telegram User Bot con IA

- **Función:** User Bot (no BotFather) que interactúa como usuario regular
- **Base de datos:** 16 millones de colombianos con números telefónicos
- **Objetivo:**
  - 1% activo en Telegram = ~160k usuarios
  - Agregar a canales y grupos
  - Mensajería personalizada con IA persuasiva
  - Interactuar en grupos relevantes (Cripto, Cine para GPT Touring/Torrent)
- **Integración:** Reutilizar infraestructura para promocionar GPT Touring y GPT Torrent
- **Costo IA:** Modelo económico (DeepSeek non-reasoning, Ollama local) = muy bajo

### 2.3 Email Marketing (Opcional)

- **Plataforma:** AWS SES
- **Costo:** $0.01 USD por 1,000 correos
- **Presupuesto:** $30 USD/mes = 300,000 correos/mes
- **Objetivo:** Completar envío a 16M correos en ~53 meses
- **Estado:** Opcional, baja prioridad

---

## 3. Economía y Moneda

### Escala de Cambio

- **Tasa:** 1 USD = 1,000 MC (MonopolyCoins)
- **Moneda:** Monopoly Coins

### Ingreso Pasivo Inicial (Onboarding)

Para incentivar la entrada, el usuario recibe una propiedad exclusiva al iniciar su primera sesión:

- **Propiedad Exclusiva:** "Apartamento Emprender"
- **Rentabilidad:** Genera **1,000 MC al mes** (equivalente a $1.00 USD)
  - Desglose por hora: ~33.3 MC/h
  - Sin upgrades ni boosts

### Retiros y Pagos

- **Mínimo de retiro:** 10,000 MC (equivalente a $10 USD)
- **Mínimo de inversión:** $10 USD
- **Infraestructura:** Se sugiere apalancar la tecnología de "Payout Points" para gestionar los retiros
- **Control selectivo de pagos:** Decidir a quién pagar y a quién no
- **Estrategia final:** "Desaparecer" después de acumular capital suficiente

---

## 4. Mecánicas de Progresión

### Desbloqueo de Contenido

El usuario no puede comprar propiedades libremente; debe "descubrirlas" jugando dentro de Telegram.

- **Acción:** Lanzar el dado (🎲) vía Telegram
- **Probabilidades:**
  - **1 al 4:** Desbloquea un **Nuevo Servicio**
  - **5 al 6:** Desbloquea una **Nueva Propiedad**

### Requisitos

- El usuario debe **comprar** la propiedad o servicio que le salió para poder seguir lanzando el dado. Esto asegura la inversión progresiva.

---

## 5. Sistema de Propiedades

Las propiedades se organizan por colores, cada uno con diferentes niveles de exclusividad y rentabilidad.

### Colores y Número de Propiedades

| Color      | Propiedades | Nivel          |
| ---------- | ----------- | -------------- |
| 🟦 Azul    | 2           | Más exclusivas |
| 🔴 Roja    | 3           | Alto           |
| 🟧 Naranja | 3           | Medio          |
| 🟤 Marrón  | 4           | Básico         |

### Nombres de Propiedades

#### 🟦 AZUL (Nivel más exclusivo)

1. **One World Trade Center** (Nueva York, EE.UU.)
   - Nivel 2: One World Trade Center - Suites de Lujo
   - Nivel 3: One World Trade Center - Sky Lounge y Observatorio
   - Nivel 4: One World Trade Center - Completo con Helipuerto

2. **The Shard** (Londres, Reino Unido)
   - Nivel 2: The Shard - Oficinas Premium
   - Nivel 3: The Shard - Sky Garden
   - Nivel 4: The Shard - Complejo de Alta Gama Completo

#### 🔴 ROJA (Nivel alto)

1. **Burj Khalifa** (Dubái, EAU)
   - Nivel 2: Burj Khalifa - Pisos de Lujo
   - Nivel 3: Burj Khalifa - At The Top Sky Lounge
   - Nivel 4: Burj Khalifa - Completo con Armani Hotel

2. **Taipei 101** (Taiwán)
   - Nivel 2: Taipei 101 - Oficinas Corporativas
   - Nivel 3: Taipei 101 - Torre Completa
   - Nivel 4: Taipei 101 - Complejo Comercial Integrado

3. **Hacienda Santa Rosa** (Guanacaste, Costa Rica)
   - Nivel 2: Hacienda Santa Rosa - Casas Guest
   - Nivel 3: Hacienda Santa Rosa - Hotel Boutique
   - Nivel 4: Hacienda Santa Rosa - Resort con Spa y Canchas

#### 🟧 NARANJA (Nivel medio)

1. **Marina Bay Sands** (Singapur)
   - Nivel 2: Marina Bay Sands - Suites de Lujo
   - Nivel 3: Marina Bay Sands - Infinity Pool y Casino
   - Nivel 4: Marina Bay Sands - Completo con Sky Park

2. **Sydney Opera House** (Sídney, Australia)
   - Nivel 2: Sydney Opera House - Oficinas de Arte
   - Nivel 3: Sydney Opera House - Complejo Cultural
   - Nivel 4: Sydney Opera House - Completo con Restaurantes y Bares

3. **Residencial Rohrmoser** (San José, Costa Rica)
   - Nivel 2: Residencial Rohrmoser - Apartamentos Modernos
   - Nivel 3: Residencial Rohrmoser - Complejo con Piscina
   - Nivel 4: Residencial Rohrmoser - Completo con BBQ y Áreas Sociales

#### 🟤 MARRÓN (Nivel básico)

1. **Casa Blanca** (Washington D.C., EE.UU.)
   - Nivel 2: Casa Blanca - Ala Oeste
   - Nivel 3: Casa Blanca - Residencia Ampliada
   - Nivel 4: Casa Blanca - Completo con Rose Garden

2. **Casa de Anne Frank** (Ámsterdam, Países Bajos)
   - Nivel 2: Casa de Anne Frank - Ampliación
   - Nivel 3: Casa de Anne Frank - Complejo Residencial
   - Nivel 4: Casa de Anne Frank - Completo con Museo

3. **Fallingwater House** (Pennsylvania, EE.UU.)
   - Nivel 2: Fallingwater House - Área Extra
   - Nivel 3: Fallingwater House - Complejo Completo
   - Nivel 4: Fallingwater House - Completo con Senderos

4. **Winchester Mystery House** (California, EE.UU.)
   - Nivel 2: Winchester Mystery House - Habitaciones Extra
   - Nivel 3: Winchester Mystery House - Pasillos Secretos
   - Nivel 4: Winchester Mystery House - Completo con Torre

### Imágenes 3D

- **Generación:** Imágenes 3D generadas con IA para cada propiedad
- **Personalización:** Niveles visuales diferentes según el nivel de construcción

---

## 6. Sistema de Upgrades

### Tabla de Costos por Nivel

| Color      | Nivel 1   | Nivel 2 | Nivel 3 | Nivel 4 |
| ---------- | --------- | ------- | ------- | ------- |
| 🟤 Marrón  | 3,000 MC  | +4,000  | +8,000  | +12,000 |
| 🟧 Naranja | 5,000 MC  | +6,000  | +10,000 | +15,000 |
| 🔴 Roja    | 7,500 MC  | +8,000  | +12,000 | +20,000 |
| 🟦 Azul    | 10,000 MC | +10,000 | +15,000 | +25,000 |

### Tabla de Ingresos por Nivel (MC/hora)

| Color      | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
| ---------- | ------- | ------- | ------- | ------- |
| 🟤 Marrón  | 1.86    | 5.25    | 14.58   | 28.67   |
| 🟧 Naranja | 3.10    | 7.88    | 18.23   | 35.83   |
| 🔴 Roja    | 4.65    | 10.50   | 21.88   | 47.78   |
| 🟦 Azul    | 6.19    | 13.13   | 27.30   | 59.72   |

### Reglas de Construcción

1. **Niveles 1-3:** Puedes construir hasta el nivel 3 en cualquier propiedad independientemente.
2. **Nivel 4:** Para alcanzar el nivel 4 en una propiedad, **TODAS** las propiedades del mismo color deben estar al nivel 3.
3. **ROI Base:** La inversión básica tiene un retorno de 62 días, que se acorta con más inversión y boosts.

---

## 7. Sistema de Servicios

### Tipos de Servicios y Costos

| Tipo          | Nombre                             | Costo    | Boost          |
| ------------- | ---------------------------------- | -------- | -------------- |
| 🚂 Tren       | Orient Express                     | 3,000 MC | 2 trenes: +10% |
| 🚂 Tren       | Transiberiano                      | 3,000 MC | 3 trenes: +20% |
| 🚂 Tren       | Bullet Train                       | 3,000 MC | 4 trenes: +35% |
| 🚂 Tren       | Expreso Polar                      | 3,000 MC | -              |
| 💡 Luz        | Central de Itaipú                  | 3,000 MC | +5%            |
| 💡 Luz        | Central de Chernobyl               | 3,000 MC | +5%            |
| 💧 Agua       | Acueducto de Segovia               | 3,000 MC | +5%            |
| 💧 Agua       | Acueducto de los Arcos             | 3,000 MC | +5%            |
| 🎬 Cine       | Grauman's Chinese Theatre          | 5,000 MC | +7%            |
| 🏛️ Museo      | American Museum of Natural History | 5,000 MC | +7%            |
| ⛽ Gasolinera | Shell Station                      | 4,000 MC | +6%            |
| 💊 Farmacia   | CVS Pharmacy                       | 4,000 MC | +6%            |

### Resumen de Boosts por Tipo

- **Trenes (4):** 2 trenes = +10%, 3 trenes = +20%, 4 trenes = +35%
- **Luz (2):** Cada una = +5%
- **Agua (2):** Cada una = +5%
- **Cine:** +7%
- **Museo:** +7%
- **Gasolinera:** +6%
- **Farmacia:** +6%

---

## 8. Sistema de Boosts por Color Completado

### Boosts por Completación de Colores

| Color      | Número | Nivel 3 Completo | Nivel 4 Completo |
| ---------- | ------ | ---------------- | ---------------- |
| 🟤 Marrón  | 4      | +15%             | +25%             |
| 🟧 Naranja | 3      | +20%             | +30%             |
| 🔴 Roja    | 3      | +20%             | +30%             |
| 🟦 Azul    | 2      | +25%             | +40%             |

### Ejemplo de Cálculo de Ingresos

**Escenario:** Usuario con 1 propiedad Roja al Nivel 3 + 2 servicios

- Ingreso base propiedad N3: 21.88 MC/h
- Boost servicios (2 × 5%): 24.27 MC/h
- Boost color completo (roja al nivel 3): 29.12 MC/h (+20%)
- **Total:** 29.12 MC/h = 21,026 MC/mes (~$21 USD)

---

## 9. Sistema de Referidos (Ganancia Dinámica)

Para generar dinero más allá de la inversión pasiva, los usuarios pueden invitar a otros. El sistema utiliza un esquema de comisiones de por vida con 5 niveles de profundidad.

| Nivel   | Comisión | Usuarios Base | Propiedad Asociada    |
| ------- | -------- | ------------- | --------------------- |
| Nivel 1 | 5%       | 100 usuarios  | Tren (mayor ganancia) |
| Nivel 2 | 4%       | 75 usuarios   | Luz                   |
| Nivel 3 | 3%       | 50 usuarios   | Agua                  |
| Nivel 4 | 2%       | 25 usuarios   | Gas                   |
| Nivel 5 | 1%       | 10 usuarios   | Impuestos             |

**Características:**

- Propiedades por nivel no se repiten
- Comisiones decrecientes por nivel
- Dashboard visual para ver referidos, propiedades y ganancias

---

## 10. Mecánicas de "Ludopatía" (Mini-Juegos)

Telegram permite el uso de emojis que generan resultados aleatorios. Se integrarán estas probabilidades para eventos especiales o recompensas adicionales:

| Juego                 | Probabilidad | Recompensa      | Costo  |
| --------------------- | ------------ | --------------- | ------ |
| 🎲 Dado               | 1/6          | 6 Coins (6x)    | 1 Coin |
| 🎯 Dardos             | 1/5          | Moderada (2-5x) | 1 Coin |
| 🏀 Baloncesto         | 1/5          | Moderada (2x)   | 1 Coin |
| ⚽ Balón de Fútbol    | 1/5          | Moderada (2-5x) | 1 Coin |
| 🎳 Bolos              | 1/6          | Variable        | 1 Coin |
| 🎰 Tragamonedas (777) | 1/64         | Alta (100x)     | 1 Coin |

**Sistema "Cárcel":**

- Al perder, pagar X Coins o esperar 1 día con ganancias pausadas

---

## 11. Flujo de Usuario

1. **Registro:** El usuario entra al bot y recibe el **Apartamento Emprender** (1,000 MC/mes).
2. **Progresión:** Tira el dado. Si saca 1-4, desbloquea un servicio. Si saca 5-6, desbloquea una propiedad.
3. **Inversión:** Compra la propiedad/servicio que le salió. Solo así puede seguir tirando el dado.
4. **Crecimiento:** Construye niveles 1-3 en sus propiedades. Para llegar al nivel 4, debe tener todas las del mismo color al nivel 3.
5. **Estrategia:** Completa colores para obtener boosts. Compra servicios para multiplicar ingresos.
6. **Meta:** Construir un imperio completo con todas las propiedades al nivel máximo y servicios comprados.
7. **Escala:** Invitar amigos para acelerar el proceso mediante comisiones y retirar las ganancias al superar los 10,000 MC.

---

## 12. Presupuesto

### Publicidad

- **Telegram Ads:** $100 USD/mes ($50 Carmelo + $50 Oscar)
- **TonCoins:** Compra inicial de $100 USD para saldo disponible

### Infraestructura

- **IA:** Modelo económico (~$10 USD/mes o menos)
- **Servidores:** AWS para User Bot y base de datos
- **Email Marketing:** $30 USD/mes (opcional)

### Presupuesto Total Mensual Estimado

- **Mínimo:** $100-150 USD/mes (publicidad + IA básica)
- **Completo:** $200-250 USD/mes (incluyendo email marketing)

---

## 13. Cronograma del Proyecto

### Fase 1: Estrategia y Lore (2 semanas - 10-23 Ene)

- Investigación de canales de Telegram
- Configuración de campañas de Telegram Ads
- Diseño de creativos publicitarios
- Desarrollo de User Bot básico
- Integración de modelo de IA
- Creación de lore del juego

### Fase 2: Desarrollo Core (4 semanas - 24 Ene - 20 Feb)

- Sistema de Monopoly (terrenos, casas, hoteles)
- Sistema de referidos multinivel
- Sistema de economía y retiros
- Base de datos de colombianos

### Fase 3: Juegos de Azar (2 semanas - 21 Feb - 6 Mar)

- Implementación de Dado, Traga perras, Dardos, Baloncesto, Bolos
- Menú interactivo con emojis
- Sistema de "cárcel"

### Fase 4: Integración y Testing (2 semanas - 7 Mar - 20 Mar)

- Integración completa de sistemas
- Testing funcional y de usuario
- Ajustes finales

### Fase 5: Lanzamiento y Marketing Activo (6+ semanas - 21 Mar - 30 Abr)

- Lanzamiento oficial
- Activación de campañas de Telegram Ads
- User Bot interactuando en grupos
- Monitoreo y optimización continua

---

## 14. Objetivos y Proyecciones

### Conservadores

- **Usuarios activos:** 160k (1% de 16M)
- **Usuarios que invierten:** 1.6k (1% de activos)
- **Inversión promedio:** $10 USD
- **Total ingresos:** ~$16,000 USD

### Optimistas

- **Usuarios activos:** 1.6M (10% de 16M)
- **Usuarios que invierten:** 16k (1% de activos)
- **Inversión promedio:** $10 USD
- **Total ingresos:** ~$160,000 USD

### Realistas (meta)

- **Usuarios activos:** 500k - 1M
- **Usuarios que invierten:** 5k - 10k
- **Inversión promedio:** $10-50 USD
- **Total ingresos:** $50,000 - $500,000 USD

---

## 15. Puntos Clave del Proyecto

1. **Oportunidad única:** Ahora es el mejor momento por la baja competencia en Telegram Ads en español
2. **Costo económico:** $100 USD/mes pueden generar 10M de impresiones
3. **Diversificación:** Estrategia combinada (Ads + User Bot + Email opcional)
4. **Sistema probado:** Modelos similares (Farm, Zoo) han demostrado funcionar y enganchar usuarios
5. **FOMO y confianza:** El lore del juego y el canal oficial generarán confianza y sentido de urgencia
6. **Control selectivo:** Decidir a quién pagar para mantener rentabilidad
7. **Versatilidad:** User Bot se puede reutilizar para otros proyectos (GPT Touring, GPT Torrent)

---

## 16. Próximos Pasos Inmediatos

### Carmelo:

- Investigar y seleccionar canales de Telegram objetivo
- Comprar TonCoins ($100 USD) para publicidad
- Diseñar creativos publicitarios
- Iniciar desarrollo de User Bot

### Oscar:

- Brainstorming de conceptos narrativos (Lore)
- Diseñar sistema de terrenos y propiedades
- Definir estructura multinivel de referidos
- Crear personajes y mundo del juego

### Ambos:

- Completar diagrama de flujo del juego
- Definir porcentajes de comisión por nivel de referido
- Aportar $50 USD/mes cada uno para publicidad
- Mantener comunicación constante sobre progreso

---

## 17. Recursos y Herramientas

### Marketing

- Telegram Ads (<https://telegram.org>)
- Ton (moneda para pagar publicidad)

### Desarrollo

- User Bot de Telegram (API)
- Modelos de IA: DeepSeek (non-reasoning), Ollama local
- AWS para servidores y email marketing (SES)

### Diseño

- Generación de imágenes 3D con IA
- Emojis interactivos de Telegram

---

**Notas Adicionales:**

- El proyecto se ha estructurado completamente en Plane con 3 módulos, 8 tareas principales, 47 subtareas y 5 ciclos de trabajo
- La estrategia de pago selectivo es crucial para mantener la rentabilidad
- El momento actual es ideal por la poca competencia en Telegram Ads en español
- Reutilizar infraestructura del User Bot para otros proyectos (GPT Touring, GPT Torrent)

---

_Documento generado el 9 de enero de 2026 basado en la reunión del día._
