#!/usr/bin/env bash
# =============================================================================
# Cutover /ripser — PASO 1: preparación (correr con sudo).
# SEGURO: no cambia nada que vea el usuario; nginx sigue sirviendo la app en /.
# Uso: sudo bash ~/ripser-cutover/01-prep.sh
# =============================================================================
set -euo pipefail
# Bajo sudo, ~ es /root: resolver la carpeta del propio script.
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "== Directorios del layout nuevo =="
mkdir -p /var/www/app/releases
mkdir -p /var/www/landing/current
# CI (deploy@) escribe releases y rota el symlink current.
chown -R deploy:deploy /var/www/app
# La landing la gestiona mariano a mano.
chown -R mariano:mariano /var/www/landing

echo "== Kill-switch del SW viejo (se sirve recién post-cutover) =="
install -o mariano -g mariano -m 644 "$SRC/sw-killswitch.js" /var/www/landing/current/sw.js

echo "== Config nginx staged (NO habilitada todavía) =="
install -m 644 "$SRC/nginx-ysysoftware.conf" /etc/nginx/sites-available/ysysoftware-ripser

echo "== Backup del config vigente =="
cp -a /etc/nginx/sites-available/ysysoftware /etc/nginx/sites-available/ysysoftware.pre-ripser.bak

echo
echo "OK. Siguiente: mergear feature/ripser-subpath a main (CI llena /var/www/app),"
echo "verificar /var/www/app/current/ripser/index.html y correr 02-cutover.sh."
