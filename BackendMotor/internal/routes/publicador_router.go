// internal/routes/publicador_router.go
package routes

import (
	"backendmotor/internal/publicador"
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
)

// RegistrarRutasPublicacion agrega las rutas dinámicas de canal y publica los canales en memoria
func RegistrarRutasPublicacion(router *gin.Engine) {

	// Publicación en memoria de canales
	if err := publicador.PublicarCanales(context.Background()); err != nil {
		fmt.Println("❌ Error al publicar canales:", err)
	} else {
		fmt.Println("✅ Canales publicados en memoria correctamente.")
	}

	// Ruta dedicada a WSDL y WSDL Motor
	fmt.Println("🛰️  Registrando WSDL en /wsdl/:codigo")
	router.GET("/wsdl/:codigo", publicador.WSDLHandler)

	fmt.Println("🛰️  Registrando WSDL Motor en /wsdl_motor/:codigo")
	router.GET("/wsdl_motor/:codigo", publicador.WSDLHandler)

	// Handlers clásicos (canal)
	fmt.Println("🌐 Registrando handler CANAL en /canal/:codigo/*rest")
	router.GET("/canal/:codigo/*rest", publicador.GinCanalHandler)
	router.POST("/canal/:codigo/*rest", publicador.GinCanalHandler)

	// Handlers del motor nuevo
	fmt.Println("🚀 Registrando handler MOTOR en /motor/:codigo/*rest")
	router.GET("/motor/:codigo/*rest", publicador.GinMotorHandler)
	router.POST("/motor/:codigo/*rest", publicador.GinMotorHandler)
}
