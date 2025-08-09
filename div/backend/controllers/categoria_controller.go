package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"net/http"
)

// ListarCategorias obtiene todas las categorías activas, opcionalmente filtradas por ámbito
func ListarCategorias(w http.ResponseWriter, r *http.Request) {
	ambito := r.URL.Query().Get("ambito")
	
	var categorias []models.Categoria
	query := database.DB.Where("activo = ?", true)
	
	// Si se especifica un ámbito, filtrar por él
	if ambito != "" {
		query = query.Where("ambito = ?", ambito)
	}
	
	if err := query.Order("nombre").Find(&categorias).Error; err != nil {
		http.Error(w, "Error al listar categorías", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(categorias)
}

// CrearCategoria crea una nueva categoría
func CrearCategoria(w http.ResponseWriter, r *http.Request) {
	var nueva models.Categoria
	if err := json.NewDecoder(r.Body).Decode(&nueva); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	nueva.ID = uuid.New().String()
	nueva.Activo = true
	
	// Si no se especifica ámbito, usar "proceso" por defecto
	if nueva.Ambito == "" {
		nueva.Ambito = "proceso"
	}
	
	if err := database.DB.Create(&nueva).Error; err != nil {
		http.Error(w, "Error al crear categoría", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(nueva)
}

// ActualizarCategoria actualiza una categoría existente
func ActualizarCategoria(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var actualizada models.Categoria
	
	if err := json.NewDecoder(r.Body).Decode(&actualizada); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	var existente models.Categoria
	if err := database.DB.First(&existente, "id = ?", id).Error; err != nil {
		http.NotFound(w, r)
		return
	}

	// Preservar valores existentes y actualizar solo los campos enviados
	existente.Nombre = actualizada.Nombre
	existente.Color = actualizada.Color
	
	if err := database.DB.Save(&existente).Error; err != nil {
		http.Error(w, "Error al actualizar categoría", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(existente)
}

// EliminarCategoria desactiva una categoría
func EliminarCategoria(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	// Solo desactivamos, no eliminamos físicamente
	result := database.DB.Model(&models.Categoria{}).Where("id = ?", id).Update("activo", false)
	if result.Error != nil {
		http.Error(w, "Error al eliminar categoría", http.StatusInternalServerError)
		return
	}
	
	if result.RowsAffected == 0 {
		http.NotFound(w, r)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Categoría eliminada"})
}