package ejecucion

import (
	"backendmotor/internal/database"
	"backendmotor/internal/models"
)

func ObtenerProcesoDesdeBD(procesoID string) (*models.Proceso, error) {
	var proceso models.Proceso
	if err := database.DBGORM.First(&proceso, "id = ?", procesoID).Error; err != nil {
		return nil, err
	}
	return &proceso, nil
}
