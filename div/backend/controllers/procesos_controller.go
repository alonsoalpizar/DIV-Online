package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"github.com/gorilla/mux"
	"github.com/google/uuid"
)

// Obtener todos los procesos
func ListarProcesos(w http.ResponseWriter, r *http.Request) {
	var procesos []models.Proceso
	if err := database.DB.Find(&procesos).Error; err != nil {
		http.Error(w, "Error al listar procesos", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(procesos)
}

// Crear un nuevo proceso
func CrearProceso(w http.ResponseWriter, r *http.Request) {
	var nuevo models.Proceso
	if err := json.NewDecoder(r.Body).Decode(&nuevo); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validar código único
	var existente models.Proceso
	if err := database.DB.Where("codigo = ?", nuevo.Codigo).First(&existente).Error; err == nil {
		http.Error(w, "El código ya existe", http.StatusConflict)
		return
	}

	nuevo.ID = uuid.New().String()
	if err := database.DB.Create(&nuevo).Error; err != nil {
		http.Error(w, "Error al crear proceso", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(nuevo)
}

// Actualizar un proceso
func ActualizarProceso(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var actualizado models.Proceso
	if err := json.NewDecoder(r.Body).Decode(&actualizado); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	var existente models.Proceso
	if err := database.DB.First(&existente, "id = ?", id).Error; err != nil {
		http.NotFound(w, r)
		return
	}

	actualizado.ID = id
	if err := database.DB.Save(&actualizado).Error; err != nil {
		http.Error(w, "Error al actualizar", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(actualizado)
}

// Eliminar un proceso
func EliminarProceso(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if err := database.DB.Delete(&models.Proceso{}, "id = ?", id).Error; err != nil {
		http.Error(w, "Error al eliminar", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
