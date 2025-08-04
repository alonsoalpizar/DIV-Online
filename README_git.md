# 📦 Integración con Git y GitHub

Este archivo documenta los pasos seguidos para conectar el proyecto desde el servidor Ubuntu hacia GitHub usando Git.

## ✅ Usuario y repositorio

- Usuario: **alonsoalpizar**
- Repositorio: **DIV-Online**
- Método de autenticación: **SSH key**

## 🔧 Pasos realizados

1. Instalación de Git:
   ```bash
   sudo apt update
   sudo apt install git -y
Configuración de identidad:

bash
Copiar
Editar
git config --global user.name "Alonso Alpízar"
git config --global user.email "alonsoalpizar@gmail.com"
Inicialización del repositorio desde /opt:

bash
Copiar
Editar
cd /opt
sudo git init
Creación del archivo .gitignore para evitar archivos sensibles:

bash
Copiar
Editar
*.log
*.env
main
div/logs/
dist/
build/
Creación de clave SSH y vinculación con GitHub:

bash
Copiar
Editar
ssh-keygen -t rsa -b 4096 -C "alonsoalpizar@gmail.com"
cat ~/.ssh/id_rsa.pub
Luego se pegó en: https://github.com/settings/ssh/new

Conexión con repositorio remoto:

bash
Copiar
Editar
sudo git remote add origin git@github.com:alonsoalpizar/DIV-Online.git
sudo git branch -M main
sudo git push -u origin main
📌 Notas
La clave SSH está guardada en ~/.ssh/id_rsa (privada) y ~/.ssh/id_rsa.pub (pública).

Usar git pull y git push para sincronizar con GitHub.
