-- Drop Salary Related Tables and Types
DROP TABLE IF EXISTS salary_items;
DROP TABLE IF EXISTS salary_statements;
DROP TABLE IF EXISTS salary_concepts;

-- Optionally remove buckets if we created them (though usually managed via API)
-- We can try deleting the storage.buckets row if we know the ID, but it's safer to leave buckets or delete via UI.
-- Focusing on Data Tables.
