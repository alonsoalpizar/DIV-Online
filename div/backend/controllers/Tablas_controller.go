package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// Listar todas las tablas desde la base de datos
func ListarTablas(w http.ResponseWriter, r *http.Request) {
	var tablas []models.Tabla

	if err := database.DB.Find(&tablas).Error; err != nil {
		http.Error(w, "Error al obtener tablas: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tablas)
}

// Crear una nueva tabla
func CrearTabla(w http.ResponseWriter, r *http.Request) {
	var nueva models.Tabla

	if err := json.NewDecoder(r.Body).Decode(&nueva); err != nil {
		http.Error(w, "JSON inválido: "+err.Error(), http.StatusBadRequest)
		return
	}

	nueva.ID = uuid.New().String()
	nueva.FechaCreacion = time.Now()

	if err := database.DB.Create(&nueva).Error; err != nil {
		http.Error(w, "Error al guardar en la base de datos: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nueva)
}

// Actualizar una tabla existente
func ActualizarTabla(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var actualizada models.Tabla

	if err := json.NewDecoder(r.Body).Decode(&actualizada); err != nil {
		http.Error(w, "JSON inválido: "+err.Error(), http.StatusBadRequest)
		return
	}

	actualizada.ID = id

	if err := database.DB.Model(&models.Tabla{}).Where("id = ?", id).Updates(actualizada).Error; err != nil {
		http.Error(w, "Error al actualizar tabla: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(actualizada)
}

// Eliminar una tabla
func EliminarTabla(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	if err := database.DB.Delete(&models.Tabla{}, "id = ?", id).Error; err != nil {
		http.Error(w, "Error al eliminar tabla: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
