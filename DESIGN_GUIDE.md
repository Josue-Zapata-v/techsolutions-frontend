# TechSolutions Frontend Design Guide

## Personalidad visual

sistema de gestion comercial SaaS para pymes peruanas: sobrio, confiable, operativo y claro. La interfaz debe sentirse como una herramienta de trabajo diaria, no como landing decorativa.

## Paleta

- Cobalto primario: `#0E2A4D` para navegaci�n, jerarqu�a, acciones principales y estructura.
- Cobalto medio: `#143866` para estados activos, headers secundarios y �nfasis.
- Cobalto suave: `#5C7AA0` para iconograf�a de apoyo.
- Esmeralda acento: `#1F9D74` para progreso, �xito, crecimiento y llamados positivos.
- Esmeralda oscuro: `#198862` para texto de estados positivos.
- Hueso: `#FAF9F6` como fondo principal para reducir fatiga visual.
- Tinta: `#14181F` para texto principal.

## Tipograf�a

Stack usado:
`"Canva Sans", "Helvetica Neue", "Open Sans", "Aptos", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Reglas:
- Titulares compactos, sin letter-spacing negativo.
- Tablas y paneles con tama�os moderados para lectura repetida.
- Texto descriptivo solo donde ayude a decidir; evitar explicaciones redundantes dentro de m�dulos.

## Layout

- Sidebar cobalto persistente en desktop.
- Topbar con b�squeda global, notificaciones y usuario.
- Secciones por raz�n de uso: dashboard, ventas, inventario, clientes, suscripci�n.
- Cards solo para m�tricas, paneles y elementos repetidos.
- Tablas densas para operaciones frecuentes.

## Im�genes recomendadas

Actualmente no se requiere fotograf�a para operar el sistema de gestion comercial. Si se agrega una homepage p�blica o login comercial, usar im�genes reales o capturas del producto:

1. `public/placeholders/product-dashboard.png`: captura real del panel principal con informacion del negocio.
2. `public/placeholders/peruvian-business-owner.jpg`: due�o o equipo de pyme peruana usando laptop/tablet en ambiente real.
3. `public/placeholders/inventory-workflow.jpg`: escena de inventario/almac�n peque�o, clara y bien iluminada.

Evitar im�genes gen�ricas oscuras, manos con laptop sin contexto o ilustraciones abstractas.