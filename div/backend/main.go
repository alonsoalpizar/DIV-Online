package main

import (
	"backend/database"
	"backend/routes"
	"log"
	"net/http"
)

// Middleware CORS
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Permitir acceso desde el frontend
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:5173" || origin == "http://173.249.49.235" || origin == "https://173.249.49.235" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// Permitir acceso desde el mismo servidor (sin Origin header)
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		// w.Header().Set("Access-Control-Allow-Origin", "http://173.249.49.235")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// Manejo de preflight
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// Conectar a la base de datos
	database.Connect()

	// Configurar rutas con Gorilla Mux
	router := routes.SetupRoutes()

	// Aplicar middleware CORS
	handlerConCORS := corsMiddleware(router)

	// Iniciar servidor
	log.Println("🚀 Servidor iniciado en http://173.249.49.235:30000")
	err := http.ListenAndServe(":30000", handlerConCORS)
	if err != nil {
		log.Fatalf("❌ Error al iniciar el servidor: %v", err)
	}
}
