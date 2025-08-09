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
  },

  // Servicios de Comunicación
  "WhatsApp": {
    // Campos fijos para todos los servidores
    instancias: "20",
    timeout: "30000",
    conexionPorTransaccion: "true",
    // Específicos de WhatsApp Business API
    apiVersion: "v17.0",
    businessAccountId: "",
    phoneNumberId: "",
    accessToken: "",
    webhookUrl: "",
    webhookVerifyToken: "",
    ssl: "true",
    maxRetries: "3",
    retryDelay: "2000",
    rateLimitPerMinute: "1000",
    messageTemplateNamespace: "",
    defaultLanguage: "es",
    mediaStorageUrl: "",
    maxFileSize: "16777216",
    allowedMediaTypes: "image/jpeg,image/png,application/pdf,video/mp4",
    encryptionEnabled: "true"
  },
  "SMS": {
    // Campos fijos para todos los servidores
    instancias: "15",
    timeout: "20000",
    conexionPorTransaccion: "true",
    // Específicos de SMS (compatible con Twilio, Vonage, etc.)
    provider: "twilio",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    messagingServiceSid: "",
    ssl: "true",
    maxRetries: "2",
    retryDelay: "3000",
    maxMessageLength: "1600",
    concatenateMessages: "true",
    deliveryReportUrl: "",
    statusCallbackUrl: "",
    encoding: "GSM-7",
    validityPeriod: "4320",
    priority: "normal",
    trackLinks: "false"
  },
  "Email": {
    // Campos fijos para todos los servidores
    instancias: "25",
    timeout: "45000",
    conexionPorTransaccion: "true",
    // Específicos de Email SMTP
    smtpHost: "",
    smtpPort: "587",
    encryption: "STARTTLS",
    authMethod: "LOGIN",
    fromEmail: "",
    fromName: "",
    replyTo: "",
    ssl: "true",
    maxRetries: "3",
    retryDelay: "5000",
    maxAttachmentSize: "26214400",
    allowedAttachmentTypes: "pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif,txt,csv",
    bounceHandling: "true",
    bounceEmail: "",
    trackOpens: "false",
    trackClicks: "false",
    unsubscribeUrl: "",
    charset: "UTF-8",
    priority: "normal"
  },
  "Telegram": {
    // Campos fijos para todos los servidores
    instancias: "15",
    timeout: "25000",
    conexionPorTransaccion: "true",
    // Específicos de Telegram Bot API
    botToken: "",
    apiBaseUrl: "https://api.telegram.org",
    webhookUrl: "",
    webhookSecretToken: "",
    ssl: "true",
    maxRetries: "3",
    retryDelay: "2000",
    allowedUpdates: "message,callback_query,inline_query",
    maxConnections: "40",
    parseMode: "HTML",
    disableNotification: "false",
    protectContent: "false",
    maxMessageLength: "4096",
    maxCaptionLength: "1024",
    maxFileSize: "52428800",
    pollTimeout: "30"
  },
  "Discord": {
    // Campos fijos para todos los servidores
    instancias: "10",
    timeout: "20000",
    conexionPorTransaccion: "true",
    // Específicos de Discord API
    botToken: "",
    applicationId: "",
    guildId: "",
    channelId: "",
    webhookUrl: "",
    ssl: "true",
    maxRetries: "2",
    retryDelay: "3000",
    intents: "GUILDS,GUILD_MESSAGES",
    maxMessageLength: "2000",
    maxEmbeds: "10",
    maxFileSize: "8388608",
    allowedMentions: "users,roles",
    messageRetention: "1209600",
    rateLimitPerSecond: "5",
    shardCount: "1"
  },
  "Slack": {
    // Campos fijos para todos los servidores
    instancias: "15",
    timeout: "25000",
    conexionPorTransaccion: "true",
    // Específicos de Slack API
    botToken: "",
    appToken: "",
    signingSecret: "",
    clientId: "",
    clientSecret: "",
    workspaceId: "",
    channelId: "",
    webhookUrl: "",
    ssl: "true",
    maxRetries: "3",
    retryDelay: "2000",
    maxMessageLength: "40000",
    maxBlocksPerMessage: "50",
    maxAttachments: "100",
    maxFileSize: "1073741824",
    threadingEnabled: "true",
    unfurlLinks: "true",
    unfurlMedia: "true",
    markdownEnabled: "true"
  },

  // Autenticación Externa
  "Google-OAuth": {
    // Campos fijos para todos los servidores
    instancias: "30",
    timeout: "30000",
    conexionPorTransaccion: "true",
    // Específicos de Google OAuth 2.0
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v1/userinfo",
    scopes: "openid email profile",
    accessType: "online",
    prompt: "select_account",
    ssl: "true",
    state: "",
    nonce: "",
    loginHint: "",
    hostedDomain: "",
    includeGrantedScopes: "true",
    tokenValidationUrl: "https://oauth2.googleapis.com/tokeninfo",
    revocationUrl: "https://oauth2.googleapis.com/revoke"
  },
  "Facebook-OAuth": {
    // Campos fijos para todos los servidores
    instancias: "25",
    timeout: "30000",
    conexionPorTransaccion: "true",
    // Específicos de Facebook OAuth 2.0
    appId: "",
    appSecret: "",
    redirectUri: "",
    authorizeUrl: "https://www.facebook.com/v17.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v17.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me",
    scopes: "public_profile,email",
    apiVersion: "v17.0",
    ssl: "true",
    state: "",
    responseType: "code",
    display: "page",
    authType: "",
    fields: "id,name,email,picture",
    locale: "es_ES",
    debugToken: "false"
  },
  "Microsoft-OAuth": {
    // Campos fijos para todos los servidores
    instancias: "25",
    timeout: "30000",
    conexionPorTransaccion: "true",
    // Específicos de Microsoft OAuth 2.0 / Azure AD
    clientId: "",
    clientSecret: "",
    tenantId: "common",
    redirectUri: "",
    authorizeUrl: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    scopes: "openid profile email User.Read",
    responseType: "code",
    responseMode: "query",
    ssl: "true",
    state: "",
    nonce: "",
    prompt: "select_account",
    loginHint: "",
    domainHint: "",
    maxAge: "",
    graphApiVersion: "v1.0"
  },
  "GitHub-OAuth": {
    // Campos fijos para todos los servidores
    instancias: "20",
    timeout: "25000",
    conexionPorTransaccion: "true",
    // Específicos de GitHub OAuth
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scopes: "read:user user:email",
    ssl: "true",
    state: "",
    allowSignup: "true",
    login: "",
    apiVersion: "2022-11-28",
    userAgent: "DIV-Integration",
    acceptHeader: "application/vnd.github+json",
    includeEmails: "true",
    includOrgs: "false"
  },
  "Auth0": {
    // Campos fijos para todos los servidores
    instancias: "30",
    timeout: "30000",
    conexionPorTransaccion: "true",
    // Específicos de Auth0
    domain: "",
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    audience: "",
    scope: "openid profile email",
    responseType: "code",
    ssl: "true",
    state: "",
    nonce: "",
    connection: "",
    prompt: "login",
    maxAge: "",
    organization: "",
    invitation: "",
    loginHint: "",
    screenHint: "",
    apiVersion: "2",
    managementApiToken: "",
    customDomain: ""
  },
  "Okta": {
    // Campos fijos para todos los servidores
    instancias: "25",
    timeout: "30000",
    conexionPorTransaccion: "true",
    // Específicos de Okta
    domain: "",
    clientId: "",
    clientSecret: "",
    authorizationServerId: "default",
    redirectUri: "",
    authorizeUrl: "https://{domain}/oauth2/{authServerId}/v1/authorize",
    tokenUrl: "https://{domain}/oauth2/{authServerId}/v1/token",
    userInfoUrl: "https://{domain}/oauth2/{authServerId}/v1/userinfo",
    scopes: "openid profile email",
    responseType: "code",
    ssl: "true",
    state: "",
    nonce: "",
    codeChallenge: "",
    codeChallengeMethod: "S256",
    prompt: "login",
    maxAge: "",
    idpId: "",
    sessionToken: "",
    apiToken: ""
  }
};
