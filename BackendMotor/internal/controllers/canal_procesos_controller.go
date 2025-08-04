package controllers

import (
	"backendmotor/internal/config"
	"backendmotor/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /canal-procesos
func GetCanalProcesos(c *gin.Context) {
	rows, err := config.DB.Query(c, `
		SELECT id, canal_id, proceso_id, trigger, fecha_creacion
		FROM canal_procesos
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar canal_procesos: " + err.Error()})
		return
	}
	defer rows.Close()

	var asignaciones []models.CanalProceso
	for rows.Next() {
		var cp models.CanalProceso
		if err := rows.Scan(&cp.ID, &cp.CanalID, &cp.ProcesoID, &cp.Trigger, &cp.FechaCreacion); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al leer canal_proceso: " + err.Error()})
			return
		}
		asignaciones = append(asignaciones, cp)
	}

	c.JSON(http.StatusOK, asignaciones)
}

// POST /canal-procesos
func CreateCanalProceso(c *gin.Context) {
	var cp models.CanalProceso
	if err := c.ShouldBindJSON(&cp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	if cp.ID == "" {
		cp.ID = uuid.New().String()
	}
	if cp.FechaCreacion.IsZero() {
		cp.FechaCreacion = time.Now()
	}

	_, err := config.DB.Exec(c, `
		INSERT INTO canal_procesos (id, canal_id, proceso_id, trigger, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5)
	`, cp.ID, cp.CanalID, cp.ProcesoID, cp.Trigger, cp.FechaCreacion)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar canal_proceso: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, cp)
}

// DELETE /canal-procesos/:id
func DeleteCanalProceso(c *gin.Context) {
	id := c.Param("id")

	_, err := config.DB.Exec(c, `DELETE FROM canal_procesos WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar canal_proceso: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
