-- Jira Lite Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team Invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Project Favorites table
CREATE TABLE IF NOT EXISTS project_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(project_id, user_id)
);

-- Project Statuses table
CREATE TABLE IF NOT EXISTS project_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  position INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  wip_limit INTEGER
);

-- Project Labels table
CREATE TABLE IF NOT EXISTS project_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  color VARCHAR(7) NOT NULL
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status_id UUID NOT NULL REFERENCES project_statuses(id),
  priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  assignee_id UUID REFERENCES users(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  due_date DATE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Issue Labels junction table
CREATE TABLE IF NOT EXISTS issue_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES project_labels(id) ON DELETE CASCADE,
  UNIQUE(issue_id, label_id)
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0
);

-- Issue History table
CREATE TABLE IF NOT EXISTS issue_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  field VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- AI Cache table
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('summary', 'suggestion', 'comment_summary')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invalidated_at TIMESTAMPTZ
);

-- AI Rate Limits table
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_assignee_id ON issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_status_id ON issues(status_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_team_id ON activity_logs(team_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can read all, update own
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams: members can view
CREATE POLICY "Team members can view teams" ON teams FOR SELECT 
  USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Team owners/admins can update" ON teams FOR UPDATE 
  USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')));
CREATE POLICY "Team owners can delete" ON teams FOR DELETE 
  USING (owner_id = auth.uid());

-- Team Members
CREATE POLICY "Team members can view members" ON team_members FOR SELECT 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "Team owners/admins can manage members" ON team_members FOR ALL 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')));

-- Team Invitations
CREATE POLICY "Team members can view invitations" ON team_invitations FOR SELECT 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()) OR email = (SELECT email FROM users WHERE id = auth.uid()));
CREATE POLICY "Team owners/admins can create invitations" ON team_invitations FOR INSERT 
  WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')));

-- Projects
CREATE POLICY "Team members can view projects" ON projects FOR SELECT 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "Team members can create projects" ON projects FOR INSERT 
  WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "Project owners/team admins can update" ON projects FOR UPDATE 
  USING (owner_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')));
CREATE POLICY "Project owners/team admins can delete" ON projects FOR DELETE 
  USING (owner_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')));

-- Project Favorites
CREATE POLICY "Users can manage own favorites" ON project_favorites FOR ALL USING (user_id = auth.uid());

-- Project Statuses
CREATE POLICY "Team members can view statuses" ON project_statuses FOR SELECT 
  USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));
CREATE POLICY "Team members can manage statuses" ON project_statuses FOR ALL 
  USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));

-- Project Labels
CREATE POLICY "Team members can view labels" ON project_labels FOR SELECT 
  USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));
CREATE POLICY "Team members can manage labels" ON project_labels FOR ALL 
  USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));

-- Issues
CREATE POLICY "Team members can view issues" ON issues FOR SELECT 
  USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));
CREATE POLICY "Team members can create issues" ON issues FOR INSERT 
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));
CREATE POLICY "Team members can update issues" ON issues FOR UPDATE 
  USING (project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));
CREATE POLICY "Issue owners/admins can delete" ON issues FOR DELETE 
  USING (owner_id = auth.uid() OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN'))));

-- Issue Labels
CREATE POLICY "Team members can manage issue labels" ON issue_labels FOR ALL 
  USING (issue_id IN (SELECT id FROM issues WHERE project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))));

-- Subtasks
CREATE POLICY "Team members can manage subtasks" ON subtasks FOR ALL 
  USING (issue_id IN (SELECT id FROM issues WHERE project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))));

-- Issue History
CREATE POLICY "Team members can view history" ON issue_history FOR SELECT 
  USING (issue_id IN (SELECT id FROM issues WHERE project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))));
CREATE POLICY "Team members can create history" ON issue_history FOR INSERT 
  WITH CHECK (issue_id IN (SELECT id FROM issues WHERE project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))));

-- Comments
CREATE POLICY "Team members can view comments" ON comments FOR SELECT 
  USING (issue_id IN (SELECT id FROM issues WHERE project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))));
CREATE POLICY "Team members can create comments" ON comments FOR INSERT 
  WITH CHECK (issue_id IN (SELECT id FROM issues WHERE project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))));
CREATE POLICY "Comment owners can update" ON comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Comment owners/admins can delete" ON comments FOR DELETE 
  USING (user_id = auth.uid() OR issue_id IN (SELECT id FROM issues WHERE owner_id = auth.uid() OR project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN')))));

-- AI Cache
CREATE POLICY "Team members can manage AI cache" ON ai_cache FOR ALL 
  USING (issue_id IN (SELECT id FROM issues WHERE project_id IN (SELECT id FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))));

-- AI Rate Limits
CREATE POLICY "Users can manage own rate limits" ON ai_rate_limits FOR ALL USING (user_id = auth.uid());

-- Notifications
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- Activity Logs
CREATE POLICY "Team members can view activity logs" ON activity_logs FOR SELECT 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "Team members can create activity logs" ON activity_logs FOR INSERT 
  WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for issues updated_at
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
