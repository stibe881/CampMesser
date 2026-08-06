import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QueryError from "./QueryError";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Der Fehlerzustand ist auf gut zwanzig Seiten eingebaut (#312, #330) und
 * wurde bis jetzt von keinem Test je gerendert – man sieht ihn nur, wenn
 * der Server gerade nicht antwortet. Genau deshalb gehört er geprüft: Ein
 * Zweig, den niemand zu Gesicht bekommt, verrottet still.
 */
function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("QueryError", () => {
  it("mit Verbindung: Störung melden und einen Knopf anbieten", async () => {
    setOnline(true);
    renderWithI18n(<QueryError onRetry={() => {}} />);
    // Als `alert` ausgezeichnet – eine Vorlesehilfe soll es ansagen,
    // nicht erst beim Durchtabben finden.
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("ohne Verbindung: anderer Text, kein Vorwurf", async () => {
    // Offline ist nichts kaputt – da wartet man. Ein «Fehler beim Laden»
    // wäre dort eine falsche Aussage.
    setOnline(true);
    const { unmount } = renderWithI18n(<QueryError onRetry={() => {}} />);
    const onlineText = (await screen.findByRole("alert")).textContent;
    unmount();

    setOnline(false);
    renderWithI18n(<QueryError onRetry={() => {}} />);
    const offlineText = (await screen.findByRole("alert")).textContent;
    expect(offlineText).not.toBe(onlineText);
  });

  it("der Knopf löst den erneuten Versuch aus", async () => {
    setOnline(true);
    const onRetry = vi.fn();
    renderWithI18n(<QueryError onRetry={onRetry} />);
    await userEvent.click(await screen.findByRole("button"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("ohne Zugänglichkeits-Verstösse", async () => {
    setOnline(true);
    const { container } = renderWithI18n(<QueryError onRetry={() => {}} />);
    await screen.findByRole("alert");
    await expectNoA11yViolations(container);
  });

  it("während des Versuchs ist der Knopf gesperrt", async () => {
    // Sonst schickt ein ungeduldiger Doppelklick zwei Anfragen los.
    setOnline(true);
    const onRetry = vi.fn();
    renderWithI18n(<QueryError onRetry={onRetry} retrying />);
    const button = await screen.findByRole("button");
    expect(button).toBeDisabled();
  });
});
