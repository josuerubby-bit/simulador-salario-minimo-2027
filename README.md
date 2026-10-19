# Simulador del Salario Mínimo 2027 · Colombia

Simulador financiero interactivo de la negociación del salario mínimo en Colombia para 2027.

## Estructura de la carpeta

```
simulador-salario-minimo-2027/
├── version-un-archivo/     ← todo en un solo index.html
│   ├── index.html
│   └── README.md
└── version-separada/       ← HTML, CSS y JavaScript en archivos separados
    ├── index.html          ← estructura y contenido
    ├── styles.css          ← diseño visual
    ├── app.js              ← lógica del simulador
    └── README.md
```

Ambas versiones son idénticas en funcionamiento; solo cambia la organización del código.

## Lenguajes utilizados

- **HTML5** (`index.html`) — estructura y contenido de la página, con accesibilidad (ARIA).
- **CSS3** (`styles.css`) — diseño visual: variables CSS (tema claro/oscuro), rejillas, animaciones y diseño responsive para móvil y escritorio.
- **JavaScript ES6+** (`app.js`) — lógica del simulador: cálculo del salario 2027, ganancia real frente a la inflación, aportes patronales (salud, pensión, ARL, parafiscales) y prestaciones; actualización dinámica de tablas, KPIs y gráficos.

## Librerías externas (cargadas por CDN, requieren internet)

- **Chart.js 4.4.9** — gráficos de barras apiladas y de línea.
- **Cabinet Grotesk y Satoshi** (Fontshare) — tipografías.

## Cómo usarlo

1. Descomprime la carpeta.
2. Abre `index.html` (cualquiera de las dos versiones) con doble clic en un navegador moderno. No necesita servidor ni instalación.
3. Para publicarlo en un hosting, sube los archivos de la carpeta tal cual están (en la versión separada, los tres archivos deben ir juntos en la misma carpeta).

## Datos de referencia (octubre de 2026)

- Salario mínimo 2026: $1.750.905 (Decreto 159 de 2026, transitorio)
- Auxilio de transporte 2026: $249.095 (Decreto 1470 de 2025)
- IPC septiembre 2026: 6,29% anual (DANE)
- Proyecciones del Banco de la República: inflación 6,9% cierre 2026 y 4,3% en 2027
- Productividad total de los factores (PTF): 0,91% (referencia 2025, DANE)

Herramienta educativa; no constituye asesoría legal, laboral ni financiera.
