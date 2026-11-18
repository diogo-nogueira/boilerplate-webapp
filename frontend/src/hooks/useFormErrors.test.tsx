import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiError } from "../api/client";
import { useFormErrors } from "./useFormErrors";

const FIELDS = ["name", "email"];
const FALLBACK = "Não foi possível guardar.";

describe("useFormErrors", () => {
  it("começa sem erros", () => {
    const { result } = renderHook(() => useFormErrors(FIELDS, FALLBACK));

    expect(result.current.formError).toBeNull();
    expect(result.current.errorProps("f", "name")).toEqual({});
    expect(result.current.renderError("f", "name")).toBeNull();
  });

  it("põe o erro de cada campo junto do campo", () => {
    const { result } = renderHook(() => useFormErrors(FIELDS, FALLBACK));

    act(() => result.current.show(new ApiError(400, "Pedido inválido.", { name: ["Obrigatório.", "Curto."] })));

    expect(result.current.formError).toBeNull();
    expect(result.current.errorProps("f", "name")).toEqual({
      "aria-invalid": true,
      "aria-describedby": "f-name-erro",
    });
    expect(result.current.errorProps("f", "email")).toEqual({});
    render(<>{result.current.renderError("f", "name")}</>);
    expect(screen.getByText("Obrigatório. Curto.").id).toBe("f-name-erro");
  });

  it("junta numa faixa os erros dos campos que o formulário não mostra", () => {
    const { result } = renderHook(() => useFormErrors(FIELDS, FALLBACK));

    act(() =>
      result.current.show(
        new ApiError(400, "Pedido inválido.", { non_field_errors: ["Combinação inválida."], other: ["Erro."] }),
      ),
    );

    expect(result.current.formError).toBe("Combinação inválida. Erro.");
  });

  it("usa a mensagem por defeito quando o erro não vem do servidor", () => {
    const { result } = renderHook(() => useFormErrors(FIELDS, FALLBACK));

    act(() => result.current.show(new Error("rede")));

    expect(result.current.formError).toBe(FALLBACK);
  });

  it("limpa tudo com clear", () => {
    const { result } = renderHook(() => useFormErrors(FIELDS, FALLBACK));
    act(() => result.current.show(new ApiError(400, "x", { name: ["Obrigatório."] })));
    act(() => result.current.show(new Error("rede")));

    act(() => result.current.clear());

    expect(result.current.formError).toBeNull();
    expect(result.current.errorProps("f", "name")).toEqual({});
  });
});
