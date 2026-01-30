# Configuración de Despliegue Automático a VPS

Este repositorio está configurado con GitHub Actions para desplegar automáticamente a tu VPS cada vez que hagas push a la rama `main`.

## 🔐 Configurar Secretos en GitHub

Ve a tu repositorio en GitHub: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Agrega los siguientes secretos:

### 1. VPS_HOST
- **Nombre:** `VPS_HOST`
- **Valor:** La IP o dominio de tu VPS (ej: `190.7.234.37`)

### 2. VPS_USERNAME
- **Nombre:** `VPS_USERNAME`
- **Valor:** Usuario SSH (ej: `root`)

### 3. VPS_PASSWORD
- **Nombre:** `VPS_PASSWORD`
- **Valor:** Tu contraseña SSH

### 4. VPS_PORT (Opcional)
- **Nombre:** `VPS_PORT`
- **Valor:** Puerto SSH (default: `22`)

## 🚀 Preparar el VPS (Solo primera vez)

Conéctate a tu VPS:

```bash
ssh root@190.7.234.37
```

Ejecuta estos comandos:

```bash
# 1. Actualizar sistema
apt update && apt upgrade -y

# 2. Instalar Docker (si no está instalado)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 4. Verificar instalación
docker --version
docker-compose --version

# 5. Instalar Git (si no está instalado)
apt install git -y

# 6. Listo! El workflow se encargará del resto
```

## ✅ ¡Eso es todo!

Una vez configurados los secretos en GitHub y preparado el VPS:

1. Haz cualquier cambio en el código
2. Haz commit y push a `main`
3. Ve a GitHub → Actions → Verás el workflow ejecutándose
4. El workflow automáticamente:
   - ✅ Clona el repositorio en `/opt/splynx-tickets` (primera vez)
   - ✅ Hace pull de los cambios (siguientes veces)
   - ✅ Construye la imagen Docker
   - ✅ Levanta los contenedores
   - ✅ Verifica que todo funcione

## 🔄 Flujo de Despliegue Automático

```
git push → GitHub Actions → SSH al VPS → Git Pull → Docker Build → Docker Up → ✅
```

## 🌐 Acceder a la Aplicación

Después del despliegue, tu aplicación estará disponible en:

**http://190.7.234.37:7842**

## 📊 Monitorear el Despliegue

### En GitHub
- Ve a: https://github.com/rhernandezbas/splynx-tickets/actions
- Verás cada despliegue con su estado (✅ o ❌)
- Click en cualquier workflow para ver logs detallados

### En el VPS
```bash
# Conectarse al VPS
ssh root@190.7.234.37

# Ver contenedores
cd /opt/splynx-tickets
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de las últimas 100 líneas
docker-compose logs --tail=100

# Reiniciar manualmente si es necesario
docker-compose restart

# Detener
docker-compose down

# Iniciar
docker-compose up -d
```

## 🐛 Troubleshooting

### El workflow falla en GitHub Actions
1. Ve a Actions → Click en el workflow fallido
2. Revisa los logs rojos
3. Verifica que los secretos estén bien configurados

### La aplicación no responde
```bash
# En el VPS
cd /opt/splynx-tickets
docker-compose logs --tail=100

# Verificar que el contenedor está corriendo
docker-compose ps

# Reiniciar
docker-compose restart
```

### Error de conexión a base de datos
- Verifica que la base de datos MySQL en `190.7.234.37:3025` esté accesible
- Revisa las credenciales en `app/utils/config.py`

### Puerto 7842 no accesible
```bash
# Verificar firewall
ufw status
ufw allow 7842/tcp
```

## 📱 Despliegue Manual desde GitHub

También puedes activar el despliegue manualmente sin hacer push:

1. Ve a GitHub → Actions
2. Selecciona "Deploy to VPS"
3. Click en "Run workflow"
4. Selecciona la rama `main`
5. Click en "Run workflow"

## 🔒 Seguridad

- ✅ Los secretos están encriptados en GitHub
- ✅ Nunca se muestran en los logs
- ⚠️  Considera cambiar la contraseña de root después de configurar
- ⚠️  Configura un firewall para permitir solo puertos necesarios

## 📈 Próximos Pasos

Una vez que todo funcione:

1. Configura un dominio apuntando a `190.7.234.37`
2. Instala un certificado SSL con Let's Encrypt
3. Configura un proxy reverso con Nginx
4. Implementa backups automáticos de la base de datos

## 🎯 Comandos Útiles

```bash
# Ver todos los contenedores
docker ps -a

# Ver uso de recursos
docker stats

# Limpiar todo (cuidado!)
docker system prune -a

# Ver logs de un contenedor específico
docker logs <container_id>

# Entrar a un contenedor
docker exec -it <container_id> bash
```

Tu aplicación está lista para producción! 🚀
