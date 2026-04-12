# Guía de Deploy al VPS

Guía paso a paso para dejar configurado el VPS y que el workflow de GitHub Actions
(`.github/workflows/deploy.yml`) funcione correctamente con deploy atómico y rollback.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Crear usuario de deploy](#2-crear-usuario-de-deploy)
3. [Generar clave SSH para GitHub Actions](#3-generar-clave-ssh-para-github-actions)
4. [Configurar estructura de directorios](#4-configurar-estructura-de-directorios)
5. [Configurar sudo sin contraseña para nginx](#5-configurar-sudo-sin-contraseña-para-nginx)
6. [Configurar nginx](#6-configurar-nginx)
7. [Cargar los secrets en GitHub](#7-cargar-los-secrets-en-github)
8. [Primer deploy y verificación](#8-primer-deploy-y-verificación)
9. [Rollback manual](#9-rollback-manual)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Requisitos previos

- VPS con Ubuntu 20.04+ (o Debian equivalente)
- Acceso SSH como `root` o usuario con `sudo`
- Nginx instalado (`apt install nginx`)
- Puerto 80 (y 443 si usás HTTPS) abierto en el firewall

```bash
# Verificar que nginx está instalado y activo
nginx -v
sudo systemctl status nginx
```

Si nginx no está instalado:

```bash
sudo apt update && sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 2. Crear usuario de deploy

Crear un usuario dedicado para que GitHub Actions se conecte. No necesita contraseña ni shell interactivo para mayor seguridad.

```bash
# Conectarse al VPS como root o con sudo
sudo adduser --disabled-password --gecos "" deploy
```

Verificar que el usuario fue creado:

```bash
id deploy
```

---

## 3. Generar clave SSH para GitHub Actions

Esto se hace **en tu máquina local** (o en el VPS, da igual). El par de claves se genera una sola vez.

```bash
# Generar par de claves RSA de 4096 bits sin passphrase
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/deploy_key -N ""
```

Esto genera:
- `~/.ssh/deploy_key` → **clave privada** (va al secret de GitHub)
- `~/.ssh/deploy_key.pub` → **clave pública** (va al VPS)

### Instalar la clave pública en el VPS

```bash
# Copiar la clave pública al VPS (reemplazá IP con la IP real del VPS)
ssh-copy-id -i ~/.ssh/deploy_key.pub root@<IP_DEL_VPS>

# Luego en el VPS, mover la clave al usuario deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

O si preferís hacerlo todo desde el VPS directamente:

```bash
# En el VPS, como root
sudo mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
# Pegar el contenido de deploy_key.pub (la clave pública), guardar y salir

sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Probar la conexión desde tu máquina local:

```bash
ssh -i ~/.ssh/deploy_key deploy@<IP_DEL_VPS>
# Debe entrar sin pedir contraseña
```

---

## 4. Configurar estructura de directorios

Ejecutar **en el VPS** como root o con sudo:

```bash
# Crear estructura de releases
sudo mkdir -p /var/www/frontend/releases

# Darle propiedad al usuario deploy
sudo chown -R deploy:deploy /var/www/frontend

# Verificar
ls -la /var/www/frontend/
```

La estructura resultante después del primer deploy será:

```
/var/www/frontend/
├── releases/
│   ├── 1/        ← primer deploy (run #1 de GitHub Actions)
│   ├── 2/        ← segundo deploy
│   └── 3/        ← deploy actual
└── current -> releases/3   ← symlink al release activo
```

---

## 5. Configurar sudo sin contraseña para nginx

El usuario `deploy` necesita poder ejecutar `systemctl reload nginx` sin contraseña,
ya que GitHub Actions no puede ingresar una contraseña interactiva.

```bash
sudo visudo -f /etc/sudoers.d/deploy-nginx
```

Agregar esta línea y guardar:

```
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/systemctl reload apache2
```

Verificar que funciona:

```bash
# Cambiar al usuario deploy y probar
sudo -u deploy sudo systemctl reload nginx
# No debe pedir contraseña
```

---

## 6. Configurar nginx

El archivo de configuración del proyecto (`nginx.conf` en la raíz del repo) sirve como
referencia. Para el VPS hay que adaptarlo: el `root` debe apuntar al symlink `current`.

Crear el sitio en nginx:

```bash
sudo nano /etc/nginx/sites-available/frontend
```

Pegar esta configuración (adaptada del `nginx.conf` del proyecto):

```nginx
server {
    listen 80;
    server_name <DOMINIO_O_IP>;   # ← reemplazar con el dominio o IP del VPS

    root /var/www/frontend/current;
    index index.html;

    # Gzip para assets estáticos
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/javascript application/x-javascript image/svg+xml;
    gzip_min_length 1024;
    gzip_vary on;

    # Assets con hash en el nombre → caché agresivo (1 año)
    location ~* \.(js|css|woff2?|ttf|eot|svg|ico|png|jpg|jpeg|gif|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Proxy reverso → backend
    location /api/ {
        proxy_pass         http://76.13.161.228:8080/RipserApp/api/;
        proxy_http_version 1.1;

        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        proxy_set_header   Authorization   $http_authorization;
        proxy_set_header   X-Empresa-Id    $http_x_empresa_id;
        proxy_set_header   X-Sucursal-Id   $http_x_sucursal_id;

        proxy_connect_timeout 10s;
        proxy_read_timeout    30s;
    }

    # SPA fallback: cualquier ruta desconocida sirve index.html (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Activar el sitio y recargar nginx:

```bash
# Crear symlink para activar el sitio
sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/frontend

# Desactivar el sitio default si está activo
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar que la configuración no tiene errores
sudo nginx -t

# Aplicar cambios
sudo systemctl reload nginx
```

> **Nota sobre HTTPS:** Si el VPS tiene un dominio, se recomienda agregar SSL con Certbot:
> ```bash
> sudo apt install certbot python3-certbot-nginx
> sudo certbot --nginx -d tu-dominio.com
> ```
> Certbot modifica el bloque `server` automáticamente para incluir el certificado.

---

## 7. Cargar los secrets en GitHub

Ir al repositorio en GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Crear los siguientes tres secrets:

| Secret       | Valor                                                      |
|--------------|------------------------------------------------------------|
| `VPS_HOST`   | IP pública del VPS (ej: `203.0.113.42`)                   |
| `VPS_USER`   | `deploy`                                                   |
| `VPS_SSH_KEY`| Contenido completo de `~/.ssh/deploy_key` (clave **privada**) |

Para copiar la clave privada correctamente:

```bash
# En tu máquina local, mostrar la clave privada
cat ~/.ssh/deploy_key
```

Copiar todo el contenido incluyendo las líneas:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

---

## 8. Primer deploy y verificación

Hacer un push a `main` (o disparar el workflow manualmente desde GitHub Actions → pestaña **Actions** → **Run workflow**).

Verificar en el VPS que todo quedó bien:

```bash
# Ver estructura de releases
ls -la /var/www/frontend/releases/
ls -la /var/www/frontend/current   # debe mostrar el symlink

# Verificar que nginx sirve el frontend
curl -I http://localhost/
# Debe responder HTTP/1.1 200 OK

# Ver logs de nginx si algo falla
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 9. Rollback manual

El workflow hace rollback automático si el deploy falla. Para hacer rollback **manualmente**
a un release anterior:

```bash
# Listar releases disponibles (el más reciente primero)
ls -1t /var/www/frontend/releases/

# Apuntar el symlink al release deseado (reemplazar N con el número de release)
ln -sfn /var/www/frontend/releases/N /var/www/frontend/current

# Recargar nginx
sudo systemctl reload nginx

# Verificar
readlink /var/www/frontend/current
```

---

## 10. Troubleshooting

### El workflow falla en "Copy dist to VPS"

- Verificar que el usuario `deploy` puede hacer SSH: `ssh -i ~/.ssh/deploy_key deploy@<IP>`
- Verificar que la clave privada en el secret `VPS_SSH_KEY` no tiene saltos de línea extra
- Verificar que `/var/www/frontend/` tiene permisos del usuario `deploy`: `ls -la /var/www/`

### nginx devuelve 403 Forbidden

```bash
# El problema suele ser permisos. Verificar:
ls -la /var/www/frontend/current/
# El usuario www-data (nginx) debe poder leer los archivos

# Solución: dar permisos de lectura a otros
chmod -R o+rX /var/www/frontend/releases/
```

### nginx devuelve 404 en rutas de React Router (ej: /clientes/1)

Verificar que el bloque `location /` tiene el fallback correcto:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### El symlink `current` apunta a un lugar inexistente

```bash
# Ver a dónde apunta
readlink -f /var/www/frontend/current

# Si el directorio no existe, apuntarlo a un release válido
ln -sfn /var/www/frontend/releases/<N> /var/www/frontend/current
sudo systemctl reload nginx
```

### Verificar que el proxy al backend funciona

```bash
# Desde el VPS, probar que el backend responde
curl -I http://76.13.161.228:8080/RipserApp/api/
```
