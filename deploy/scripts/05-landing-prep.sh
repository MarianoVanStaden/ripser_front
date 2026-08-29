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

# Autorizar la key dedicada del CI de ysy_landing para el usuario deploy
# (la privada correspondiente va al secret VPS_SSH_KEY del repo ysy_landing).
LANDING_PUB='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ35Wbl+PG6nwh8n7CZSxoXyWfP6eUjJSpNntYwj3yf/ ysy-landing-deploy'
mkdir -p /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
grep -qF "$LANDING_PUB" /home/deploy/.ssh/authorized_keys || echo "$LANDING_PUB" >> /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
echo "key del CI de la landing autorizada para deploy@"

bash "$SRC/04-apply-nginx.sh"
