export const extrasPorTipoServidor: Record<string, Record<string, string>> = {
  // Bases de Datos Relacionales
  "SQL Server": {
    conexionPorTransaccion: "false",
    instancias: "50",
    timeout: "3000",
    ssl: "false",
    encriptacion: "ninguna"
  },
  "Oracle": {
    conexionPorTransaccion: "false",
    instancias: "30",
    timeout: "4000",
    sid: "XE",
    servicio: "orcl"
  },
  "MySQL": {
    conexionPorTransaccion: "true",
    instancias: "20",
    timeout: "2000",
    ssl: "opcional"
  },
  "PostgreSQL": {
    conexionPorTransaccion: "true",
    instancias: "25",
    timeout: "2500",
    schema: "public",
    sslmode: "prefer"
  },

  // Bases de Datos NoSQL
  "MongoDB": {
    replicaSet: "rs0",
    ssl: "true",
    timeout: "3000"
  },
  "Redis": {
    cluster: "false",
    timeout: "1000"
  },

  // Bases de Datos Analíticas
  "Snowflake": {
    region: "us-west-2",
    warehouse: "COMPUTE_WH",
    role: "SYSADMIN",
    timeout: "5000"
  },
  "BigQuery": {
    proyecto: "mi-proyecto",
    dataset: "datos",
    modoAutenticacion: "service-account",
    timeout: "5000"
  },

  // APIs y Servicios
  "REST": {
    urlBase: "https://api.miempresa.com",
    authTipo: "APIKey",
    apiKey: "",
    timeout: "5000"
  },
  "SOAP": {
    namespace: "http://miws.com",
    soapAction: "accion",
    version: "1.1",
    timeout: "5000"
  },

  // Servicios en Tiempo Real
  "Kafka": {
    topic: "procesos",
    particiones: "3",
    reintentos: "2",
    timeout: "3000"
  },
  "RabbitMQ": {
    exchange: "canal.principal",
    routingKey: "flujo",
    virtualHost: "/",
    ssl: "false"
  },

  // Servicios Híbridos
  "Firebase": {
    token: "",
    baseURL: "https://miapp.firebaseio.com",
    timeout: "4000"
  },
  "Supabase": {
    url: "https://xyz.supabase.co",
    apiKey: "",
    schema: "public",
    timeout: "4000"
  },

  // Conexiones por Socket
  "Socket TCP": {
    modo: "cliente",
    reintentos: "3",
    esperaEntreIntentos: "1000",
    codificacion: "utf-8"
  }
};
