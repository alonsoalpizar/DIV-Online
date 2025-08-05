package database

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/joho/godotenv"

	"encoding/json"

	"backendmotor/internal/estructuras"
)

var DBGORM *gorm.DB

func InitDB() {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ No se pudo cargar el archivo .env, usando variables de entorno existentes.")
	}

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	sslmode := os.Getenv("DB_SSLMODE")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode,
	)

	DBGORM, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Error al conectar con la base de datos: %v", err)
	}

	log.Println("✅ Conexión con la base de datos exitosa.")
}

// ActualizarNodoEnFlujo actualiza un nodo en el flujo de un proceso sin alterar edges u otros nodos.
func ActualizarNodoEnFlujo(nodo estructuras.NodoGenerico) error {

	var flujoJSON estructuras.Flujo

	// 📦 1. Obtener proceso original
	procesoID := nodo.ProcesoID
	var registro struct {
		Flujo string
	}

	if err := DBGORM.Model(&registro).Table("procesos").Select("flujo").Where("id = ?", procesoID).First(&registro).Error; err != nil {
		return fmt.Errorf("error obteniendo flujo desde DB: %w", err)
	}

	// 📥 2. Parsear flujo JSON existente
	if err := json.Unmarshal([]byte(registro.Flujo), &flujoJSON); err != nil {
		return fmt.Errorf("error parseando flujo JSON: %w", err)
	}

	// 🔁 3. Buscar y reemplazar el nodo
	encontrado := false
	for i, n := range flujoJSON.Nodes {
		if n.ID == nodo.ID {
			flujoJSON.Nodes[i] = nodo
			encontrado = true
			break
		}
	}

	if !encontrado {
		return fmt.Errorf("nodo con ID %s no encontrado en el flujo", nodo.ID)
	}

	// 📤 4. Guardar el flujo actualizado
	nuevoJSON, err := json.Marshal(flujoJSON)
	if err != nil {
		return fmt.Errorf("error serializando flujo actualizado: %w", err)
	}

	if err := DBGORM.Table("procesos").Where("id = ?", procesoID).Update("flujo", string(nuevoJSON)).Error; err != nil {
		return fmt.Errorf("error actualizando flujo en DB: %w", err)
	}

	return nil
}
