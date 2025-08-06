package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"strings"
)

// SearchResult representa un resultado de búsqueda
type SearchResult struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// SearchResponse respuesta del endpoint de búsqueda
type SearchResponse struct {
	Results []SearchResult `json:"results"`
	Count   int            `json:"count"`
}

// SearchGlobal busca en todos los tipos de entidades
func SearchGlobal(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Obtener parámetro de búsqueda
	query := r.URL.Query().Get("q")
	if query == "" || len(query) < 2 {
		json.NewEncoder(w).Encode(SearchResponse{Results: []SearchResult{}, Count: 0})
		return
	}

	var allResults []SearchResult
	query = strings.ToLower(query)

	// Buscar en Servidores
	var servidores []models.Servidor
	database.DB.Where("LOWER(nombre) LIKE ? OR LOWER(tipo) LIKE ?", "%"+query+"%", "%"+query+"%").Find(&servidores)
	
	for _, servidor := range servidores {
		allResults = append(allResults, SearchResult{
			ID:          servidor.ID,
			Type:        "servidor",
			Name:        servidor.Nombre,
			Description: servidor.Tipo + " - " + servidor.Host,
		})
	}

	// Buscar en Canales
	var canales []models.Canal
	database.DB.Where("LOWER(nombre) LIKE ? OR LOWER(codigo) LIKE ?", "%"+query+"%", "%"+query+"%").Find(&canales)
	
	for _, canal := range canales {
		allResults = append(allResults, SearchResult{
			ID:          canal.ID,
			Type:        "canal",
			Name:        canal.Nombre,
			Description: "Código: " + canal.Codigo + " - Tipo: " + canal.TipoPublicacion,
		})
	}

	// Buscar en Procesos
	var procesos []models.Proceso
	database.DB.Where("LOWER(nombre) LIKE ? OR LOWER(descripcion) LIKE ?", "%"+query+"%", "%"+query+"%").Find(&procesos)
	
	for _, proceso := range procesos {
		description := proceso.Descripcion
		if description == "" {
			description = "Proceso de integración"
		}
		allResults = append(allResults, SearchResult{
			ID:          proceso.ID,
			Type:        "proceso",
			Name:        proceso.Nombre,
			Description: description,
		})
	}

	// Buscar en Parámetros
	var parametros []models.Parametro
	database.DB.Where("LOWER(nombre) LIKE ? OR LOWER(descripcion) LIKE ?", "%"+query+"%", "%"+query+"%").Find(&parametros)
	
	for _, parametro := range parametros {
		allResults = append(allResults, SearchResult{
			ID:          parametro.ID,
			Type:        "parametro",
			Name:        parametro.Nombre,
			Description: parametro.Descripcion + " - Valor: " + parametro.Valor,
		})
	}

	// Buscar en Tareas Programadas
	var tareas []models.TareaProgramada
	database.DB.Where("LOWER(nombre) LIKE ? OR LOWER(descripcion) LIKE ?", "%"+query+"%", "%"+query+"%").Find(&tareas)
	
	for _, tarea := range tareas {
		status := "Inactivo"
		if tarea.Activo {
			status = "Activo"
		}
		allResults = append(allResults, SearchResult{
			ID:          tarea.ID,
			Type:        "tarea",
			Name:        tarea.Nombre,
			Description: tarea.Descripcion + " - " + status,
		})
	}

	// Limitar resultados (máximo 10)
	if len(allResults) > 10 {
		allResults = allResults[:10]
	}

	response := SearchResponse{
		Results: allResults,
		Count:   len(allResults),
	}

	json.NewEncoder(w).Encode(response)
}

// SearchByType busca por tipo específico
func SearchByType(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Obtener parámetros
	query := r.URL.Query().Get("q")
	searchType := r.URL.Query().Get("type")
	
	if query == "" || len(query) < 2 {
		json.NewEncoder(w).Encode(SearchResponse{Results: []SearchResult{}, Count: 0})
		return
	}

	var results []SearchResult
	query = strings.ToLower(query)

	switch searchType {
	case "servidor":
		var servidores []models.Servidor
		database.DB.Where("LOWER(nombre) LIKE ? OR LOWER(tipo) LIKE ?", "%"+query+"%", "%"+query+"%").Find(&servidores)
		
		for _, servidor := range servidores {
			results = append(results, SearchResult{
				ID:          servidor.ID,
				Type:        "servidor",
				Name:        servidor.Nombre,
				Description: servidor.Tipo + " - " + servidor.Host,
			})
		}

	case "canal":
		var canales []models.Canal
		database.DB.Where("LOWER(nombre) LIKE ? OR LOWER(codigo) LIKE ?", "%"+query+"%", "%"+query+"%").Find(&canales)
		
		for _, canal := range canales {
			results = append(results, SearchResult{
				ID:          canal.ID,
				Type:        "canal",
				Name:        canal.Nombre,
				Description: "Código: " + canal.Codigo + " - Tipo: " + canal.TipoPublicacion,
			})
		}

	case "proceso":
		var procesos []models.Proceso
		database.DB.Where("LOWER(nombre) LIKE ? OR LOWER(descripcion) LIKE ?", "%"+query+"%", "%"+query+"%").Find(&procesos)
		
		for _, proceso := range procesos {
			description := proceso.Descripcion
			if description == "" {
				description = "Proceso de integración"
			}
			results = append(results, SearchResult{
				ID:          proceso.ID,
				Type:        "proceso",
				Name:        proceso.Nombre,
				Description: description,
			})
		}
	}

	response := SearchResponse{
		Results: results,
		Count:   len(results),
	}

	json.NewEncoder(w).Encode(response)
}