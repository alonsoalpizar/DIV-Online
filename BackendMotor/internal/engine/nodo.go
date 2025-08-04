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
	Nombre string
	Tipo   string
}
