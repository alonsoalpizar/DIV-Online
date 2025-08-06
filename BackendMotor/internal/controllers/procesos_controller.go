package controllers

import (
	"backendmotor/internal/config"
	"backendmotor/internal/models"
	"backendmotor/internal/ejecucion"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /procesos
func GetProcesos(c *gin.Context) {
	rows, err := config.DB.Query(c, `
		SELECT id, codigo, nombre, descripcion, flujo
		FROM procesos
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar procesos: " + err.Error()})
		return
	}
	defer rows.Close()

	var procesos []models.Proceso
	for rows.Next() {
		var p models.Proceso
		if err := rows.Scan(&p.ID, &p.Codigo, &p.Nombre, &p.Descripcion, &p.Flujo); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al leer proceso: " + err.Error()})
			return
		}
		procesos = append(procesos, p)
	}

	c.JSON(http.StatusOK, procesos)
}

// POST /procesos
func CreateProceso(c *gin.Context) {
	var proceso models.Proceso
	if err := c.ShouldBindJSON(&proceso); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	if proceso.ID == "" {
		proceso.ID = uuid.New().String()
	}

	_, err := config.DB.Exec(c, `
		INSERT INTO procesos (id, codigo, nombre, descripcion, flujo)
		VALUES ($1, $2, $3, $4, $5)
	`, proceso.ID, proceso.Codigo, proceso.Nombre, proceso.Descripcion, proceso.Flujo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar proceso: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, proceso)
}

// PUT /procesos/:id
func UpdateProceso(c *gin.Context) {
	id := c.Param("id")
	var proceso models.Proceso
	if err := c.ShouldBindJSON(&proceso); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	if proceso.ID != id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID del JSON no coincide con el de la URL"})
		return
	}

	_, err := config.DB.Exec(c, `
		UPDATE procesos 
		SET codigo=$1, nombre=$2, descripcion=$3, flujo=$4
		WHERE id=$5
	`, proceso.Codigo, proceso.Nombre, proceso.Descripcion, proceso.Flujo, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar proceso: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, proceso)
}

// DELETE /procesos/:id
func DeleteProceso(c *gin.Context) {
	id := c.Param("id")

	_, err := config.DB.Exec(c, `DELETE FROM procesos WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar proceso: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// POST /ejecutar-proceso
func EjecutarProceso(c *gin.Context) {
	var request struct {
		ProcesoID  string                 `json:"procesoId" binding:"required"`
		Parametros map[string]interface{} `json:"parametros"`
		Canal      string                 `json:"canal"`
		Trigger    string                 `json:"trigger"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	// Usar canal por defecto si no se especifica
	if request.Canal == "" {
		request.Canal = "API"
	}
	
	// Usar trigger por defecto si no se especifica
	if request.Trigger == "" {
		request.Trigger = "api"
	}

	// Ejecutar el proceso usando el motor
	resultado, err := ejecucion.EjecutarFlujo(request.ProcesoID, request.Parametros, request.Canal, request.Trigger)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Error ejecutando proceso: " + err.Error(),
			"procesoId": request.ProcesoID,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"mensaje": "Proceso ejecutado exitosamente",
		"procesoId": request.ProcesoID,
		"resultado": resultado,
	})
}
