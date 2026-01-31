-- Add street_line column to saved_locations
alter table saved_locations 
add column if not exists street_line text;
