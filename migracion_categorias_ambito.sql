-- Migración: Agregar campo 'ambito' a categorías y 'categoria_id' a servidores
-- Fecha: 2025-08-09
-- Propósito: Permitir categorías por ámbito (proceso, servidor, canal)

-- 1. Agregar campo 'ambito' a la tabla categorias
ALTER TABLE categorias ADD COLUMN ambito VARCHAR(20) DEFAULT 'proceso';

-- 2. Actualizar categorías existentes para que sean de ámbito 'proceso'
UPDATE categorias SET ambito = 'proceso' WHERE ambito IS NULL OR ambito = '';

-- 3. Hacer el campo 'ambito' obligatorio
ALTER TABLE categorias ALTER COLUMN ambito SET NOT NULL;

-- 4. Agregar campo 'categoria_id' a la tabla servidores (nullable)
ALTER TABLE servidores ADD COLUMN categoria_id VARCHAR;

-- 5. Crear categorías por defecto para servidores (opcional)
INSERT INTO categorias (nombre, color, activo, ambito) VALUES
    ('Bases de Datos', '#2563eb', true, 'servidor'),
    ('APIs Web', '#059669', true, 'servidor'),
    ('NoSQL', '#dc2626', true, 'servidor'),
    ('Mensajería', '#7c3aed', true, 'servidor'),
    ('Servicios OAuth', '#f59e0b', true, 'servidor'),
    ('Otros Servicios', '#6b7280', true, 'servidor');

-- 6. Crear categorías por defecto para canales (opcional)
INSERT INTO categorias (nombre, color, activo, ambito) VALUES
    ('Entrada', '#10b981', true, 'canal'),
    ('Salida', '#3b82f6', true, 'canal'),
    ('Bidireccional', '#8b5cf6', true, 'canal');

-- Verificar la migración
SELECT 'Categorías por ámbito:' as info;
SELECT ambito, COUNT(*) as cantidad 
FROM categorias 
WHERE activo = true 
GROUP BY ambito 
ORDER BY ambito;

SELECT 'Estructura de tabla servidores:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'servidores' 
ORDER BY ordinal_position;

-- Crear índices para mejor rendimiento (opcional)
CREATE INDEX IF NOT EXISTS idx_categorias_ambito ON categorias(ambito);
CREATE INDEX IF NOT EXISTS idx_servidores_categoria ON servidores(categoria_id);