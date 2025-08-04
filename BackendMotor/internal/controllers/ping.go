package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// PingHandler responde con un mensaje simple para verificar si el motor está vivo.
func PingHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"mensaje": "pong 🟢 Backend Motor operativo",
	})
}
