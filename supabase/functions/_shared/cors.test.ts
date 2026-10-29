import { parseAllowedOrigins, resolveAllowedOrigin } from "./cors";

describe("CORS compartido", () => {
  const allowed = ["https://sintonia.app"];

  it("acepta pedidos sin Origin (apps nativas)", () => {
    expect(resolveAllowedOrigin(null, allowed)).toEqual({ allowed: true, header: null });
  });
  it("acepta solo los orígenes de la lista", () => {
    expect(resolveAllowedOrigin("https://sintonia.app", allowed)).toEqual({
      allowed: true,
      header: "https://sintonia.app",
    });
    expect(resolveAllowedOrigin("https://otro.com", allowed).allowed).toBe(false);
  });
  it("con lista vacía rechaza cualquier navegador", () => {
    expect(resolveAllowedOrigin("https://sintonia.app", []).allowed).toBe(false);
  });
  it("parsea la variable de entorno", () => {
    expect(parseAllowedOrigins(" a , b,,")).toEqual(["a", "b"]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });
});
