import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import SitePlanCard from "./SitePlanCard";

// Der LanguageProvider spricht tRPC (Einstellungs-Sync) – Attrappe genügt.
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock({}) };
});

/**
 * Platzplan (#401): leerer Zustand lädt zum Fotografieren ein, mit Plan
 * gibt es Bild, Ersetzen und Entfernen. UI-Tests rendern auf Englisch.
 */
function renderCard(plan: { id: number; fileName: string } | null) {
  return renderWithI18n(
    <ConfirmProvider>
      <SitePlanCard
        spotId={7}
        spotName="Camping Aare"
        plan={plan}
        onChanged={vi.fn()}
        deletePhoto={vi.fn().mockResolvedValue(undefined)}
      />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("SitePlanCard", () => {
  it("ohne Plan: Leertext und Hochladen-Knopf", () => {
    renderCard(null);
    expect(screen.getByText(/No site map yet/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload map" })
    ).toBeInTheDocument();
  });

  it("mit Plan: Bild, Ersetzen und Entfernen", () => {
    renderCard({ id: 1, fileName: "plan.jpg" });
    expect(
      screen.getByRole("img", { name: "Site map of Camping Aare" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Replace map" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("ist barrierefrei", async () => {
    const { container } = renderCard({ id: 1, fileName: "plan.jpg" });
    await expectNoA11yViolations(container);
  });
});
