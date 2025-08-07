import React, { useState } from 'react';
import { FaServer, FaBook, FaSearch, FaChevronDown, FaChevronUp, FaInfoCircle } from 'react-icons/fa';
import './DocumentacionCamposServidor.css';

interface CampoDoc {
  nombre: string;
  descripcion: string;
  valorPorDefecto: string;
  ejemplos?: string[];
  importante?: boolean;
}

interface TipoServidorDoc {
  nombre: string;
  descripcion: string;
  categoria: string;
  campos: CampoDoc[];
}

const DocumentacionCamposServidor: React.FC = () => {
  const [filtro, setFiltro] = useState('');
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>('relacionales');
  
  const documentacion: TipoServidorDoc[] = [
    // === BASES DE DATOS RELACIONALES ===
    {
      nombre: 'SQLServer',
      categoria: 'relacionales',
      descripcion: 'Microsoft SQL Server - Base de datos relacional empresarial',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas al pool de conexiones', valorPorDefecto: '50', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite en milisegundos para operaciones de conexión y consulta', valorPorDefecto: '30000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Si cada transacción debe usar una conexión dedicada (false) o compartir conexiones (true)', valorPorDefecto: 'false', importante: true },
        { nombre: 'ssl', descripcion: 'Habilita el cifrado SSL/TLS para la conexión a la base de datos', valorPorDefecto: 'false', ejemplos: ['true', 'false'] },
        { nombre: 'encriptacion', descripcion: 'Tipo de encriptación para la conexión', valorPorDefecto: 'ninguna', ejemplos: ['ninguna', 'obligatoria', 'opcional'] },
        { nombre: 'trustServerCertificate', descripcion: 'Confía automáticamente en el certificado del servidor sin validación', valorPorDefecto: 'false' },
        { nombre: 'applicationName', descripcion: 'Nombre de la aplicación que aparecerá en los logs del servidor', valorPorDefecto: 'DIV_Integration' },
        { nombre: 'connectionString', descripcion: 'Cadena de conexión personalizada completa (sobrescribe otros parámetros si se define)', valorPorDefecto: '' },
        { nombre: 'maxConnections', descripcion: 'Límite máximo de conexiones que pueden crearse en el pool', valorPorDefecto: '100' },
        { nombre: 'minConnections', descripcion: 'Número mínimo de conexiones que se mantienen abiertas en el pool', valorPorDefecto: '5' },
        { nombre: 'charset', descripcion: 'Codificación de caracteres para la conexión', valorPorDefecto: 'utf8', ejemplos: ['utf8', 'latin1'] },
        { nombre: 'autocommit', descripcion: 'Confirma automáticamente cada operación SQL sin necesidad de COMMIT explícito', valorPorDefecto: 'true' },
        { nombre: 'isolationLevel', descripcion: 'Nivel de aislamiento de transacciones', valorPorDefecto: 'READ_COMMITTED', ejemplos: ['READ_UNCOMMITTED', 'READ_COMMITTED', 'REPEATABLE_READ', 'SERIALIZABLE'] }
      ]
    },
    {
      nombre: 'Oracle',
      categoria: 'relacionales',
      descripcion: 'Oracle Database - Sistema de gestión de base de datos empresarial',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas al pool de conexiones', valorPorDefecto: '30', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite en milisegundos para operaciones de conexión y consulta', valorPorDefecto: '45000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Si cada transacción debe usar una conexión dedicada', valorPorDefecto: 'false', importante: true },
        { nombre: 'sid', descripcion: 'System Identifier - Identificador único de la instancia Oracle', valorPorDefecto: 'XE', ejemplos: ['XE', 'ORCL', 'PROD'] },
        { nombre: 'servicio', descripcion: 'Nombre del servicio Oracle al cual conectarse', valorPorDefecto: 'orcl' },
        { nombre: 'ssl', descripcion: 'Habilita conexiones seguras SSL/TLS', valorPorDefecto: 'false' },
        { nombre: 'charset', descripcion: 'Conjunto de caracteres de la base de datos Oracle', valorPorDefecto: 'AL32UTF8', ejemplos: ['AL32UTF8', 'WE8MSWIN1252'] },
        { nombre: 'connectionString', descripcion: 'Cadena de conexión TNS personalizada', valorPorDefecto: '' },
        { nombre: 'maxConnections', descripcion: 'Límite máximo de conexiones en el pool', valorPorDefecto: '80' },
        { nombre: 'minConnections', descripcion: 'Número mínimo de conexiones mantenidas', valorPorDefecto: '3' },
        { nombre: 'autocommit', descripcion: 'Modo de confirmación automática de transacciones', valorPorDefecto: 'false' },
        { nombre: 'fetchSize', descripcion: 'Número de filas recuperadas en cada operación de lectura', valorPorDefecto: '1000' },
        { nombre: 'sessionTimeZone', descripcion: 'Zona horaria para la sesión de base de datos', valorPorDefecto: 'America/Bogota' }
      ]
    },
    {
      nombre: 'MySQL',
      categoria: 'relacionales',
      descripcion: 'MySQL - Base de datos relacional de código abierto',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '25', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '20000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar conexión dedicada por transacción', valorPorDefecto: 'true', importante: true },
        { nombre: 'ssl', descripcion: 'Configuración SSL para conexiones seguras', valorPorDefecto: 'opcional', ejemplos: ['true', 'false', 'opcional'] },
        { nombre: 'charset', descripcion: 'Codificación de caracteres de la conexión', valorPorDefecto: 'utf8mb4', ejemplos: ['utf8mb4', 'utf8', 'latin1'] },
        { nombre: 'collation', descripcion: 'Reglas de comparación y ordenamiento de caracteres', valorPorDefecto: 'utf8mb4_unicode_ci' },
        { nombre: 'autocommit', descripcion: 'Confirmación automática de transacciones', valorPorDefecto: 'true' },
        { nombre: 'maxConnections', descripcion: 'Límite máximo de conexiones concurrentes', valorPorDefecto: '60' },
        { nombre: 'minConnections', descripcion: 'Conexiones mínimas mantenidas en el pool', valorPorDefecto: '2' },
        { nombre: 'useUnicode', descripcion: 'Habilita el soporte completo de Unicode', valorPorDefecto: 'true' },
        { nombre: 'allowMultiQueries', descripcion: 'Permite ejecutar múltiples consultas en una sola llamada', valorPorDefecto: 'false' },
        { nombre: 'timezone', descripcion: 'Zona horaria para fechas y horas', valorPorDefecto: 'America/Bogota' }
      ]
    },
    {
      nombre: 'PostgreSQL',
      categoria: 'relacionales',
      descripcion: 'PostgreSQL - Base de datos relacional de código abierto avanzada',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '25', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '25000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar conexión dedicada por transacción', valorPorDefecto: 'true', importante: true },
        { nombre: 'schema', descripcion: 'Esquema por defecto para las operaciones', valorPorDefecto: 'public' },
        { nombre: 'sslmode', descripcion: 'Modo de conexión SSL', valorPorDefecto: 'prefer', ejemplos: ['disable', 'allow', 'prefer', 'require'] },
        { nombre: 'charset', descripcion: 'Codificación de caracteres', valorPorDefecto: 'UTF8' },
        { nombre: 'autocommit', descripcion: 'Confirmación automática de transacciones', valorPorDefecto: 'false' },
        { nombre: 'maxConnections', descripcion: 'Límite máximo de conexiones', valorPorDefecto: '50' },
        { nombre: 'minConnections', descripcion: 'Conexiones mínimas en el pool', valorPorDefecto: '2' },
        { nombre: 'applicationName', descripcion: 'Identificador de la aplicación en los logs', valorPorDefecto: 'DIV_Integration' },
        { nombre: 'timezone', descripcion: 'Zona horaria para la sesión', valorPorDefecto: 'America/Bogota' },
        { nombre: 'searchPath', descripcion: 'Ruta de búsqueda de esquemas', valorPorDefecto: 'public' }
      ]
    },
    
    // === BASES DE DATOS NOSQL ===
    {
      nombre: 'MongoDB',
      categoria: 'nosql',
      descripcion: 'MongoDB - Base de datos NoSQL orientada a documentos',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '20', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '30000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar conexión dedicada por transacción (generalmente false en NoSQL)', valorPorDefecto: 'false', importante: true },
        { nombre: 'replicaSet', descripcion: 'Nombre del conjunto de réplicas para alta disponibilidad', valorPorDefecto: 'rs0' },
        { nombre: 'ssl', descripcion: 'Habilita conexiones SSL/TLS', valorPorDefecto: 'true' },
        { nombre: 'authSource', descripcion: 'Base de datos donde se almacenan las credenciales de autenticación', valorPorDefecto: 'admin' },
        { nombre: 'maxPoolSize', descripcion: 'Tamaño máximo del pool de conexiones', valorPorDefecto: '100' },
        { nombre: 'minPoolSize', descripcion: 'Tamaño mínimo del pool de conexiones', valorPorDefecto: '5' },
        { nombre: 'maxIdleTimeMS', descripcion: 'Tiempo máximo que una conexión puede estar inactiva antes de cerrarse', valorPorDefecto: '300000' },
        { nombre: 'connectTimeoutMS', descripcion: 'Tiempo límite para establecer conexión inicial', valorPorDefecto: '10000' },
        { nombre: 'socketTimeoutMS', descripcion: 'Tiempo límite para operaciones de socket', valorPorDefecto: '30000' },
        { nombre: 'serverSelectionTimeoutMS', descripcion: 'Tiempo para seleccionar un servidor disponible', valorPorDefecto: '5000' },
        { nombre: 'heartbeatFrequencyMS', descripcion: 'Frecuencia de verificación de estado del servidor', valorPorDefecto: '10000' }
      ]
    },
    {
      nombre: 'Redis',
      categoria: 'nosql',
      descripcion: 'Redis - Base de datos en memoria para caché y almacén de estructuras',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '15', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '10000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar conexión dedicada por transacción', valorPorDefecto: 'false', importante: true },
        { nombre: 'cluster', descripcion: 'Si Redis está configurado en modo cluster', valorPorDefecto: 'false', ejemplos: ['true', 'false'] },
        { nombre: 'db', descripcion: 'Número de base de datos Redis a seleccionar (0-15)', valorPorDefecto: '0', ejemplos: ['0', '1', '2'] },
        { nombre: 'ssl', descripcion: 'Habilita conexiones SSL/TLS', valorPorDefecto: 'false' },
        { nombre: 'maxConnections', descripcion: 'Límite máximo de conexiones concurrentes', valorPorDefecto: '50' },
        { nombre: 'minConnections', descripcion: 'Conexiones mínimas mantenidas en el pool', valorPorDefecto: '2' },
        { nombre: 'connectionTimeout', descripcion: 'Tiempo límite para establecer conexión', valorPorDefecto: '5000' },
        { nombre: 'commandTimeout', descripcion: 'Tiempo límite para ejecutar comandos', valorPorDefecto: '5000' },
        { nombre: 'retryDelayOnFailover', descripcion: 'Retraso en milisegundos antes de reintentar tras fallo', valorPorDefecto: '100' },
        { nombre: 'maxRetryAttempts', descripcion: 'Número máximo de reintentos en caso de fallo', valorPorDefecto: '3' },
        { nombre: 'keepAlive', descripcion: 'Tiempo en segundos para mantener conexiones activas', valorPorDefecto: '60' }
      ]
    },

    // === BASES DE DATOS ANALÍTICAS ===
    {
      nombre: 'Snowflake',
      categoria: 'analiticas',
      descripcion: 'Snowflake - Plataforma de datos en la nube para análisis',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '10', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '60000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar conexión dedicada por transacción', valorPorDefecto: 'false', importante: true },
        { nombre: 'region', descripcion: 'Región de AWS/Azure donde está ubicado Snowflake', valorPorDefecto: 'us-west-2', ejemplos: ['us-west-2', 'us-east-1', 'eu-west-1'] },
        { nombre: 'warehouse', descripcion: 'Nombre del warehouse (cluster de cómputo) a utilizar', valorPorDefecto: 'COMPUTE_WH' },
        { nombre: 'role', descripcion: 'Rol de usuario para la sesión', valorPorDefecto: 'SYSADMIN', ejemplos: ['SYSADMIN', 'ACCOUNTADMIN', 'USERADMIN'] },
        { nombre: 'schema', descripcion: 'Schema por defecto para las consultas', valorPorDefecto: 'PUBLIC' },
        { nombre: 'database', descripcion: 'Base de datos por defecto', valorPorDefecto: '' },
        { nombre: 'ssl', descripcion: 'Siempre habilitado en Snowflake', valorPorDefecto: 'true' },
        { nombre: 'authenticationType', descripcion: 'Tipo de autenticación', valorPorDefecto: 'password', ejemplos: ['password', 'oauth', 'key_pair'] },
        { nombre: 'sessionParameters', descripcion: 'Parámetros adicionales de sesión en formato JSON', valorPorDefecto: '' },
        { nombre: 'maxConnections', descripcion: 'Límite máximo de conexiones', valorPorDefecto: '20' },
        { nombre: 'minConnections', descripcion: 'Conexiones mínimas en el pool', valorPorDefecto: '1' }
      ]
    },
    {
      nombre: 'BigQuery',
      categoria: 'analiticas',
      descripcion: 'Google BigQuery - Almacén de datos completamente administrado',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '8', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para consultas en milisegundos', valorPorDefecto: '120000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar conexión dedicada por transacción', valorPorDefecto: 'false', importante: true },
        { nombre: 'proyecto', descripcion: 'ID del proyecto de Google Cloud', valorPorDefecto: 'mi-proyecto' },
        { nombre: 'dataset', descripcion: 'Dataset por defecto para las consultas', valorPorDefecto: 'datos' },
        { nombre: 'modoAutenticacion', descripcion: 'Método de autenticación con Google Cloud', valorPorDefecto: 'service-account', ejemplos: ['service-account', 'oauth', 'api-key'] },
        { nombre: 'location', descripcion: 'Ubicación geográfica de los datos', valorPorDefecto: 'US', ejemplos: ['US', 'EU', 'asia-southeast1'] },
        { nombre: 'ssl', descripcion: 'Siempre habilitado en BigQuery', valorPorDefecto: 'true' },
        { nombre: 'maxResults', descripcion: 'Número máximo de filas a retornar por consulta', valorPorDefecto: '10000' },
        { nombre: 'useLegacySql', descripcion: 'Usar SQL legacy en lugar de Standard SQL', valorPorDefecto: 'false' },
        { nombre: 'jobTimeoutMs', descripcion: 'Tiempo límite para jobs de consulta', valorPorDefecto: '300000' },
        { nombre: 'maxConnections', descripcion: 'Límite máximo de conexiones concurrentes', valorPorDefecto: '15' },
        { nombre: 'credentialsPath', descripcion: 'Ruta al archivo JSON de credenciales de service account', valorPorDefecto: '' }
      ]
    },

    // === APIS Y SERVICIOS ===
    {
      nombre: 'REST',
      categoria: 'apis',
      descripcion: 'REST API - Servicios web basados en protocolo HTTP',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones HTTP simultáneas', valorPorDefecto: '50', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para peticiones HTTP en milisegundos', valorPorDefecto: '30000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Crear nueva conexión HTTP para cada operación', valorPorDefecto: 'true', importante: true },
        { nombre: 'urlBase', descripcion: 'URL base del API REST', valorPorDefecto: 'https://api.miempresa.com' },
        { nombre: 'authTipo', descripcion: 'Tipo de autenticación', valorPorDefecto: 'APIKey', ejemplos: ['APIKey', 'Bearer', 'Basic', 'OAuth2'] },
        { nombre: 'apiKey', descripcion: 'Clave de API para autenticación', valorPorDefecto: '' },
        { nombre: 'ssl', descripcion: 'Verificar certificados SSL', valorPorDefecto: 'true' },
        { nombre: 'maxRetries', descripcion: 'Número máximo de reintentos en caso de fallo', valorPorDefecto: '3' },
        { nombre: 'retryDelay', descripcion: 'Retraso en milisegundos entre reintentos', valorPorDefecto: '1000' },
        { nombre: 'circuitBreakerEnabled', descripcion: 'Habilita patrón Circuit Breaker para fallos consecutivos', valorPorDefecto: 'false' },
        { nombre: 'circuitBreakerThreshold', descripcion: 'Número de fallos consecutivos antes de abrir el circuito', valorPorDefecto: '5' },
        { nombre: 'rateLimitPerSecond', descripcion: 'Límite de peticiones por segundo', valorPorDefecto: '100' },
        { nombre: 'keepAliveTimeout', descripcion: 'Tiempo para mantener conexiones activas', valorPorDefecto: '30000' },
        { nombre: 'headers', descripcion: 'Headers HTTP adicionales (formato: key:value)', valorPorDefecto: 'Content-Type:application/json' },
        { nombre: 'compression', descripcion: 'Tipo de compresión HTTP', valorPorDefecto: 'gzip', ejemplos: ['gzip', 'deflate', 'none'] },
        { nombre: 'followRedirects', descripcion: 'Seguir automáticamente redirecciones HTTP', valorPorDefecto: 'true' },
        { nombre: 'maxRedirects', descripcion: 'Número máximo de redirecciones a seguir', valorPorDefecto: '5' }
      ]
    },
    {
      nombre: 'SOAP',
      categoria: 'apis',
      descripcion: 'SOAP - Protocolo de acceso a servicios web XML',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones SOAP simultáneas', valorPorDefecto: '30', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones SOAP en milisegundos', valorPorDefecto: '45000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Crear nueva conexión para cada operación SOAP', valorPorDefecto: 'true', importante: true },
        { nombre: 'namespace', descripcion: 'Namespace XML del servicio web', valorPorDefecto: 'http://miws.com' },
        { nombre: 'soapAction', descripcion: 'SOAPAction header para la operación', valorPorDefecto: 'accion' },
        { nombre: 'version', descripcion: 'Versión del protocolo SOAP', valorPorDefecto: '1.1', ejemplos: ['1.1', '1.2'] },
        { nombre: 'ssl', descripcion: 'Usar HTTPS para conexiones seguras', valorPorDefecto: 'true' },
        { nombre: 'wsdlUrl', descripcion: 'URL del archivo WSDL que describe el servicio', valorPorDefecto: '' },
        { nombre: 'encoding', descripcion: 'Codificación de caracteres para XML', valorPorDefecto: 'utf-8', ejemplos: ['utf-8', 'iso-8859-1'] },
        { nombre: 'maxRetries', descripcion: 'Número máximo de reintentos en caso de fallo', valorPorDefecto: '2' },
        { nombre: 'retryDelay', descripcion: 'Retraso entre reintentos en milisegundos', valorPorDefecto: '2000' },
        { nombre: 'validateResponse', descripcion: 'Validar respuesta XML contra el esquema WSDL', valorPorDefecto: 'true' },
        { nombre: 'mtom', descripcion: 'Habilitar MTOM (Message Transmission Optimization Mechanism)', valorPorDefecto: 'false' },
        { nombre: 'chunking', descripcion: 'Usar transferencia HTTP chunked para mensajes grandes', valorPorDefecto: 'false' },
        { nombre: 'keepAlive', descripcion: 'Mantener conexiones HTTP activas', valorPorDefecto: 'true' }
      ]
    },

    // === SERVICIOS EN TIEMPO REAL ===
    {
      nombre: 'Kafka',
      categoria: 'tiempo_real',
      descripcion: 'Apache Kafka - Plataforma de streaming de datos distribuida',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '20', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '30000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar conexión dedicada por transacción', valorPorDefecto: 'false', importante: true },
        { nombre: 'topic', descripcion: 'Nombre del topic de Kafka donde enviar/recibir mensajes', valorPorDefecto: 'procesos' },
        { nombre: 'particiones', descripcion: 'Número de particiones del topic', valorPorDefecto: '3' },
        { nombre: 'reintentos', descripcion: 'Número de reintentos para envío de mensajes', valorPorDefecto: '2' },
        { nombre: 'ssl', descripcion: 'Habilitar SSL/TLS para conexión segura', valorPorDefecto: 'false' },
        { nombre: 'groupId', descripcion: 'ID del grupo de consumidores', valorPorDefecto: 'div-consumer-group' },
        { nombre: 'autoOffsetReset', descripcion: 'Comportamiento cuando no hay offset inicial', valorPorDefecto: 'earliest', ejemplos: ['earliest', 'latest', 'none'] },
        { nombre: 'enableAutoCommit', descripcion: 'Confirmar automáticamente offsets de mensajes leídos', valorPorDefecto: 'true' },
        { nombre: 'autoCommitIntervalMs', descripcion: 'Intervalo para auto-commit de offsets', valorPorDefecto: '1000' },
        { nombre: 'sessionTimeoutMs', descripcion: 'Timeout de sesión del consumidor', valorPorDefecto: '10000' },
        { nombre: 'maxPollRecords', descripcion: 'Número máximo de registros por poll', valorPorDefecto: '500' },
        { nombre: 'compressionType', descripcion: 'Tipo de compresión para mensajes', valorPorDefecto: 'none', ejemplos: ['none', 'gzip', 'snappy', 'lz4'] },
        { nombre: 'acks', descripcion: 'Nivel de reconocimiento requerido del líder', valorPorDefecto: '1', ejemplos: ['0', '1', 'all'] },
        { nombre: 'batchSize', descripcion: 'Tamaño del lote en bytes para envío eficiente', valorPorDefecto: '16384' },
        { nombre: 'lingerMs', descripcion: 'Tiempo de espera para formar lotes más grandes', valorPorDefecto: '0' }
      ]
    },
    {
      nombre: 'RabbitMQ',
      categoria: 'tiempo_real',
      descripcion: 'RabbitMQ - Broker de mensajes AMQP para sistemas distribuidos',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '15', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '20000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar conexión dedicada por transacción', valorPorDefecto: 'false', importante: true },
        { nombre: 'exchange', descripcion: 'Nombre del exchange donde enrutar mensajes', valorPorDefecto: 'canal.principal' },
        { nombre: 'routingKey', descripcion: 'Clave de enrutamiento para dirigir mensajes', valorPorDefecto: 'flujo' },
        { nombre: 'virtualHost', descripcion: 'Virtual host para organización lógica', valorPorDefecto: '/' },
        { nombre: 'ssl', descripcion: 'Usar conexiones SSL/TLS', valorPorDefecto: 'false' },
        { nombre: 'queueDurable', descripcion: 'Las colas sobreviven a reinicios del servidor', valorPorDefecto: 'true' },
        { nombre: 'exchangeDurable', descripcion: 'El exchange sobrevive a reinicios del servidor', valorPorDefecto: 'true' },
        { nombre: 'autoAck', descripcion: 'Reconocimiento automático de mensajes', valorPorDefecto: 'false' },
        { nombre: 'prefetchCount', descripcion: 'Número de mensajes no confirmados por consumidor', valorPorDefecto: '1' },
        { nombre: 'heartbeat', descripcion: 'Intervalo de heartbeat en segundos', valorPorDefecto: '60' },
        { nombre: 'connectionTimeout', descripcion: 'Timeout para establecer conexión', valorPorDefecto: '30000' },
        { nombre: 'channelMax', descripcion: 'Número máximo de canales por conexión', valorPorDefecto: '2047' },
        { nombre: 'frameMax', descripcion: 'Tamaño máximo de frame AMQP en bytes', valorPorDefecto: '131072' }
      ]
    },

    // === SERVICIOS HÍBRIDOS ===
    {
      nombre: 'Firebase',
      categoria: 'hibridos',
      descripcion: 'Google Firebase - Plataforma de desarrollo de aplicaciones móviles y web',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '25', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '30000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Crear nueva conexión por operación', valorPorDefecto: 'true', importante: true },
        { nombre: 'token', descripcion: 'Token de autenticación de Firebase', valorPorDefecto: '' },
        { nombre: 'baseURL', descripcion: 'URL base de la base de datos Firebase', valorPorDefecto: 'https://miapp.firebaseio.com' },
        { nombre: 'ssl', descripcion: 'Siempre habilitado en Firebase', valorPorDefecto: 'true' },
        { nombre: 'authType', descripcion: 'Tipo de autenticación', valorPorDefecto: 'token', ejemplos: ['token', 'service-account', 'oauth'] },
        { nombre: 'region', descripcion: 'Región de Firebase Realtime Database', valorPorDefecto: 'us-central1' },
        { nombre: 'maxRetries', descripcion: 'Reintentos máximos en caso de fallo', valorPorDefecto: '3' },
        { nombre: 'retryDelay', descripcion: 'Retraso entre reintentos en milisegundos', valorPorDefecto: '1000' },
        { nombre: 'keepAlive', descripcion: 'Mantener conexiones persistentes', valorPorDefecto: 'true' },
        { nombre: 'compression', descripcion: 'Usar compresión HTTP', valorPorDefecto: 'true' },
        { nombre: 'rateLimitPerSecond', descripcion: 'Límite de operaciones por segundo', valorPorDefecto: '1000' }
      ]
    },
    {
      nombre: 'Supabase',
      categoria: 'hibridos',
      descripcion: 'Supabase - Alternativa open source a Firebase',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones simultáneas', valorPorDefecto: '20', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite para operaciones en milisegundos', valorPorDefecto: '25000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Crear nueva conexión por operación', valorPorDefecto: 'true', importante: true },
        { nombre: 'url', descripcion: 'URL de tu proyecto Supabase', valorPorDefecto: 'https://xyz.supabase.co' },
        { nombre: 'apiKey', descripcion: 'Clave pública (anon) o secreta (service_role) de Supabase', valorPorDefecto: '' },
        { nombre: 'schema', descripcion: 'Schema de PostgreSQL por defecto', valorPorDefecto: 'public' },
        { nombre: 'ssl', descripcion: 'Siempre habilitado en Supabase', valorPorDefecto: 'true' },
        { nombre: 'authType', descripcion: 'Tipo de autenticación', valorPorDefecto: 'apikey', ejemplos: ['apikey', 'jwt', 'oauth'] },
        { nombre: 'maxRetries', descripcion: 'Reintentos máximos en caso de fallo', valorPorDefecto: '2' },
        { nombre: 'retryDelay', descripcion: 'Retraso entre reintentos en milisegundos', valorPorDefecto: '1500' },
        { nombre: 'keepAlive', descripcion: 'Mantener conexiones HTTP persistentes', valorPorDefecto: 'true' },
        { nombre: 'rateLimitPerSecond', descripcion: 'Límite de peticiones por segundo', valorPorDefecto: '100' },
        { nombre: 'realtime', descripcion: 'Habilitar subscripciones en tiempo real', valorPorDefecto: 'false' }
      ]
    },

    // === CONEXIONES POR SOCKET ===
    {
      nombre: 'SocketTCP',
      categoria: 'socket',
      descripcion: 'Socket TCP - Conexión directa por socket para protocolos personalizados',
      campos: [
        { nombre: 'instancias', descripcion: 'Número máximo de conexiones socket simultáneas', valorPorDefecto: '10', importante: true },
        { nombre: 'timeout', descripcion: 'Tiempo límite general para operaciones en milisegundos', valorPorDefecto: '30000', importante: true },
        { nombre: 'conexionPorTransaccion', descripcion: 'Usar socket dedicado por operación', valorPorDefecto: 'false', importante: true },
        { nombre: 'modo', descripcion: 'Modo de operación del socket', valorPorDefecto: 'cliente', ejemplos: ['cliente', 'servidor'] },
        { nombre: 'reintentos', descripcion: 'Número de reintentos de conexión', valorPorDefecto: '3' },
        { nombre: 'esperaEntreIntentos', descripcion: 'Milisegundos de espera entre reintentos', valorPorDefecto: '1000' },
        { nombre: 'keepAlive', descripcion: 'Mantener conexiones socket activas', valorPorDefecto: 'true' },
        { nombre: 'codificacion', descripcion: 'Codificación de caracteres para datos', valorPorDefecto: 'utf-8', ejemplos: ['utf-8', 'ascii', 'latin1'] },
        { nombre: 'terminador', descripcion: 'Caracteres de fin de mensaje', valorPorDefecto: '\\r\\n', ejemplos: ['\\r\\n', '\\n', '\\0', 'ETX'] },
        { nombre: 'bufferSize', descripcion: 'Tamaño del buffer de socket en bytes', valorPorDefecto: '8192' },
        { nombre: 'socketLinger', descripcion: 'Control de cierre de socket (SO_LINGER)', valorPorDefecto: 'true' },
        { nombre: 'socketLingerTime', descripcion: 'Segundos de espera al cerrar socket', valorPorDefecto: '5' },
        { nombre: 'tcpNoDelay', descripcion: 'Deshabilitar algoritmo de Nagle para menor latencia', valorPorDefecto: 'true' },
        { nombre: 'reuseAddress', descripcion: 'Permitir reutilización de direcciones socket', valorPorDefecto: 'true' },
        { nombre: 'soTimeout', descripcion: 'Timeout para operaciones de lectura socket', valorPorDefecto: '30000' },
        { nombre: 'connectTimeout', descripcion: 'Timeout específico para establecer conexión', valorPorDefecto: '10000' },
        { nombre: 'readTimeout', descripcion: 'Timeout para operaciones de lectura', valorPorDefecto: '15000' },
        { nombre: 'writeTimeout', descripcion: 'Timeout para operaciones de escritura', valorPorDefecto: '15000' },
        { nombre: 'maxConnections', descripcion: 'Máximo de conexiones en el pool', valorPorDefecto: '20' },
        { nombre: 'minConnections', descripcion: 'Mínimo de conexiones mantenidas', valorPorDefecto: '1' }
      ]
    }
  ];

  const categorias = [
    { id: 'relacionales', nombre: 'Bases de Datos Relacionales', icono: '🗄️' },
    { id: 'nosql', nombre: 'Bases de Datos NoSQL', icono: '📊' },
    { id: 'analiticas', nombre: 'Bases de Datos Analíticas', icono: '📈' },
    { id: 'apis', nombre: 'APIs y Servicios', icono: '🌐' },
    { id: 'tiempo_real', nombre: 'Servicios en Tiempo Real', icono: '⚡' },
    { id: 'hibridos', nombre: 'Servicios Híbridos', icono: '🔗' },
    { id: 'socket', nombre: 'Conexiones por Socket', icono: '🔌' }
  ];

  const servidoresFiltrados = documentacion.filter(servidor =>
    servidor.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    servidor.descripcion.toLowerCase().includes(filtro.toLowerCase()) ||
    servidor.campos.some(campo => 
      campo.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      campo.descripcion.toLowerCase().includes(filtro.toLowerCase())
    )
  );

  const toggleCategoria = (categoria: string) => {
    setCategoriaExpandida(categoriaExpandida === categoria ? null : categoria);
  };

  return (
    <div className="documentacion-container">
      {/* Header */}
      <div className="doc-header">
        <div className="doc-title-section">
          <div className="doc-icon">
            <FaBook />
          </div>
          <div>
            <h1 className="doc-title">Documentación de Campos Extra</h1>
            <p className="doc-subtitle">
              Guía completa de configuración de servidores y conexiones externas
            </p>
          </div>
        </div>
      </div>

      {/* Información importante */}
      <div className="info-banner">
        <FaInfoCircle className="info-icon" />
        <div className="info-content">
          <h3>📋 Cómo funciona el sistema</h3>
          <p>
            <strong>El sistema utiliza estos campos de forma inteligente:</strong><br/>
            • Si el campo existe y tiene un valor, el sistema lo aplicará en la conexión<br/>
            • Si el campo no existe o está vacío, el sistema usará valores por defecto internos<br/>
            • Puedes agregar campos personalizados usando el botón "➕ Agregar Campo"
          </p>
        </div>
      </div>

      {/* Filtro */}
      <div className="doc-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar servidor o campo..."
            className="search-input"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido por categorías */}
      <div className="doc-content">
        {categorias.map(categoria => {
          const servidoresCategoria = servidoresFiltrados.filter(s => s.categoria === categoria.id);
          if (servidoresCategoria.length === 0) return null;

          return (
            <div key={categoria.id} className="categoria-section">
              <div 
                className={`categoria-header ${categoriaExpandida === categoria.id ? 'expandida' : ''}`}
                onClick={() => toggleCategoria(categoria.id)}
              >
                <div className="categoria-info">
                  <span className="categoria-icono">{categoria.icono}</span>
                  <h2 className="categoria-titulo">{categoria.nombre}</h2>
                  <span className="categoria-count">({servidoresCategoria.length} tipos)</span>
                </div>
                {categoriaExpandida === categoria.id ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {categoriaExpandida === categoria.id && (
                <div className="categoria-content">
                  {servidoresCategoria.map(servidor => (
                    <div key={servidor.nombre} className="servidor-doc">
                      <div className="servidor-header">
                        <FaServer className="servidor-icon" />
                        <div className="servidor-info">
                          <h3 className="servidor-nombre">{servidor.nombre}</h3>
                          <p className="servidor-descripcion">{servidor.descripcion}</p>
                        </div>
                        <div className="servidor-stats">
                          <span className="campos-count">{servidor.campos.length} campos</span>
                        </div>
                      </div>

                      <div className="campos-grid">
                        {servidor.campos.map(campo => (
                          <div key={campo.nombre} className={`campo-doc ${campo.importante ? 'importante' : ''}`}>
                            <div className="campo-header">
                              <h4 className="campo-nombre">
                                {campo.nombre}
                                {campo.importante && <span className="badge-importante">Obligatorio</span>}
                              </h4>
                              <code className="campo-default">{campo.valorPorDefecto}</code>
                            </div>
                            <p className="campo-descripcion">{campo.descripcion}</p>
                            {campo.ejemplos && (
                              <div className="campo-ejemplos">
                                <strong>Ejemplos:</strong> {campo.ejemplos.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentacionCamposServidor;