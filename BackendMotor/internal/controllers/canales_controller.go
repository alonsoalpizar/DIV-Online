package controllers

import (
	"backendmotor/internal/config"
	"backendmotor/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /canales
func GetCanales(c *gin.Context) {
	rows, err := config.DB.Query(c, `SELECT id, codigo, nombre, tipo_publicacion, fecha_creacion, puerto, tipo_data, extras FROM canales`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar canales: " + err.Error()})
		return
	}
	defer rows.Close()

	var canales []models.Canal
	for rows.Next() {
		var canal models.Canal
		if err := rows.Scan(&canal.ID, &canal.Codigo, &canal.Nombre, &canal.TipoPublicacion, &canal.FechaCreacion, &canal.Puerto, &canal.TipoData, &canal.Extras); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al leer canal: " + err.Error()})
			return
		}
		canales = append(canales, canal)
	}

	c.JSON(http.StatusOK, canales)
}

// POST /canales
func CreateCanal(c *gin.Context) {
	var canal models.Canal
	if err := c.ShouldBindJSON(&canal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	if canal.ID == "" {
		canal.ID = uuid.New().String()
	}
	if canal.FechaCreacion.IsZero() {
		canal.FechaCreacion = time.Now()
	}

	_, err := config.DB.Exec(c, `
		INSERT INTO canales (id, codigo, nombre, tipo_publicacion, fecha_creacion, puerto, tipo_data, extras)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, canal.ID, canal.Codigo, canal.Nombre, canal.TipoPublicacion, canal.FechaCreacion, canal.Puerto, canal.TipoData, canal.Extras)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar canal: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, canal)
}

// PUT /canales/:id
func UpdateCanal(c *gin.Context) {
	id := c.Param("id")
	var canal models.Canal
	if err := c.ShouldBindJSON(&canal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	if canal.ID != id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El ID del JSON no coincide con el de la URL"})
		return
	}

	_, err := config.DB.Exec(c, `
		UPDATE canales SET codigo=$1, nombre=$2, tipo_publicacion=$3, puerto=$4, tipo_data=$5, extras=$6
		WHERE id=$7
	`, canal.Codigo, canal.Nombre, canal.TipoPublicacion, canal.Puerto, canal.TipoData, canal.Extras, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar canal: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, canal)
}

// DELETE /canales/:id
func DeleteCanal(c *gin.Context) {
	id := c.Param("id")

	_, err := config.DB.Exec(c, `DELETE FROM canales WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar canal: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
