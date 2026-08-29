#!/usr/bin/env bash
# =============================================================================
# Landing: habilitar el deploy por CI (correr con sudo).
#  - chown de /var/www/landing a deploy (el workflow de ysy_landing escribe
#    releases/ y rota el symlink current, igual que ripser_front).
#  - re-aplica el nginx staged (headers de seguridad + cache de /_astro/).
# Uso: sudo bash /home/mariano/ripser-cutover/05-landing-prep.sh
# =============================================================================
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

chown -R deploy:deploy /var/www/landing
echo "chown OK:"; ls -la /var/www/landing/

bash "$SRC/04-apply-nginx.sh"
