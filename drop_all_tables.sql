DO $$ DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    -- Drop all tables in auth schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'auth') LOOP
        EXECUTE 'DROP TABLE IF EXISTS auth.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    -- Drop all functions in public schema
    FOR r IN (SELECT routine_name, routine_type FROM information_schema.routines WHERE specific_schema = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || '() CASCADE';
    END LOOP;
    -- Drop all functions in auth schema
    FOR r IN (SELECT routine_name, routine_type FROM information_schema.routines WHERE specific_schema = 'auth') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS auth.' || quote_ident(r.routine_name) || '() CASCADE';
    END LOOP;
    -- Drop all types in public schema
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;
