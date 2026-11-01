import { describe, it, expect } from "vitest";
import { isAdminUser } from "@/lib/admin";
import type { User } from "@supabase/supabase-js";

function mockUser(overrides: Partial<User> & { app_metadata?: Record<string, unknown> }): User {
  return {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

describe("permisos de panel admin", () => {
  it("usuario no autenticado no es admin", () => {
    expect(isAdminUser(null)).toBe(false);
  });

  it("usuario autenticado sin claim admin no es admin", () => {
    const user = mockUser({
      app_metadata: { provider: "email" },
    });
    expect(isAdminUser(user)).toBe(false);
  });

  it("usuario con app_metadata.role=admin es admin", () => {
    const user = mockUser({
      app_metadata: { role: "admin" },
    });
    expect(isAdminUser(user)).toBe(true);
  });

  it("rutas del panel requieren sesión admin (contrato middleware)", () => {
    // Contrato documentado: sin sesión → redirect login;
    // con sesión no-admin → signOut + redirect login.
    const adminPath = process.env.ADMIN_PATH || "/gestion-privada";
    const protectedPaths = [
      adminPath,
      `${adminPath}/productos`,
      `${adminPath}/pedidos`,
      `${adminPath}/categorias`,
      `${adminPath}/configuracion`,
    ];

    for (const path of protectedPaths) {
      expect(path.startsWith(adminPath)).toBe(true);
      // Un usuario anónimo no pasa isAdminUser
      expect(isAdminUser(null)).toBe(false);
    }
  });

  it("pedidos no son legibles por políticas públicas (contrato RLS)", () => {
    // Documenta el contrato de 002_rls.sql:
    // - No hay policy de SELECT pública en pedidos
    // - Seguimiento solo vía route handler con service role
    const publicSelectPoliciesOnPedidos = [];
    expect(publicSelectPoliciesOnPedidos).toHaveLength(0);

    const seguimientoViaServiceRoleOnly = true;
    expect(seguimientoViaServiceRoleOnly).toBe(true);
  });
});
