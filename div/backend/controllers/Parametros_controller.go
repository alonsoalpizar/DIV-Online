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

// Listar todos los parámetros desde la base de datos
func ListarParametros(w http.ResponseWriter, r *http.Request) {
	var parametros []models.Parametro

	if err := database.DB.Find(&parametros).Error; err != nil {
		http.Error(w, "Error al obtener parámetros: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(parametros)
}

// Crear un nuevo parámetro
func CrearParametro(w http.ResponseWriter, r *http.Request) {
	var nuevo models.Parametro

	if err := json.NewDecoder(r.Body).Decode(&nuevo); err != nil {
		http.Error(w, "JSON inválido: "+err.Error(), http.StatusBadRequest)
		return
	}

	nuevo.ID = uuid.New().String()
	nuevo.FechaCreacion = time.Now()

	if err := database.DB.Create(&nuevo).Error; err != nil {
		http.Error(w, "Error al guardar en la base de datos: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nuevo)
}

// Actualizar un parámetro existente
func ActualizarParametro(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var actualizado models.Parametro

	if err := json.NewDecoder(r.Body).Decode(&actualizado); err != nil {
		http.Error(w, "JSON inválido: "+err.Error(), http.StatusBadRequest)
		return
	}

	actualizado.ID = id

	if err := database.DB.Model(&models.Parametro{}).Where("id = ?", id).Updates(actualizado).Error; err != nil {
		http.Error(w, "Error al actualizar parámetro: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(actualizado)
}

// Eliminar un parámetro
func EliminarParametro(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	if err := database.DB.Delete(&models.Parametro{}, "id = ?", id).Error; err != nil {
		http.Error(w, "Error al eliminar parámetro: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
