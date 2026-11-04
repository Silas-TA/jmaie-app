-- Local development only: recreates the v0.1 (Prisma) tables so the app can be
-- tested without the production database. Never run this against production.

CREATE TYPE "CategoryType" AS ENUM ('income_salary','income_haircut','income_other','fixed','subscription','family_giving','debt','variable');
CREATE TYPE "Direction" AS ENUM ('income','expense');
CREATE TYPE "EntrySource" AS ENUM ('manual','ai_agent','csv_import');
CREATE TYPE "GoalType" AS ENUM ('savings','debt_payoff');
CREATE TYPE "MessageRole" AS ENUM ('user','assistant','tool');

CREATE TABLE categories (
  id text PRIMARY KEY, name text NOT NULL, type "CategoryType" NOT NULL, color text NOT NULL,
  icon text, is_archived boolean NOT NULL DEFAULT false);

CREATE TABLE budgets (
  id text PRIMARY KEY, category_id text NOT NULL REFERENCES categories(id), year int NOT NULL, month int NOT NULL,
  budgeted_amount numeric(10,2) NOT NULL, notes text, UNIQUE (category_id, year, month));

CREATE TABLE transactions (
  id text PRIMARY KEY, category_id text REFERENCES categories(id), direction "Direction" NOT NULL,
  amount numeric(10,2) NOT NULL, date date NOT NULL, description text NOT NULL,
  source "EntrySource" NOT NULL DEFAULT 'manual', is_business_expense boolean NOT NULL DEFAULT false,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE haircut_clients (id text PRIMARY KEY, name text NOT NULL, first_booking_date date, notes text);

CREATE TABLE haircut_bookings (
  id text PRIMARY KEY, client_id text REFERENCES haircut_clients(id), date date NOT NULL, amount numeric(10,2) NOT NULL,
  notes text, paid boolean NOT NULL DEFAULT true, source "EntrySource" NOT NULL DEFAULT 'manual',
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE goals (
  id text PRIMARY KEY, name text NOT NULL, type "GoalType" NOT NULL, target_amount numeric(10,2) NOT NULL,
  current_amount numeric(10,2), target_date date, linked_category_id text REFERENCES categories(id),
  tracks_monthly_savings boolean NOT NULL DEFAULT false, created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE ai_conversations (id text PRIMARY KEY, role "MessageRole" NOT NULL, content text NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);

-- Sample data resembling the live app (Oct 2026)
INSERT INTO categories VALUES
 ('c_salary','Job Salary','income_salary','#34D399',null,false),
 ('c_cut','Haircut Business','income_haircut','#A78BFA',null,false),
 ('c_other','Other Income','income_other','#60A5FA',null,false),
 ('c_net','Home Internet','fixed','#94A3B8',null,false),
 ('c_phone','Phone Bill','fixed','#94A3B8',null,false),
 ('c_rent','Rent + Utilities','fixed','#F87171',null,false),
 ('c_save','Savings','fixed','#34D399',null,false),
 ('c_transport','Transportation','fixed','#FBBF24',null,false),
 ('c_google','Google One','subscription','#60A5FA',null,false),
 ('c_gym','Gym','subscription','#F472B6',null,false),
 ('c_spotify','Spotify','subscription','#34D399',null,false),
 ('c_icloud','iCloud','subscription','#93C5FD',null,false),
 ('c_driving','Driving School','debt','#FB7185',null,false),
 ('c_braids','Braids','variable','#FB923C',null,false),
 ('c_food','Food & Groceries','variable','#4ADE80',null,false),
 ('c_cutexp','Haircut Business Expenses','variable','#C084FC',null,false),
 ('c_jeremiah','Jeremiah','variable','#FCD34D',null,false),
 ('c_mum','Mum','variable','#F9A8D4',null,false),
 ('c_outing','Outing','variable','#22D3EE',null,false);

INSERT INTO transactions (id, category_id, direction, amount, date, description) VALUES
 ('t1','c_salary','income',1297,'2026-10-10','Salary'),
 ('t2','c_rent','expense',350,'2026-10-01','Rent + utilities'),
 ('t3','c_phone','expense',364,'2026-10-05','Phone bill'),
 ('t4','c_food','expense',300,'2026-10-12','Groceries'),
 ('t5','c_gym','expense',27,'2026-10-02','Gym'),
 ('t6','c_mum','expense',50,'2026-10-15','Mum'),
 ('t7','c_salary','income',1100,'2026-11-03','Salary (part)'),
 ('t8','c_food','expense',42.5,'2026-11-02','Lidl');

INSERT INTO haircut_clients VALUES ('hc1','Tomas','2026-09-01',null);
INSERT INTO haircut_bookings (id, client_id, date, amount, paid) VALUES
 ('hb1','hc1','2026-10-04',15,true), ('hb2','hc1','2026-11-01',15,true), ('hb3',null,'2026-11-03',20,false);
