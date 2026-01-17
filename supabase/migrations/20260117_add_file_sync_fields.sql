-- Add synchronization fields to thesis_nodes table
ALTER TABLE thesis_nodes 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS file_last_modified TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS content TEXT;

COMMENT ON COLUMN thesis_nodes.last_synced_at IS 'Timestamp of the last successful sync with the file system';
COMMENT ON COLUMN thesis_nodes.file_last_modified IS 'Last modified timestamp of the actual file on disk';
COMMENT ON COLUMN thesis_nodes.content IS 'Text content extracted from the file for search and indexing';

-- Create an index for faster search on content (Optional, but good for Global Search)
CREATE INDEX IF NOT EXISTS idx_thesis_nodes_content ON thesis_nodes USING GIN (to_tsvector('arabic', content));
