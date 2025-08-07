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
	err = DB.AutoMigrate(&models.Servidor{}, &models.Canal{}, &models.Parametro{}, &models.Tabla{}, &models.Proceso{}, &models.CanalProceso{}, &models.Configuracion{}, &models.TareaProgramada{}, &models.EjecucionTarea{})
	if err != nil {
		log.Fatal("Error al migrar las tablas: ", err)
	}

}
