# Sistema de Gestion de Pedidos - Frontend

Aplicacion web construida con React y Vite para registrar pedidos, consultar su
estado, adjuntar imagenes y revisar estadisticas operativas.

## Caracteristicas

- Registro de pedidos con cliente, fecha, estado, comentarios y articulos.
- Carga opcional de imagenes asociadas al pedido.
- Busqueda por cliente, codigo, fecha y estado.
- Cambio rapido de estado de cada pedido.
- Vista de estadisticas por mes, estado y cliente.
- Persistencia local de clientes frecuentes.

## Tecnologias

- React
- Vite
- CSS
- Recharts

## Estructura principal

```text
src/
  App.jsx             # Pantalla principal y flujo de pedidos
  Estadisticas.jsx    # Graficos y resumenes del sistema
  App.css             # Estilos de la interfaz
  main.jsx            # Punto de entrada de React
```

## Configuracion local

1. Clonar el repositorio.

```bash
git clone https://github.com/26Davee/temu-frontend.git
cd temu-frontend
```

2. Instalar dependencias.

```bash
npm install
```

3. Crear el archivo `.env` a partir de `.env.example`.

```bash
cp .env.example .env
```

4. Ejecutar en desarrollo.

```bash
npm run dev
```

## Variables de entorno

```env
VITE_API_URL=http://localhost:3000
```

En produccion puede apuntar al backend desplegado en Railway u otro proveedor.

## Scripts

```bash
npm run dev      # servidor local de Vite
npm run build    # compilacion de produccion
npm run preview  # vista previa del build
npm run lint     # revision con ESLint
```

## Deploy

- Frontend: [temu-frontend.vercel.app](https://temu-frontend.vercel.app)
- Backend relacionado: [temu-pedidos](https://github.com/26Davee/temu-pedidos)
