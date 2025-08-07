package engine

type NodoProceso struct {
	ID                string
	ServidorID        string
	Objeto            string
	TipoObjeto        string
	ParametrosEntrada []Parametro
	ParametrosSalida  []Parametro
}

type Parametro struct {
	Nombre          string                 `json:"nombre"`
	Tipo            string                 `json:"tipo"`
	EnviarAServidor *bool                  `json:"enviarAServidor,omitempty"` // Puntero para manejar valor null (retrocompatibilidad)
	Orden           *int                   `json:"orden,omitempty"`
	Subcampos       []Parametro            `json:"subcampos,omitempty"`
}
