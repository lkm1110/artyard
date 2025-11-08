-- Add artist_name field to artworks table for resale support
-- This allows sellers to specify the original artist if different from the seller

-- Add artist_name column
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS artist_name TEXT;

-- Set existing artworks' artist_name to the author's handle
UPDATE artworks 
SET artist_name = (
  SELECT handle 
  FROM profiles 
  WHERE id = artworks.author_id
)
WHERE artist_name IS NULL;

-- Add comment
COMMENT ON COLUMN artworks.artist_name IS 'Original artist name - can be different from seller for resale items';


