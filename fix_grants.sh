#!/bin/bash
sed -i '' 's/revoke all on function public.create_order(text, text, jsonb) from public/revoke all on function public.create_order(text, text, text, jsonb) from public/g' supabase/migrations/20261004160817_initial_schema.sql
sed -i '' 's/grant execute on function public.create_order(text, text, jsonb) to anon, authenticated/grant execute on function public.create_order(text, text, text, jsonb) to anon, authenticated/g' supabase/migrations/20261004160817_initial_schema.sql
