-- Alter the pic_project column to LONGTEXT to accommodate larger image data
ALTER TABLE projects MODIFY COLUMN pic_project LONGTEXT;
