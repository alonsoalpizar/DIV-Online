package database

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"backend/config"
	"backend/models"
)

var DB *gorm.DB

func Connect() {
	config.LoadEnv()

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		config.GetEnv("DB_HOST"),
		config.GetEnv("DB_USER"),
		config.GetEnv("DB_PASSWORD"),
		config.GetEnv("DB_NAME"),
		config.GetEnv("DB_PORT"),
		config.GetEnv("DB_SSLMODE"),
	)

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Error al conectar a la base de datos: ", err)
	}

	DB = database

	// Migraciones automáticas
	err = DB.AutoMigrate(
		&models.Servidor{}, 
		&models.Canal{}, 
		&models.Parametro{}, 
		&models.Tabla{}, 
		&models.Categoria{},  // Nueva tabla de categorías
		&models.Proceso{}, 
		&models.CanalProceso{}, 
		&models.Configuracion{}, 
		&models.TareaProgramada{}, 
		&models.EjecucionTarea{},
	)
	if err != nil {
		log.Fatal("Error al migrar las tablas: ", err)
	}
	
	// Inicializar categorías por defecto si no existen
	inicializarCategorias()

}

func inicializarCategorias() {
	var count int64
	DB.Model(&models.Categoria{}).Count(&count)
	
	// Solo inicializar si no hay categorías
	if count == 0 {
		categoriasPorDefecto := []models.Categoria{
			{Nombre: "Integración", Color: "#3B82F6", Activo: true},
			{Nombre: "ETL", Color: "#10B981", Activo: true},
			{Nombre: "Reportes", Color: "#F59E0B", Activo: true},
			{Nombre: "Automatización", Color: "#8B5CF6", Activo: true},
			{Nombre: "Migración", Color: "#EF4444", Activo: true},
			{Nombre: "Validación", Color: "#06B6D4", Activo: true},
		}
		
		for _, categoria := range categoriasPorDefecto {
			if err := DB.Create(&categoria).Error; err != nil {
				log.Printf("Error creando categoría %s: %v", categoria.Nombre, err)
			}
		}
		
		log.Println("✅ Categorías por defecto inicializadas")
	}
}
