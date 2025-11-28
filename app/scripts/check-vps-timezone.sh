#!/bin/bash

echo "🔍 VERIFICANDO ZONA HORARIA DEL VPS"
echo "==================================="
echo ""

# Verificar zona horaria actual
echo "Zona horaria actual:"
timedatectl status | grep "Time zone"
echo ""

# Verificar hora actual en el VPS
echo "Hora actual en el VPS:"
date
echo ""

# Verificar hora actual en UTC
echo "Hora actual en UTC:"
date -u
echo ""

# Verificar diferencia
echo "Diferencia con UTC:"
date +%z
echo ""

# Verificar configuración de PostgreSQL
if [ -f /etc/postgresql/*/main/postgresql.conf ]; then
  echo "Zona horaria de PostgreSQL:"
  grep timezone /etc/postgresql/*/main/postgresql.conf | grep -v "^#"
else
  echo "PostgreSQL no encontrado o no configurado"
fi

echo ""
echo "💡 Si el VPS muestra la hora correcta de Chile (UTC-3),"
echo "   las fechas guardadas ya están en UTC-3 y NO necesitan conversión."