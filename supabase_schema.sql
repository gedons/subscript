-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table (linked to auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  notification_enabled boolean default true,
  currency text default 'USD',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create subscriptions table
create table subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  cost numeric(10, 2) not null,
  renewal_date date not null,
  category text,
  billing_cycle text default 'Monthly', -- 'Monthly', 'Yearly', 'Weekly'
  reminder_days_before integer default 3,
  is_active boolean default true,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create reminders log table (to track sent notifications)
create table reminders_log (
  id uuid default uuid_generate_v4() primary key,
  subscription_id uuid references subscriptions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text -- 'sent', 'failed'
);

-- Set up Row Level Security (RLS)

-- Profiles RLS
alter table profiles enable row level security;
-- Optimized with (select auth.uid()) syntax
create policy "Users can view their own profile" on profiles for select using ((select auth.uid()) = id);
create policy "Users can update their own profile" on profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Subscriptions RLS
alter table subscriptions enable row level security;
create policy "Users can view their own subscriptions" on subscriptions for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own subscriptions" on subscriptions for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own subscriptions" on subscriptions for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own subscriptions" on subscriptions for delete using ((select auth.uid()) = user_id);

-- Reminders Log RLS
alter table reminders_log enable row level security;
create policy "Users can view their own reminder logs" on reminders_log for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own reminder logs" on reminders_log for insert with check ((select auth.uid()) = user_id);

-- AUTOMATION: Create a profile automatically when a user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer; -- Set to security definer for trigger reliability

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
