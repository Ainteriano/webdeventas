-- Permisos de ejecución de helpers
GRANT EXECUTE ON FUNCTION generar_codigo_pedido() TO service_role;
GRANT EXECUTE ON FUNCTION es_admin() TO authenticated, anon, service_role;

-- Asegurar que service_role puede operar sin RLS (bypass nativo),
-- y que authenticated solo vía policies/es_admin.
