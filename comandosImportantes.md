iniciar - detener - reiniciar el servicio de backend del frontend


# Estado
systemctl status div-backend.service

# Reiniciar
sudo systemctl restart div-backend.service

# Logs
journalctl -u div-backend.service -f

iniciar - detener - Reiniciar el servicio de Motor Backend

# Estado
systemctl status div-backend-motor.service

# Reiniciar
sudo systemctl restart div-backend-motor.service

# Logs
journalctl -u div-backend-motor.service -f


Compilar el front-end para que se vean cambios en pagina

cd div/frontend/S 

Iniciar el backend Motor manualmente para debug
/opt/BackendMotor# go run cmd/server/main.go 

