-- Crear bucket para informes en Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('informes', 'informes', true)
ON CONFLICT DO NOTHING;

-- Política para subir archivos
CREATE POLICY "public upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'informes');

CREATE POLICY "public read" ON storage.objects
FOR SELECT USING (bucket_id = 'informes');

-- Arreglar RLS de informes
DROP POLICY IF EXISTS "auth only" ON informes;
CREATE POLICY "open" ON informes FOR ALL USING (true);
