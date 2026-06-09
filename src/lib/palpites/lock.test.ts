import { describe, expect, it } from "vitest";
import { isPredictionOpen } from "./lock";

describe("isPredictionOpen", () => {
  const kickoff = new Date("2026-06-13T22:00:00Z");

  it("aberto um minuto antes do apito", () => {
    expect(isPredictionOpen(kickoff, new Date("2026-06-13T21:59:00Z"))).toBe(true);
  });

  it("fechado na hora exata do apito", () => {
    expect(isPredictionOpen(kickoff, new Date("2026-06-13T22:00:00Z"))).toBe(false);
  });

  it("fechado depois do apito", () => {
    expect(isPredictionOpen(kickoff, new Date("2026-06-13T22:00:01Z"))).toBe(false);
  });
});
