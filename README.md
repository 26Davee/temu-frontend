# 📦 Gestión de Pedidos Temu (Frontend)

Aplicación web desarrollada con **React + Vite** para gestionar pedidos personalizados con carga de imágenes, filtros por estado, estadísticas dinámicas y más.

## 🚀 Funcionalidades

- Registro de pedidos con artículos, comentarios, y estado.
- Carga opcional de imágenes (almacenadas en Cloudinary).
- Filtrado por nombre, código, fecha y estado.
- Visualización de estadísticas por mes, estado y cliente.
- Soporte para modo claro y oscuro según el sistema operativo.

## 🌐 Backend

- API REST construida con Express y Prisma.
- Almacenamiento de imágenes en **Cloudinary**.
- Base de datos PostgreSQL alojada en **Railway**.
- URL de producción: [`https://temu-pedidos-production.up.railway.app`](https://temu-pedidos-production.up.railway.app)

## 🧑‍💻 Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/temu-pedidos.git

# Ir al frontend
cd temu-pedidos

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
