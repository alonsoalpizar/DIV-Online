package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"github.com/gorilla/mux"
	"github.com/google/uuid"
)

// GET /canal-procesos/{canalId}
func GetProcesosAsignados(w http.ResponseWriter, r *http.Request) {
	canalId := mux.Vars(r)["canalId"]
	var asignaciones []models.CanalProceso

	err := database.DB.Preload("Proceso").Where("canal_id = ?", canalId).Find(&asignaciones).Error
	if err != nil {
		http.Error(w, "Error al obtener asignaciones", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(asignaciones)
}

// POST /canal-procesos
func AsignarProcesoACanal(w http.ResponseWriter, r *http.Request) {
	var cp models.CanalProceso
	if err := json.NewDecoder(r.Body).Decode(&cp); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	cp.ID = uuid.New().String()

	if err := database.DB.Create(&cp).Error; err != nil {
		http.Error(w, "Error al asignar proceso", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cp)
}

// PUT /canal-procesos/{id}
func EditarAsignacionProceso(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var input struct {
		Trigger string `json:"trigger"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if err := database.DB.Model(&models.CanalProceso{}).Where("id = ?", id).Update("trigger", input.Trigger).Error; err != nil {
		http.Error(w, "Error al actualizar trigger", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// DELETE /canal-procesos/{id}
func DesasignarProceso(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	if err := database.DB.Delete(&models.CanalProceso{}, "id = ?", id).Error; err != nil {
		http.Error(w, "Error al desasignar proceso", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
