-- Migration: Enable Realtime for core tables
-- Created: 2026-01-11
-- Purpose: Enable real-time synchronization for core tables

-- Add tables to the realtime publication
-- This allows clients to receive live updates when data changes

ALTER PUBLICATION supabase_realtime ADD TABLE locations;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE finances;

-- Note: After running this migration, clients subscribed to these tables
-- will receive INSERT, UPDATE, and DELETE events in real-time
