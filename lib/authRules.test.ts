import {
  DELETE_ACCOUNT_WARNING,
  authErrorMessage,
  deleteAccountErrorMessage,
  isValidEmail,
  isValidOtpCode,
  normalizeEmail,
  otpTypeFor,
} from "./authRules";

describe("normalizeEmail", () => {
  it("saca espacios y pasa a minúsculas", () => {
    expect(normalizeEmail("  Ana@Correo.COM ")).toBe("ana@correo.com");
  });
});

describe("isValidEmail", () => {
  it("acepta direcciones normales", () => {
    expect(isValidEmail("ana@correo.com")).toBe(true);
    expect(isValidEmail("ana.perez+ciclo@mail.com.ar")).toBe(true);
  });

  it("acepta con espacios alrededor, porque se normaliza antes", () => {
    expect(isValidEmail(" ana@correo.com ")).toBe(true);
  });

  it("rechaza lo que no puede ser un mail", () => {
    expect(isValidEmail("ana")).toBe(false);
    expect(isValidEmail("ana@correo")).toBe(false);
    expect(isValidEmail("ana@@correo.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("rechaza espacios en el medio", () => {
    expect(isValidEmail("an a@correo.com")).toBe(false);
  });

  it("rechaza una dirección absurdamente larga", () => {
    expect(isValidEmail(`${"a".repeat(250)}@correo.com`)).toBe(false);
  });
});

describe("isValidOtpCode", () => {
  it("acepta seis dígitos", () => {
    expect(isValidOtpCode("123456")).toBe(true);
    expect(isValidOtpCode(" 123456 ")).toBe(true);
  });

  it("rechaza otra cosa", () => {
    expect(isValidOtpCode("12345")).toBe(false);
    expect(isValidOtpCode("1234567")).toBe(false);
    expect(isValidOtpCode("12345a")).toBe(false);
    expect(isValidOtpCode("")).toBe(false);
  });
});

describe("otpTypeFor", () => {
  it("quien ya tenía sesión anónima verifica como cambio de mail", () => {
    // Es lo que conserva el user_id y, con él, las conexiones ya hechas.
    expect(otpTypeFor("claim")).toBe("email_change");
  });

  it("una cuenta nueva verifica como mail común", () => {
    expect(otpTypeFor("signIn")).toBe("email");
  });
});

describe("authErrorMessage", () => {
  it("explica un código vencido o equivocado", () => {
    expect(authErrorMessage("Token has expired or is invalid")).toMatch(/venció|correcto/i);
  });

  it("explica el límite de pedidos seguidos", () => {
    expect(authErrorMessage("Email rate limit exceeded")).toMatch(/esperá/i);
    expect(
      authErrorMessage("For security purposes, you can only request this after 51 seconds")
    ).toMatch(/esperá/i);
  });

  it("explica que el mail ya tiene cuenta", () => {
    const message = authErrorMessage(
      "A user with this email address has already been registered"
    );
    expect(message).toMatch(/ya hay una cuenta/i);
  });

  it("ante un problema de red aclara que los datos locales siguen ahí", () => {
    expect(authErrorMessage("Network request failed")).toMatch(/guardados en el teléfono/i);
  });

  it("no inventa una explicación cuando no reconoce el error", () => {
    expect(authErrorMessage("Something weird happened")).toContain("Something weird happened");
  });

  it("responde algo útil incluso sin mensaje", () => {
    expect(authErrorMessage(null)).toMatch(/probá de nuevo/i);
    expect(authErrorMessage(undefined)).toMatch(/probá de nuevo/i);
    expect(authErrorMessage("")).toMatch(/probá de nuevo/i);
  });
});

describe("eliminar cuenta", () => {
  it("el aviso aclara que lo del teléfono no se borra y que no se deshace", () => {
    expect(DELETE_ACCOUNT_WARNING).toContain("este teléfono no se toca");
    expect(DELETE_ACCOUNT_WARNING).toContain("No se puede deshacer");
  });

  it("traduce la falta de conexión sin inventar otra causa", () => {
    expect(deleteAccountErrorMessage("FunctionsFetchError: Failed to send a request")).toContain(
      "No hay conexión"
    );
    expect(deleteAccountErrorMessage(null)).toContain("No se pudo eliminar");
    expect(deleteAccountErrorMessage("algo raro")).toContain("No se pudo eliminar");
  });
});
