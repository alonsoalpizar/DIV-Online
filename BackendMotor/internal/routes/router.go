package routes

import (
	"backendmotor/internal/controllers"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// SetupRouter crea el router con todas las rutas disponibles.
func SetupRouter() *gin.Engine {
	router := gin.Default()

	// Rutas base
	router.GET("/ping", controllers.PingHandler)

	// Rutas de procesos
	//router.GET("/procesos", controllers.ObtenerProcesos)

	// Rutas de canales
	router.GET("/canales", controllers.GetCanales)
	router.POST("/canales", controllers.CreateCanal)
	router.PUT("/canales/:id", controllers.UpdateCanal)
	router.DELETE("/canales/:id", controllers.DeleteCanal)

	// Rutas de servidores
	router.GET("/servidores", controllers.GetServidores)
	router.POST("/servidores", controllers.CreateServidor)
	router.PUT("/servidores/:id", controllers.UpdateServidor)
	router.DELETE("/servidores/:id", controllers.DeleteServidor)

	// Rutas de procesos
	router.GET("/procesos", controllers.GetProcesos)
	router.POST("/procesos", controllers.CreateProceso)
	router.PUT("/procesos/:id", controllers.UpdateProceso)
	router.DELETE("/procesos/:id", controllers.DeleteProceso)
	
	// Ejecución de procesos
	router.POST("/ejecutar-proceso", controllers.EjecutarProceso)

	// Rutas de canal_procesos
	router.GET("/canal-procesos", controllers.GetCanalProcesos)
	router.POST("/canal-procesos", controllers.CreateCanalProceso)
	router.DELETE("/canal-procesos/:id", controllers.DeleteCanalProceso)

	// Endpoint para Prometheus
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	RegistrarRutasPublicacion(router)

	return router
}
