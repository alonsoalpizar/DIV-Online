package routes

import (
	"backend/controllers"
	"net/http"

	"github.com/gorilla/mux"
)

func SetupRoutes() *mux.Router {
	router := mux.NewRouter()

	// Rutas de Servidores
	router.HandleFunc("/servidores", controllers.GetServidores).Methods("GET")
	router.HandleFunc("/servidores", controllers.CreateServidor).Methods("POST")
	router.HandleFunc("/servidores/{id}", controllers.UpdateServidor).Methods("PUT")
	router.HandleFunc("/servidores/{id}", controllers.DeleteServidor).Methods("DELETE")

	// Rutas de Canales
	router.HandleFunc("/canales", controllers.GetCanales).Methods("GET")
	router.HandleFunc("/canales", controllers.CreateCanal).Methods("POST")
	router.HandleFunc("/canales/{id}", controllers.UpdateCanal).Methods("PUT")
	router.HandleFunc("/canales/{id}", controllers.DeleteCanal).Methods("DELETE")

	// Rutas de Parámetros
	router.HandleFunc("/parametros", controllers.ListarParametros).Methods("GET")
	router.HandleFunc("/parametros", controllers.CrearParametro).Methods("POST")
	router.HandleFunc("/parametros/{id}", controllers.ActualizarParametro).Methods("PUT")
	router.HandleFunc("/parametros/{id}", controllers.EliminarParametro).Methods("DELETE")

	// Rutas de Tablas
	router.HandleFunc("/tablas", controllers.ListarTablas).Methods("GET")
	router.HandleFunc("/tablas", controllers.CrearTabla).Methods("POST")
	router.HandleFunc("/tablas/{id}", controllers.ActualizarTabla).Methods("PUT")
	router.HandleFunc("/tablas/{id}", controllers.EliminarTabla).Methods("DELETE")

	// Rutas de Procesos
	router.HandleFunc("/procesos", controllers.ListarProcesos).Methods("GET")
	router.HandleFunc("/procesos", controllers.CrearProceso).Methods("POST")
	router.HandleFunc("/procesos/{id}", controllers.ActualizarProceso).Methods("PUT")
	router.HandleFunc("/procesos/{id}", controllers.EliminarProceso).Methods("DELETE")

	// Rutas de Canal-Procesos
	router.HandleFunc("/canal-procesos/{canalId}", controllers.GetProcesosAsignados).Methods("GET")
	router.HandleFunc("/canal-procesos", controllers.AsignarProcesoACanal).Methods("POST")
	router.HandleFunc("/canal-procesos/{id}", controllers.EditarAsignacionProceso).Methods("PUT")
	router.HandleFunc("/canal-procesos/{id}", controllers.DesasignarProceso).Methods("DELETE")

	// Rutas de Búsqueda
	router.HandleFunc("/search", controllers.SearchGlobal).Methods("GET")
	router.HandleFunc("/search/type", controllers.SearchByType).Methods("GET")

	// Rutas de Consecutividad
	router.HandleFunc("/consecutivo/servidor", controllers.ObtenerProximoCodigoServidor).Methods("GET")
	router.HandleFunc("/consecutivo/proceso", controllers.ObtenerProximoCodigoProceso).Methods("GET")

	//Para hacer Ping desde el Frontend
	router.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","mensaje":"pong"}`))
	}).Methods("GET")

	//Ruta conectividad local configuracion
	router.HandleFunc("/configuracion", controllers.CreateConfiguracion).Methods("POST")
	router.HandleFunc("/configuracion", controllers.GetConfiguracion).Methods("GET")
	router.HandleFunc("/configuracion", controllers.UpdateConfiguracion).Methods("PUT")

	// Rutas de Tareas Programadas
	router.HandleFunc("/tareas-programadas", controllers.ListarTareasProgramadas).Methods("GET")
	router.HandleFunc("/tareas-programadas", controllers.CrearTareaProgramada).Methods("POST")
	router.HandleFunc("/tareas-programadas/{id}", controllers.ObtenerTareaProgramada).Methods("GET")
	router.HandleFunc("/tareas-programadas/{id}", controllers.ActualizarTareaProgramada).Methods("PUT")
	router.HandleFunc("/tareas-programadas/{id}", controllers.EliminarTareaProgramada).Methods("DELETE")
	router.HandleFunc("/tareas-programadas/{id}/ejecutar", controllers.EjecutarTareaManual).Methods("POST")
	router.HandleFunc("/tareas-programadas/{id}/ejecuciones", controllers.ObtenerEjecucionesTarea).Methods("GET")

	// Rutas de Cliente de Pruebas Interno
	router.HandleFunc("/test-cliente/ejecutar", controllers.EjecutarTest).Methods("POST")
	router.HandleFunc("/test-cliente/parametros", controllers.ObtenerParametrosProceso).Methods("POST")

	return router
}
