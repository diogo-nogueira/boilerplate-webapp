import { describe, expect, it } from "vitest";

import { ApiError } from "./api/client";
import { formErrorsFrom, splitFieldErrors } from "./fieldErrors";

const KNOWN = ["start_date", "end_date", "priority"];

describe("splitFieldErrors", () => {
  it("deixa os campos do formulário junto de cada campo", () => {
    const result = splitFieldErrors({ end_date: ["Fim antes do início."] }, KNOWN);
    expect(result.forFields).toEqual({ end_date: ["Fim antes do início."] });
    expect(result.others).toEqual([]);
  });

  it("junta os erros de chaves desconhecidas para o aviso do formulário", () => {
    const result = splitFieldErrors(
      {
        non_field_errors: ["Erro geral."],
        __all__: ["Erro do modelo."],
        quantity: ["Quantidade inválida."],
        priority: ["Fora do intervalo."],
      },
      KNOWN,
    );
    expect(result.forFields).toEqual({ priority: ["Fora do intervalo."] });
    expect(result.others).toEqual(["Erro geral.", "Erro do modelo.", "Quantidade inválida."]);
  });
});

describe("formErrorsFrom", () => {
  const FALLBACK = "Não foi possível guardar.";

  it("põe os erros de campo junto dos campos e não mostra aviso", () => {
    const caught = new ApiError(400, "Pedido inválido.", { priority: ["Fora do intervalo."] });
    expect(formErrorsFrom(caught, KNOWN, FALLBACK)).toEqual({
      fieldErrors: { priority: ["Fora do intervalo."] },
      formError: null,
    });
  });

  it("mostra no aviso os erros sem campo no formulário", () => {
    const caught = new ApiError(400, "Pedido inválido.", {
      __all__: ["Já existe um registo nesse período."],
      end_date: ["Fim antes do início."],
    });
    expect(formErrorsFrom(caught, KNOWN, FALLBACK)).toEqual({
      fieldErrors: { end_date: ["Fim antes do início."] },
      formError: "Já existe um registo nesse período.",
    });
  });

  it("sem erros de campo, mostra o detail do servidor", () => {
    const caught = new ApiError(403, "Não tem permissão.");
    expect(formErrorsFrom(caught, KNOWN, FALLBACK)).toEqual({
      fieldErrors: {},
      formError: "Não tem permissão.",
    });
  });

  it("num erro que não veio do servidor, mostra a mensagem por defeito", () => {
    expect(formErrorsFrom(new TypeError("Failed to fetch"), KNOWN, FALLBACK)).toEqual({
      fieldErrors: {},
      formError: FALLBACK,
    });
  });
});
