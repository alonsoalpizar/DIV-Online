package controllers

import (
	"backendmotor/internal/config"
	"backendmotor/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GET /servidores
func GetServidores(c *gin.Context) {
	rows, err := config.DB.Query(c, `
		SELECT id, codigo, nombre, tipo, host, puerto, usuario, clave, fecha_creacion, extras 
		FROM servidores
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar servidores: " + err.Error()})
		return
	}
	defer rows.Close()

	var servidores []models.Servidor
	for rows.Next() {
		var s models.Servidor
		if err := rows.Scan(&s.ID, &s.Codigo, &s.Nombre, &s.Tipo, &s.Host, &s.Puerto, &s.Usuario, &s.Clave, &s.FechaCreacion, &s.Extras); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al leer servidor: " + err.Error()})
			return
		}
		servidores = append(servidores, s)
	}

	c.JSON(http.StatusOK, servidores)
}

// POST /servidores
func CreateServidor(c *gin.Context) {
	var servidor models.Servidor
	if err := c.ShouldBindJSON(&servidor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	if servidor.ID == "" {
		servidor.ID = uuid.New().String()
	}
	if servidor.FechaCreacion.IsZero() {
		servidor.FechaCreacion = time.Now()
	}

	_, err := config.DB.Exec(c, `
		INSERT INTO servidores (id, codigo, nombre, tipo, host, puerto, usuario, clave, fecha_creacion, extras)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, servidor.ID, servidor.Codigo, servidor.Nombre, servidor.Tipo, servidor.Host, servidor.Puerto,
		servidor.Usuario, servidor.Clave, servidor.FechaCreacion, servidor.Extras)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al guardar servidor: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, servidor)
}

// PUT /servidores/:id
func UpdateServidor(c *gin.Context) {
	id := c.Param("id")
	var servidor models.Servidor
	if err := c.ShouldBindJSON(&servidor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido: " + err.Error()})
		return
	}

	if servidor.ID != id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID del JSON no coincide con el de la URL"})
		return
	}

	_, err := config.DB.Exec(c, `
		UPDATE servidores 
		SET codigo=$1, nombre=$2, tipo=$3, host=$4, puerto=$5, usuario=$6, clave=$7, extras=$8
		WHERE id=$9
	`, servidor.Codigo, servidor.Nombre, servidor.Tipo, servidor.Host, servidor.Puerto,
		servidor.Usuario, servidor.Clave, servidor.Extras, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar servidor: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, servidor)
}

// DELETE /servidores/:id
func DeleteServidor(c *gin.Context) {
	id := c.Param("id")

	_, err := config.DB.Exec(c, `DELETE FROM servidores WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar servidor: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
