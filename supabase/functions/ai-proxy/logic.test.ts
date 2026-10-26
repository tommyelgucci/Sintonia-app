import {
  MAX_CONTEXT_CHARS,
  MAX_QUESTION_CHARS,
  RateLimiter,
  buildSystemPrompt,
  clientIp,
  parseAllowedOrigins,
  parseBody,
  resolveAllowedOrigin,
} from "./logic";

describe("parseBody", () => {
  it("acepta un cuerpo válido y recorta la pregunta", () => {
    const r = parseBody({ question: "  ¿por qué me duele?  ", context: "x" });
    expect(r).toEqual({ ok: true, body: { question: "¿por qué me duele?", context: "x" } });
  });

  it("rechaza lo que no es objeto o le faltan campos", () => {
    expect(parseBody(null)).toMatchObject({ ok: false, status: 400 });
    expect(parseBody("hola")).toMatchObject({ ok: false, status: 400 });
    expect(parseBody({ question: "a" })).toMatchObject({ ok: false, status: 400 });
    expect(parseBody({ question: 1, context: "" })).toMatchObject({ ok: false, status: 400 });
  });

  it("rechaza pregunta vacía", () => {
    expect(parseBody({ question: "   ", context: "" })).toMatchObject({ ok: false, status: 400 });
  });

  it("rechaza pregunta o contexto demasiado largos", () => {
    const longQ = "a".repeat(MAX_QUESTION_CHARS + 1);
    const longC = "a".repeat(MAX_CONTEXT_CHARS + 1);
    expect(parseBody({ question: longQ, context: "" })).toMatchObject({ ok: false, status: 413 });
    expect(parseBody({ question: "a", context: longC })).toMatchObject({ ok: false, status: 413 });
  });
});

describe("CORS", () => {
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

describe("RateLimiter", () => {
  const rules = [
    { limit: 2, windowMs: 60_000 },
    { limit: 3, windowMs: 3_600_000 },
  ];

  it("deja pasar hasta el límite y después devuelve segundos de espera", () => {
    const rl = new RateLimiter(rules);
    expect(rl.check("ip", 0)).toBe(0);
    expect(rl.check("ip", 1_000)).toBe(0);
    expect(rl.check("ip", 2_000)).toBe(58);
  });

  it("libera cuando vence la ventana corta", () => {
    const rl = new RateLimiter(rules);
    rl.check("ip", 0);
    rl.check("ip", 1_000);
    expect(rl.check("ip", 61_000)).toBe(0);
  });

  it("respeta la ventana larga aunque la corta esté libre", () => {
    const rl = new RateLimiter(rules);
    rl.check("ip", 0);
    rl.check("ip", 1_000);
    rl.check("ip", 61_000);
    expect(rl.check("ip", 130_000)).toBe(3_600 - 130);
  });

  it("cuenta por separado cada clave y no registra los pedidos rechazados", () => {
    const rl = new RateLimiter(rules);
    rl.check("a", 0);
    rl.check("a", 0);
    expect(rl.check("a", 10)).toBeGreaterThan(0);
    expect(rl.check("b", 10)).toBe(0);
    expect(rl.check("a", 60_000)).toBe(0);
  });
});

describe("clientIp", () => {
  const h = (m: Record<string, string>) => ({ get: (k: string) => m[k] ?? null });
  it("toma la primera IP de x-forwarded-for", () => {
    expect(clientIp(h({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
  });
  it("cae a cf-connecting-ip y a un valor fijo", () => {
    expect(clientIp(h({ "cf-connecting-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(h({}))).toBe("desconocida");
  });
});

describe("buildSystemPrompt", () => {
  it("incluye las reglas y el contexto", () => {
    const p = buildSystemPrompt("Día 3 del ciclo");
    expect(p).toContain("Nunca afirmes un diagnóstico");
    expect(p).toContain("Día 3 del ciclo");
  });
});
