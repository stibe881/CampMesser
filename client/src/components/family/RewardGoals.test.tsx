import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import RewardGoals from "./RewardGoals";

/**
 * Belohnungs-Ziele (#399): Der Test hält fest, dass der Einlöse-Knopf
 * WIRKLICH am Punktestand hängt – ein immer aktiver Knopf würde das
 * Sparen aufs Ziel entwerten. UI-Tests rendern auf Englisch.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "rewards.list": [
        { id: 1, title: "Ice cream", points: 20 },
        { id: 2, title: "Minigolf", points: 50 },
      ],
      "rewards.redemptions": [],
    }),
  };
});

const SCORES = [{ childId: 1, name: "Lina", points: 30, done: 3 }];

describe("RewardGoals", () => {
  it("zeigt den verfügbaren Stand und beide Ziele", async () => {
    renderWithI18n(<RewardGoals scores={SCORES} />, { trpc: false });
    expect(
      await screen.findByText("Lina has 30 points to redeem.")
    ).toBeInTheDocument();
    expect(screen.getByText("Ice cream")).toBeInTheDocument();
    expect(screen.getByText("Minigolf")).toBeInTheDocument();
  });

  it("einlösen geht nur, wenn die Punkte reichen", async () => {
    renderWithI18n(<RewardGoals scores={SCORES} />, { trpc: false });
    await screen.findByText("Ice cream");
    const buttons = screen.getAllByRole("button", { name: "Redeem" });
    expect(buttons).toHaveLength(2);
    // 30 Punkte: das 20er-Ziel ist erreichbar, das 50er nicht.
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();
  });

  it("ist barrierefrei", async () => {
    const { container } = renderWithI18n(<RewardGoals scores={SCORES} />, {
      trpc: false,
    });
    await screen.findByText("Ice cream");
    await expectNoA11yViolations(container);
  });
});
