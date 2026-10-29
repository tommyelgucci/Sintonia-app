import { bearerToken } from "./logic";

describe("bearerToken", () => {
  it("saca el token de un header válido", () => {
    expect(bearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });
  it("ignora mayúsculas del esquema y espacios alrededor", () => {
    expect(bearerToken("  bearer   abc ")).toBe("abc");
  });
  it("devuelve null si falta, está vacío o no es Bearer", () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken("")).toBeNull();
    expect(bearerToken("Bearer")).toBeNull();
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken("Bearer a b")).toBeNull();
  });
});
