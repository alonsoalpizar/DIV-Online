package engine

import "backendmotor/internal/models"

type ContextoEjecucion struct {
	Valores    map[string]interface{}
	Servidores map[string]models.Servidor
}
