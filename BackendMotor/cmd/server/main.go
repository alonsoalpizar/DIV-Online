package main

import (
	"fmt"
	"log"

	"backendmotor/internal/config"   // pgxpool
	"backendmotor/internal/database" // GORM
	"backendmotor/internal/monitoring"
	"backendmotor/internal/routes"
	"backendmotor/pkg/logging"
)

func main() {
	logging.InitLogger()
	monitoring.InitMetrics()

	// Conexión a PostgreSQL con pgxpool (para ejecución directa)
	if err := config.InitDB(); err != nil {
		log.Fatalf("❌ Error al conectar a DB (pgxpool): %v", err)
	}
	defer config.DB.Close()
	log.Println("✅ pgxpool listo (config.DB)")

	// Conexión con GORM (para modelos de alto nivel)
	database.InitDB()
	log.Println("✅ GORM listo (database.DB)")

	// Iniciar router Principales
	router := routes.SetupRouter()

	port := ":50000"
	fmt.Println("🚀 Backend Motor iniciado en http://localhost" + port)
	if err := router.Run(port); err != nil {
		log.Fatalf("❌ Error al iniciar servidor: %v", err)
	}
}
