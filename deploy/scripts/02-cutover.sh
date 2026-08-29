#!/usr/bin/env bash
# =============================================================================
# Cutover /ripser — PASO 2: activar (correr con sudo). ESTE es el cambio visible.
# Precondiciones: 01-prep.sh corrido y CI ya deployó a /var/www/app (rama mergeada).
# Uso: sudo bash ~/ripser-cutover/02-cutover.sh
# Rollback inmediato: sudo bash ~/ripser-cutover/03-rollback.sh
# =============================================================================
set -euo pipefail

echo "== Precondiciones =="
test -f /var/www/app/current/ripser/index.html || {
  echo "ABORT: /var/www/app/current/ripser/index.html no existe (¿CI deployó el release nuevo?)"; exit 1; }
test -f /var/www/landing/current/sw.js || {
  echo "ABORT: kill-switch /var/www/landing/current/sw.js no existe (¿corriste 01-prep.sh?)"; exit 1; }
test -f /etc/nginx/sites-available/ysysoftware.pre-ripser.bak || {
  echo "ABORT: falta el backup del config (¿corriste 01-prep.sh?)"; exit 1; }
# El dist nuevo tiene que estar compilado para subpath.
grep -q '/ripser/assets/' /var/www/app/current/ripser/index.html || {
  echo "ABORT: el index de /var/www/app no referencia /ripser/assets/ (build con base vieja)"; exit 1; }

echo "== Swap del config =="
cp /etc/nginx/sites-available/ysysoftware-ripser /etc/nginx/sites-available/ysysoftware
if ! nginx -t; then
  echo "nginx -t FALLÓ — restaurando config previo"
  cp /etc/nginx/sites-available/ysysoftware.pre-ripser.bak /etc/nginx/sites-available/ysysoftware
  nginx -t
  exit 1
fi
systemctl reload nginx
echo "== nginx recargado =="

echo "== Purga de releases pre-migración (base '/', romperían un rollback de CI) =="
ls -1dt /var/www/frontend/releases/*/ 2>/dev/null | tail -n +2 | xargs -r rm -rf || true
# /var/www/frontend queda (solo el release activo) como referencia; se borra en Deploy C.

echo "== Smoke =="
curl -sk -o /dev/null -w "GET /            -> %{http_code} %{redirect_url}\n" https://localhost/ -H 'Host: www.ysysoftware.com'
curl -sk -o /dev/null -w "GET /ripser      -> %{http_code} %{redirect_url}\n" https://localhost/ripser -H 'Host: www.ysysoftware.com'
curl -sk -o /dev/null -w "GET /ripser/     -> %{http_code}\n"                 https://localhost/ripser/ -H 'Host: www.ysysoftware.com'
curl -sk -o /dev/null -w "GET /dashboard   -> %{http_code} %{redirect_url}\n" https://localhost/dashboard -H 'Host: www.ysysoftware.com'
curl -sk -o /dev/null -w "GET QR viejo     -> %{http_code} %{redirect_url}\n" https://localhost/public/equipos/1/ficha -H 'Host: www.ysysoftware.com'
curl -sk -o /dev/null -w "GET /sw.js (kill)-> %{http_code}\n"                 https://localhost/sw.js -H 'Host: www.ysysoftware.com'
curl -sk -o /dev/null -w "GET api ping     -> %{http_code}\n"                 https://localhost/ripser/api/public/ping -H 'Host: www.ysysoftware.com'
echo "Cutover aplicado. Verificar desde un browser real (PWA vieja instalada => kill-switch)."
