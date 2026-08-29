#!/usr/bin/env bash
# =============================================================================
# Re-aplica el nginx-ysysoftware.conf staged sobre el sitio activo (correr con
# sudo). Idempotente: para iterar fixes del config post-cutover.
# Uso: sudo bash /home/mariano/ripser-cutover/04-apply-nginx.sh
# =============================================================================
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install -m 644 "$SRC/nginx-ysysoftware.conf" /etc/nginx/sites-available/ysysoftware-ripser
cp /etc/nginx/sites-available/ysysoftware-ripser /etc/nginx/sites-available/ysysoftware
if ! nginx -t; then
  echo "nginx -t FALLÓ — restaurando backup pre-cutover"
  cp /etc/nginx/sites-available/ysysoftware.pre-ripser.bak /etc/nginx/sites-available/ysysoftware
  nginx -t
  exit 1
fi
systemctl reload nginx
echo "Config aplicado."
curl -sk -o /dev/null -w "GET / -> %{http_code} %{redirect_url}\n" https://localhost/ -H 'Host: www.ysysoftware.com'
