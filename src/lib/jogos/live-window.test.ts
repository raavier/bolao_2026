import { describe, expect, it } from "vitest";
import { isWithinPinWindow } from "./live-window";

const kickoff = new Date("2026-06-22T14:00:00-03:00");

describe("isWithinPinWindow", () => {
  it("não fixa antes do apito", () => {
    const now = new Date("2026-06-22T13:59:59-03:00");
    expect(isWithinPinWindow(kickoff, now)).toBe(false);
  });

  it("fixa no exato apito", () => {
    expect(isWithinPinWindow(kickoff, kickoff)).toBe(true);
  });

  it("fixa durante a janela de 3h", () => {
    const now = new Date("2026-06-22T16:30:00-03:00");
    expect(isWithinPinWindow(kickoff, now)).toBe(true);
  });

  it("desafixa exatamente 3h após o apito", () => {
    const now = new Date("2026-06-22T17:00:00-03:00");
    expect(isWithinPinWindow(kickoff, now)).toBe(false);
  });

  it("não fixa depois de passada a janela", () => {
    const now = new Date("2026-06-22T18:00:00-03:00");
    expect(isWithinPinWindow(kickoff, now)).toBe(false);
  });
});
