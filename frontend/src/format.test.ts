import { describe, expect, it } from "vitest";

import { addDays, formatDayRange, formatQuantity, formatShortDate, todayIso } from "./format";

describe("addDays", () => {
  it("soma dias a uma data AAAA-MM-DD, passando de mês e de ano", () => {
    expect(addDays("2026-11-09", 7)).toBe("2026-11-16");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-01-05", -7)).toBe("2025-12-29");
  });

  it("não é afetada pela mudança de hora de outubro", () => {
    expect(addDays("2026-10-19", 7)).toBe("2026-10-26");
  });
});

describe("todayIso", () => {
  it("usa o dia local", () => {
    expect(todayIso(new Date(2026, 10, 5, 23, 30))).toBe("2026-11-05");
  });
});

describe("formatShortDate", () => {
  it("escreve o dia e o mês abreviado", () => {
    expect(formatShortDate("2026-12-08")).toBe("8 dez");
    expect(formatShortDate("2026-01-02")).toBe("2 jan");
  });
});

describe("formatDayRange", () => {
  it("só repete o mês quando muda", () => {
    expect(formatDayRange("2026-11-09", "2026-11-09")).toBe("9 nov");
    expect(formatDayRange("2026-11-09", "2026-11-13")).toBe("9 a 13 nov");
    expect(formatDayRange("2026-11-30", "2026-12-04")).toBe("30 nov a 4 dez");
  });
});

describe("formatQuantity", () => {
  it("usa espaço nos milhares e vírgula decimal, como em Portugal", () => {
    expect(formatQuantity(12500)).toBe("12\u00a0500");
    expect(formatQuantity(2.5)).toBe("2,5");
  });
});
