-- Script para insertar categorías de servidores basadas en las agrupaciones del formulario
-- Fecha: 2025-08-09
-- Propósito: Crear categorías reales basadas en los tipos agrupados del ServidorForm

-- Primero, verificar si ya existen categorías de servidor para evitar duplicados
DO $$
BEGIN
    -- Solo insertar si no hay categorías de servidor existentes
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE ambito = 'servidor' LIMIT 1) THEN
        
        -- Insertar categorías de servidor con colores temáticos
        INSERT INTO categorias (nombre, color, activo, ambito) VALUES
            -- Bases de Datos Relacionales (Azul - representa estabilidad y confianza)
            ('Bases de Datos Relacionales', '#2563eb', true, 'servidor'),
            
            -- Bases de Datos NoSQL (Rojo - representa innovación y velocidad)
            ('Bases de Datos NoSQL', '#dc2626', true, 'servidor'),
            
            -- Bases de Datos Analíticas (Púrpura - representa análisis y inteligencia)
            ('Bases de Datos Analíticas', '#7c3aed', true, 'servidor'),
            
            -- APIs y Servicios (Verde - representa integración y conexión)
            ('APIs y Servicios', '#059669', true, 'servidor'),
            
            -- Servicios en Tiempo Real (Naranja - representa velocidad y tiempo real)
            ('Servicios en Tiempo Real', '#ea580c', true, 'servidor'),
            
            -- Servicios Híbridos (Azul claro - representa versatilidad)
            ('Servicios Híbridos', '#0284c7', true, 'servidor'),
            
            -- Conexiones por Socket (Gris azulado - representa conexiones de bajo nivel)
            ('Conexiones por Socket', '#475569', true, 'servidor'),
            
            -- Servicios de Comunicación (Rosa - representa comunicación y social)
            ('Servicios de Comunicación', '#e11d48', true, 'servidor'),
            
            -- Autenticación Externa (Amarillo/Oro - representa seguridad y autenticación)
            ('Autenticación Externa', '#f59e0b', true, 'servidor');

        RAISE NOTICE 'Se han insertado 9 categorías de servidores exitosamente.';
        
    ELSE
        RAISE NOTICE 'Ya existen categorías de servidores. No se insertarán duplicados.';
    END IF;
END $$;

-- Verificar las categorías insertadas
SELECT 
    'Categorías de Servidores Creadas:' as info,
    '' as nombre,
    '' as color,
    '' as tipos_incluidos;

SELECT 
    '' as info,
    nombre,
    color,
    CASE nombre
        WHEN 'Bases de Datos Relacionales' THEN 'SQLServer, Oracle, MySQL, PostgreSQL'
        WHEN 'Bases de Datos NoSQL' THEN 'MongoDB, Redis'
        WHEN 'Bases de Datos Analíticas' THEN 'Snowflake, BigQuery'
        WHEN 'APIs y Servicios' THEN 'REST, SOAP'
        WHEN 'Servicios en Tiempo Real' THEN 'Kafka, RabbitMQ'
        WHEN 'Servicios Híbridos' THEN 'Firebase, Supabase'
        WHEN 'Conexiones por Socket' THEN 'SocketTCP'
        WHEN 'Servicios de Comunicación' THEN 'WhatsApp, SMS, Email, Telegram, Discord, Slack'
        WHEN 'Autenticación Externa' THEN 'Google-OAuth, Facebook-OAuth, Microsoft-OAuth, GitHub-OAuth, Auth0, Okta'
        ELSE 'Sin tipos definidos'
    END as tipos_incluidos
FROM categorias 
WHERE ambito = 'servidor' 
ORDER BY nombre;

-- Mostrar estadísticas finales
SELECT 
    'Resumen:' as estadistica,
    '' as valor;

SELECT 
    'Total categorías por ámbito' as estadistica,
    CONCAT(ambito, ': ', COUNT(*)) as valor
FROM categorias 
WHERE activo = true 
GROUP BY ambito 
ORDER BY ambito;

-- Crear vista opcional para mapeo de tipos a categorías
CREATE OR REPLACE VIEW vista_tipos_servidor_categoria AS
SELECT 
    'SQLServer' as tipo_servidor, 
    (SELECT id FROM categorias WHERE nombre = 'Bases de Datos Relacionales' AND ambito = 'servidor') as categoria_id,
    'Bases de Datos Relacionales' as categoria_nombre
UNION ALL SELECT 'Oracle', (SELECT id FROM categorias WHERE nombre = 'Bases de Datos Relacionales' AND ambito = 'servidor'), 'Bases de Datos Relacionales'
UNION ALL SELECT 'MySQL', (SELECT id FROM categorias WHERE nombre = 'Bases de Datos Relacionales' AND ambito = 'servidor'), 'Bases de Datos Relacionales'  
UNION ALL SELECT 'PostgreSQL', (SELECT id FROM categorias WHERE nombre = 'Bases de Datos Relacionales' AND ambito = 'servidor'), 'Bases de Datos Relacionales'
UNION ALL SELECT 'MongoDB', (SELECT id FROM categorias WHERE nombre = 'Bases de Datos NoSQL' AND ambito = 'servidor'), 'Bases de Datos NoSQL'
UNION ALL SELECT 'Redis', (SELECT id FROM categorias WHERE nombre = 'Bases de Datos NoSQL' AND ambito = 'servidor'), 'Bases de Datos NoSQL'
UNION ALL SELECT 'Snowflake', (SELECT id FROM categorias WHERE nombre = 'Bases de Datos Analíticas' AND ambito = 'servidor'), 'Bases de Datos Analíticas'
UNION ALL SELECT 'BigQuery', (SELECT id FROM categorias WHERE nombre = 'Bases de Datos Analíticas' AND ambito = 'servidor'), 'Bases de Datos Analíticas'
UNION ALL SELECT 'REST', (SELECT id FROM categorias WHERE nombre = 'APIs y Servicios' AND ambito = 'servidor'), 'APIs y Servicios'
UNION ALL SELECT 'SOAP', (SELECT id FROM categorias WHERE nombre = 'APIs y Servicios' AND ambito = 'servidor'), 'APIs y Servicios'
UNION ALL SELECT 'Kafka', (SELECT id FROM categorias WHERE nombre = 'Servicios en Tiempo Real' AND ambito = 'servidor'), 'Servicios en Tiempo Real'
UNION ALL SELECT 'RabbitMQ', (SELECT id FROM categorias WHERE nombre = 'Servicios en Tiempo Real' AND ambito = 'servidor'), 'Servicios en Tiempo Real'
UNION ALL SELECT 'Firebase', (SELECT id FROM categorias WHERE nombre = 'Servicios Híbridos' AND ambito = 'servidor'), 'Servicios Híbridos'
UNION ALL SELECT 'Supabase', (SELECT id FROM categorias WHERE nombre = 'Servicios Híbridos' AND ambito = 'servidor'), 'Servicios Híbridos'
UNION ALL SELECT 'SocketTCP', (SELECT id FROM categorias WHERE nombre = 'Conexiones por Socket' AND ambito = 'servidor'), 'Conexiones por Socket'
UNION ALL SELECT 'WhatsApp', (SELECT id FROM categorias WHERE nombre = 'Servicios de Comunicación' AND ambito = 'servidor'), 'Servicios de Comunicación'
UNION ALL SELECT 'SMS', (SELECT id FROM categorias WHERE nombre = 'Servicios de Comunicación' AND ambito = 'servidor'), 'Servicios de Comunicación'
UNION ALL SELECT 'Email', (SELECT id FROM categorias WHERE nombre = 'Servicios de Comunicación' AND ambito = 'servidor'), 'Servicios de Comunicación'
UNION ALL SELECT 'Telegram', (SELECT id FROM categorias WHERE nombre = 'Servicios de Comunicación' AND ambito = 'servidor'), 'Servicios de Comunicación'
UNION ALL SELECT 'Discord', (SELECT id FROM categorias WHERE nombre = 'Servicios de Comunicación' AND ambito = 'servidor'), 'Servicios de Comunicación'
UNION ALL SELECT 'Slack', (SELECT id FROM categorias WHERE nombre = 'Servicios de Comunicación' AND ambito = 'servidor'), 'Servicios de Comunicación'
UNION ALL SELECT 'Google-OAuth', (SELECT id FROM categorias WHERE nombre = 'Autenticación Externa' AND ambito = 'servidor'), 'Autenticación Externa'
UNION ALL SELECT 'Facebook-OAuth', (SELECT id FROM categorias WHERE nombre = 'Autenticación Externa' AND ambito = 'servidor'), 'Autenticación Externa'
UNION ALL SELECT 'Microsoft-OAuth', (SELECT id FROM categorias WHERE nombre = 'Autenticación Externa' AND ambito = 'servidor'), 'Autenticación Externa'
UNION ALL SELECT 'GitHub-OAuth', (SELECT id FROM categorias WHERE nombre = 'Autenticación Externa' AND ambito = 'servidor'), 'Autenticación Externa'
UNION ALL SELECT 'Auth0', (SELECT id FROM categorias WHERE nombre = 'Autenticación Externa' AND ambito = 'servidor'), 'Autenticación Externa'
UNION ALL SELECT 'Okta', (SELECT id FROM categorias WHERE nombre = 'Autenticación Externa' AND ambito = 'servidor'), 'Autenticación Externa';

-- Mostrar la vista creada
SELECT 'Vista de mapeo tipo -> categoría:' as info;
SELECT * FROM vista_tipos_servidor_categoria ORDER BY categoria_nombre, tipo_servidor;

RAISE NOTICE 'Script completado exitosamente. Se ha creado también una vista para mapear tipos de servidor a categorías.';