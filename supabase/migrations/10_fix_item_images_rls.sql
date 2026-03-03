-- Fix RLS policies for malroda_item_images table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view images for their farm items" ON public.malroda_item_images;
DROP POLICY IF EXISTS "Users can add images to their farm items" ON public.malroda_item_images;
DROP POLICY IF EXISTS "Users can delete images from their farm items" ON public.malroda_item_images;

-- Recreate with fixed policies

-- SELECT policy
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

-- INSERT policy - simplified to check if user belongs to the item's farm
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

-- DELETE policy
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

-- Also add UPDATE policy for reordering images
CREATE POLICY "Users can update images for their farm items" ON public.malroda_item_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.malroda_items i
      JOIN public.malroda_farm_members fm ON i.farm_id = fm.farm_id
      WHERE i.id = malroda_item_images.item_id
      AND fm.user_id = auth.uid()
    )
  );

-- Storage bucket policies (run these in Supabase Dashboard -> Storage -> Policies)
-- For bucket: item-images

-- Policy 1: Allow authenticated users to upload to their folder
-- Name: "Users can upload images"
-- Allowed operation: INSERT
-- Policy definition: (auth.uid() IS NOT NULL)

-- Policy 2: Allow public read access
-- Name: "Public read access"
-- Allowed operation: SELECT
-- Policy definition: true

-- Policy 3: Allow users to delete their uploads
-- Name: "Users can delete their images"
-- Allowed operation: DELETE
-- Policy definition: (auth.uid() IS NOT NULL)
