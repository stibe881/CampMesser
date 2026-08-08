import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import CookieNotice from "./CookieNotice";

// Der LanguageProvider spricht tRPC (Einstellungs-Sync) – Attrappe genügt.
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock({}) };
});

/**
 * Cookie-Hinweis (#409): einmal zeigen, nach «Verstanden» nie wieder.
 * UI-Tests rendern auf Englisch.
 */
describe("CookieNotice", () => {
  beforeEach(() => {
    localStorage.removeItem("campmesser.cookieNoticeSeen");
  });

  it("erscheint beim ersten Besuch und verschwindet nach «Got it»", async () => {
    renderWithI18n(<CookieNotice />, { trpc: false });
    expect(screen.getByRole("region", { name: "Cookie notice" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(
      screen.queryByRole("region", { name: "Cookie notice" })
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("campmesser.cookieNoticeSeen")).toBe("1");
  });

  it("bleibt weg, wenn der Hinweis schon bestätigt wurde", () => {
    localStorage.setItem("campmesser.cookieNoticeSeen", "1");
    renderWithI18n(<CookieNotice />, { trpc: false });
    expect(
      screen.queryByRole("region", { name: "Cookie notice" })
    ).not.toBeInTheDocument();
  });
});
