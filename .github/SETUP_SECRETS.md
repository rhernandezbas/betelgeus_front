# Configuración de GitHub Secrets

Para que el deployment automático funcione, necesitas configurar los siguientes secretos en GitHub.

## Pasos para Configurar Secretos

1. Ve a tu repositorio en GitHub
2. Click en `Settings` (Configuración)
3. En el menú lateral, click en `Secrets and variables` → `Actions`
4. Click en `New repository secret`
5. Agrega cada uno de los siguientes secretos:

## Secretos Requeridos

### VPS_HOST
- **Nombre del Secret:** `VPS_HOST`
- **Descripción:** IP o dominio de tu servidor VPS
- **Ejemplo:** `190.7.234.37` o `mi-servidor.com`

### VPS_USERNAME
- **Nombre del Secret:** `VPS_USERNAME`
- **Descripción:** Usuario SSH para conectarse al VPS
- **Ejemplo:** `root` o `deploy`

### VPS_PASSWORD
- **Nombre del Secret:** `VPS_PASSWORD`
- **Descripción:** Contraseña SSH del usuario
- **Nota:** Asegúrate de usar una contraseña segura

### VPS_PORT (Opcional)
- **Nombre del Secret:** `VPS_PORT`
- **Descripción:** Puerto SSH (si es diferente al default)
- **Default:** `22`
- **Solo necesario si usas un puerto diferente**

## Verificar Configuración

Después de agregar los secretos:

1. Ve a la pestaña `Actions` en tu repositorio
2. Verás los workflows configurados:
   - **CI - Build and Lint**: Se ejecuta en cada push/PR
   - **Deploy to VPS**: Se ejecuta solo en push a `main`

3. Haz un push a `main` para probar el deployment:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```

4. Ve a `Actions` para ver el progreso del deployment

## Seguridad

✅ **Buenas Prácticas:**
- Nunca compartas tus secretos públicamente
- Usa contraseñas fuertes para tu VPS
- Considera usar SSH keys en lugar de contraseñas
- Revisa regularmente los logs de deployment

⚠️ **Importante:**
- Los secretos están encriptados en GitHub
- No se muestran en los logs de workflows
- Solo los administradores del repositorio pueden verlos/editarlos

## Alternativa con SSH Keys (Más Seguro)

Si prefieres usar SSH keys en lugar de contraseñas:

1. Genera un par de llaves SSH en tu máquina local:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
   ```

2. Copia la llave pública al VPS:
   ```bash
   ssh-copy-id -i ~/.ssh/github_actions.pub user@vps-host
   ```

3. En GitHub Secrets, crea:
   - `VPS_SSH_KEY`: El contenido de `~/.ssh/github_actions` (llave privada)
   - `VPS_HOST`: Tu IP/dominio
   - `VPS_USERNAME`: Tu usuario SSH
   - `VPS_PORT`: Puerto SSH (opcional)

4. Modifica el workflow `.github/workflows/deploy.yml`:
   ```yaml
   - uses: appleboy/ssh-action@v1.0.3
     with:
       host: ${{ secrets.VPS_HOST }}
       username: ${{ secrets.VPS_USERNAME }}
       key: ${{ secrets.VPS_SSH_KEY }}
       port: ${{ secrets.VPS_PORT || 22 }}
   ```

## Troubleshooting

### El workflow falla con "Authentication failed"
- Verifica que los secretos estén configurados correctamente
- Prueba conectarte manualmente al VPS con las mismas credenciales

### El workflow se queda "pending"
- Revisa que no haya otros workflows corriendo
- Verifica el timeout del workflow

### El deployment falla
- Ve a los logs del workflow en GitHub Actions
- Busca mensajes de error específicos
- Verifica que Docker esté instalado en el VPS

## Soporte

Si tienes problemas:
1. Revisa los logs en GitHub Actions
2. Conéctate al VPS y revisa logs de Docker:
   ```bash
   cd /opt/betelgeuse
   docker compose logs -f
   ```
