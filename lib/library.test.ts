import { findRelevantArticles } from "./library";

describe("findRelevantArticles", () => {
  it("encuentra el artículo de dolor con una pregunta sobre dolor de panza", () => {
    const result = findRelevantArticles("me duele mucho el bajo vientre, es normal?");
    expect(result.map((a) => a.id)).toContain("dolor-bajo-vientre");
  });

  it("encuentra el artículo de flujo con una pregunta sobre color y olor", () => {
    const result = findRelevantArticles("el flujo me cambió de color y tiene olor fuerte");
    expect(result[0]?.id).toBe("flujo-vaginal");
  });

  it("encuentra el artículo de ciclo irregular con una pregunta sobre ciclos", () => {
    const result = findRelevantArticles("mi ciclo es irregular, cuándo tengo que consultar?");
    expect(result.map((a) => a.id)).toContain("ciclo-irregular");
  });

  it("no devuelve nada para una pregunta sin superposición de palabras", () => {
    expect(findRelevantArticles("zzz qqq xyz")).toEqual([]);
  });

  it("no devuelve nada para una pregunta vacía", () => {
    expect(findRelevantArticles("")).toEqual([]);
  });

  it("respeta el máximo de resultados", () => {
    const result = findRelevantArticles("ciclo período ovulación embarazo flujo dolor", 1);
    expect(result.length).toBe(1);
  });
});
