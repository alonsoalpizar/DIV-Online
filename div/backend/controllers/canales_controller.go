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

// Obtener todos los canales
func GetCanales(w http.ResponseWriter, r *http.Request) {
	var canales []models.Canal

	result := database.DB.Find(&canales)
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(canales)
}

// Crear un nuevo canal
func CreateCanal(w http.ResponseWriter, r *http.Request) {
	var canal models.Canal

	err := json.NewDecoder(r.Body).Decode(&canal)
	if err != nil {
		http.Error(w, "Error al decodificar el JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if canal.Codigo == "" {
		http.Error(w, "El campo 'codigo' es obligatorio", http.StatusBadRequest)
		return
	}

	if canal.ID == "" {
		canal.ID = uuid.New().String()
	}

	if canal.FechaCreacion.IsZero() {
		canal.FechaCreacion = time.Now()
	}

	result := database.DB.Create(&canal)
	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(canal)
}

// Actualizar un canal
func UpdateCanal(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var canal models.Canal
	if err := json.NewDecoder(r.Body).Decode(&canal); err != nil {
		http.Error(w, "Error al decodificar el JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if canal.ID != id {
		http.Error(w, "El ID del canal no coincide con el de la URL", http.StatusBadRequest)
		return
	}

	result := database.DB.Model(&models.Canal{}).Where("id = ?", id).Updates(canal)
	if result.Error != nil {
		http.Error(w, "Error al actualizar el canal: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(canal)
}

// Eliminar un canal
func DeleteCanal(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	result := database.DB.Delete(&models.Canal{}, "id = ?", id)
	if result.Error != nil {
		http.Error(w, "Error al eliminar el canal: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
