package ejecucion

// ResultadoEjecucion representa la salida final de la ejecución del flujo
type ResultadoEjecucion struct {
	Estado    int                    `json:"estado"`
	Mensaje   string                 `json:"mensaje"`
	Datos     map[string]interface{} `json:"data,omitempty"`
	ProcesoID string                 `json:"procesoId"`
	Trigger   string                 `json:"trigger"`
}

// NodoGenerico es la representación base de un nodo en el flujo visual
type NodoGenerico struct {
	ID   string                 `json:"id"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}
