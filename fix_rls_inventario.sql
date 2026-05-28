-- Arreglar políticas para que funcionen los joins
DROP POLICY IF EXISTS "public access" ON inv_grupos;
DROP POLICY IF EXISTS "public access" ON inv_subgrupos;
DROP POLICY IF EXISTS "public access" ON inv_productos;
DROP POLICY IF EXISTS "public access" ON inv_movimientos;
DROP POLICY IF EXISTS "auth only" ON inv_grupos;
DROP POLICY IF EXISTS "auth only" ON inv_subgrupos;
DROP POLICY IF EXISTS "auth only" ON inv_productos;
DROP POLICY IF EXISTS "auth only" ON inv_movimientos;
DROP POLICY IF EXISTS "auth read" ON inv_grupos;
DROP POLICY IF EXISTS "auth read" ON inv_subgrupos;
DROP POLICY IF EXISTS "auth read" ON inv_productos;
DROP POLICY IF EXISTS "auth read" ON inv_movimientos;

CREATE POLICY "open" ON inv_grupos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON inv_subgrupos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON inv_productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON inv_movimientos FOR ALL USING (true) WITH CHECK (true);
