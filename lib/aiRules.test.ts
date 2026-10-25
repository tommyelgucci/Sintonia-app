import {
  AI_DISCLOSURE,
  MAX_QUESTION_CHARS,
  SUGGESTED_QUESTIONS,
  validateQuestion,
} from "./aiRules";

describe("validateQuestion", () => {
  it("acepta una pregunta normal", () => {
    expect(validateQuestion("¿Por qué me duele?")).toBeNull();
  });

  it("rechaza vacía o solo espacios", () => {
    expect(validateQuestion("")).not.toBeNull();
    expect(validateQuestion("   \n ")).not.toBeNull();
  });

  it("acepta justo el máximo y rechaza uno más", () => {
    expect(validateQuestion("a".repeat(MAX_QUESTION_CHARS))).toBeNull();
    expect(validateQuestion("a".repeat(MAX_QUESTION_CHARS + 1))).not.toBeNull();
  });

  it("no cuenta los espacios de los extremos", () => {
    expect(validateQuestion(` ${"a".repeat(MAX_QUESTION_CHARS)} `)).toBeNull();
  });
});

describe("textos", () => {
  it("el aviso aclara que las notas no se envían", () => {
    expect(AI_DISCLOSURE).toContain("las notas no");
  });

  it("las preguntas sugeridas entran en el límite", () => {
    for (const q of SUGGESTED_QUESTIONS) expect(validateQuestion(q)).toBeNull();
  });
});
