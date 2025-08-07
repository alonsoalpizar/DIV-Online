package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"net/http"
	"time"
)

// Obtener todos los servidores
func GetServidores(w http.ResponseWriter, r *http.Request) {
	var servidores []models.Servidor

	result := database.DB.Find(&servidores)
	if result.Error != nil {
		http.Error(w, "Error al obtener los servidores: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(servidores)
}

// Crear nuevo servidor
func CreateServidor(w http.ResponseWriter, r *http.Request) {
	var servidor models.Servidor

	if err := json.NewDecoder(r.Body).Decode(&servidor); err != nil {
		http.Error(w, "Error al decodificar el JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if servidor.ID == "" {
		servidor.ID = uuid.New().String()
	}

	if servidor.FechaCreacion.IsZero() {
		servidor.FechaCreacion = time.Now()
	}

	if result := database.DB.Create(&servidor); result.Error != nil {
		http.Error(w, "Error al crear el servidor: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(servidor)
}

// Actualizar servidor existente
func UpdateServidor(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var servidor models.Servidor
	if err := json.NewDecoder(r.Body).Decode(&servidor); err != nil {
		http.Error(w, "Error al decodificar el JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	servidor.ID = id

	result := database.DB.Model(&models.Servidor{}).Where("id = ?", id).Updates(servidor)
	if result.Error != nil {
		http.Error(w, "Error al actualizar el servidor: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(servidor)
}

// Eliminar servidor
func DeleteServidor(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	var servidor models.Servidor
	result := database.DB.First(&servidor, "id = ?", id)

	if result.Error != nil {
		http.Error(w, "Servidor no encontrado", http.StatusNotFound)
		return
	}

	if err := database.DB.Delete(&servidor).Error; err != nil {
		http.Error(w, "Error al eliminar el servidor: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
