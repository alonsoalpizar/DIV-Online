export const extrasPorTipoServidor: Record<string, Record<string, string>> = {
  // Bases de Datos Relacionales
  "SQLServer": {
    // Campos fijos para todos los servidores
    instancias: "50",
    timeout: "30000",
    conexionPorTransaccion: "false",
    // Específicos de SQL Server
    ssl: "false",
    encriptacion: "ninguna",
    trustServerCertificate: "false",
    applicationName: "DIV_Integration",
    connectionString: "",
    maxConnections: "100",
    minConnections: "5",
    charset: "utf8",
    autocommit: "true",
    isolationLevel: "READ_COMMITTED"
  },
  "Oracle": {
    // Campos fijos para todos los servidores
    instancias: "30",
    timeout: "45000",
    conexionPorTransaccion: "false",
    // Específicos de Oracle
    sid: "XE",
    servicio: "orcl",
    ssl: "false",
    charset: "AL32UTF8",
    connectionString: "",
    maxConnections: "80",
    minConnections: "3",
    autocommit: "false",
    fetchSize: "1000",
    sessionTimeZone: "America/Bogota"
  },
  "MySQL": {
    // Campos fijos para todos los servidores
    instancias: "25",
    timeout: "20000",
    conexionPorTransaccion: "true",
    // Específicos de MySQL
    ssl: "opcional",
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    autocommit: "true",
    maxConnections: "60",
    minConnections: "2",
    useUnicode: "true",
    allowMultiQueries: "false",
    timezone: "America/Bogota"
  },
  "PostgreSQL": {
    // Campos fijos para todos los servidores
    instancias: "25",
    timeout: "25000",
    conexionPorTransaccion: "true",
    // Específicos de PostgreSQL
    schema: "public",
    sslmode: "prefer",
    charset: "UTF8",
    autocommit: "false",
    maxConnections: "50",
    minConnections: "2",
    applicationName: "DIV_Integration",
    timezone: "America/Bogota",
    searchPath: "public"
  },

  // Bases de Datos NoSQL
  "MongoDB": {
    // Campos fijos para todos los servidores
    instancias: "20",
    timeout: "30000",
    conexionPorTransaccion: "false",
    // Específicos de MongoDB
    replicaSet: "rs0",
    ssl: "true",
    authSource: "admin",
    maxPoolSize: "100",
    minPoolSize: "5",
    maxIdleTimeMS: "300000",
    connectTimeoutMS: "10000",
    socketTimeoutMS: "30000",
    serverSelectionTimeoutMS: "5000",
    heartbeatFrequencyMS: "10000"
  },
  "Redis": {
    // Campos fijos para todos los servidores
    instancias: "15",
    timeout: "10000",
    conexionPorTransaccion: "false",
    // Específicos de Redis
    cluster: "false",
    db: "0",
    ssl: "false",
    maxConnections: "50",
    minConnections: "2",
    connectionTimeout: "5000",
    commandTimeout: "5000",
    retryDelayOnFailover: "100",
    maxRetryAttempts: "3",
    keepAlive: "60"
  },

  // Bases de Datos Analíticas
  "Snowflake": {
    // Campos fijos para todos los servidores
    instancias: "10",
    timeout: "60000",
    conexionPorTransaccion: "false",
    // Específicos de Snowflake
    region: "us-west-2",
    warehouse: "COMPUTE_WH",
    role: "SYSADMIN",
    schema: "PUBLIC",
    database: "",
    ssl: "true",
    authenticationType: "password",
    sessionParameters: "",
    maxConnections: "20",
    minConnections: "1"
  },
  "BigQuery": {
    // Campos fijos para todos los servidores
    instancias: "8",
    timeout: "120000",
    conexionPorTransaccion: "false",
    // Específicos de BigQuery
    proyecto: "mi-proyecto",
    dataset: "datos",
    modoAutenticacion: "service-account",
    location: "US",
    ssl: "true",
    maxResults: "10000",
    useLegacySql: "false",
    jobTimeoutMs: "300000",
    maxConnections: "15",
    credentialsPath: ""
  },

  // APIs y Servicios
  "REST": {
    // Campos fijos para todos los servidores
    instancias: "50",
    timeout: "30000",
    conexionPorTransaccion: "true",
    // Específicos de REST API
    urlBase: "https://api.miempresa.com",
    authTipo: "APIKey",
    apiKey: "",
    ssl: "true",
    maxRetries: "3",
    retryDelay: "1000",
    circuitBreakerEnabled: "false",
    circuitBreakerThreshold: "5",
    rateLimitPerSecond: "100",
    keepAliveTimeout: "30000",
    headers: "Content-Type:application/json",
    compression: "gzip",
    followRedirects: "true",
    maxRedirects: "5"
  },
  "SOAP": {
    // Campos fijos para todos los servidores
    instancias: "30",
    timeout: "45000",
    conexionPorTransaccion: "true",
    // Específicos de SOAP
    namespace: "http://miws.com",
    soapAction: "accion",
    version: "1.1",
    ssl: "true",
    wsdlUrl: "",
    encoding: "utf-8",
    maxRetries: "2",
    retryDelay: "2000",
    validateResponse: "true",
    mtom: "false",
    chunking: "false",
    keepAlive: "true"
  },

  // Servicios en Tiempo Real
  "Kafka": {
    // Campos fijos para todos los servidores
    instancias: "20",
    timeout: "30000",
    conexionPorTransaccion: "false",
    // Específicos de Kafka
    topic: "procesos",
    particiones: "3",
    reintentos: "2",
    ssl: "false",
    groupId: "div-consumer-group",
    autoOffsetReset: "earliest",
    enableAutoCommit: "true",
    autoCommitIntervalMs: "1000",
    sessionTimeoutMs: "10000",
    maxPollRecords: "500",
    compressionType: "none",
    acks: "1",
    batchSize: "16384",
    lingerMs: "0"
  },
  "RabbitMQ": {
    // Campos fijos para todos los servidores
    instancias: "15",
    timeout: "20000",
    conexionPorTransaccion: "false",
    // Específicos de RabbitMQ
    exchange: "canal.principal",
    routingKey: "flujo",
    virtualHost: "/",
    ssl: "false",
    queueDurable: "true",
    exchangeDurable: "true",
    autoAck: "false",
    prefetchCount: "1",
    heartbeat: "60",
    connectionTimeout: "30000",
    channelMax: "2047",
    frameMax: "131072"
  },

  // Servicios Híbridos
  "Firebase": {
    // Campos fijos para todos los servidores
    instancias: "25",
    timeout: "30000",
    conexionPorTransaccion: "true",
    // Específicos de Firebase
    token: "",
    baseURL: "https://miapp.firebaseio.com",
    ssl: "true",
    authType: "token",
    region: "us-central1",
    maxRetries: "3",
    retryDelay: "1000",
    keepAlive: "true",
    compression: "true",
    rateLimitPerSecond: "1000"
  },
  "Supabase": {
    // Campos fijos para todos los servidores
    instancias: "20",
    timeout: "25000",
    conexionPorTransaccion: "true",
    // Específicos de Supabase
    url: "https://xyz.supabase.co",
    apiKey: "",
    schema: "public",
    ssl: "true",
    authType: "apikey",
    maxRetries: "2",
    retryDelay: "1500",
    keepAlive: "true",
    rateLimitPerSecond: "100",
    realtime: "false"
  },

  // Conexiones por Socket
  "SocketTCP": {
    // Campos fijos para todos los servidores
    instancias: "10",
    timeout: "30000",
    conexionPorTransaccion: "false",
    // Específicos de Socket TCP
    modo: "cliente",
    reintentos: "3",
    esperaEntreIntentos: "1000",
    keepAlive: "true",
    codificacion: "utf-8",
    terminador: "\\r\\n",
    bufferSize: "8192",
    socketLinger: "true",
    socketLingerTime: "5",
    tcpNoDelay: "true",
    reuseAddress: "true",
    soTimeout: "30000",
    connectTimeout: "10000",
    readTimeout: "15000",
    writeTimeout: "15000",
    maxConnections: "20",
    minConnections: "1"
  }
};
