import { describe, expect, it } from "vitest";

import { pageFromParams, pageQuery } from "./pagination";

describe("pageFromParams", () => {
  it("lê números inteiros a partir de 1", () => {
    expect(pageFromParams(new URLSearchParams("page=3"))).toBe(3);
  });

  it("trata o que falta ou é inválido como página 1", () => {
    expect(pageFromParams(new URLSearchParams(""))).toBe(1);
    for (const value of ["abc", "0", "-2", "1.5"]) {
      expect(pageFromParams(new URLSearchParams(`page=${value}`))).toBe(1);
    }
  });
});

describe("pageQuery", () => {
  it("só escreve a página quando é maior que 1", () => {
    expect(pageQuery(1)).toBe("");
    expect(pageQuery(2)).toBe("?page=2");
  });
});
