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

	// Métricas para subprocesos
	SubprocessTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "subprocess_executions_total",
			Help: "Total de ejecuciones de subprocesos",
		},
		[]string{"status"},
	)

	SubprocessErrors = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "subprocess_errors_total",
			Help: "Total de errores en ejecución de subprocesos",
		},
	)

	SubprocessDuration = prometheus.NewHistogram(
		prometheus.HistogramOpts{
			Name:    "subprocess_duration_seconds",
			Help:    "Duración de ejecución de subprocesos en segundos",
			Buckets: prometheus.DefBuckets,
		},
	)
)

func InitMetrics() {
	prometheus.MustRegister(HttpRequestsTotal)
	prometheus.MustRegister(ProcesoErroresTotal)
	prometheus.MustRegister(SubprocessTotal)
	prometheus.MustRegister(SubprocessErrors)
	prometheus.MustRegister(SubprocessDuration)
}
