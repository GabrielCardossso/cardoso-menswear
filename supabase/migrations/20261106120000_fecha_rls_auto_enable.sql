-- O "Enable automatic RLS" do projeto criou public.rls_auto_enable() como SECURITY DEFINER, e o
-- Security Advisor avisou que visitante e usuário logado podem chamá-la pela API. Ela só serve ao
-- gatilho de evento do próprio Supabase (que não precisa de EXECUTE), então fica fechada para a API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
