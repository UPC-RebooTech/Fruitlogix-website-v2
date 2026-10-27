# FruitLogix landing

Landing estática bilingüe para RebooTech, construida con HTML, CSS y módulos JavaScript nativos. No requiere instalación de dependencias ni build.

## Ejecutar localmente

El navegador debe servir el proyecto por HTTP para que funcionen los módulos ES y la carga de `locales/*.json` (no abrir `index.html` directamente como `file://`). Desde esta carpeta:

```bash
python3 -m http.server 8000
```
npx serve -l 3000

Abre `http://localhost:8000`. Para publicarla, sube la carpeta del proyecto a Netlify, Vercel, GitHub Pages u otro hosting estático.

## Antes de producción

- Cambia los `href` de Google Play y App Store en `index.html` por los enlaces oficiales.
- Confirma el correo `contacto@rebootech.pe` en `index.html` y `ui.js`.
- Reemplaza los enlaces sociales placeholder en la sección de contacto.
- Coloca cada foto aprobada del equipo en el atributo `data-photo` de la tarjeta correspondiente; las iniciales permanecen como fallback.
- Para usar Formspree/Netlify Forms en vez de `mailto:`, coloca la URL del endpoint en `data-endpoint` del formulario `#contact-form`.
- Añade el dominio público definitivo a `canonical` y `og:url` cuando esté configurado; el proyecto no inventa esa dirección.
