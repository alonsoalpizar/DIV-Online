package monitoring

import (
	"github.com/prometheus/client_golang/prometheus"
)

var (
	// Contador general de solicitudes HTTP por endpoint y método
	HttpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Número total de solicitudes HTTP",
		},
		[]string{"path", "method"},
	)

	// Contador de errores al consultar procesos
	ProcesoErroresTotal = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "proceso_errores_total",
			Help: "Errores ocurridos al recuperar procesos desde la base de datos",
		},
	)
)

func InitMetrics() {
	prometheus.MustRegister(HttpRequestsTotal)
	prometheus.MustRegister(ProcesoErroresTotal)
}
