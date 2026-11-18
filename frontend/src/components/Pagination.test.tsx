import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FirstPageButton, Pagination } from "./Pagination";

describe("Pagination", () => {
  it("não aparece com uma só página", () => {
    render(<Pagination page={1} totalPages={1} onChange={() => {}} />);

    expect(screen.queryByRole("navigation", { name: "Paginação" })).toBeNull();
  });

  it("mostra 'Página 2 de 3' e chama onChange com 3 ao carregar em Seguinte", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onChange={onChange} />);

    expect(screen.getByText("Página 2 de 3")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Seguinte" }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("desativa Anterior na primeira página e Seguinte na última", () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Anterior" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Seguinte" }).hasAttribute("disabled")).toBe(false);

    rerender(<Pagination page={3} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Anterior" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Seguinte" }).hasAttribute("disabled")).toBe(true);
  });

  it("leva a vista ao topo ao mudar de página", async () => {
    const user = userEvent.setup();
    vi.mocked(window.scrollTo).mockClear();
    render(<Pagination page={2} totalPages={3} onChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});

describe("FirstPageButton", () => {
  it("não aparece na página 1", () => {
    render(<FirstPageButton page={1} onClick={() => {}} />);

    expect(screen.queryByRole("button", { name: "Voltar à primeira página" })).toBeNull();
  });

  it("aparece depois da página 1 e chama onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FirstPageButton page={4} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Voltar à primeira página" }));

    expect(onClick).toHaveBeenCalled();
  });
});
