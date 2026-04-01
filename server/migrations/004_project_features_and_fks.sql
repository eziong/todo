-- 1. projects에 features 컬럼 추가
ALTER TABLE projects ADD COLUMN features text[] NOT NULL DEFAULT '{tasks,ideas,notes,links}';

-- 2. notes에 project_id FK 추가
ALTER TABLE notes ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX notes_project_id_idx ON notes(project_id);

-- 3. links에 project_id FK 추가
ALTER TABLE links ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX links_project_id_idx ON links(project_id);
