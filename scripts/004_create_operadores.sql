-- Crear tabla operadores
CREATE TABLE IF NOT EXISTS operadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  numero_empleado VARCHAR(50) UNIQUE,
  tipo_licencia VARCHAR(50),
  numero_licencia VARCHAR(50) UNIQUE,
  licencia_vigencia DATE,
  telefono VARCHAR(20),
  email VARCHAR(100),
  estatus VARCHAR(20) DEFAULT 'Activo',
  documento_numero VARCHAR(50) UNIQUE,
  fecha_contratacion DATE,
  vigencia_contrato DATE,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_operadores_nombre ON operadores(nombre);
CREATE INDEX idx_operadores_apellido ON operadores(apellido);
CREATE INDEX idx_operadores_numero_empleado ON operadores(numero_empleado);
CREATE INDEX idx_operadores_estatus ON operadores(estatus);
CREATE INDEX idx_operadores_numero_licencia ON operadores(numero_licencia);

-- Habilitar RLS
ALTER TABLE operadores ENABLE ROW LEVEL SECURITY;

-- Política para leer (todos pueden ver)
CREATE POLICY "Usuarios autenticados pueden ver operadores"
  ON operadores FOR SELECT
  USING (TRUE);

-- Política para crear (solo admin)
CREATE POLICY "Solo admin puede crear operadores"
  ON operadores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para actualizar (solo admin)
CREATE POLICY "Solo admin puede actualizar operadores"
  ON operadores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política para eliminar (solo admin)
CREATE POLICY "Solo admin puede eliminar operadores"
  ON operadores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
