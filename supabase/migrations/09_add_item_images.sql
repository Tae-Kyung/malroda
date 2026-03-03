-- Migration: Add image support for inventory items
-- One item can have multiple images

-- 1. Create item_images table (one-to-many relationship)
CREATE TABLE IF NOT EXISTS public.malroda_item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.malroda_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT, -- Supabase Storage path for deletion
  display_order INTEGER DEFAULT 0,
  caption VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES public.malroda_profiles(id) ON DELETE SET NULL
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_item_images_item_id ON public.malroda_item_images(item_id);

-- 3. Enable RLS
ALTER TABLE public.malroda_item_images ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow users to view images for items in their farm
CREATE POLICY "Users can view images for their farm items" ON public.malroda_item_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.malroda_items i
      JOIN public.malroda_farm_members fm ON i.farm_id = fm.farm_id
      WHERE i.id = malroda_item_images.item_id
      AND fm.user_id = auth.uid()
    )
  );

-- Allow users to insert images for items in their farm
CREATE POLICY "Users can add images to their farm items" ON public.malroda_item_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.malroda_items i
      JOIN public.malroda_farm_members fm ON i.farm_id = fm.farm_id
      WHERE i.id = item_id
      AND fm.user_id = auth.uid()
    )
  );

-- Allow users to delete images for items in their farm
CREATE POLICY "Users can delete images from their farm items" ON public.malroda_item_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.malroda_items i
      JOIN public.malroda_farm_members fm ON i.farm_id = fm.farm_id
      WHERE i.id = malroda_item_images.item_id
      AND fm.user_id = auth.uid()
    )
  );

-- 5. Create Supabase Storage bucket for item images (run in Supabase Dashboard)
-- Note: Storage bucket creation is done via Supabase Dashboard or CLI, not SQL
-- Bucket name: item-images
-- Public access: true (for easy image display)

-- 6. Update the inventory summary view to include image count
DROP VIEW IF EXISTS public.v_malroda_inventory_summary;
CREATE OR REPLACE VIEW public.v_malroda_inventory_summary AS
SELECT
  f.id AS farm_id,
  f.farm_name,
  i.id AS item_id,
  i.item_name,
  i.grade,
  i.zone,
  i.current_stock,
  i.unit,
  i.updated_at AS last_updated,
  (SELECT COUNT(*) FROM public.malroda_item_images img WHERE img.item_id = i.id) AS image_count,
  (SELECT image_url FROM public.malroda_item_images img WHERE img.item_id = i.id ORDER BY display_order ASC LIMIT 1) AS thumbnail_url
FROM public.malroda_farms f
JOIN public.malroda_items i ON f.id = i.farm_id;

-- 7. Helper function to get all images for an item
CREATE OR REPLACE FUNCTION public.get_item_images(p_item_id UUID)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  display_order INTEGER,
  caption VARCHAR,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, image_url, display_order, caption, created_at
  FROM public.malroda_item_images
  WHERE item_id = p_item_id
  ORDER BY display_order ASC, created_at ASC;
$$;
