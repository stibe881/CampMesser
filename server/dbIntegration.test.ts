import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Integrationstest gegen eine echte MySQL-Datenbank: läuft nur, wenn
 * DATABASE_URL gesetzt ist (CI-Job mit MySQL-Service und angewendeten
 * Migrationen). Lokal ohne Datenbank wird die Datei übersprungen.
 * Ablauf: Registrieren → Anmelden → Daten quer durch alle Nutzer-Tabellen
 * anlegen (Packliste, Einstellung, Zeltplatz mit Foto, Trip mit Foto,
 * Menüplan und Reise-Einkaufsliste,
 * Rezept mit Foto, Inventar-Gegenstand mit Foto, Schnitzeljagd, Quiz,
 * Kinder-Profil mit Abzeichen und Zählern, Einkaufsliste, Kühlbox samt
 * Vorlage, Push-Abo, Heim-Standort, Passkey)
 * → Konto löschen → prüfen, dass die Lösch-Kaskade alle Tabellen und
 * die Upload-Dateien erfasst hat.
 */

const hasDb = Boolean(process.env.DATABASE_URL);

function createRes() {
  const cookies: { name: string; value?: string }[] = [];
  return {
    res: {
      cookie: (name: string, value: string) => cookies.push({ name, value }),
      clearCookie: (name: string) => cookies.push({ name }),
    } as unknown as TrpcContext["res"],
    cookies,
  };
}

function anonContext(): { ctx: TrpcContext; cookies: { name: string }[] } {
  const { res, cookies } = createRes();
  return {
    ctx: {
      user: null,
      req: {
        protocol: "https",
        headers: {},
        ip: "203.0.113.99",
      } as TrpcContext["req"],
      res,
    },
    cookies,
  };
}

describe.skipIf(!hasDb)("Datenbank-Integration (Auth-Flow)", () => {
  const email = `ci-test-${Date.now()}@example.com`;
  const password = "test-passwort-123";

  it("registriert, meldet an, legt Daten an und löscht das Konto wieder", async () => {
    // Registrieren setzt ein Session-Cookie
    const anon = anonContext();
    const anonCaller = appRouter.createCaller(anon.ctx);
    const registered = await anonCaller.auth.register({
      name: "CI Test",
      email,
      password,
    });
    expect(registered.success).toBe(true);
    expect(anon.cookies.length).toBeGreaterThan(0);

    // Anmelden mit denselben Zugangsdaten funktioniert
    const login = await appRouter
      .createCaller(anonContext().ctx)
      .auth.login({ email, password });
    expect(login.success).toBe(true);

    // Authentifizierter Kontext: Nutzer aus der DB laden
    const { findUserByEmail } = await import("./localAuth");
    const user = await findUserByEmail(email);
    expect(user).toBeDefined();
    const authed = appRouter.createCaller({
      user: user as NonNullable<TrpcContext["user"]>,
      req: {
        protocol: "https",
        headers: {},
        ip: "203.0.113.99",
      } as TrpcContext["req"],
      res: createRes().res,
    });

    // Packliste anlegen und wiederfinden (Migrationen + Schreibpfad ok)
    const { listId } = await authed.packing.createList({
      name: "CI-Liste",
      scenario: "solo",
    });
    expect(listId).toBeTruthy();
    const lists = await authed.packing.lists();
    expect(lists.some(l => l.name === "CI-Liste")).toBe(true);

    // Eigene Vorlage aus der Liste einfrieren und daraus eine neue Liste bauen
    const { templateId } = await authed.packing.saveAsTemplate({
      listId,
      name: "CI-Vorlage",
    });
    expect(templateId).toBeTruthy();
    const templates = await authed.packing.listTemplates();
    const template = templates.find(t => t.id === templateId);
    expect(template?.name).toBe("CI-Vorlage");
    expect(template?.items.length).toBeGreaterThan(0);
    const fromTemplate = await authed.packing.createListFromTemplate({
      templateId,
      listName: "CI-Liste aus Vorlage",
    });
    const fromTemplateItems = await authed.packing.items({
      listId: fromTemplate.listId,
    });
    expect(fromTemplateItems.items.length).toBe(template?.items.length);

    // Einstellungs-Sync: Schreiben und Lesen über die userSettings-Tabelle
    await authed.settings.set({
      key: "moduleOrder",
      value: JSON.stringify(["/sos"]),
    });
    const settings = await authed.settings.all();
    expect(settings.moduleOrder).toBe(JSON.stringify(["/sos"]));

    // Daten quer durch alle Nutzer-Tabellen anlegen, damit die Lösch-Kaskade
    // des Kontos wirklich jede Tabelle erfasst
    const spotId = await authed.spots.add({
      name: "CI-Platz",
      latitude: 46.8,
      longitude: 8.2,
    });
    const { id: tripId } = await authed.trips.add({
      location: "CI-Ort",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
    });
    const { id: recipeId } = await authed.recipes.save({
      name: "CI-Rezept",
      method: "Gaskocher",
      timeMinutes: 30,
      servings: 4,
      difficulty: "einfach",
      onePot: false,
      kidFriendly: false,
      ingredients: ["Wasser"],
      steps: ["Kochen"],
    });
    await authed.menu.set({
      tripId,
      day: "2026-08-01",
      meal: "dinner",
      customRecipeId: recipeId,
    });
    // Tages-Notiz im Menüplan (#153): setzen, ausserhalb des Zeitraums abweisen
    await authed.menu.setDayNote({
      tripId,
      day: "2026-08-01",
      note: "Pizzeria-Abend",
    });
    await expect(
      authed.menu.setDayNote({ tripId, day: "2026-08-05", note: "X" })
    ).rejects.toThrow();
    await authed.hunts.save({
      title: "CI-Jagd",
      intro: "Los",
      finale: "Ende",
      durationMinutes: 30,
      stations: [{ title: "Station 1", story: "", task: "Suchen" }],
    });
    await authed.quizzes.create({
      title: "CI-Quiz",
      questions: [
        {
          question: "Frage?",
          options: ["Ja", "Nein"],
          correctIndex: 0,
          explanation: "Weil.",
        },
      ],
    });
    // Kinder-Profile & Abzeichen: anlegen, umbenennen, Zähler fortschreiben,
    // Abzeichen idempotent vergeben; Kind löschen räumt Abzeichen + Zähler weg
    const { id: childId } = await authed.family.children.add({ name: "Mia" });
    const { id: secondChildId } = await authed.family.children.add({
      name: "Temp",
    });
    await authed.family.children.rename({ id: childId, name: "Mia-Lena" });
    const childrenList = await authed.family.children.list();
    expect(childrenList.find(c => c.id === childId)?.name).toBe("Mia-Lena");
    const statsAfterHunt = await authed.family.stats.record({
      childId,
      type: "huntCompleted",
    });
    expect(statsAfterHunt.huntsCompleted).toBe(1);
    const statsAfterQuiz = await authed.family.stats.record({
      childId,
      type: "quizCompleted",
      correctStreak: 7,
    });
    expect(statsAfterQuiz).toEqual({
      huntsCompleted: 1,
      quizzesCompleted: 1,
      bestStreak: 7,
    });
    await authed.family.badges.award({ childId, badgeId: "hunt-first" });
    await authed.family.badges.award({ childId, badgeId: "hunt-first" });
    const badges = await authed.family.badges.listByChild({ childId });
    expect(badges.filter(b => b.badgeId === "hunt-first")).toHaveLength(1);
    await authed.family.badges.award({
      childId: secondChildId,
      badgeId: "quiz-first",
    });
    await authed.family.stats.record({
      childId: secondChildId,
      type: "quizCompleted",
    });
    await authed.family.children.remove({ id: secondChildId });
    expect(
      await authed.family.badges.listByChild({ childId: secondChildId })
    ).toHaveLength(0);
    expect(
      (await authed.family.children.list()).some(c => c.id === secondChildId)
    ).toBe(false);
    const invItemId = await authed.inventory.add({ name: "CI-Zelt" });
    // Natur-Beobachtungen: anlegen, bearbeiten, auflisten (Foto weiter unten)
    const { id: sightingId } = await authed.sightings.add({
      title: "CI-Reh",
      entryId: "reh",
      sightedAt: "2026-08-01",
      lat: 46.8,
      lon: 8.2,
      note: "Am Waldrand",
    });
    await authed.sightings.update({
      id: sightingId,
      title: "CI-Reh am Abend",
      entryId: "reh",
      sightedAt: "2026-08-01",
      lat: 46.8,
      lon: 8.2,
    });
    const sightings = await authed.sightings.list();
    expect(sightings.find(s => s.id === sightingId)?.title).toBe(
      "CI-Reh am Abend"
    );
    expect(sightings.find(s => s.id === sightingId)?.note).toBeNull();
    // Ausrüstungs-Pflege: Aufgabe anlegen, erledigen (lastDoneAt = heute)
    const { id: gearTaskId } = await authed.gear.add({
      title: "CI-Zelt imprägnieren",
      intervalMonths: 24,
    });
    await authed.gear.markDone({ id: gearTaskId, today: "2026-08-02" });
    const gearList = await authed.gear.list();
    expect(gearList.find(g => g.id === gearTaskId)?.lastDoneAt).toBe(
      "2026-08-02"
    );
    await authed.shopping.add({ name: "CI-Zutat" });
    // Einkaufsliste teilen: Token ist idempotent, öffentlicher Abruf und
    // Abhaken über den Teil-Link funktionieren ohne Anmeldung
    const { token: shoppingToken } = await authed.shopping.share();
    expect(shoppingToken.length).toBeGreaterThanOrEqual(8);
    expect((await authed.shopping.share()).token).toBe(shoppingToken);
    const publicCaller = appRouter.createCaller(anonContext().ctx);
    const sharedShopping = await publicCaller.shopping.sharedGet({
      token: shoppingToken,
    });
    expect(sharedShopping.active).toBe(true);
    const sharedItem = sharedShopping.items.find(i => i.name === "CI-Zutat");
    expect(sharedItem).toBeDefined();
    await publicCaller.shopping.sharedToggle({
      token: shoppingToken,
      itemId: sharedItem!.id,
      checked: true,
    });
    const sharedAfterToggle = await publicCaller.shopping.sharedGet({
      token: shoppingToken,
    });
    expect(
      sharedAfterToggle.items.find(i => i.id === sharedItem!.id)?.checked
    ).toBe(true);
    await authed.food.add({ name: "CI-Vorrat" });
    // Kühlbox-Vorlage anlegen und laden: vorhandener gleichnamiger Eintrag
    // wird übersprungen, der neue mit MHD (heute + 5 Tage) eingefügt
    const { templateId: foodTemplateId } = await authed.foodTemplates.create({
      name: "CI-Standardfüllung",
      items: [{ name: "CI-Vorrat" }, { name: "CI-Milch", expiryDays: 5 }],
    });
    expect(foodTemplateId).toBeTruthy();
    const applied = await authed.foodTemplates.applyTemplate({
      templateId: foodTemplateId,
      today: "2026-08-02",
    });
    expect(applied).toEqual({ added: 1, skipped: 1 });
    const foodAfterApply = await authed.food.list();
    expect(foodAfterApply.find(i => i.name === "CI-Milch")?.expiryDate).toBe(
      "2026-08-07"
    );
    await authed.home.set({
      name: "CI-Zuhause",
      latitude: 46.95,
      longitude: 7.45,
    });
    expect((await authed.home.get())?.name).toBe("CI-Zuhause");
    await authed.push.subscribe({
      endpoint: `https://example.com/ci-${Date.now()}`,
      p256dh: "p".repeat(20),
      auth: "a".repeat(10),
    });
    // Passkey direkt anlegen (die echte WebAuthn-Zeremonie braucht einen
    // Browser) – Auflisten und die Lösch-Kaskade laufen über die DB
    {
      const { getDb: getDbLocal } = await import("./db");
      const schemaLocal = await import("../drizzle/schema");
      await (await getDbLocal())!.insert(schemaLocal.passkeys).values({
        userId: (user as NonNullable<typeof user>).id,
        credentialId: `ci-credential-${Date.now()}`,
        publicKey: Buffer.from("ci-public-key").toString("base64url"),
        counter: 0,
        transports: "internal",
        name: "CI-Passkey",
      });
    }
    const passkeyList = await authed.auth.passkeyList();
    expect(passkeyList.some(p => p.name === "CI-Passkey")).toBe(true);

    // ── Reise-Mitglieder: einladen, gemeinsam bearbeiten, Berechtigungen ──
    const memberEmail = `ci-member-${Date.now()}@example.com`;
    const outsiderEmail = `ci-outsider-${Date.now()}@example.com`;
    await appRouter
      .createCaller(anonContext().ctx)
      .auth.register({ name: "CI Mitglied", email: memberEmail, password });
    await appRouter
      .createCaller(anonContext().ctx)
      .auth.register({ name: "CI Fremd", email: outsiderEmail, password });
    const memberUser = await findUserByEmail(memberEmail);
    const outsiderUser = await findUserByEmail(outsiderEmail);
    const makeCaller = (u: typeof user) =>
      appRouter.createCaller({
        user: u as NonNullable<TrpcContext["user"]>,
        req: {
          protocol: "https",
          headers: {},
          ip: "203.0.113.99",
        } as TrpcContext["req"],
        res: createRes().res,
      });
    const memberCaller = makeCaller(memberUser);
    const outsiderCaller = makeCaller(outsiderUser);

    // Owner verknüpft die Packliste mit dem Trip (für den Mitglieds-Zugriff)
    await authed.trips.update({
      id: tripId,
      packListId: listId,
      location: "CI-Ort",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
    });

    // Einladung erzeugen ist idempotent; die öffentliche Vorschau zeigt nur
    // Ort, Zeitraum und Owner-Name
    const { token: inviteToken } = await authed.trips.invite.create({ tripId });
    expect((await authed.trips.invite.create({ tripId })).token).toBe(
      inviteToken
    );
    const preview = await publicCaller.trips.invite.get({ token: inviteToken });
    expect(preview.trip?.place).toBe("CI-Ort");
    expect(preview.trip?.ownerName).toBe("CI Test");

    // Annehmen ist idempotent; der Trip erscheint als Mitglieds-Trip
    expect(
      (await memberCaller.trips.invite.accept({ token: inviteToken })).tripId
    ).toBe(tripId);
    await memberCaller.trips.invite.accept({ token: inviteToken });
    const sharedTrip = (await memberCaller.trips.list()).find(
      tr => tr.id === tripId
    );
    expect(sharedTrip?.role).toBe("member");
    expect(sharedTrip?.ownerName).toBe("CI Test");

    // Mitglieder-Liste: Owner zuerst; den Einladungs-Token sieht nur der Owner
    const membersForOwner = await authed.trips.members.list({ tripId });
    expect(membersForOwner.members.map(m => m.role)).toEqual([
      "owner",
      "member",
    ]);
    expect(membersForOwner.inviteToken).toBe(inviteToken);
    expect(
      (await memberCaller.trips.members.list({ tripId })).inviteToken
    ).toBeNull();

    // Mitglied darf bearbeiten – die Verknüpfungen (Zeltplatz/Packliste)
    // muss es unverändert lassen
    await memberCaller.trips.update({
      id: tripId,
      spotId: null,
      packListId: listId,
      location: "CI-Ort",
      title: "Gemeinsame Reise",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
    });
    await expect(
      memberCaller.trips.update({
        id: tripId,
        spotId: null,
        packListId: null,
        location: "CI-Ort",
        startDate: "2026-08-01",
        endDate: "2026-08-02",
      })
    ).rejects.toThrow();

    // Menüplan gemeinsam pflegen
    await memberCaller.menu.set({
      tripId,
      day: "2026-08-02",
      meal: "dinner",
      freeText: "Fondue",
    });
    const menuShared = await memberCaller.menu.listByTrip({ tripId });
    expect(menuShared.trip?.title).toBe("Gemeinsame Reise");
    expect(menuShared.entries.some(e => e.freeText === "Fondue")).toBe(true);

    // Tages-Notizen: das Mitglied sieht die Owner-Notiz, darf überschreiben
    // und per leerem Text löschen (eine Notiz pro Tag, unique tripId+day)
    expect(menuShared.dayNotes).toHaveLength(1);
    expect(menuShared.dayNotes[0]).toMatchObject({
      day: "2026-08-01",
      note: "Pizzeria-Abend",
    });
    await memberCaller.menu.setDayNote({
      tripId,
      day: "2026-08-01",
      note: "Fondue-Abend",
    });
    await memberCaller.menu.setDayNote({
      tripId,
      day: "2026-08-02",
      note: "Ruhetag",
    });
    await memberCaller.menu.setDayNote({
      tripId,
      day: "2026-08-02",
      note: "   ",
    });
    const dayNotesAfter = (await authed.menu.listByTrip({ tripId })).dayNotes;
    expect(dayNotesAfter).toHaveLength(1);
    expect(dayNotesAfter[0]).toMatchObject({
      day: "2026-08-01",
      note: "Fondue-Abend",
    });

    // Reise-Einkaufsliste: Owner und Mitglied teilen sich dieselbe Liste
    await authed.tripShopping.add({
      tripId,
      name: "CI-Reise-Zutat",
      quantity: "2×",
    });
    const tripShoppingForMember = await memberCaller.tripShopping.listByTrip({
      tripId,
    });
    expect(tripShoppingForMember.trip?.id).toBe(tripId);
    const sharedTripItem = tripShoppingForMember.items.find(
      i => i.name === "CI-Reise-Zutat"
    );
    expect(sharedTripItem?.quantity).toBe("2×");
    await memberCaller.tripShopping.toggle({
      tripId,
      id: sharedTripItem!.id,
      checked: true,
    });
    await memberCaller.tripShopping.add({ tripId, name: "CI-Mitglied-Zutat" });
    const tripShoppingForOwner = await authed.tripShopping.listByTrip({
      tripId,
    });
    expect(
      tripShoppingForOwner.items.find(i => i.id === sharedTripItem!.id)?.checked
    ).toBe(true);
    const memberItem = tripShoppingForOwner.items.find(
      i => i.name === "CI-Mitglied-Zutat"
    );
    expect(memberItem?.createdByUserId).toBe(
      (memberUser as NonNullable<typeof memberUser>).id
    );
    // Die geteilte Reise-Liste markiert die Reise in trips.list als geteilt
    expect(
      (await authed.trips.list()).find(tr => tr.id === tripId)?.shared
    ).toBe(true);
    // Fremde sehen die Reise-Liste nicht und dürfen nichts anlegen
    expect(
      (await outsiderCaller.tripShopping.listByTrip({ tripId })).trip
    ).toBeNull();
    await expect(
      outsiderCaller.tripShopping.add({ tripId, name: "CI-Fremd-Zutat" })
    ).rejects.toThrow();
    await expect(
      outsiderCaller.tripShopping.toggle({
        tripId,
        id: sharedTripItem!.id,
        checked: false,
      })
    ).rejects.toThrow();

    // Verknüpfte Packliste: einsehen und abhaken
    const sharedListView = await memberCaller.packing.items({ listId });
    expect(sharedListView.list?.id).toBe(listId);
    const sharedItem2 = sharedListView.items[0];
    await memberCaller.packing.toggleItem({
      id: sharedItem2.id,
      checked: true,
    });
    expect(
      (await authed.packing.items({ listId })).items.find(
        i => i.id === sharedItem2.id
      )?.checked
    ).toBe(true);

    // Nicht-Mitglieder bleiben aussen vor
    await expect(
      outsiderCaller.trips.update({
        id: tripId,
        spotId: null,
        packListId: null,
        location: "X",
        startDate: "2026-08-01",
        endDate: "2026-08-02",
      })
    ).rejects.toThrow();
    expect((await outsiderCaller.packing.items({ listId })).list).toBeNull();
    await expect(
      outsiderCaller.packing.toggleItem({ id: sharedItem2.id, checked: false })
    ).rejects.toThrow();
    expect((await outsiderCaller.menu.listByTrip({ tripId })).trip).toBeNull();
    await expect(
      outsiderCaller.menu.setDayNote({
        tripId,
        day: "2026-08-01",
        note: "Fremd-Notiz",
      })
    ).rejects.toThrow();

    // Owner-only: löschen, einladen/widerrufen, fremde Mitglieder entfernen
    await expect(memberCaller.trips.remove({ id: tripId })).rejects.toThrow();
    await expect(
      memberCaller.trips.invite.create({ tripId })
    ).rejects.toThrow();
    await expect(
      memberCaller.trips.invite.revoke({ tripId })
    ).rejects.toThrow();
    await expect(
      memberCaller.trips.members.remove({
        tripId,
        userId: (user as NonNullable<typeof user>).id,
      })
    ).rejects.toThrow();

    // Widerrufen macht den Link ungültig; ein neuer ersetzt ihn
    await authed.trips.invite.revoke({ tripId });
    expect(
      (await publicCaller.trips.invite.get({ token: inviteToken })).trip
    ).toBeNull();
    const { token: secondToken } = await authed.trips.invite.create({ tripId });
    expect(secondToken).not.toBe(inviteToken);

    // Reise verlassen (ohne userId = sich selbst) und wieder beitreten
    await memberCaller.trips.members.remove({ tripId });
    expect((await memberCaller.trips.list()).some(tr => tr.id === tripId)).toBe(
      false
    );
    expect((await memberCaller.menu.listByTrip({ tripId })).trip).toBeNull();
    await memberCaller.trips.invite.accept({ token: secondToken });
    expect((await memberCaller.trips.list()).some(tr => tr.id === tripId)).toBe(
      true
    );

    // Foto-Uploads simulieren: DB-Einträge plus echte Dateien auf dem Webspace
    const { getDb } = await import("./db");
    const schema = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const {
      tripPhotoStorage,
      recipePhotoStorage,
      spotPhotoStorage,
      inventoryPhotoStorage,
      sightingPhotoStorage,
    } = await import("./photoStorage");
    const fs = await import("node:fs/promises");
    const dbc = (await getDb())!;
    const uid = (user as NonNullable<typeof user>).id;
    const tripFile = `ci-trip-${Date.now()}.jpg`;
    const recipeFile = `ci-recipe-${Date.now()}.jpg`;
    const spotFile = `ci-spot-${Date.now()}.jpg`;
    const inventoryFile = `ci-inventory-${Date.now()}.jpg`;
    const sightingFile = `ci-sighting-${Date.now()}.jpg`;
    await tripPhotoStorage.saveFile(tripFile, Buffer.from("x"));
    await recipePhotoStorage.saveFile(recipeFile, Buffer.from("x"));
    await spotPhotoStorage.saveFile(spotFile, Buffer.from("x"));
    await inventoryPhotoStorage.saveFile(inventoryFile, Buffer.from("x"));
    await sightingPhotoStorage.saveFile(sightingFile, Buffer.from("x"));
    await dbc
      .insert(schema.tripPhotos)
      .values({ userId: uid, tripId, fileName: tripFile });
    await dbc
      .update(schema.customRecipes)
      .set({ imageFileName: recipeFile })
      .where(eq(schema.customRecipes.id, recipeId));
    await dbc
      .insert(schema.spotPhotos)
      .values({ userId: uid, spotId, fileName: spotFile });
    await dbc
      .update(schema.inventoryItems)
      .set({ imageFileName: inventoryFile })
      .where(eq(schema.inventoryItems.id, invItemId));
    await dbc
      .update(schema.natureSightings)
      .set({ fileName: sightingFile })
      .where(eq(schema.natureSightings.id, sightingId));
    // Offenes E-Mail-Bestätigungs-Token anlegen – die Lösch-Kaskade muss es entfernen
    await dbc.insert(schema.emailVerifyTokens).values({
      userId: uid,
      tokenHash: `ci-verify-${Date.now()}`,
      expiresAt: new Date(Date.now() + 60 * 1000),
    });

    // Aufräumen: Konto löschen entfernt auch die angelegten Daten
    const deleted = await authed.auth.deleteAccount({ password });
    expect(deleted.success).toBe(true);
    expect(await findUserByEmail(email)).toBeUndefined();

    // Lösch-Kaskade: keine Tabelle darf noch Zeilen des Kontos enthalten
    const remaining = await Promise.all([
      dbc
        .select()
        .from(schema.packLists)
        .where(eq(schema.packLists.userId, uid)),
      dbc
        .select()
        .from(schema.packTemplatesCustom)
        .where(eq(schema.packTemplatesCustom.userId, uid)),
      dbc
        .select()
        .from(schema.campSpots)
        .where(eq(schema.campSpots.userId, uid)),
      dbc
        .select()
        .from(schema.spotPhotos)
        .where(eq(schema.spotPhotos.userId, uid)),
      dbc.select().from(schema.tripLogs).where(eq(schema.tripLogs.userId, uid)),
      dbc
        .select()
        .from(schema.tripPhotos)
        .where(eq(schema.tripPhotos.userId, uid)),
      dbc
        .select()
        .from(schema.menuEntries)
        .where(eq(schema.menuEntries.userId, uid)),
      dbc
        .select()
        .from(schema.customRecipes)
        .where(eq(schema.customRecipes.userId, uid)),
      dbc
        .select()
        .from(schema.customHunts)
        .where(eq(schema.customHunts.userId, uid)),
      dbc
        .select()
        .from(schema.customQuizzes)
        .where(eq(schema.customQuizzes.userId, uid)),
      dbc
        .select()
        .from(schema.familyChildren)
        .where(eq(schema.familyChildren.userId, uid)),
      dbc
        .select()
        .from(schema.childBadges)
        .where(eq(schema.childBadges.userId, uid)),
      dbc
        .select()
        .from(schema.childStats)
        .where(eq(schema.childStats.userId, uid)),
      dbc
        .select()
        .from(schema.inventoryItems)
        .where(eq(schema.inventoryItems.userId, uid)),
      dbc
        .select()
        .from(schema.shoppingItems)
        .where(eq(schema.shoppingItems.userId, uid)),
      dbc
        .select()
        .from(schema.shoppingShares)
        .where(eq(schema.shoppingShares.userId, uid)),
      dbc
        .select()
        .from(schema.foodItems)
        .where(eq(schema.foodItems.userId, uid)),
      dbc
        .select()
        .from(schema.foodTemplates)
        .where(eq(schema.foodTemplates.userId, uid)),
      dbc
        .select()
        .from(schema.homeLocations)
        .where(eq(schema.homeLocations.userId, uid)),
      dbc
        .select()
        .from(schema.pushSubscriptions)
        .where(eq(schema.pushSubscriptions.userId, uid)),
      dbc
        .select()
        .from(schema.userSettings)
        .where(eq(schema.userSettings.userId, uid)),
      dbc
        .select()
        .from(schema.passwordResetTokens)
        .where(eq(schema.passwordResetTokens.userId, uid)),
      dbc
        .select()
        .from(schema.emailVerifyTokens)
        .where(eq(schema.emailVerifyTokens.userId, uid)),
      dbc.select().from(schema.passkeys).where(eq(schema.passkeys.userId, uid)),
      dbc
        .select()
        .from(schema.gearTasks)
        .where(eq(schema.gearTasks.userId, uid)),
      dbc
        .select()
        .from(schema.natureSightings)
        .where(eq(schema.natureSightings.userId, uid)),
      // Reise-Mitglieder, Einladungs-Links und Reise-Einkaufsliste der
      // eigenen Reisen sind weg (auch Einträge von Mitreisenden)
      dbc
        .select()
        .from(schema.tripMembers)
        .where(eq(schema.tripMembers.tripId, tripId)),
      dbc
        .select()
        .from(schema.tripInvites)
        .where(eq(schema.tripInvites.tripId, tripId)),
      dbc
        .select()
        .from(schema.tripShoppingItems)
        .where(eq(schema.tripShoppingItems.tripId, tripId)),
      dbc
        .select()
        .from(schema.menuDayNotes)
        .where(eq(schema.menuDayNotes.tripId, tripId)),
    ]);
    expect(remaining.map(rows => rows.length)).toEqual(remaining.map(() => 0));

    // Für das Mitglied ist der geteilte Trip nach der Konto-Löschung weg
    expect((await memberCaller.trips.list()).some(tr => tr.id === tripId)).toBe(
      false
    );

    // Hilfs-Konten wieder aufräumen
    await memberCaller.auth.deleteAccount({ password });
    await outsiderCaller.auth.deleteAccount({ password });
    expect(await findUserByEmail(memberEmail)).toBeUndefined();
    expect(await findUserByEmail(outsiderEmail)).toBeUndefined();

    // Auch die Upload-Dateien sind vom Webspace verschwunden
    await expect(
      fs.access(tripPhotoStorage.photoPath(tripFile))
    ).rejects.toThrow();
    await expect(
      fs.access(recipePhotoStorage.photoPath(recipeFile))
    ).rejects.toThrow();
    await expect(
      fs.access(spotPhotoStorage.photoPath(spotFile))
    ).rejects.toThrow();
    await expect(
      fs.access(inventoryPhotoStorage.photoPath(inventoryFile))
    ).rejects.toThrow();
    await expect(
      fs.access(sightingPhotoStorage.photoPath(sightingFile))
    ).rejects.toThrow();
  });
});
