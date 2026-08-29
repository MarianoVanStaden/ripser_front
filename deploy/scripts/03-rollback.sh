#!/usr/bin/env bash
# =============================================================================
# Cutover /ripser — ROLLBACK del nginx al estado pre-cutover (correr con sudo).
# Restaura la app en / servida desde /var/www/frontend/current.
# OJO: tras 02-cutover.sh los releases viejos de /var/www/frontend fueron
# purgados salvo el activo — el rollback sirve ese único release.
# Uso: sudo bash ~/ripser-cutover/03-rollback.sh
# =============================================================================
set -euo pipefail

test -f /etc/nginx/sites-available/ysysoftware.pre-ripser.bak || {
  echo "ABORT: no hay backup pre-ripser"; exit 1; }
test -f /var/www/frontend/current/index.html || {
  echo "ABORT: /var/www/frontend/current ya no existe — rollback imposible, ir hacia adelante"; exit 1; }

cp /etc/nginx/sites-available/ysysoftware.pre-ripser.bak /etc/nginx/sites-available/ysysoftware
nginx -t
systemctl reload nginx
echo "Rollback aplicado: la app vuelve a servirse en / desde /var/www/frontend/current."
echo "OJO: browsers que ya corrieron el kill-switch quedaron sin SW (la app carga de red — OK)."
