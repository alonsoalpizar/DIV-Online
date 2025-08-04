package ejecucion

type Flujo struct {
	ID     string `json:"id"`
	Nombre string `json:"nombre"`
	Nodes  []Nodo `json:"nodes"`
	Edges  []Edge `json:"edges"`
}

type Nodo struct {
	ID   string                 `json:"id"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

type Edge struct {
	ID     string                 `json:"id"`
	Source string                 `json:"source"`
	Target string                 `json:"target"`
	Type   string                 `json:"type"`
	Data   map[string]interface{} `json:"data"`
}

func (f Flujo) ObtenerNodoPorTipo(tipo string) Nodo {
	for _, nodo := range f.Nodes {
		if nodo.Type == tipo {
			return nodo
		}
	}
	return Nodo{}
}
