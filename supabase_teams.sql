-- Create Enums
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- 1. Create Teams Table
CREATE TABLE public.teams (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Team Members Table
CREATE TABLE public.team_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role team_role DEFAULT 'member' NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, user_id)
);

-- 3. Create Team Invitations Table
CREATE TABLE public.team_invitations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role team_role DEFAULT 'member' NOT NULL,
  token text NOT NULL UNIQUE,
  status invitation_status DEFAULT 'pending' NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Add team_id to existing tables
-- We don't drop existing user_id to maintain backwards compatibility 
-- and because users might still want to own a resource uniquely within a team in the future.
ALTER TABLE public.projects ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.time_entries ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;

-- Default existing data to the user's new personal workspace below

-- 5. Helper function to check if user belongs to team
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update user signup trigger to auto-create Personal Workspace
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_team_id uuid;
  workspace_name text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, default_paper_size, default_tax_rate)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'A4', 0);
  
  -- Determine workspace name
  workspace_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Workspace';

  -- Create personal workspace
  INSERT INTO public.teams (name, owner_id)
  VALUES (workspace_name, new.id)
  RETURNING id INTO new_team_id;

  -- Add user as team owner
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, new.id, 'owner');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies for New Tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Teams
CREATE POLICY "Users can view their teams" ON public.teams
  FOR SELECT USING (id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Owners can update their teams" ON public.teams
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their teams" ON public.teams
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Team Members
CREATE POLICY "Users can view members of their teams" ON public.team_members
  FOR SELECT USING (is_team_member(team_id));

CREATE POLICY "Team admins/owners can add members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = public.team_members.team_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins/owners can update members" ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = public.team_members.team_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins/owners can remove members" ON public.team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = public.team_members.team_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    ) OR user_id = auth.uid() -- Allow users to leave
  );

-- Team Invitations
CREATE POLICY "Users can view invitations for their teams" ON public.team_invitations
  FOR SELECT USING (is_team_member(team_id));

CREATE POLICY "Team admins/owners can create invitations" ON public.team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = public.team_invitations.team_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team admins/owners can delete invitations" ON public.team_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = public.team_invitations.team_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Function to backfill team_id for existing users
CREATE OR REPLACE FUNCTION public.backfill_teams()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  new_team_id uuid;
  workspace_name text;
BEGIN
  FOR profile_record IN SELECT * FROM public.profiles LOOP
    -- Check if user already has a team
    IF NOT EXISTS (SELECT 1 FROM public.teams WHERE owner_id = profile_record.id) THEN
      workspace_name := COALESCE(profile_record.full_name, split_part(profile_record.email, '@', 1)) || '''s Workspace';
      
      -- Create team
      INSERT INTO public.teams (name, owner_id)
      VALUES (workspace_name, profile_record.id)
      RETURNING id INTO new_team_id;

      -- Add as owner
      INSERT INTO public.team_members (team_id, user_id, role)
      VALUES (new_team_id, profile_record.id, 'owner');

      -- Update existing records
      UPDATE public.projects SET team_id = new_team_id WHERE user_id = profile_record.id AND team_id IS NULL;
      UPDATE public.clients SET team_id = new_team_id WHERE user_id = profile_record.id AND team_id IS NULL;
      UPDATE public.invoices SET team_id = new_team_id WHERE user_id = profile_record.id AND team_id IS NULL;
      UPDATE public.tasks SET team_id = new_team_id WHERE user_id = profile_record.id AND team_id IS NULL;
      UPDATE public.time_entries SET team_id = new_team_id WHERE user_id = profile_record.id AND team_id IS NULL;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the backfill function to migrate existing data
SELECT public.backfill_teams();

-- Drop the function after use
DROP FUNCTION public.backfill_teams();
