package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Crear una nueva configuración del sistema
func CreateConfiguracion(w http.ResponseWriter, r *http.Request) {
	var config models.Configuracion

	err := json.NewDecoder(r.Body).Decode(&config)
	if err != nil {
		http.Error(w, "Error al decodificar JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if config.ID == "" {
		config.ID = uuid.New().String()
	}
	if config.FechaCreacion.IsZero() {
		config.FechaCreacion = time.Now()
	}

	result := database.DB.Create(&config)
	if result.Error != nil {
		http.Error(w, "Error al guardar en la base de datos: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

// Obtener la última configuración guardada
func GetConfiguracion(w http.ResponseWriter, r *http.Request) {
	var config models.Configuracion

	// Orden descendente por fecha, tomamos la última
	result := database.DB.Order("fecha_creacion desc").First(&config)
	if result.Error != nil {
		http.Error(w, "No se pudo obtener configuración: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

// Actualizar (sobrescribir) la configuración del sistema
func UpdateConfiguracion(w http.ResponseWriter, r *http.Request) {
	var nueva models.Configuracion

	// Leer JSON recibido
	err := json.NewDecoder(r.Body).Decode(&nueva)
	if err != nil {
		http.Error(w, "Error al decodificar JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Eliminar todas las configuraciones anteriores
	if err := database.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.Configuracion{}).Error; err != nil {
		http.Error(w, "Error al eliminar configuraciones: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Insertar la nueva configuración
	nueva.ID = uuid.New().String()
	nueva.FechaCreacion = time.Now()

	if err := database.DB.Create(&nueva).Error; err != nil {
		http.Error(w, "Error al guardar nueva configuración: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("✅ Configuración sobrescrita correctamente."))
}
