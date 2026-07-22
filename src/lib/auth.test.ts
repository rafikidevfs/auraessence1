import { describe, expect, it } from "vitest";
import { isAdminRole, toUserRole, signInWithPassword } from "./auth";

describe("role helpers", () => {
  it("normalizes known role values", () => {
    expect(toUserRole("ADMIN")).toBe("admin");
    expect(toUserRole("admin")).toBe("admin");
    expect(toUserRole("customer")).toBe("customer");
    expect(toUserRole("manager")).toBe("customer");
  });

  it("detects admin access", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("customer")).toBe(false);
  });
});

describe("authentication", () => {
  it("rejects login when the Supabase backend is not configured", async () => {
    await expect(signInWithPassword("usuario@teste.com", "senha123")).rejects.toThrow(/autenticação/i);
  });
});
