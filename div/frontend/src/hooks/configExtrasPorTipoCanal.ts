export const extrasPorTipoCanal: Record<string, Record<string, string>> = {
  "REST": {
    path: "/api/proceso",
    metodo: "POST",
    authTipo: "APIKey",
    workers: "20",
    timeout: "5000"
  },
  "SOAP": {
    path: "/ws/ejecucion",
    namespace: "http://miws.com",
    soapAction: "procesar",
    version: "1.1",
    workers: "10",
    timeout: "5000"
  },
  "SIMPLE": {
    subTipo: "SOCKET",
    puertoInterno: "40000",
    workers: "5",
    trigger: "evento-interno",
    tipoData: "JSON"
  }
};
