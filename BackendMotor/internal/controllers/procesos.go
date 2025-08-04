package controllers

import (
	"backendmotor/internal/config"
	"backendmotor/internal/models"
	"net/http"

	"backendmotor/internal/monitoring"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func ObtenerProcesos(c *gin.Context) {
	log.Info().Str("origen", c.Request.RemoteAddr).Msg("📥 Solicitud recibida: GET /procesos")

	// ⬇️ Contador de solicitudes al endpoint
	monitoring.HttpRequestsTotal.WithLabelValues("/procesos", "GET").Inc()

	rows, err := config.DB.Query(c, `SELECT id, codigo, nombre, descripcion, flujo FROM procesos ORDER BY nombre`)
	if err != nil {
		// ⬇️ Contador de errores al consultar procesos
		monitoring.ProcesoErroresTotal.Inc()

		log.Error().Err(err).Msg("❌ Error al consultar procesos")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar procesos", "detalle": err.Error()})
		return
	}
	defer rows.Close()

	var procesos []models.Proceso
	for rows.Next() {
		var p models.Proceso
		if err := rows.Scan(&p.ID, &p.Codigo, &p.Nombre, &p.Descripcion, &p.Flujo); err != nil {
			// ⬇️ Otro punto de posible error
			monitoring.ProcesoErroresTotal.Inc()

			log.Error().Err(err).Msg("❌ Error leyendo resultados de procesos")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo resultados", "detalle": err.Error()})
			return
		}
		procesos = append(procesos, p)
	}

	log.Info().Int("cantidad", len(procesos)).Msg("✅ Procesos recuperados correctamente")
	c.JSON(http.StatusOK, procesos)
}
