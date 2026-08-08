import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Die Platz-Druckansicht (#416): Namen, Koordinaten und die eigenen
 * Angaben aufs Papier. Geprüft wird, dass die Seite mit einem Platz
 * rendert und die Kernangaben (Name, Koordinaten) enthält – die
 * Formulierungen wechseln mit der Sprache, die Zahlen nicht.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "spots.list": [
        {
          id: 7,
          userId: 1,
          name: "Camping Thun",
          latitude: 46.75,
          longitude: 7.63,
          notes: null,
          nextTimeJson: JSON.stringify(["Schöner Blick auf den See"]),
          elevationM: 560,
          pricePerNightRappen: 3200,
          extraPerNightRappen: null,
          tariffsJson: null,
          attributesJson: null,
          contactJson: null,
          ratingJson: null,
          createdAt: new Date("2026-01-01T10:00:00Z"),
        },
      ],
      "spots.photos.list": [],
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Test", email: "test@example.com" },
    loading: false,
  }),
}));

vi.mock("wouter", async importOriginal => {
  const actual = await importOriginal<typeof import("wouter")>();
  return { ...actual, useParams: () => ({ id: "7" }) };
});

async function renderPrint() {
  const { default: SpotPrint } = await import("./SpotPrint");
  return renderWithI18n(<SpotPrint />, { trpc: false });
}

describe("Platz-Druckansicht", () => {
  it("nennt den Platz", async () => {
    await renderPrint();
    expect((await screen.findAllByText(/Camping Thun/)).length).toBeGreaterThan(
      0
    );
  });

  it("zeigt die Koordinaten fürs Navi", async () => {
    await renderPrint();
    await screen.findAllByText(/Camping Thun/);
    expect(screen.getByText(/46\.75/)).toBeInTheDocument();
  });

  it("druckt die «Nächstes Mal»-Notizen mit", async () => {
    await renderPrint();
    expect(
      await screen.findByText(/Schöner Blick auf den See/)
    ).toBeInTheDocument();
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderPrint();
    await screen.findAllByText(/Camping Thun/);
    await expectNoA11yViolations(container);
  });
});
