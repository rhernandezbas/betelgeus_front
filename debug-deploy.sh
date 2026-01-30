#!/bin/bash
# Script de diagnóstico para deployment

echo "🔍 Diagnóstico de Deployment - Betelgeuse"
echo "=========================================="
echo ""

# Verificar Docker
echo "📦 Verificando Docker..."
docker --version
docker compose version
echo ""

# Estado de contenedores
echo "📊 Estado de contenedores:"
docker compose ps -a
echo ""

# Logs completos
echo "📋 Logs de frontend (últimas 100 líneas):"
docker compose logs --tail=100 frontend
echo ""

# Imágenes Docker
echo "🖼️  Imágenes Docker:"
docker images | grep betelgeuse
echo ""

# Uso de recursos
echo "💾 Uso de recursos:"
docker stats --no-stream
echo ""

# Archivos del proyecto
echo "📁 Archivos del proyecto:"
ls -lah
echo ""

# Verificar puerto
echo "🔌 Verificando puerto 7842:"
netstat -tlnp | grep 7842 || echo "Puerto 7842 no está en uso"
echo ""

# Test de build manual
echo "🏗️  Intentar build manual..."
docker compose build 2>&1 | tail -50
echo ""

echo "✅ Diagnóstico completado"
