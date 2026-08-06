import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider, useConfirm } from "./ConfirmDialog";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Der Bestätigungs-Dialog (#317) steht vor 35 Löschvorgängen.
 *
 * WARUM GERADE HIER EIN TEST: Das ist die Stelle, an der ein Fehler NICHT
 * mit einer schiefen Anzeige endet, sondern mit weg gelöschten Daten. Ein
 * vertauschtes «Abbrechen»/«Löschen», ein Promise, das bei Abbruch `true`
 * liefert – beides sieht im Code harmlos aus und fällt beim Durchklicken
 * nicht auf, weil man ja bestätigt.
 */
function Harness({ onResult }: { onResult: (value: boolean) => void }) {
  const ask = useConfirm();
  return (
    <button
      type="button"
      onClick={async () => {
        onResult(
          await ask({ title: "Wirklich löschen?", confirmLabel: "Löschen" })
        );
      }}
    >
      Auslösen
    </button>
  );
}

function renderHarness(onResult: (value: boolean) => void) {
  return renderWithI18n(
    <ConfirmProvider>
      <Harness onResult={onResult} />
    </ConfirmProvider>
  );
}

describe("Bestätigungs-Dialog", () => {
  it("bestätigen liefert true", async () => {
    let result: boolean | null = null;
    renderHarness(value => {
      result = value;
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Auslösen" })
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Löschen" })
    );
    expect(result).toBe(true);
  });

  it("abbrechen liefert false – und nicht etwa nichts", async () => {
    // Ein Promise, das bei Abbruch nie auflöst, würde die aufrufende
    // Funktion still hängen lassen; eines, das `true` liefert, löscht.
    let result: boolean | null = null;
    renderHarness(value => {
      result = value;
    });
    await userEvent.click(
      await screen.findByRole("button", { name: "Auslösen" })
    );
    const dialog = await screen.findByRole("alertdialog");
    const buttons = await screen.findAllByRole("button");
    const cancel = buttons.find(
      b => b.textContent && b.textContent !== "Löschen" && dialog.contains(b)
    );
    expect(cancel).toBeDefined();
    await userEvent.click(cancel!);
    expect(result).toBe(false);
  });

  it("die Frage steht als Dialog da, nicht als Kasten", async () => {
    // Ohne Rolle merkt eine Vorlesehilfe nicht, dass gerade eine
    // Entscheidung ansteht – man löscht dann blind.
    renderHarness(() => {});
    await userEvent.click(
      await screen.findByRole("button", { name: "Auslösen" })
    );
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Wirklich löschen?")).toBeInTheDocument();
  });

  it("ohne Zugänglichkeits-Verstösse", async () => {
    const { baseElement } = renderHarness(() => {});
    await userEvent.click(
      await screen.findByRole("button", { name: "Auslösen" })
    );
    await screen.findByRole("alertdialog");
    // `baseElement`, nicht `container`: Der Dialog hängt über ein Portal
    // am Body und läge sonst ausserhalb des Geprüften.
    await expectNoA11yViolations(baseElement);
  });
});
