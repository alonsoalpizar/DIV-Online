package models

// TestRequest representa la petición para probar un proceso
type TestRequest struct {
	CanalCodigo string                 `json:"canalCodigo" binding:"required"`
	Trigger     string                 `json:"trigger" binding:"required"`
	Trama       map[string]interface{} `json:"trama" binding:"required"`
	ProcesoID   string                 `json:"procesoId,omitempty"`
}

// TestResponse representa la respuesta del test
type TestResponse struct {
	Exitoso   bool                   `json:"exitoso"`
	Mensaje   string                 `json:"mensaje"`
	Resultado map[string]interface{} `json:"resultado,omitempty"`
	Error     string                 `json:"error,omitempty"`
	Duracion  string                 `json:"duracion,omitempty"`
}
