import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import TripTemplatePicker from "@/components/TripTemplatePicker";
// Seit den eigenen Vorlagen (#628) fragt der Dialog vor dem Löschen nach –
// der Bestätigungs-Dialog braucht seinen Provider wie in App.tsx.
import { ConfirmProvider } from "@/components/ConfirmDialog";

/**
 * Reise-Vorlagen (#284/#463/#485, UI-Test #484).
 *
 * WARUM ES EINEN TEST BEKOMMT: Seit den Reise-Arten trägt jede
 * Nicht-Camping-Vorlage ihr Art-Etikett (#463), und die Zeltplatz-Auswahl
 * erscheint nur noch für Arten, die dort schlafen (#485). Beide Regeln
 * sind reine Anzeige-Logik im Dialog – genau die Sorte, die beim Umbau
 * still kippt: ein Etikett an der falschen Vorlage oder eine
 * Platz-Auswahl im Städtetrip.
 */
const SPOTS = [{ id: 1, name: "Camping Waldheim" }];

async function openDialog() {
  const result = renderWithI18n(
    <ConfirmProvider>
      <TripTemplatePicker spots={SPOTS} />
    </ConfirmProvider>
  );
  await userEvent.click(
    await screen.findByRole("button", { name: /From template/ })
  );
  await screen.findByText("Trip from a template");
  return result;
}

describe("Reise-Vorlagen", () => {
  it("etikettiert Nicht-Camping-Vorlagen mit ihrer Reise-Art (#463)", async () => {
    await openDialog();
    // «City break» (Vorlage) trägt das Art-Etikett «City trip»
    const cityTile = screen.getByRole("button", { name: /City break/ });
    expect(cityTile).toHaveTextContent("City trip");
    // Camping ist der Normalfall und bleibt ohne Etikett
    const weekendTile = screen.getByRole("button", { name: /Weekend/ });
    expect(weekendTile).not.toHaveTextContent("Camping");
  });

  it("bietet die Zeltplatz-Auswahl nur für Arten an, die dort schlafen (#485)", async () => {
    await openDialog();
    // Standard-Vorlage «Weekend» ist Camping → Platz-Auswahl da
    expect(screen.getByLabelText("Pitch")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /City break/ }));
    // Städtereise schläft nicht auf dem Platz → nur der Freitext-Ort
    expect(screen.queryByLabelText("Pitch")).toBeNull();
    expect(screen.getByLabelText("Place")).toBeVisible();
  });

  /**
   * Rundreise-Vorlage (#619, UI-Test aus #644): Die Vorlage «Road trip»
   * steht im Dialog, nennt im Beschrieb die vorbereiteten Etappen und
   * lässt sich wählen. Die Etappen selbst legt der Server an
   * (trips.createFromTemplate) – das prüfen die Server-Tests.
   */
  it("bietet die Rundreise-Vorlage mit Etappen-Hinweis an (#619)", async () => {
    await openDialog();
    const tile = screen.getByRole("button", { name: /Road trip/ });
    expect(tile).toHaveTextContent(/stages are set up/);
    await userEvent.click(tile);
    expect(tile).toHaveAttribute("aria-pressed", "true");
  });

  it("ist barrierefrei – mit offenem Dialog", async () => {
    const { container } = await openDialog();
    await expectNoA11yViolations(container);
  });
});
