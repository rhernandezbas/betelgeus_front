# Betelgeuse - Splynx Admin Panel

Panel de administración web para gestión de operadores de tickets Splynx, construido con React, Vite, TailwindCSS y shadcn/ui.

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Docker y Docker Compose (para deployment)

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/rhernandezbas/betelgeus_front.git
cd betelgeus_front

# Instalar dependencias del frontend
cd frontend
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en http://localhost:3000

### Build para Producción

```bash
cd frontend
npm run build
npm run preview  # Preview del build
```

## 🐳 Docker

### Desarrollo con Docker Compose

```bash
# Copiar archivo de entorno
cp .env.example .env

# Levantar contenedores
docker compose up -d

# Ver logs
docker compose logs -f

# Detener contenedores
docker compose down
```

La aplicación estará disponible en http://localhost:7842

### Build de Imagen Docker

```bash
cd frontend
docker build -t betelgeuse-frontend:latest .
docker run -p 7842:80 betelgeuse-frontend:latest
```

## 📋 Scripts Disponibles

Dentro del directorio `frontend/`:

- `npm run dev` - Inicia servidor de desarrollo con hot reload
- `npm run build` - Compila la aplicación para producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Ejecuta ESLint para análisis de código

## 🏗️ Estructura del Proyecto

```
betelgeus_front/
├── .github/
│   └── workflows/
│       ├── ci.yml           # CI: Build y Lint
│       └── deploy.yml       # CD: Deploy automático a VPS
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── lib/            # Utilidades y API client
│   │   └── hooks/          # Custom hooks
│   ├── public/             # Archivos estáticos
│   ├── Dockerfile          # Configuración Docker
│   └── package.json        # Dependencias Node.js
├── docker-compose.yml      # Configuración Docker Compose
├── .env.example           # Variables de entorno ejemplo
└── CLAUDE.md              # Documentación para Claude Code
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_API_URL=http://localhost:5605

# VPS Configuration (para GitHub Actions)
VPS_HOST=your-vps-ip
VPS_PORT=22
VPS_USERNAME=root
VPS_DEPLOY_PATH=/opt/betelgeuse
```

## 🚢 Deployment

### GitHub Actions

El proyecto incluye CI/CD automático:

1. **CI (Continuous Integration)** - Se ejecuta en cada push/PR:
   - Instala dependencias
   - Ejecuta linting
   - Compila la aplicación
   - Construye imagen Docker de prueba

2. **CD (Continuous Deployment)** - Se ejecuta en push a `main`:
   - Despliega automáticamente al VPS
   - Actualiza contenedores Docker
   - Verifica el deployment

### Configurar GitHub Secrets

Ve a tu repositorio en GitHub: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Agrega los siguientes secretos:

- `VPS_HOST` - IP o dominio del VPS
- `VPS_USERNAME` - Usuario SSH (ej: root)
- `VPS_PASSWORD` - Contraseña SSH
- `VPS_PORT` - Puerto SSH (default: 22)

### Deployment Manual

```bash
# En el VPS
cd /opt/betelgeuse
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 🎨 Stack Tecnológico

- **Frontend Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** TailwindCSS 3
- **UI Components:** shadcn/ui + Radix UI
- **Routing:** React Router 6
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React
- **Server:** Nginx (producción)

## 📚 Documentación

- [Frontend README](./frontend/README.md) - Documentación detallada del frontend
- [CLAUDE.md](./CLAUDE.md) - Guía para Claude Code
- [Deployment Guide](./.github/DEPLOYMENT.md) - Guía de deployment detallada

## 🔐 Autenticación

El sistema usa autenticación basada en roles:

- **Admin:** Acceso completo al panel de administración
- **Operator:** Acceso limitado a vista de operador

La autenticación se gestiona mediante sesiones almacenadas en `sessionStorage`.

## 🌟 Características

- ✅ Gestión de operadores y horarios
- ✅ Sistema de auditoría completo
- ✅ Métricas y estadísticas en tiempo real
- ✅ Análisis de dispositivos
- ✅ Gestión de usuarios y permisos
- ✅ Logs del sistema
- ✅ Responsive design
- ✅ Dark mode support

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y pertenece a su organización.

## 👥 Autor

**Ronald Hernández**
- GitHub: [@rhernandezbas](https://github.com/rhernandezbas)
- Email: ronald.hernandezba@gmail.com
