import type { Translation } from "./de";

/** Dizionario italiano. */
export const it: Translation = {
  common: {
    loading: "Caricamento",
    save: "Salva",
    saving: "Salvataggio …",
    cancel: "Annulla",
    delete: "Elimina",
    confirmLeave: "Esci",
    confirmDiscard: "Scarta",
    confirmEmpty: "Svuota",
    confirmReset: "Reimposta",
    confirmStop: "Termina",
    edit: "Modifica",
    copy: "Copia",
    linkCopied: "Link copiato",
    copyFailed: "Copia non riuscita – seleziona il testo manualmente",
    back: "Indietro",
    today: "Oggi",
    tomorrow: "domani",
    optional: "facoltativo",
    night: "notte",
    nights: "notti",
    deleteFailed: "Eliminazione non riuscita",
    saveFailed: "Salvataggio non riuscito",
    actionFailed: "Azione non riuscita",
    offlineBadge: "Offline",
    distanceByRoad: (value: string) => `${value} su strada`,
    distanceOnPath: (value: string) => `${value} lungo il sentiero`,
    screenAwake: "Lo schermo resta acceso",
  },
  password: {
    strengthLabel: "Forza della password",
    weak: "debole",
    medium: "media",
    good: "buona",
    strong: "forte",
    strengthAria: (label: string) => `Forza della password: ${label}`,
    hints: {
      tooShort: "Usa almeno 8 caratteri",
      addLength: "Allungala – da 12 caratteri in su diventa molto più sicura",
      addCase: "Mescola maiuscole e minuscole",
      addNumber: "Inserisci almeno una cifra",
      addSpecial: "Aggiungi un carattere speciale, p. es. ! ? #",
      avoidCommon: "Evita parole comuni e sequenze di numeri",
      avoidRepeat: "Evita ripetizioni come «aaa»",
    },
  },
  shell: {
    toHome: "Alla pagina iniziale",
    skipToContent: "Vai al contenuto",
    themeLight: "Attiva il tema chiaro",
    themeDark: "Attiva il tema scuro",
    themeAuto: "Attiva il tema automatico (sistema)",
    notificationsMenu: "Mostra le notifiche",
    notificationsUnread: (count: number) =>
      count === 1
        ? "Mostra le notifiche – 1 nuova"
        : `Mostra le notifiche – ${count} nuove`,
    notificationsTitle: "Notifiche",
    accountMenu: "Apri il menu dell'account",
    loggedIn: "Connesso/a",
    profile: "Profilo",
    logout: "Esci",
    login: "Accedi",
    sosAria: "SOS – apri il pannello d'emergenza",
    mainNav: "Navigazione principale",
    nav: {
      start: "Inizio",
      pack: "Bagagli",
      sun: "Sole",
      weather: "Meteo",
      firstAid: "Primo soccorso",
      sos: "SOS",
    },
  },
  /** Offline-Hinweise: Band in der Kopfzeile und Stand der Daten. */
  /** Karten-App-Wahl beim Öffnen einer Route. */
  directions: {
    title: "Con cosa navighiamo?",
    description: "Il percorso può aprirsi in Mappe di Apple o in Google Maps.",
    apple: "Mappe (Apple)",
    google: "Google Maps",
    remember: "Ricorda la scelta e non chiedere più",
    changeHint: "Puoi cambiarlo in qualsiasi momento nel profilo.",
    settingLabel: "App di mappe per i percorsi",
    settingAsk: "Chiedi ogni volta",
    settingHint:
      "Determina con cosa si aprono «Percorso» e «Andare». «Chiedi ogni volta» ripropone la domanda.",
  },
  /** Himmel-Seite: Mond, Sternschnuppen, ISS, Sternbilder, Rotlicht. */
  sky: {
    title: "Cielo",
    subtitle: "Luna, stelle cadenti, ISS e costellazioni per stanotte",
    fromNatureHint:
      "Luna, oscurità, stelle cadenti, ISS e costellazioni – ora su una pagina propria",
  },
  /** «Konnte nicht geladen werden» – der dritte Zustand neben Laden und Leer. */
  queryError: {
    title: "Impossibile caricare",
    text: "Il server non ha risposto come previsto. I tuoi dati non sono persi – riprova subito.",
    offlineTitle: "Non caricabile senza connessione",
    offlineText:
      "Questa parte non è mai stata caricata e quindi non è sul dispositivo. Ci sarà appena tornerai in rete.",
    retry: "Riprova",
  },
  offline: {
    banner: "Nessuna connessione – vedi dati salvati.",
    dataAge: (time: string) => `Aggiornato alle ${time}`,
    synced: (count: number) =>
      count === 1 ? "1 modifica inviata." : `${count} modifiche inviate.`,
  },
  home: {
    recentSearches: "Ricerche recenti:",
    recentSearchesClear: "cancella",
    heroImageAlt:
      "Tenda con pannelli solari e falò davanti alle Alpi svizzere al tramonto",
    heroKicker: "Il tuo coltellino svizzero per il campeggio in tenda",
    greeting: {
      morning: (name: string) => `Buongiorno, ${name}`,
      day: (name: string) => `Buongiorno, ${name}`,
      evening: (name: string) => `Buonasera, ${name}`,
    },
    tripArrivalAt: (time: string) => `Arrivo ${time}`,
    heroTitle1: "Tutto per il campo.",
    heroTitle2: "In una sola app.",
    heroSubtitle:
      "Pianificazione, sicurezza, energia e natura – oltre 40 strumenti smart per la tua prossima avventura.",
    sunInfo: (sunrise, sunset) => `Oggi: alba ${sunrise} · tramonto ${sunset}`,
    nextTripFallback: "Prossimo trip",
    nextTripAria: place => `Prossimo soggiorno pianificato: ${place}`,
    tripStartsToday: "Si parte oggi!",
    tripStartsTomorrow: "Si parte domani!",
    tripDaysLeft: n => `Ancora ${n} giorni`,
    tripPacked: (name, checked, total, pct) =>
      `${name}: ${checked} su ${total} pronti (${pct} %)`,
    tripPlannedNote: "Soggiorno pianificato in «I miei viaggi»",
    currentTripAria: place => `Soggiorno in corso a ${place}`,
    currentTripTitle: place => `Sei a ${place}`,
    currentTripDay: (day, total) => `Giorno ${day} di ${total}`,
    currentTripMenuLink: "Piano dei pasti",
    currentTripMenuAria: place =>
      `Apri il piano dei pasti del soggiorno a ${place}`,
    currentTripSpotLink: "Dossier della piazzola",
    currentTripSpotAria: place => `Apri il dossier della piazzola ${place}`,
    currentTripShoppingLink: "Lista della spesa",
    currentTripFoodLink: "Frigo box",
    currentTripWeatherLink: "Meteo del campo",
    currentTripChoresLink: "Piano dei turni",
    currentTripMealsSr: "Pasti di oggi:",
    anniversaryTitleOne: "Un anno fa",
    anniversaryTitleMany: years => `${years} anni fa`,
    anniversaryNights: n => (n === 1 ? "1 notte" : `${n} notti`),
    anniversaryRatingAria: stars =>
      stars === 1 ? "1 stella su 5" : `${stars} stelle su 5`,
    anniversaryLink: "Guarda nel diario",
    anniversaryLinkAria: place =>
      `Guarda la voce su ${place} nel diario di viaggio`,
    anniversaryPhotoAlt: place => `Immagine principale di ${place}`,
    anniversaryDismissAria: "Nascondi il promemoria per oggi",
    weatherAria: (temp, label) =>
      `Meteo attuale: ${temp} gradi, ${label} – al modulo meteo`,
    weatherNoAlerts: "Nessuna allerta maltempo nella tua posizione",
    weatherAlertAria: (temp, label, count, severity) =>
      `Meteo attuale: ${temp} gradi, ${label}. ${
        count === 1 ? "1 allerta maltempo" : `${count} allerte maltempo`
      }, livello più alto: ${severity} – alle allerte nel modulo meteo`,
    tipOfDayTitle: "Consiglio del giorno",
    tipOfDayAria: (text: string) => `Consiglio del giorno: ${text}`,
    gearDueText: (n: number) =>
      n === 1
        ? "1 attività di manutenzione della tua attrezzatura è in scadenza"
        : `${n} attività di manutenzione della tua attrezzatura sono in scadenza`,
    gearDueAria: (n: number) =>
      n === 1
        ? "1 attività di manutenzione in scadenza – apri l'inventario"
        : `${n} attività di manutenzione in scadenza – apri l'inventario`,
    tickDueText: (n: number) =>
      n === 1
        ? "1 morso di zecca è ancora da osservare"
        : `${n} morsi di zecca sono ancora da osservare`,
    tickDueAria: (n: number) =>
      n === 1
        ? "1 morso di zecca in osservazione – apri il primo soccorso"
        : `${n} morsi di zecca in osservazione – apri il primo soccorso`,
    searchPlaceholder:
      "Cerca nel sapere: morso di zecca, nodo parlato, ricette …",
    searchAria: "Cerca nei moduli di conoscenza",
    searchNoResults:
      "Nessun risultato – prova un altro termine (ad es. «ustione» o «nodo»).",
    searchPreparing: "Preparazione dei moduli di conoscenza …",
    travelModeLabel: "Vista:",
    travelModeOnSite: "In viaggio",
    travelModePlanning: "Pianificare",
    travelModeAuto: "automatico",
    travelModeAria: "Vista della pagina iniziale",
    searchCategories: {
      module: "Modulo",
      firstAid: "Primo soccorso",
      knots: "Nodi",
      recipes: "Ricette",
      nature: "Natura",
      care: "Manutenzione",
      clouds: "Nuvole",
      own: "I miei contenuti",
    },
    recentTitle: "Usati di recente",
    sortStart: "Ordina",
    sortDone: "Fatto",
    sortStartAria: "Ordina le tessere",
    sortDoneAria: "Termina l'ordinamento",
    sortHint:
      "Trascina le tessere nella nuova posizione (all'interno del gruppo) oppure usa i pulsanti freccia. Con il pulsante occhio nascondi o mostri di nuovo le tessere. Se hai eseguito l'accesso, la selezione vale su tutti i tuoi dispositivi.",
    hiddenBadge: "Nascosto",
    widgetsTitle: "Widget",
    widgetsHint:
      "Scegli quali sezioni compaiono sopra le schede. Il saluto, la ricerca e le schede stesse restano sempre visibili. Da connesso la scelta vale su tutti i tuoi dispositivi.",
    widgetNames: {
      onboarding: "Primi passi",
      briefing: "Briefing del mattino",
      trip: "Soggiorno in corso / prossimo",
      anniversary: "Un anno fa",
      weather: "Meteo",
      tip: "Consiglio del giorno",
      recent: "Usati di recente",
    },
    moveAria: title => `Sposta ${title}`,
    moveUpAria: title => `Sposta ${title} in avanti`,
    moveDownAria: title => `Sposta ${title} indietro`,
    showAria: title => `Mostra di nuovo ${title}`,
    hideAria: title => `Nascondi ${title}`,
    openAria: title => `Apri ${title}`,
    onboardingTitle: "Primi passi",
    onboardingSubtitle:
      "Ecco come preparare CampMesser per la tua prossima avventura.",
    onboardingDismissAria: "Nascondi la scheda dei primi passi",
    onboardingSteps: {
      account: "Crea un account o accedi",
      spot: "Salva la prima piazzola",
      packList: "Crea la prima lista bagagli",
      trip: "Pianifica il primo viaggio",
      push: "Attiva le notifiche push",
    },
    onboardingOptional: "facoltativo",
    onboardingDoneAria: label => `${label} – fatto`,
    onboardingOpenAria: label => `${label} – apri ora`,
    onboardingLockedAria: label => `${label} – possibile solo dopo l'accesso`,
  },
  login: {
    title: "Accedi",
    subtitle:
      "Con il tuo account CampMesser salvi liste bagagli, inventario e piazzole e le usi su tutti i tuoi dispositivi.",
    resetTitle: "Reimposta la password",
    resetSubtitle:
      "Indica l'indirizzo e-mail del tuo account – ti inviamo un link con cui puoi impostare una nuova password.",
    newPasswordTitle: "Imposta una nuova password",
    newPasswordSubtitle: "Scegli una nuova password per il tuo account.",
    welcome: "Benvenuto/a!",
    welcomeName: name => `Benvenuto/a, ${name}!`,
    linkSent:
      "Se esiste un account con questo indirizzo e-mail, ti abbiamo appena inviato un link (valido 60 minuti). Controlla anche la cartella spam.",
    resetDone: "Password reimpostata – ora hai eseguito l'accesso.",
    resetUnavailable:
      "La reimpostazione della password via e-mail al momento non è disponibile. Contatta il gestore.",
    tooManyResets: "Troppe richieste. Riprova tra un'ora.",
    resetLinkInvalid: "Il link non è valido o è scaduto. Richiedine uno nuovo.",
    passwordsMismatch: "Le password non coincidono.",
    accountEmailLabel: "E-mail del tuo account",
    emailPlaceholder: "tu@esempio.ch",
    sendingLink: "Invio del link …",
    sendLink: "Richiedi link",
    newPasswordLabel: "Nuova password",
    passwordHint: "(min. 8 caratteri)",
    confirmNewPasswordLabel: "Conferma la nuova password",
    setPassword: "Imposta password",
    backToLogin: "Torna all'accesso",
    tabLogin: "Accedi",
    tabRegister: "Registrati",
    emailLabel: "E-mail",
    passwordLabel: "Password",
    loggingIn: "Accesso in corso …",
    loginButton: "Accedi",
    forgotPassword: "Password dimenticata?",
    nameLabel: "Nome",
    namePlaceholder: "ad es. Alex",
    confirmPasswordLabel: "Conferma password",
    creatingAccount: "Creazione dell'account …",
    createAccount: "Crea account",
    knowledgeNote:
      "I moduli di conoscenza (primo soccorso, nodi, natura, ricette) funzionano anche senza account – un account ti serve solo per salvare i tuoi dati.",
    passkeyOr: "oppure",
    passkeyButton: "Accedi con passkey",
    passkeyWaiting: "In attesa della passkey …",
    passkeyFailed:
      "L'accesso con la passkey non è riuscito. Riprova oppure accedi con la password.",
    emailVerified: "Indirizzo e-mail confermato – grazie!",
    verifyLinkInvalid:
      "Il link di conferma non è valido o è scaduto. Richiedine uno nuovo nel tuo profilo.",
  },
  profile: {
    prefHeat: "Sole e caldo",
    prefHeatDesc:
      "Al mattino un promemoria per la crema solare e per bere, quando la giornata porta UV alto o più di 28 °C.",
    languageTitle: "Lingua",
    languageIntro:
      "In quale lingua deve funzionare l'app? La scelta vale su tutti i tuoi dispositivi, anche per le notifiche che riceve questo dispositivo.",
    calendarTitle: "Abbonamento al calendario",
    calendarIntro:
      "I tuoi viaggi sempre aggiornati nel calendario del telefono o del computer: a differenza del file scaricato, un abbonamento si aggiorna da solo quando sposti un viaggio.",
    calendarSubscribe: "Abbonati al calendario",
    calendarCopy: "Copia l'indirizzo",
    calendarCopied: "Indirizzo copiato.",
    calendarCopyFailed:
      "La copia non ha funzionato: seleziona l'indirizzo a mano.",
    calendarSecretHint:
      "Chi ha questo indirizzo vede luogo e periodo dei tuoi viaggi. L'hai dato via? Generane uno nuovo: il vecchio smette subito di funzionare.",
    calendarResetButton: "Rigenera",
    calendarResetConfirm:
      "Generare un nuovo indirizzo? Gli abbonamenti con il vecchio smettono di aggiornarsi.",
    calendarReset: "Nuovo indirizzo generato.",
    appBadgeTitle: "Numero sull'icona dell'app",
    appBadgeDesc:
      "Mostra sull'icona quanti alimenti della ghiacciaia scadono oggi o domani e quante attività di manutenzione sono in scadenza. Non è una notifica non letta: un'attività aperta resta finché non la spunti.",
    appBadgeAria: "Mostrare il numero sull'icona dell'app",
    title: "Profilo",
    manageSubtitle: "Gestisci il tuo account e le tue impostazioni.",
    loginFeature: "il tuo profilo",
    loggedInAs: id => `Accesso eseguito come ${id}`,
    nameUpdated: "Nome aggiornato",
    emailUpdated:
      "Indirizzo e-mail aggiornato – d'ora in poi accedi con questo",
    passwordUpdated: "Password aggiornata",
    accountDeleted: "Account eliminato. Buon viaggio!",
    themeSavedDark: "Tema scuro salvato come predefinito",
    themeSavedLight: "Tema chiaro salvato come predefinito",
    themeSavedAuto: "Tema automatico salvato – segue l'impostazione di sistema",
    themeTitle: "Tema",
    themeIntro:
      "Scegli con quale tema si avvia l'app per impostazione predefinita.",
    themeGroupAria: "Scegli il tema predefinito",
    themeLight: "Chiaro",
    themeDark: "Scuro",
    themeAuto: "Automatico (sistema)",
    nameTitle: "Cambia nome",
    nameAria: "Nome",
    namePlaceholder: "Il tuo nome",
    verifyHint:
      "Il tuo indirizzo e-mail non è ancora confermato. Controlla la tua casella di posta (anche lo spam) oppure fatti rinviare il link.",
    verifyResend: "Invia di nuovo l'e-mail di conferma",
    verifySending: "Invio in corso …",
    verifySent:
      "E-mail di conferma inviata – controlla la tua casella di posta (valida 48 ore).",
    verifyTooMany: "Troppe richieste. Riprova tra un'ora.",
    verifyUnavailable: "L'invio di e-mail al momento non è disponibile.",
    emailTitle: "Cambia indirizzo e-mail",
    emailCurrentPrefix: "Attuale:",
    emailCurrentSuffix: ". D'ora in poi accederai con il nuovo indirizzo.",
    newEmailLabel: "Nuovo indirizzo e-mail",
    confirmWithPasswordLabel: "Password per conferma",
    changeEmail: "Cambia e-mail",
    passwordTitle: "Aggiorna password",
    newPasswordsMismatch: "Le nuove password non coincidono.",
    currentPasswordLabel: "Password attuale",
    newPasswordLabel: "Nuova password (min. 8 caratteri)",
    repeatPasswordLabel: "Ripeti la nuova password",
    changePassword: "Cambia password",
    deleteTitle: "Elimina account",
    deleteIntro:
      "Elimina irrevocabilmente il tuo account e tutti i dati salvati (liste bagagli, inventario, piazzole, utenze, frigo box).",
    deleteButton: "Elimina account …",
    deleteConfirmTitle: "Eliminare davvero l'account?",
    deleteConfirmDescription:
      "Tutti i tuoi dati saranno eliminati irrevocabilmente. Conferma con la tua password.",
    passwordLabel: "Password",
    deleteFinal: "Elimina definitivamente",
    versionLine: version => `CampMesser versione ${version}`,
    buildDate: date => ` · build del ${date}`,
    notificationsTitle: "Notifiche",
    pushDeviceTitle: "Push su questo dispositivo",
    pushDeviceDesc:
      "Notifiche per maltempo, TMC del frigo box, conto alla rovescia del soggiorno, notti di stelle cadenti e manutenzione dell'attrezzatura.",
    pushDeviceAria: "Attiva le notifiche push su questo dispositivo",
    pushUnsupported: "Il tuo browser non supporta le notifiche push.",
    pushNotConfigured: "Il push non è configurato lato server.",
    pushOn: "Notifiche push attivate",
    pushOff: "Notifiche push disattivate",
    prefsIntro: "Scegli quali notifiche riceve questo dispositivo:",
    lastCheckAgo: (ago: string) => `Ultimo controllo: ${ago}`,
    lastCheckNever: "Il controllo non è mai stato eseguito.",
    lastCheckStale: (hours: number) =>
      `Nessun controllo da oltre ${hours} ore – probabilmente al momento non arriva nessuna notifica.`,
    prefWeather: "Allerte maltempo",
    prefWeatherDesc:
      "Tempesta, temporale o piogge intense sulle tue piazzole salvate.",
    prefFood: "Promemoria TMC",
    prefFoodDesc: "Quando gli alimenti nel frigo box scadono oggi o domani.",
    prefTrips: "Conto alla rovescia del soggiorno",
    prefTripsDesc:
      "3 giorni prima dell'arrivo, incluso lo stato della lista bagagli.",
    prefAstro: "Notti di stelle cadenti",
    prefAstroDesc:
      "Quando una notte serena coincide con un massimo di stelle cadenti nella tua località di casa.",
    prefGear: "Promemoria di manutenzione",
    prefGearDesc:
      "Al massimo una volta al mese, quando la manutenzione dell'attrezzatura è in scadenza.",
    prefToggleAria: (label: string) => `Attiva o disattiva ${label}`,
    thresholdsTitle: "Soglie di allerta personali",
    thresholdsIntro:
      "Da quali valori la notifica di maltempo deve svegliarti? Lascia vuoto per il valore standard.",
    thresholdWind: "Raffiche da (km/h)",
    thresholdWindHint: (standard: number, min: number, max: number) =>
      `Standard ${standard} · possibile ${min}–${max}`,
    thresholdRain: "Pioggia da (mm all'ora)",
    thresholdRainHint: (standard: number, min: number, max: number) =>
      `Standard ${standard} · possibile ${min}–${max}`,
    thresholdReset: "Standard",
    historyHint:
      "Le ultime notifiche inviate al tuo account – le più recenti per prime.",
    historyEmpty:
      "Nessuna notifica inviata finora. Appena ci sarà qualcosa, la trovi qui.",
    historyOpenAria: (title: string) => `Apri «${title}»`,
    historyKind: {
      heat: "Sole e caldo",
      weather: "Maltempo",
      food: "Frigo box",
      trip: "Viaggio",
      drying: "Asciugare la tenda",
      astro: "Stelle cadenti",
      gear: "Attrezzatura",
      evepack: "Controllo della vigilia",
      board: "Bacheca",
      join: "Compagni di viaggio",
    },
    homeTitle: "Località di casa",
    homeIntro:
      "Salva il luogo in cui abiti per ricevere allerte maltempo e consigli sulle stelle cadenti anche per casa – senza piazzola salvata.",
    homeNotSet: "Nessuna località di casa impostata finora.",
    homeNameLabel: "Nome",
    homeDefaultName: "Casa",
    homeUseLocation: "Usa la posizione attuale",
    homeLocating: "Rilevamento della posizione …",
    homeSearchLabel: "Cerca località",
    homeSearchPlaceholder: "es. Berna",
    homeSearchButton: "Cerca",
    homeSearchFailed:
      "La ricerca della località non è riuscita. Riprova più tardi.",
    homeSearchEmpty: "Nessuna località trovata.",
    homeSelectAria: (name: string) => `Imposta ${name} come località di casa`,
    homeSaved: "Località di casa salvata",
    homeRemoved: "Località di casa rimossa",
    homeRemoveAria: "Rimuovi la località di casa",
    passkeysTitle: "Sicurezza: passkey",
    passkeysIntro:
      "Con una passkey accedi senza password – con impronta digitale, volto o codice del dispositivo. La tua password resta comunque valida.",
    passkeysEmpty: "Nessuna passkey salvata finora.",
    passkeyAddedOn: (date: string) => `aggiunta il ${date}`,
    passkeyNameLabel: "Nome della passkey",
    passkeyNamePlaceholder: "es. telefono di Alex",
    passkeyDefaultName: "Passkey",
    passkeyAddButton: "Aggiungi passkey",
    passkeyAdding: "In attesa di conferma …",
    passkeyAdded: "Passkey salvata",
    passkeyAddFailed: "Non è stato possibile creare la passkey. Riprova.",
    passkeyExists: "Su questo dispositivo è già salvata una passkey.",
    passkeyRemoveAria: (name: string) => `Rimuovi la passkey «${name}»`,
    passkeyRemoveConfirm: (name: string) =>
      `Rimuovere davvero la passkey «${name}»? L'accesso con essa non sarà più possibile.`,
    passkeyRemoved: "Passkey rimossa",
    passkeysUnsupported: "Il tuo browser non supporta le passkey.",
  },
  packLists: {
    title: "Liste bagagli",
    subtitle: "Checklist basate su scenari, da spuntare e ampliare come vuoi.",
    loginFeature: "le tue liste bagagli",
    newList: "Nuova lista bagagli",
    newListAria: "Creare una nuova lista bagagli",
    dialogDescription:
      "Scegli uno scenario – l'attrezzatura di base adatta viene inserita automaticamente.",
    scenarioAria: label => `Scegliere lo scenario ${label}`,
    preparedItems: n => `Contiene ${n} voci preparate.`,
    nameLabel: "Nome della lista",
    namePlaceholder: label => `p. es. ${label} estate`,
    namePlaceholderFallback: "Nome",
    personsLabel: "Persone (facoltativo)",
    personsPlaceholder: "Inserisci un nome, Invio lo aggiunge",
    personsAddAria: "Aggiungi una persona alla nuova lista",
    personsRemoveAria: name => `Rimuovi la persona ${name}`,
    personsHint:
      "Ogni persona riceve una propria sezione nella lista – «Generale» c'è sempre.",
    createList: "Crea la lista",
    defaultName: "La mia lista bagagli",
    created: "Lista bagagli creata",
    createFailed: "Impossibile creare la lista",
    duplicated: "Lista copiata – tutte le voci sono da spuntare",
    duplicateFailed: "Copia non riuscita",
    openAria: name => `Aprire la lista bagagli ${name}`,
    duplicateAria: name => `Duplicare la lista bagagli ${name}`,
    renameAria: (name: string) => `Rinomina la lista bagagli ${name}`,
    renameTitle: "Rinomina la lista",
    renameSaved: "Nome salvato.",
    saveTemplateAria: (name: string) => `Salva la lista ${name} come modello`,
    deleteAria: name => `Eliminare la lista bagagli ${name}`,
    deleteConfirm: name => `Eliminare davvero la lista «${name}»?`,
    emptyTitle: "Ancora nessuna lista bagagli",
    emptyText: "Crea la tua prima lista – scegli semplicemente uno scenario.",
    familyTitle: "Checklist per famiglie",
    familySubtitle:
      "Pacchetti pronti per il campeggio con i bambini – riprendi le voci in una delle tue liste.",
    moreItems: (n: number) => `… e altre ${n} voci`,
    addToPackList: "Aggiungi a una lista bagagli",
    addToPackListAria: label =>
      `Aggiungere il pacchetto ${label} a una lista bagagli`,
    chooseListTitle: "Scegli una lista bagagli",
    chooseListDescription: label =>
      `In quale lista vuoi riprendere le voci di «${label}»?`,
    addOnAdded: (label, list) => `«${label}» aggiunto a «${list}»`,
    addOnAddFailed: "Impossibile aggiungere le voci",
    noListsForAddOn:
      "Crea prima una lista bagagli – poi potrai riprendere il pacchetto.",
    myTemplatesTitle: "I miei modelli",
    templateAria: (name: string) => `Scegliere il modello ${name}`,
    templateItemCount: (n: number) => (n === 1 ? "1 voce" : `${n} voci`),
    templateDeleteAria: (name: string) => `Eliminare il modello ${name}`,
    templateDeleteConfirm: (name: string) =>
      `Eliminare davvero il modello «${name}»?`,
    templateDeleted: "Modello eliminato",
    templateDeleteFailed: "Impossibile eliminare il modello",
    budgetBadge: weight => `Budget ${weight}`,
    templateShareAria: name => `Condividi il modello ${name} tramite link`,
    templateShareTitle: "Condividi modello",
    templateShareDescription:
      "Chi ha il link può vedere il modello e, con un account, salvarlo come modello personale.",
    templateShareCopied: "Link di condivisione copiato – inoltralo!",
    templateShareFailed: "Condivisione non riuscita",
    templateUnshare: "Termina condivisione",
    templateUnshared: "Condivisione terminata – il link non è più valido",
    templateUnshareFailed: "Impossibile terminare la condivisione",
    templateQrAlt: name =>
      `Codice QR del link di condivisione del modello ${name}`,
    templateQrTitle: "Passalo direttamente",
    templateQrText:
      "Fai scansionare il codice con la fotocamera del telefono – il modello si apre subito.",
    templateSharedBadge: "condiviso",
    archiveAria: (name: string) => `Archivia la lista bagagli ${name}`,
    unarchiveAria: (name: string) => `Ripristina la lista bagagli ${name}`,
    archived: "Lista archiviata",
    unarchived: "Lista ripristinata",
    archiveFailed: "Archiviazione non riuscita",
    archiveSectionTitle: (n: number) => `Archivio (${n})`,
    archiveSectionAria: "Apri o chiudi le liste bagagli archiviate",
    archiveHint:
      "Le liste archiviate restano complete di tutte le voci – semplicemente non compaiono più negli elenchi di scelta.",
    archivedBadge: "archiviata",
  },
  packListDetail: {
    boxBadgeAria: "Si trova nella cassa",
    backLabel: "Liste bagagli",
    fallbackTitle: "Lista bagagli",
    loginFeature: "le tue liste bagagli",
    notFound: "Lista bagagli non trovata",
    packedCount: (checked, total) => `${checked} voci su ${total} preparate`,
    progressAria: pct => `Avanzamento: ${pct} per cento preparato`,
    weightTotal: "in totale",
    weightPacked: "preparato",
    volumeLine: litres => `${litres} l di volume`,
    matchedInfo: (matched, total) =>
      `(${matched} voci su ${total} trovate nell'inventario)`,
    shareCreating: "Creazione del link …",
    shareButton: "Condividi la lista con un link",
    shareCopied:
      "Link di condivisione copiato – mandalo ai tuoi compagni di viaggio!",
    shareCreated: "Link di condivisione creato – copialo qui sotto.",
    shareFailed: "Condivisione non riuscita",
    qrAlt: name => `Codice QR del link di condivisione della lista ${name}`,
    qrTitle: "Da passare direttamente sul posto",
    qrText:
      "Fai scansionare il codice con la fotocamera del telefono – la lista si apre subito, senza digitare né accedere.",
    shareHint:
      "Chi ha il link può vedere la lista e spuntarla insieme a te – senza alcun accesso.",
    toggleFailed: "Modifica non riuscita",
    addFailed: "Impossibile aggiungere la voce",
    addOnAdded: label => `«${label}» aggiunto`,
    addPlaceholder: "Aggiungi una voce …",
    addNameAria: "Nome della nuova voce",
    categoryAria: "Categoria della nuova voce",
    newCategoryOption: "Nuova categoria …",
    newCategoryPlaceholder: "Nuova categoria",
    newCategoryAria: "Nome della nuova categoria",
    editCategoryAria: (name: string) => `Modifica la categoria di ${name}`,
    editItemAria: (name: string) => `Modifica ${name}`,
    editNameAria: (name: string) => `Nuovo nome per ${name}`,
    editQtyAria: (name: string) => `Quantità di ${name}`,
    editCategorySelectAria: (name: string) => `Nuova categoria per ${name}`,
    categorySave: "Salva categoria",
    categoryUpdateFailed: "Impossibile modificare la categoria",
    addAria: "Aggiungi la voce",
    defaultCategory: "Personale",
    generalCategory: "Generale",
    inventoryTitle: "Riprendi dal tuo inventario",
    inventoryAddAria: name => `Aggiungere ${name} dall'inventario alla lista`,
    inventoryHint:
      "Le voci trovate nell'inventario contano automaticamente nel bilancio del peso qui sopra.",
    addOnAria: label => `Aggiungere il pacchetto ${label} alla lista`,
    markPacked: name => `Segnare ${name} come preparato`,
    markUnpacked: name => `Segnare ${name} come non preparato`,
    deleteItemAria: name => `Eliminare ${name}`,
    reorderAria: name => `Sposta ${name} – trascina per ordinare`,
    reorderFailed: "Impossibile salvare il nuovo ordine",
    emptyList:
      "Questa lista è ancora vuota – aggiungi la tua prima voce in una sezione qui sotto.",
    assignFailed: "Assegnazione non riuscita",
    assignButtonAria: name => `Assegnare ${name} a una persona`,
    assignInputAria: name => `Persona che prepara ${name}`,
    assignPlaceholder: "Nome (ad es. Mamma)",
    assignSave: "Assegna",
    assignRemove: "Rimuovi l'assegnazione",
    assignSuggestionAria: (person, item) => `Assegnare ${item} a ${person}`,
    sectionGeneral: "Generale",
    sectionProgress: (checked, total) => `${checked} su ${total} preparate`,
    sectionEmpty: "Ancora nessuna voce in questa sezione.",
    sectionAddNameAria: section => `Nuova voce nella sezione ${section}`,
    sectionAddAria: section => `Aggiungi una voce nella sezione ${section}`,
    printPersonAria: name => `Stampa solo le voci di ${name}`,
    managePersonsButton: "Gestisci persone",
    personTabsAria: "Sezioni della lista bagagli",
    managePersonsTitle: "Gestisci persone",
    managePersonsDescription:
      "Ogni persona riceve una propria sezione nella lista. Le voci senza persona stanno sotto «Generale».",
    personsEmpty: "Ancora nessuna persona – aggiungi la prima qui sotto.",
    personNameAria: "Nome della nuova persona",
    addPersonButton: "Aggiungi",
    removePersonAria: name => `Rimuovi la persona ${name}`,
    removePersonConfirm: name =>
      `Rimuovere davvero la persona «${name}»? Le sue voci tornano sotto «Generale».`,
    personsSaveFailed: "Impossibile salvare le persone",
    personsMaxHint: "Al massimo 10 persone per lista.",
    tripMembersTitle: "Aggiungi compagni di viaggio",
    tripMembersHint:
      "Questa lista è collegata a un viaggio condiviso: tocca un nome per creargli una sezione.",
    addTripMemberAria: (name: string) =>
      `Aggiungi ${name} come persona alla lista`,
    ownPersonBadge: "Tu",
    printButton: "Stampa",
    saveTemplateButton: "Salva come modello",
    saveTemplateAria: (name: string) => `Salvare la lista ${name} come modello`,
    saveTemplateTitle: "Salva come modello",
    saveTemplateDescription:
      "Salva le voci attuali (nomi, categorie, quantità) come modello riutilizzabile. Le spunte e le assegnazioni alle persone non vengono riprese.",
    templateNameLabel: "Nome del modello",
    saveTemplateConfirm: "Salva il modello",
    templateSaved: "Modello salvato – disponibile quando crei nuove liste",
    templateSaveFailed: "Impossibile salvare il modello",
    budgetSetButton: "Imposta un budget di peso",
    budgetEdit: "Modifica",
    budgetEditAria: "Modifica il budget di peso",
    budgetLine: (total, budget) => `${total} su ${budget} di budget`,
    budgetPercent: pct => `${pct} % del budget utilizzato`,
    budgetOver: excess => `${excess} oltre il budget`,
    budgetProgressAria: pct => `Peso: ${pct} per cento del budget`,
    budgetDialogTitle: "Imposta un budget di peso",
    budgetDialogDescription:
      "Definisci quanto può pesare al massimo il tuo bagaglio. Il bilancio confronta il peso attuale dall'inventario con il tuo budget.",
    budgetLabel: "Budget in kg",
    budgetPlaceholder: "es. 15,5",
    budgetSave: "Salva budget",
    budgetRemove: "Rimuovi budget",
    budgetSaved: "Budget di peso salvato",
    budgetRemoved: "Budget di peso rimosso",
    budgetSaveFailed: "Impossibile salvare il budget",
    budgetInvalid: "Inserisci un peso tra 0,1 e 500 kg",
    uncheckAllButton: "Togli tutte le spunte",
    uncheckAllConfirm: (n: number) =>
      n === 1
        ? "Togliere davvero la spunta? La voce rimane."
        : `Togliere davvero tutte le ${n} spunte? Le voci rimangono.`,
    uncheckAllDone: "Tutte le spunte tolte – pronto per il prossimo bagaglio",
    uncheckAllFailed: "Impossibile togliere le spunte",
    editedByTitle: (name, date) => `Ultima modifica di ${name} il ${date}`,
    editedByBadgeAria: name => `Ultima modifica di ${name}`,
  },
  packListPrint: {
    docTitle: name => `${name} – lista bagagli da stampare`,
    docTitleFallback: "Lista bagagli",
    appTitle: "CampMesser – il coltellino svizzero per il campeggio in tenda",
    notFound: "Questa lista bagagli non è stata trovata.",
    printButton: "Stampa / Salva come PDF",
    printBrowserHint:
      "Nell'app installata il pulsante apre la vista nel browser – da lì stampa o salva come PDF dal menu.",
    headerKicker: "CampMesser · Lista bagagli",
    meta: (items, categories) =>
      `${items} ${items === 1 ? "voce" : "voci"} · ${categories} ${categories === 1 ? "categoria" : "categorie"}`,
    printedOn: date => `Stato: ${date}`,
    personFilterInfo: name => `Solo le voci di ${name}`,
    emptyList: "Questa lista non contiene voci.",
    footer:
      "Niente di dimenticato – buon viaggio! · CampMesser – il coltellino svizzero per il campeggio in tenda",
  },
  sharedPackList: {
    loadingShared: "Caricamento della lista condivisa …",
    notFoundTitle: "Link scaduto o non valido",
    backHome: "Pagina iniziale",
    invalidLink:
      "Questo link di condivisione è scaduto, non è valido o è stato ritirato dalla proprietaria o dal proprietario.",
    toggleFailed: "Spunta non riuscita",
    subtitle: (checked, total) =>
      `Lista bagagli condivisa · ${checked} voci su ${total} preparate`,
    progressAria: pct => `Avanzamento: ${pct} per cento preparato`,
    sharedInfo:
      "Spunta condivisa: tutte le persone con questo link vedono lo stesso stato – la visualizzazione si aggiorna automaticamente.",
    emptyList: "Questa lista è ancora vuota.",
    checkAria: name => `Spuntare ${name}`,
  },
  sharedTemplate: {
    loading: "Caricamento del modello condiviso …",
    notFoundTitle: "Link scaduto o non valido",
    backHome: "Pagina iniziale",
    invalidLink:
      "Questo link di condivisione è scaduto, non è valido o è stato ritirato dalla proprietaria o dal proprietario.",
    subtitle: n =>
      n === 1
        ? "Modello bagagli condiviso · 1 voce"
        : `Modello bagagli condiviso · ${n} voci`,
    sharedInfo:
      "Modello bagagli condiviso: dai un'occhiata – con un account puoi salvarlo come tuo modello o creare subito una lista bagagli da esso.",
    importButton: "Salva come modello personale",
    imported: "Modello salvato – disponibile quando crei nuove liste",
    importFailed: "Impossibile salvare il modello",
    createListButton: "Crea una nuova lista dal modello",
    listCreated: "Lista bagagli creata",
    createListFailed: "Impossibile creare la lista",
    loginHint:
      "Accedi per salvare il modello o creare una lista bagagli da esso.",
    emptyTemplate: "Questo modello non ha voci.",
  },
  sharedQuiz: {
    loading: "Caricamento del quiz condiviso …",
    notFoundTitle: "Link scaduto o non valido",
    backHome: "Pagina iniziale",
    invalidLink:
      "Questo link di condivisione è scaduto, non è valido o è stato ritirato dalla proprietaria o dal proprietario.",
    subtitle: "Quiz condiviso",
    sharedInfo:
      "Quiz condiviso: dai un'occhiata – con un account puoi salvarlo come tuo quiz nella modalità famiglia.",
    importButton: "Salva come quiz personale",
    imported: "Quiz salvato – lo trovi nella modalità famiglia",
    importFailed: "Impossibile salvare il quiz",
    loginHint: "Accedi per salvare il quiz come quiz personale.",
    questionCount: n => (n === 1 ? "1 domanda" : `${n} domande`),
    sampleQuestionTitle: "Domanda di esempio",
    moreQuestions: n =>
      n === 1
        ? "… e 1 altra domanda ti aspetta dopo il salvataggio."
        : `… e altre ${n} domande ti aspettano dopo il salvataggio.`,
    emptyQuiz: "Questo quiz non ha domande.",
  },
  sharedRecipe: {
    loading: "Caricamento della ricetta condivisa …",
    notFoundTitle: "Link scaduto o non valido",
    backHome: "Home",
    invalidLink:
      "Questo link di condivisione è scaduto, non è valido oppure è stato ritirato da chi lo ha creato.",
    subtitle: "Ricetta condivisa",
    sharedInfo:
      "Ricetta condivisa: provala – con un account puoi salvarla come ricetta personale nel tuo ricettario.",
    importButton: "Salva come ricetta personale",
    imported: "Ricetta salvata – la trovi nel ricettario",
    importFailed: "Non è stato possibile salvare la ricetta",
    loginHint: "Accedi per salvare la ricetta nel tuo ricettario.",
    minutes: (n: number) => `${n} min`,
    servings: (n: number) => `${n} porzioni`,
    onePotBadge: "One-pot",
    kidsBadge: "Bambini",
    ingredientsTitle: "Ingredienti",
    stepsTitle: "Preparazione",
    tipTitle: "Consiglio",
    photoNote:
      "La foto della ricetta resta privata e non viene condivisa tramite il link.",
  },
  packOptimizer: {
    title: "Ottimizzazione bagagli",
    subtitleLoggedOut:
      "Peso e ingombro della tua attrezzatura sotto controllo – su misura per il tuo veicolo.",
    loginFeature: "la tua analisi bagagli",
    subtitle:
      "Basato sul tuo inventario: peso e volume rispetto alla capacità del tuo mezzo di trasporto.",
    transportTitle: "Mezzo di trasporto",
    transportGroupAria: "Scegliere il mezzo di trasporto",
    weight: "Peso",
    weightPercentAria: pct => `Utilizzo del peso ${pct} per cento`,
    volume: "Volume",
    volumePercentAria: pct => `Utilizzo del volume ${pct} per cento`,
    hintsTitle: "Consigli di ottimizzazione",
    heaviestTitle: "Posizioni più pesanti",
    bulkiestTitle: "Posizioni più voluminose",
    emptyPrefix: "Il tuo inventario è ancora vuoto.",
    emptyLink: "Registra prima la tua attrezzatura",
    emptySuffix: "con peso e volume.",
  },
  inventory: {
    boxButton: "Riporre",
    boxAria: (name: string) => `Riporre ${name} in una cassa`,
    boxDialogTitle: "Riporre in una cassa",
    boxDialogDescription:
      "Scegli la cassa in cui si trova questo oggetto. Comparirà nel suo contenuto – anche dopo aver inquadrato l'etichetta.",
    boxAssigned: "Assegnazione salvata",
    boxRemove: "Togliere dalla cassa",
    boxNoBoxes:
      "Ancora nessuna cassa. Creane prima una, poi potrai riporre da qui.",
    boxManageLink: "Gestire le casse",
    title: "Inventario",
    subtitleLoggedOut:
      "Registra il tuo materiale da campeggio con peso e volume.",
    loginFeature: "il tuo inventario",
    subtitle:
      "Registra il tuo materiale da campeggio – peso e volume confluiscono direttamente nell'ottimizzazione bagagli.",
    itemsCount: "Oggetti",
    totalWeight: "Peso totale",
    totalVolume: "Volume totale",
    addButton: "Registra attrezzatura",
    addAria: "Registrare nuova attrezzatura",
    dialogTitleEdit: "Modifica attrezzatura",
    dialogTitleNew: "Nuova attrezzatura",
    dialogDescription:
      "Peso e volume aiuteranno più tardi nell'ottimizzazione bagagli.",
    nameLabel: "Nome",
    namePlaceholder: "p. es. sacco a pelo comfort -5 °C",
    categoryLabel: "Categoria",
    categoryAria: "Scegliere la categoria",
    weightLabel: "Peso (g)",
    volumeLabel: "Volume (l)",
    quantityLabel: "Quantità",
    submitNew: "Registra",
    created: "Attrezzatura registrata",
    updated: "Modifiche salvate",
    nameRequired: "Inserisci un nome",
    tableName: "Nome",
    tableCategory: "Categoria",
    tableWeight: "Peso",
    tableVolume: "Volume",
    actionsAria: "Azioni",
    editAria: name => `Modificare ${name}`,
    deleteAria: name => `Eliminare ${name}`,
    deleteConfirm: name => `Eliminare davvero «${name}»?`,
    photoLabel: "Foto (facoltativa)",
    photoChoose: "Scegli una foto",
    photoChange: "Cambia foto",
    photoRemove: "Rimuovi foto",
    photoPreviewAlt: "Anteprima della foto dell'attrezzatura",
    photoHint:
      "JPEG, PNG o WebP – la foto viene ridotta automaticamente prima del caricamento.",
    photoUploading: "Caricamento della foto …",
    photoUploadFailed: "Salvato, ma la foto non è stata caricata.",
    photoTooLarge: "La foto è troppo grande (max. 5 MB).",
    photoHeic: "Il browser non può leggere HEIC/HEIF – esporta come JPEG.",
    photoReadFailed: "Impossibile leggere l'immagine.",
    photoRemoveFailed: "Impossibile rimuovere la foto.",
    photoThumbAria: (name: string) =>
      `Mostra la foto di ${name} a schermo intero`,
    photoDialogAlt: (name: string) => `Foto di ${name}`,
    photoDialogDescription: "Foto dell'oggetto in grande.",
    emptyTitle: "Ancora nessuna attrezzatura registrata",
    emptyText:
      "Comincia dai pezzi grandi: tenda, sacco a pelo, materassino isolante.",
    searchPlaceholder: "Cerca nell'inventario …",
    searchAria: "Cerca nell'inventario per nome o nota",
    categoryFilterAria: "Filtra per categoria",
    filterAll: "Tutti",
    filterCount: (shown: number, total: number) =>
      `${shown} oggetti su ${total}`,
    filterEmptyTitle: "Nessun risultato",
    filterEmptyText: "Modifica la ricerca o scegli un'altra categoria.",
    filterReset: "Reimposta i filtri",
    priceLabel: "Prezzo (CHF)",
    priceAria: "Prezzo d'acquisto in franchi",
    purchaseDateLabel: "Data d'acquisto",
    warrantyLabel: "Garanzia (mesi)",
    warrantyAria: "Durata della garanzia in mesi dalla data d'acquisto",
    warrantyHelp: "Dalla data d'acquisto – lascia vuoto se non lo sai.",
    warrantyBadge: (date: string) => `Garanzia fino al ${date}`,
    warrantyExpiredBadge: (date: string) => `Garanzia scaduta il ${date}`,
    warrantyDaysLeft: (n: number) =>
      n === 0
        ? "Scade oggi"
        : n === 1
          ? "Scade domani"
          : `Scade tra ${n} giorni`,
    warrantySoonTitle: (n: number) =>
      n === 1
        ? "1 garanzia sta per scadere"
        : `${n} garanzie stanno per scadere`,
    warrantySoonText:
      "Nei prossimi 60 giorni: vale la pena controllare adesso.",
    warrantySoonShow: "Mostra",
    warrantySoonShowAll: "Mostra tutti",
    lentButton: "Prestato",
    lentAria: (name: string) => `Segna ${name} come prestato`,
    lentDialogTitle: "Segna come prestato",
    lentDialogDescription:
      "Annota chi ha l'oggetto e da quando – così non dimentichi nulla.",
    lentToLabel: "Prestato a",
    lentToPlaceholder: "p. es. la vicina Sara",
    lentAtLabel: "Dal",
    lentSubmit: "Segna come prestato",
    lentToRequired: "Inserisci un nome",
    lentSaved: "Segnato come prestato",
    lentBadge: (name: string, date: string) => `prestato a ${name} dal ${date}`,
    lentReturnButton: "Restituito",
    lentReturnAria: (name: string) => `Segna ${name} come restituito`,
    lentReturned: "Di nuovo nell'inventario",
    lentFilterChip: (n: number) => `Prestati (${n})`,
    priceBadge: (chf: string) => `CHF ${chf}`,
    totalValue: (chf: string) => `Valore totale: CHF ${chf}`,
    totalValueHint: "Somma di tutti i prezzi registrati × quantità",
    receiptLabel: "Scontrino (facoltativo)",
    receiptChoose: "Scegli scontrino",
    receiptChange: "Cambia scontrino",
    receiptRemove: "Rimuovi scontrino",
    receiptPreviewAlt: "Anteprima dello scontrino",
    receiptHint:
      "Foto della ricevuta – JPEG, PNG o WebP, viene ridotta automaticamente prima del caricamento.",
    receiptUploading: "Caricamento dello scontrino …",
    receiptUploadFailed:
      "Salvato, ma non è stato possibile caricare lo scontrino.",
    receiptRemoveFailed: "Non è stato possibile rimuovere lo scontrino.",
    receiptIconAria: (name: string) => `Mostra lo scontrino di ${name}`,
    receiptDialogDescription: "Scontrino dell'oggetto in grande.",
    receiptDialogAlt: (name: string) => `Scontrino di ${name}`,
    receiptDialogTitle: (name: string) => `Scontrino: ${name}`,
    gearTitle: "Cura & manutenzione",
    gearIntro:
      "Attività ricorrenti come impermeabilizzare o controllare le batterie – le attività in scadenza vengono evidenziate e ricordate via push.",
    gearAddButton: "Aggiungi attività",
    gearAddAria: "Aggiungi una nuova attività di manutenzione",
    gearDialogTitle: "Aggiungi attività di manutenzione",
    gearDialogDescription:
      "Riprendi un suggerimento oppure crea un'attività personalizzata con intervallo.",
    gearSuggestionsLabel: "Suggerimenti",
    gearSuggestionAria: (title: string) =>
      `Riprendi il suggerimento «${title}»`,
    gearTitleLabel: "Attività",
    gearTitlePlaceholder: "es. impermeabilizzare la tenda",
    gearIntervalLabel: "Intervallo (mesi)",
    gearIntervalText: (n: number) => (n === 1 ? "ogni mese" : `ogni ${n} mesi`),
    gearSubmit: "Aggiungi",
    gearCreated: "Attività di manutenzione aggiunta",
    gearTitleRequired: "Inserisci un titolo per l'attività",
    gearEmpty:
      "Ancora nessuna attività di manutenzione – riprendi un suggerimento o creane una.",
    gearDueBadge: "In scadenza",
    gearSoonBadge: "Presto in scadenza",
    gearDueOn: (date: string) => `Scade il ${date}`,
    gearLastDone: (date: string) => `ultima volta il ${date}`,
    gearNeverDone: "mai ancora fatta",
    gearDoneButton: "Fatto",
    gearDoneAria: (title: string) => `Segna «${title}» come fatta`,
    gearMarkedDone: "Segnata come fatta",
    gearRemoveAria: (title: string) =>
      `Elimina l'attività di manutenzione «${title}»`,
    gearRemoveConfirm: (title: string) =>
      `Eliminare davvero l'attività di manutenzione «${title}»?`,
    gearRemoved: "Attività di manutenzione eliminata",
  },
  fireBans: {
    title: "Divieti di fuoco per cantone",
    sectionAria: "Livelli di pericolo d'incendio boschivo di tutti i cantoni",
    intro:
      "Livello di pericolo ufficiale nel capoluogo di ogni cantone, il più alto per primo. Un cantone può comprendere più regioni d'allerta – in montagna vale spesso un livello diverso che a valle.",
    loading: "Caricamento dei livelli …",
    loadFailed:
      "I livelli di pericolo al momento non sono disponibili. Senza rete o se il servizio della Confederazione non risponde, l'elenco resta vuoto.",
    retry: "Riprovare",
    unknown: "nessun dato",
    banLikely: "Divieto probabile",
    disclaimer:
      "Il livello è una valutazione della Confederazione. Il divieto di fuoco lo dispone il cantone o il comune – da verificare prima di accendere.",
    portalLink: "Panoramica ufficiale dei cantoni",
  },
  weather: {
    mosquitoTitle: "Zanzare stasera",
    mosquitoAria: "Indice zanzare per la sera",
    mosquitoBarAria: (score: number) => `Indice zanzare ${score} su 100`,
    mosquitoLimiting: {
      kalt: "Troppo fresco per un volo attivo.",
      trocken: "L'aria secca le tiene giù.",
      wind: "Il vento le allontana – la miglior protezione che ci sia.",
    },
    mosquitoHint:
      "Stimato da calore, umidità, vento e pioggia degli ultimi giorni. Uno stagno accanto alla tenda batte qualsiasi formula.",
    cloudLexiconHint:
      "Il cielo spesso ne sa più della previsione: cerca il tipo di nuvola e scopri che cosa arriva.",
    heatSunscreen: (minutes: number, burn: number) =>
      `Crema solare, da riapplicare ogni ${minutes} min (pelle scoperta rossa dopo ~${burn} min)`,
    heatDrink: (liters: string) => `Circa ${liters} l d'acqua per adulto`,
    title: "Meteo del campo",
    subtitle: "Previsioni iperlocali e allerte maltempo per la tua piazzola.",
    locationGroupAria: "Scegli il luogo per le previsioni meteo",
    myLocation: "La mia posizione",
    loadingAria: "Caricamento dei dati meteo",
    retry: "Riprova",
    offlineHint:
      "Nota: il modulo meteo ha bisogno di una connessione Internet e della tua posizione. I moduli offline (primo soccorso, nodi, natura) continuano a funzionare senza rete.",
    serviceError: status => `Il servizio meteo non risponde (${status})`,
    loadFailed: "Impossibile caricare i dati meteo.",
    geoUnsupported: "Il tuo dispositivo non supporta la geolocalizzazione.",
    geoDenied:
      "Posizione non disponibile. Consenti l'accesso alla posizione nel browser.",
    elevation: m => `${m} m s.l.m.`,
    feelsLike: deg => `Percepiti ${deg}°`,
    refreshAria: "Aggiorna il meteo",
    alertsAria: "Allerte maltempo",
    noAlerts:
      "Nessuna allerta maltempo per le prossime 48 ore – buone condizioni per il campo.",
    severity: {
      gefahr: "Pericolo",
      warnung: "Allerta",
      info: "Info",
    },
    fireAria: "Pericolo di incendio boschivo",
    fireTitle: title => `Pericolo di incendio boschivo: ${title}`,
    fireLevelBadge: level => `Grado ${level}/5`,
    fireValidFrom: date => `valido dal ${date}`,
    fireSourcePrefix:
      "Fonte: carta dei pericoli dell'UFAM. Fanno stato le decisioni cantonali – dettagli su ",
    uvAria: "Indice UV",
    uvTitle: "Indice UV",
    uvTodayMax: uv => `Massimo di oggi: UV ${uv}`,
    pollenTitle: "Pollini",
    pollenAria: "Pollini",
    pollenListAria: "Carico pollinico per specie",
    pollenLoadingAria: "Caricamento dei dati sui pollini",
    pollenUnavailable:
      "I dati sui pollini non sono al momento disponibili – le previsioni meteo non ne risentono.",
    pollenNoData: "Nessun dato sui pollini per questo luogo.",
    pollenSource:
      "Fonte: Open-Meteo Air Quality (CAMS Europa) – carico attuale dell'ora in corso.",
    pollenProfileTitle: "I tuoi tipi di polline",
    pollenProfileIntro:
      "Scegli i tipi che ti riguardano – vengono evidenziati e mostrati per primi.",
    pollenOnlyMine: "Mostra solo i miei tipi",
    pollenMineSr: "(il tuo tipo)",
    next24: "Prossime 24 ore",
    rain48: "Pioggia: prossime 48 ore",
    chartRain: "Pioggia",
    chartProb: "Probabilità",
    chartTooltipHour: label => `ore ${label}`,
    chartLegend:
      "Barre = quantità di pioggia (mm/h, asse sinistro) · Linea = probabilità di pioggia (%, asse destro).",
    forecast7: "Previsioni a 7 giorni",
    week2Title: "Settimana 2",
    week2Hint: "Tendenza – affidabilità ridotta",
    week2Aria: "Tendenza per la settimana 2",
    dayToggleAria: (day: string) =>
      `Mostra o nascondi l'andamento orario per ${day}`,
    chartTemp: "Temperatura",
    hourlyLegend:
      "Linea = temperatura (°C, asse sinistro) · Barre = quantità di pioggia (mm/h, asse destro).",
    windRowAria: "Vento nell'arco della giornata",
    windRowLegend:
      "Freccia = direzione del vento (indica dove soffia) · Numero = raffica massima in km/h.",
    windSrHour: (time: string, dir: string, gusts: number) =>
      `${time}: vento da ${dir}, raffiche fino a ${gusts} km/h`,
    windSrHourNoDir: (time: string, gusts: number) =>
      `${time}: raffiche fino a ${gusts} km/h`,
    dayWindPeak: (n: number) => `Punta di vento: raffiche fino a ${n} km/h`,
    dayFeelsLike: (deg: number) => `percepiti fino a ${deg}°`,
    dayHoursEmpty: "Nessun dato orario disponibile per questo giorno.",
    dataSource:
      "Fonte dati: Open-Meteo (migliore risoluzione disponibile per la tua posizione, in Svizzera MeteoSvizzera ICON-CH). Le allerte sono calcolate dalle previsioni e non sostituiscono le allerte ufficiali di MeteoSvizzera.",
    compareButton: "Confronta con un altro luogo",
    compareTitle: "Confronta luoghi",
    compareAria: "Confronto meteo di due luoghi",
    compareCloseAria: "Chiudi il confronto",
    compareSearchLabel: "Cerca un secondo luogo",
    compareSearchPlaceholder: "ad es. Bellinzona o Fiesch",
    compareSearchButton: "Cerca",
    compareSearchingAria: "Ricerca del luogo in corso",
    compareSearchFailed:
      "La ricerca del luogo non è riuscita – riprova più tardi.",
    compareNoResults: "Nessun luogo trovato – controlla la grafia.",
    compareResultsAria: "Luoghi trovati",
    compareSpotsLabel: "Oppure scegli una piazzola salvata:",
    compareChange: "Cambia luogo",
    compareLoadingAria: "Caricamento delle previsioni di confronto",
    compareLoadFailed:
      "Impossibile caricare le previsioni del luogo di confronto.",
    compareCaption: (a, b) => `Confronto a 7 giorni: ${a} e ${b}`,
    compareDayHeader: "Giorno",
    compareSrRain: "Pioggia",
    compareSrWind: "Raffiche",
    radarTitle: "Radar pioggia",
    radarAria: "Radar pioggia",
    radarIntro:
      "Precipitazioni dell'ultima ora e previsione a brevissimo termine (nowcast) attorno al luogo scelto – in animazione.",
    radarLoadingAria: "Caricamento del radar pioggia",
    radarFailed: "Impossibile caricare il radar pioggia.",
    radarMapAria: "Mappa del radar pioggia",
    radarPlayAria: "Avvia l'animazione del radar",
    radarPauseAria: "Metti in pausa l'animazione del radar",
    radarTimestamp: time => `Immagine radar delle ${time}`,
    radarForecastBadge: "Previsione",
    radarSource:
      "Dati radar: RainViewer · Mappa: OpenStreetMap. I frame nowcast sono un'estrapolazione a brevissimo termine.",
    rainSoonAria: "Avviso pioggia a breve termine",
    pressureAria: "Tendenza della pressione atmosferica",
    pressureFalling: hPa =>
      `La pressione atmosferica cala (−${hPa} hPa in 3 ore) – è probabile un cambiamento del tempo.`,
    pressureFallingStrong: hPa =>
      `La pressione atmosferica cala fortemente (−${hPa} hPa in 3 ore) – aspettati un netto cambiamento del tempo e metti al sicuro il campo.`,
    rainStartsAt: time => `La pioggia inizia verso le ${time}`,
    rainEndsAt: time => `La pioggia smette verso le ${time}`,
    placeAddButton: "Aggiungi luogo",
    placeSearchLabel: "Cerca un luogo e salvalo come preferito meteo",
    placeSearchPlaceholder: "es. Locarno o Scuol",
    placeSearchCloseAria: "Chiudi la ricerca del luogo",
    placeResultsHint: "Un clic salva il luogo e ne mostra il meteo.",
    placeRemoveAria: name => `Rimuovi ${name} dai luoghi meteo`,
    placeLimitHint: max =>
      `Al massimo ${max} luoghi salvati – rimuovi prima un luogo.`,
    placesTitle: "I tuoi luoghi",
    placesAria: "Panoramica delle allerte per i tuoi luoghi",
    placesIntro:
      "Controlla le allerte maltempo delle prossime 48 ore per le tue piazzole salvate e la tua località di casa.",
    placesLoadingAria: "Controllo delle allerte per i tuoi luoghi",
    placesNoAlert: "Nessuna allerta",
    placesCheckFailed: "Controllo non riuscito",
    placesEmpty:
      "Nessun luogo salvato per ora – aggiungi piazzole preferite o imposta la tua località di casa nel profilo.",
    placesSelectAria: name =>
      `Mostra il meteo di ${name} nella vista principale`,
  },
  water: {
    title: "Calcolatore dell'acqua potabile",
    subtitle:
      "Quanta acqua devi portare se la piazzola non ha un allacciamento all'acqua potabile?",
    liters: n => `${n} litri`,
    recommendedNote:
      "quantità totale consigliata, riserva di sicurezza del 20 % inclusa",
    canisterNote: n => `Corrisponde a circa ${n} taniche da 10 litri`,
    adults: "Adulti",
    children: "Bambini",
    dogs: "Cani",
    daysWithoutWater: "Giorni senza allacciamento all'acqua",
    decreaseAria: label => `Riduci ${label}`,
    increaseAria: label => `Aumenta ${label}`,
    tempLabel: "Temperatura massima giornaliera prevista",
    tempSliderAria: "Temperatura massima giornaliera prevista in gradi Celsius",
    tempAuto: (days, temp) =>
      `Ripreso automaticamente: massimo dei prossimi ${days} giorni nella tua posizione (${temp} °C).`,
    tempReapply: temp => `Riprendi la previsione (${temp} °C)`,
    tempHint:
      "Da 20 °C calcoliamo un supplemento di 0.5 l per persona al giorno ogni 5 °C.",
    activityTitle: "Livello di attività",
    activityGroupAria: "Scegli il livello di attività",
    activityCalm: "Tranquillo",
    activityCalmHint: "Campo & bagni",
    activityNormal: "Normale",
    activityNormalHint: "Passeggiate",
    activityActive: "Attivo",
    activityActiveHint: "Escursioni & sport",
    cookingTitle: "Includi cucina & stoviglie",
    cookingHint: "+1.5 l per persona al giorno",
    cookingAria: "Includi l'acqua per cucinare e lavare le stoviglie",
    comfortTitle: "Igiene personale confortevole",
    comfortHint: "Lavaggio rapido o doccia solare: +4 l per persona al giorno",
    comfortAria: "Includi l'acqua per un'igiene personale confortevole",
    breakdownTitle: "Dettaglio",
    rowAdults: (perDay, n, days) =>
      `Bere adulti (${perDay} l/giorno × ${n} × ${days} giorni)`,
    rowChildren: (perDay, n, days) =>
      `Bere bambini (${perDay} l/giorno × ${n} × ${days} giorni)`,
    rowDogs: (perDay, n, days) =>
      `Cani (${perDay} l/giorno × ${n} × ${days} giorni)`,
    rowCooking: "Cucina & stoviglie",
    rowComfort: "Igiene personale confortevole",
    rowReserve: "Riserva di sicurezza (20 %)",
    rowTotal: "Totale consigliato",
    footnote:
      "Nota: valori indicativi per un clima temperato. In caso di ondate di caldo, altitudine o lavoro fisico pianifica con più margine. Il valore per i cani vale per cani di taglia media (ca. 20 kg). Usa l'acqua dei ruscelli solo filtrata o bollita.",
  },
  sunCompass: {
    title: "Bussola solare",
    subtitle:
      "Dove si trova il sole e quando? Perfetto per scegliere la piazzola e orientare i pannelli solari.",
    kinds: {
      baum: "Albero / bosco",
      berg: "Montagna / collina",
      gebaeude: "Edificio",
    },
    diagramAria: (dir: string, alt: number) =>
      `Diagramma della posizione del sole: sole attualmente a ${dir} a ${alt} gradi di altezza`,
    horizonLabel: "Orizzonte (0°)",
    ring30: "30° di altezza",
    ring60: "60° di altezza",
    cardinalN: "N",
    cardinalE: "E",
    cardinalS: "S",
    cardinalW: "O",
    risePoint: "Alba",
    setPoint: "Tramonto",
    hourMark: (h: number) => `ore ${h}`,
    youAreHere: "Tu sei qui",
    inShadow: "in ombra",
    sunBelowHorizon: "Sole sotto l'orizzonte",
    spotBanner: "Posizione del sole per la piazzola salvata",
    useOwnLocation: "Usa la mia posizione",
    locating: "Localizzazione in corso …",
    retry: "Riprova",
    geoUnsupported: "Questo dispositivo non supporta la localizzazione.",
    geoDenied:
      "Accesso alla posizione negato. Consentilo nelle impostazioni del browser.",
    geoFailed: "Impossibile determinare la posizione.",
    atTime: (time: string) => `Alle ${time}`,
    sunIsIn: "il sole è a",
    aboveHorizon: "sopra l'orizzonte",
    summaryBlocked:
      " – ma un ostacolo registrato lo copre: la tua piazzola è in ombra.",
    summaryHigh: " – quasi verticale, pochissima ombra.",
    summaryMid: " – alberi e tende proiettano ombre di media lunghezza.",
    summaryLow:
      " – posizione bassa, ombre lunghe: gli ostacoli ora fanno molta ombra.",
    belowHorizonNext: "il sole è sotto l'orizzonte. Prossima alba:",
    clock: (time: string) => time,
    inTheEast: "a est.",
    viewFromAbove:
      "Vista dall'alto della tua piazzola: anello esterno = orizzonte, centro = in verticale sopra di te.",
    placeModeHint: (kind: string) =>
      `Tocca ora il punto del diagramma dove si trova l'ostacolo (${kind}) – direzione e altezza vengono rilevate automaticamente.`,
    liveCompassOn: "Attiva bussola live",
    liveCompassOff: "Disattiva bussola live",
    compassDenied:
      "L'accesso al sensore di movimento è stato negato – consentilo nelle impostazioni del browser per usare la bussola live.",
    compassUnsupported:
      "Questo dispositivo non ha un sensore di direzione – la bussola live funziona solo su smartphone e tablet.",
    compassWaiting:
      "In attesa dei dati del sensore … muovi leggermente il dispositivo formando un otto per calibrare la bussola.",
    legendSunNow: "Sole adesso",
    legendPathFuture: "Traiettoria (in arrivo)",
    legendPathPast: "Traiettoria (passata)",
    legendYourLocation: "La tua posizione",
    legendObstacle: "Ostacolo",
    dateLabel: "Data",
    dateAria: "Scegli la data per la visualizzazione della posizione del sole",
    planningView: "Vista di pianificazione",
    sliderLabel: "Trascina il cursore per guardare nel futuro",
    nowButton: "Adesso",
    nowAria: "Imposta data e cursore su adesso",
    timeAria: "Scegli l'ora per la visualizzazione della posizione del sole",
    sunriseTitle: "Alba",
    sunsetTitle: "Tramonto",
    belowHorizonShort: "sotto l'orizzonte",
    sunHeightAt: (time: string) => `Altezza del sole alle ${time}`,
    directionAt: (time: string) => `Direzione alle ${time}`,
    obstaclesTitle: "Ostacoli all'orizzonte",
    obstaclesIntro:
      "Registra alberi, montagne o edifici attorno alla tua piazzola. La bussola li mostra nel diagramma e calcola quando coprono il sole – importante per tenda e pannelli solari.",
    /** Berge automatisch aus dem Höhenmodell (#372) */
    terrainButton: "Rileva le montagne",
    terrainBusy: "Rilevamento in corso …",
    terrainHint:
      "Dal modello altimetrico attorno a questo punto: 24 direzioni fino a 30 km. Alberi e case non figurano in nessun modello – quelli li disegni tu.",
    terrainNoLocation:
      "Nessuna posizione – senza coordinate non c’è nulla da calcolare.",
    terrainFailed: "Il modello altimetrico non risponde.",
    terrainDone: (count: number) => `${count} direzioni riprese dal terreno`,
    profileGroupAria: "Scegli il profilo degli ostacoli",
    profileGeneral: "Generale",
    obstacleLine: (
      label: string,
      dir: string,
      az: number,
      h: number,
      w: number
    ) => `${label} a ${dir} (${az}°) · alto ${h}° · largo ${w}°`,
    removeObstacleAria: (label: string) => `Rimuovi ${label}`,
    kindLabel: "Tipo",
    azimuthLabel: "Direzione (°)",
    azimuthPlaceholder: "180 = sud",
    heightLabel: "Altezza (°)",
    widthLabel: "Larghezza (°)",
    placeByTapActive: "Modalità tocco attiva …",
    placeByTap: "Posiziona toccando il diagramma",
    addNumeric: "Inserisci con i numeri",
    fistTip:
      "Suggerimento per l'altezza: allunga il braccio – un pugno corrisponde a circa 10°. Un albero che finisce a due pugni e mezzo sopra l'orizzonte è quindi a circa 25°.",
    horizonTitle: "Sole sopra la cresta",
    horizonShaded: "All'ombra tutto il giorno: qui il sole non arriva.",
    horizonNone: "Oggi il sole non supera l'orizzonte.",
    horizonSunny: (duration: string) => `${duration} al sole`,
    horizonDelay: (duration: string) =>
      `${duration} più tardi che all'orizzonte libero`,
    horizonNote:
      "Calcolato dal profilo degli ostacoli di questa piazzola. All'orizzonte piatto il sole sorgerebbe prima: in valle passa la cresta, ed è quell'ora che conta.",
    shadowTitle: "Orari d'ombra oggi",
    shadowNone:
      "I tuoi ostacoli oggi non coprono mai il sole – vista libera tutto il giorno.",
    shadowRange: (from: string, to: string) => `${from}–${to}`,
    shadowSuffix: "– sole dietro un ostacolo, piazzola in ombra",
    locationLine: "Posizione:",
    refreshLocationAria: "Aggiorna la posizione",
    tipsTitle: "Consigli per la piazzola",
    morningShadeTitle: "Ombra al mattino:",
    morningShadeText: (sunrise: string) =>
      `Posiziona la tenda in modo che a est (alba alle ${sunrise}) ci siano alberi o un pendio – così la tenda resta fresca più a lungo.`,
    solarTitle: "Pannelli solari:",
    solarText1: (alt: number) =>
      `Orienta i pannelli verso sud. Verso mezzogiorno il sole raggiunge il punto più alto a ${alt}° – il`,
    solarLink: "calcolatore del budget energetico",
    solarText2: "aiuta a pianificare la resa.",
    photoLightTitle: "Luce fotografica",
    photoLightIntro:
      "Ora d'oro (luce morbida e calda) e ora blu (cielo blu intenso) alla data scelta in questo luogo.",
    photoLightMorning: "Al mattino",
    photoLightEvening: "Alla sera",
    goldenHour: "Ora d'oro",
    blueHour: "Ora blu",
    photoLightRange: (from, to) => `${from}–${to}`,
  },
  level: {
    title: "Livella a bolla",
    subtitle:
      "Livellare caravan, fornello o tavolo – appoggia il telefono in piano, display verso l'alto.",
    unsupported:
      "Questo dispositivo non ha un sensore di inclinazione. Apri la livella sul tuo smartphone – funziona completamente offline.",
    needsSensor:
      "Per la livella l'app ha bisogno dell'accesso al sensore di inclinazione.",
    activateSensor: "Attiva il sensore",
    bubbleAria: (pitch: string, roll: string) =>
      `Inclinazione: avanti/indietro ${pitch}, sinistra/destra ${roll}`,
    waitingSensor: "In attesa dei dati del sensore",
    pitchLabel: "Avanti / indietro",
    rollLabel: "Sinistra / destra",
    levelNow: "In bolla – posizione perfetta!",
    zeroHere: "Azzera qui",
    resetCalibration: "Reimposta la calibrazione",
    profileLabel: "Profilo del veicolo",
    profileNames: {
      tent: "Tenda",
      bus: "Van",
      caravan: "Caravan",
    },
    profileTolerance: (deg: string) => `Tolleranza ±${deg}°`,
    manageVehicles: "Veicoli e carico",
    soundLabel: "Segnale acustico",
    soundHint:
      "Breve suono e vibrazione appena sei in bolla – di nuovo solo se nel frattempo esci dalla bolla.",
    calibrationHint:
      "«Azzera qui» compensa una custodia del telefono o un piano storti: appoggia il telefono su una superficie che sai essere piana e azzera lì. Per il caravan: appoggia il telefono sul pavimento o su un piano di lavoro all'interno e metti dei cunei sotto il lato basso finché la bolla è al centro.",
  },
  payload: {
    title: "Calcolatore del carico",
    subtitle:
      "Il tuo traino è sovraccarico? Limiti, carico e semaforo in un colpo d'occhio.",
    disclaimer:
      "Aiuto orientativo senza garanzia: fanno fede la licenza di circolazione e la pesa. Prima di partire pesa il traino carico su una pesa a ponte pubblica – questo calcolo non la sostituisce.",
    rigTitle: "Traino",
    towLabel: "Veicolo trainante",
    trailerLabel: "Rimorchio",
    noneOption: "Nessun veicolo scelto",
    noTrailerOption: "Senza rimorchio",
    showVehicles: "Modifica i veicoli",
    hideVehicles: "Chiudi i veicoli",
    vehiclesHint: "La livella usa gli stessi profili.",
    limitsHint:
      "Tutti i valori si trovano nella licenza di circolazione. Lascia vuoto ciò che non conosci – il semaforo resta grigio invece che verde.",
    nameLabel: "Nome",
    kindLabel: "Tipo",
    roleLabel: "Ruolo",
    roleNames: {
      tow: "Veicolo trainante",
      trailer: "Rimorchio",
      none: "Alloggio",
    },
    emptyKgLabel: "Peso a vuoto (kg)",
    grossKgLabel: "Peso totale ammesso (kg)",
    towKgLabel: "Massa rimorchiabile ammessa (kg)",
    noseKgLabel: "Carico sul gancio ammesso (kg)",
    axleKgLabel: "Carico per asse ammesso (kg)",
    addVehicle: "Aggiungi veicolo",
    newVehicleName: "Nuovo veicolo",
    deleteVehicleAria: (name: string) => `Elimina ${name}`,
    deleteVehicleConfirm: (name: string) =>
      `Vuoi davvero eliminare «${name}»? Anche la livella perde questo profilo.`,
    loadTitle: "Carico",
    personsLabel: "Persone",
    personKgLabel: "kg a persona",
    personsHint: (kg: string) => `${kg} nel veicolo trainante`,
    personsDecreaseAria: "Una persona in meno",
    personsIncreaseAria: "Una persona in più",
    packListLabel: "Lista bagagli come carico",
    packListNone: "Nessuna lista bagagli",
    packListWeight: (kg: string) => `${kg} dal confronto con l'inventario`,
    packListMissing: (n: number) =>
      `${n} voci senza peso nell'inventario – mancano nel totale`,
    packListLoggedOut:
      "Accedi per usare una lista bagagli con il suo peso come carico.",
    positionLabel: "Posizione",
    positionNames: {
      tow: "Veicolo trainante",
      trailer: "Rimorchio",
    },
    itemsTitle: "Voci libere",
    itemsHint:
      "Per tutto ciò che non è nella lista: acqua nel serbatoio, bombola del gas, biciclette, veranda.",
    itemLabelPlaceholder: "Che cosa?",
    itemKgPlaceholder: "kg",
    addItem: "Aggiungi",
    removeItemAria: (label: string) => `Togli ${label}`,
    noseMeasuredLabel: "Carico sul gancio misurato (kg)",
    noseMeasuredHint: "Lascia vuoto: calcoliamo il 5 % del peso del rimorchio.",
    resultTitle: "Risultato",
    noVehicleHint:
      "Scegli un veicolo trainante o un rimorchio – poi calcoliamo noi.",
    checkNames: {
      towGross: "Peso totale del veicolo trainante",
      trailerGross: "Peso totale del rimorchio",
      towCapacity: "Massa rimorchiabile",
      noseWeight: "Carico sul gancio",
      towAxle: "Carico per asse del trainante",
      trailerAxle: "Carico per asse del rimorchio",
    },
    statusNames: {
      ok: "tutto a posto",
      tight: "al limite",
      over: "sovraccarico",
      unknown: "poco chiaro",
    },
    verdict: {
      ok: "Tutto a posto – buon viaggio!",
      tight:
        "Al limite: almeno un valore è quasi raggiunto. Pesa il traino prima di partire.",
      over: "Sovraccarico: almeno un limite è superato. Così non puoi metterti in strada.",
      unknown:
        "Ancora nessun verdetto: mancano dei dati. Riporta i valori della licenza di circolazione.",
    },
    checkLine: (actual: string, limit: string, rest: string) =>
      `${actual} su ${limit} · ${rest}`,
    freeLeft: (kg: string) => `${kg} liberi`,
    overBy: (kg: string) => `${kg} di troppo`,
    missingLimit: "Limite non registrato – aggiungilo nel veicolo.",
    missingValue: "Manca il peso a vuoto – senza non si calcola nulla.",
    notComputable:
      "Non calcolabile senza pesa: la ripartizione del peso sugli assi dipende dal passo e da dove carichi.",
    estimatedNote: "con carico sul gancio stimato",
    totalsLine: (tow: string, trailer: string, train: string) =>
      `Trainante ${tow} · Rimorchio ${trailer} · Traino ${train}`,
    noseRule: (min: string, max: string, rec: string) =>
      `Regola pratica per il carico sul gancio: 4–7 % del peso reale del rimorchio, qui quindi da ${min} a ${max}. Sfrutta il più possibile il carico ammesso (fino a ${rec}) – troppo poco peso sul timone fa serpeggiare il traino.`,
    levelHint: "Il veicolo è già in piano? Gli stessi profili guidano la",
    levelLink: "livella",
  },
  roadRules: {
    title: "Pedaggi, vignetta e regole",
    subtitle:
      "Scheda per il paese di destinazione: pedaggi, velocità con rimorchio, dotazione obbligatoria, emergenze.",
    disclaimer:
      "Regole, prezzi e limiti cambiano – questa panoramica è un orientamento, non un'informazione legale. Prima di partire verifica presso il tuo automobile club o le autorità del paese.",
    countryLabel: "Scegli il paese",
    tollTitle: "Vignetta e pedaggi",
    trailerTitle: "Rimorchio",
    speedTitle: "Velocità con rimorchio",
    roadNames: {
      motorway: "Autostrada",
      rural: "Strada extraurbana",
      urban: "Centro abitato",
    },
    bacTitle: "Tasso alcolemico",
    permille: (value: string) => `${value} ‰`,
    equipmentTitle: "Obbligatorio a bordo",
    zonesTitle: "Zone ambientali",
    emergencyTitle: "Numero d'emergenza",
    callAria: (number: string) => `Chiama il numero d'emergenza ${number}`,
    campingTitle: "Pernottamento e campeggio",
    updatedLine: (country: string, date: string) =>
      `${country}: aggiornato al ${date}. Valori in km/h; senza garanzia.`,
  },
  sos: {
    title: "SOS & dashboard d'emergenza",
    subtitle:
      "La tua posizione e tutti i numeri d'emergenza importanti – per ogni evenienza.",
    geoUnsupported: "Questo dispositivo non supporta la localizzazione.",
    geoDenied:
      "Accesso alla posizione negato. Autorizzalo nelle impostazioni del browser.",
    geoFailed: "Impossibile determinare la posizione. Riprova.",
    coordsCopied: "Coordinate copiate",
    copyFailed: "Copia non possibile",
    locationTitle: "La tua posizione",
    refresh: "Aggiorna",
    refreshAria: "Aggiorna la posizione",
    locating: "Determinazione della posizione …",
    decimalLabel: "Gradi decimali (WGS84) – per i servizi di soccorso",
    copyDecimalAria: "Copia le coordinate in gradi decimali",
    dmsLabel: "Gradi / minuti / secondi",
    lv95Label: "Coordinate svizzere (LV95)",
    outsideSwitzerland: "Fuori dalla Svizzera",
    accuracy: (m: number) => `Precisione: ±${m} m`,
    altitude: (m: number) => ` · Quota: ${m} m s.l.m.`,
    asOf: (time: string) => ` · Stato: ${time}`,
    numbersTitle: "Numeri d'emergenza",
    callAria: (label: string) => `Chiama ${label}`,
    regaTitle: "Allarme Rega con trasmissione della posizione",
    regaText:
      "L'app ufficiale della Rega trasmette automaticamente la tua posizione alla centrale operativa al momento dell'allarme – questo accelera notevolmente il soccorso in montagna. Consigliamo di installarla in aggiunta. In alternativa puoi comunicare le coordinate mostrate sopra chiamando il 1414.",
    regaLinkAria: "Apri la pagina ufficiale dell'app Rega (link esterno)",
    regaLink: "All'app Rega ufficiale",
    guideTitle: "Come effettuare correttamente la chiamata d'emergenza",
    abroadTitle: "Numeri d'emergenza all'estero",
    abroadHint:
      "Il 112 funziona in tutta Europa. Per il soccorso alpino e l'ambulanza i numeri nazionali diretti sono spesso più rapidi – eccoli per i paesi da campeggio più comuni.",
  },
  energy: {
    title: "Calcolatore del budget energetico",
    subtitleLoggedOut:
      "Quanto dura la tua powerstation? Registra i consumatori e calcola l'autonomia.",
    loginFeature: "i tuoi consumatori di energia",
    subtitle:
      "Consumatori, resa solare e capacità della batteria combinati: ecco quanto puoi restare autonomo.",
    saveFailed: "Impossibile salvare il consumatore",
    sourceSpot: (name: string) => `piazzola «${name}»`,
    sourceLocation: "la tua posizione",
    rangeSelfSufficient: "Illimitata – il solare copre il consumo",
    rangeOverMax: (d: number) => `> ${d} giorni`,
    rangeDays: (d: number) => `${d} giorni`,
    rangeHours: (h: number) => `${h} h`,
    rangeUnknown: "–",
    rangeLabel: "Autonomia",
    consumptionPerDay: "Consumo / giorno",
    solarPerDay: "Resa solare / giorno",
    balancePerDay: "Bilancio / giorno",
    availableLabel: "Utilizzabile ora",
    storageTitle: "Il tuo accumulatore",
    storageIntro:
      "Powerstation o batteria di servizio: capacità, tipo e stato di carica decidono quanto ti dura la corrente.",
    chemistryLabel: "Tipo",
    chemistryNames: {
      lifepo4: "LiFePO₄",
      liion: "Li-ion / powerstation",
      agm: "AGM",
      gel: "Gel",
      lead: "Piombo (aperta)",
    },
    modeLabel: "Inserisci la capacità",
    modeWh: "in Wh",
    modeAh: "in Ah + volt",
    capacityWhLabel: "Capacità (Wh)",
    capacityWhHint: "Di solito è indicata sulla powerstation, p. es. 1024 Wh.",
    capacityAhLabel: "Capacità (Ah)",
    voltageLabel: "Tensione nominale (V)",
    voltageHint:
      "Le batterie di servizio sono in genere a 12 V, gli impianti più grandi a 24 V o 48 V.",
    voltageMissing:
      "Senza tensione gli Ah non sono energia – inserisci la tensione nominale e ne ricaviamo i Wh.",
    usableLabel: "Quota utilizzabile",
    usableDefaultHint: (p: number) =>
      `Valore predefinito per questo tipo: ${p} %. Il piombo si scarica solo a metà, il LiFePO₄ quasi del tutto – scaricare più a fondo costa durata.`,
    usableReset: "Valore del tipo",
    usableAria: "Quota utilizzabile dell'accumulatore in percento",
    chargeLabel: "Stato di carica ora",
    chargeAria: "Stato di carica attuale in percento",
    capacitySummary: (nominal: string, usable: string, reserve: string) =>
      `${nominal} nominali · ${usable} utilizzabili · ${reserve} restano come riserva contro la scarica profonda.`,
    capacityUnknown: "Nessuna capacità inserita – senza non c'è autonomia.",
    deepDischargeTitle: "Rischio di scarica profonda",
    deepDischargeText:
      "La scorta utilizzabile finisce oggi stesso. Spegni qualche utenza, ricarica – oppure accetta consapevolmente una scarica più profonda, sapendo che costa durata.",
    missingStorageHint:
      "Inserisci sopra il tuo accumulatore e ti calcoliamo l'autonomia.",
    missingConsumersHint:
      "Inserisci sotto le tue utenze e ti calcoliamo l'autonomia.",
    consumerShare: (p: number) => `${p} % del consumo giornaliero`,
    templatesHint:
      "I modelli sono valori indicativi presi dalla pratica – per gli apparecchi a compressore si intende il tempo di funzionamento, non quello di presenza. Vale quanto sta scritto sulla targhetta.",
    coolingBadge: (hours: number, temp: number) =>
      `Apparecchio frigorifero: circa ${hours} h di funzionamento a ${temp} °C secondo la previsione`,
    coolingBadgeNoWeather:
      "Apparecchio frigorifero – la durata arriverà dal meteo appena è caricata una previsione",
    inverterBadge: "230 V tramite inverter (+18 % calcolati)",
    formInverter: "Apparecchio 230 V (inverter, +18 %)",
    formCooling: "Apparecchio frigorifero – durata secondo il meteo",
    coolingToggleAria: (name: string) =>
      `${name}: attiva o disattiva la durata secondo il meteo`,
    inverterToggleAria: (name: string) =>
      `${name}: attiva o disattiva il supplemento inverter`,
    solarLabel: "Pannelli solari (W totali)",
    solarHint: "ad es. 2 pannelli da 200 W = 400",
    mountLabel: "Installazione",
    mountRoof: "Fissi sul tetto",
    mountPortable: "Mobili, appoggiati",
    mountRoofHint:
      "Montaggio in piano: calcoliamo con l'irraggiamento sulla superficie orizzontale.",
    mountPortableHint:
      "Appoggiati liberamente e girati verso il sole: chiediamo l'irraggiamento direttamente per l'inclinazione e l'orientamento consigliati più sotto.",
    forecastTitle: "Previsione di resa",
    forecastSubtitle: (d: number) =>
      `Resa attesa del tuo impianto per i prossimi ${d} giorni.`,
    forecastTilted: "La base è l'irraggiamento sul tuo pannello orientato.",
    forecastHorizontal:
      "La base è l'irraggiamento sulla superficie orizzontale.",
    noPanelHint:
      "Inserisci sopra la potenza nominale dei tuoi pannelli e ti calcoliamo la resa.",
    dayYield: (wh: string, kwh: number) => `${wh} · ${kwh} kWh/m²`,
    dayBattery: (p: number) => `${p} % di accumulo`,
    balanceTotals: (y: string, c: string, d: number) =>
      `Su ${d} giorni: ${y} di resa contro ${c} di consumo.`,
    wastedHint: (wh: string) =>
      `Di questi ${wh} non entrano più nell'accumulatore pieno.`,
    balanceCovered: (d: number) =>
      `Il sole ti porta per tutti i ${d} giorni – l'accumulatore resta sopra il limite di scarica.`,
    balanceEmpty: (date: string, d: number) =>
      `Il ${date} la scorta utilizzabile è esaurita – il sole basta per ${d} giorni.`,
    balanceNoStorage:
      "Senza capacità inserita mostriamo solo resa e consumo, non lo stato dell'accumulatore.",
    efficiencyIntro: (p: number) =>
      `Calcolato con un rendimento di sistema del ${p} % – ecco come si compone:`,
    lossNames: {
      controller: "Regolatore di carica",
      cable: "Cavi e connettori",
      temperature: "Temperatura",
      soiling: "Sporco e invecchiamento",
    },
    yieldSourceForecast: "Resa solare dalla previsione di irraggiamento.",
    yieldSourceSunHours: "Resa solare dalle tue ore di sole effettive.",
    sunHoursLabel: "Ore di sole effettive al giorno",
    sunAutoLabel: "Riprendi automaticamente dalle previsioni meteo",
    sunAutoAria:
      "Riprendi automaticamente le ore di sole dalle previsioni meteo",
    sunSliderAria: "Ore di sole effettive al giorno",
    manualModeHint:
      "Modalità manuale: il tuo valore resta e non viene sovrascritto dalle previsioni.",
    forecastLoading: "Caricamento delle previsioni …",
    forecastRefresh: "Aggiorna le previsioni",
    forecastApply: "Riprendi le ore di sole dalle previsioni meteo",
    forecastOk: (avg: number, days: number, source: string) =>
      `Ripreso: Ø ${avg} h di sole al giorno (previsioni per i prossimi ${days} giorni – fonte: ${source}).`,
    forecastError:
      "Previsioni automatiche non disponibili – autorizza l'accesso alla posizione, salva una piazzola preferita o imposta il valore manualmente.",
    guidelinePrefix:
      "Valori indicativi per la Svizzera: estate soleggiata 5–6 h, variabile 3–4 h, coperto 1–2 h. L'ombra di alberi o montagne riduce nettamente il valore – controlla il percorso del sole nella ",
    sunCompassLink: "bussola solare",
    guidelineSuffix:
      ". In modalità automatica la resa si calcola con la previsione di irraggiamento; le tue ore di sole restano un riferimento.",
    alignmentTitle: "Orientamento ottimale dei pannelli oggi",
    alignmentDirection: "Orientamento",
    alignmentTilt: "Inclinazione",
    alignmentVsFlat: "vs posato in piano",
    directSun: (from: string, to: string, h: number) =>
      `Sole diretto oggi dalle ${from} alle ${to} (${h} h).`,
    directSunNoTimes: (h: number) => `Sole diretto oggi (${h} h).`,
    shadedPrefix: (h: number) =>
      `${h} h sono in ombra secondo il tuo profilo ostacoli della `,
    shadedLink: "bussola solare",
    shadedSuffix: " – la raccomandazione ne tiene già conto.",
    obstacleTipPrefix: "Suggerimento: registra alberi o montagne nella ",
    obstacleTipSuffix:
      ", così la raccomandazione considera anche l'ombreggiamento.",
    consumersTitle: "I tuoi consumatori",
    formError: "Indica nome, watt e ore",
    consumerPlaceholder: "Consumatore",
    consumerNameAria: "Nome del consumatore",
    wattsPlaceholder: "Watt",
    wattsAria: "Potenza in watt",
    hoursPlaceholder: "h/giorno",
    hoursAria: "Ore di funzionamento al giorno",
    addAria: "Aggiungi il consumatore",
    presetAddAria: (name: string) => `Aggiungi il suggerimento ${name}`,
    consumerLine: (w: number, h: number, wh: number) =>
      `${w} W · ${h} h/giorno = ${wh} Wh`,
    enableAria: (name: string) => `Attiva ${name}`,
    disableAria: (name: string) => `Disattiva ${name}`,
    deleteAria: (name: string) => `Elimina ${name}`,
    empty:
      "Nessun consumatore registrato – usa i suggerimenti sopra o inserisci i tuoi apparecchi.",
    presets: {
      fridge: "Frigorifero",
      coolbox: "Frigo box a compressore",
      laptop: "Laptop",
      drone: "Ricarica batteria del drone",
      phone: "Ricarica smartphone",
      led: "Illuminazione LED",
      camera: "Batterie della fotocamera",
      pump: "Pompa dell'acqua",
      heater: "Ventola del riscaldamento",
      fan: "Ventilatore",
      tv: "Televisore",
      router: "Router Wi-Fi",
    },
  },
  drying: {
    title: "Tempi di asciugatura",
    subtitle:
      "Il bucato sulla corda sarà asciutto entro il tramonto? Calcolato da temperatura, umidità e vento.",
    myLocation: "La mia posizione",
    conditionsTitle: "Condizioni attuali",
    tempLabel: "Temp. (°C)",
    humidityLabel: "Umidità (%)",
    windLabel: "Vento (km/h)",
    loadingWeather: "Caricamento del meteo …",
    loadWeather: "Riprendi il meteo attuale dalla posizione",
    weatherOk: (time: string) => `Meteo ripreso – tramonto oggi alle ${time}.`,
    forecastNote:
      "La stima usa l'andamento orario delle previsioni (più preciso di un'istantanea).",
    weatherError:
      "Impossibile caricare il meteo – inserisci i valori a mano (la raccomandazione sul tramonto richiede l'accesso alla posizione).",
    lineTitle: "Cosa c'è sulla corda?",
    reminderTitle: "Promemoria bucato",
    reminderText:
      "Ricevi un avviso prima che inizi a piovere o che il sole tramonti – così ritiri il bucato in tempo. Il promemoria funziona finché l'app è aperta (anche in una scheda in secondo piano).",
    leadLabel: "Preavviso:",
    leadGroupAria: "Scegli il preavviso",
    minutesShort: (n: number) => `${n} min`,
    reminderStop: "Ferma il promemoria",
    reminderStart: "Attiva il promemoria",
    reminderActive: (info: string) => `Attivo: ${info}`,
    rainWarnTitle: "Pioggia in arrivo!",
    rainWarnBody: (min: number) =>
      `Tra ca. ${min} minuti inizierà a piovere – ritira il bucato.`,
    sunsetWarnTitle: "Il sole tramonta presto",
    sunsetWarnBody: (min: number) =>
      `Ancora ca. ${min} minuti al tramonto – ritira il bucato prima della rugiada serale.`,
    scheduledRain: (time: string) => `Avviso pioggia alle ${time}`,
    scheduledSunset: (time: string) => `Promemoria tramonto alle ${time}`,
    noReminderTitle: "Nessun promemoria necessario",
    noReminderBody: "Né pioggia né tramonto sono imminenti.",
    over24: "> 24 h",
    removeAria: (label: string) => `Rimuovi ${label}`,
    dryAtPrefix: "Presumibilmente asciutto alle ",
    dryAtSuffix: "",
    tomorrowSuffix: " (domani)",
    rainFromPrefix: "Attenzione: dalle ",
    rainFromSuffix: "",
    rainAnnounced: " è prevista pioggia",
    rainProbability: (p: number) => ` (${p} %)`,
    rainAction: " – ritira prima o appendi sotto la veranda!",
    ownMaterialTitle: "Aggiungi il tuo materiale",
    labelLabel: "Denominazione",
    labelPlaceholder: "ad es. maglione di lana",
    baseHoursLabel: "Base (h)",
    addButton: "Aggiungi",
    ownMaterialNote: "Materiale personale",
    ownMaterialHint:
      "Tempo di asciugatura di base = quanto serve con un mite tempo estivo (20 °C, 60 % di umidità, vento leggero). I tuoi materiali restano salvati su questo dispositivo.",
    footnote:
      "Valori stimati per capi ben strizzati e appesi liberamente. Il sole diretto accelera ulteriormente l'asciugatura, ombra e assenza di vento la rallentano. In caso di pioggia: tutto sotto la veranda.",
  },
  quiet: {
    title: "Timer del silenzio del camping",
    subtitle:
      "Tieni d'occhio il volume quando in campeggio vige il silenzio notturno – discreto e completamente offline.",
    micError:
      "Accesso al microfono non possibile. Autorizzalo nelle impostazioni del browser – la misurazione resta completamente sul tuo dispositivo.",
    quietActive: (from: string, to: string) =>
      `Silenzio notturno attivo (${from}–${to}) – il timer ti avvisa se diventa troppo rumoroso.`,
    quietInactive: (from: string) =>
      `Al momento nessun silenzio notturno. Inizia alle ${from}.`,
    shhTitle: "Ssst – silenzio notturno!",
    shhBody:
      "Le conversazioni superano al momento la soglia che hai impostato. I vicini di tenda ringraziano per toni un po' più bassi.",
    vibrateNote:
      "Sui dispositivi Android il telefono vibra in aggiunta (gli iPhone purtroppo non supportano la vibrazione web).",
    levelTitle: "Livello sonoro",
    currentLabel: "Attuale:",
    thresholdLabel: "Soglia:",
    peakLabel: "Picco:",
    stopMeasuring: "Ferma la misurazione",
    startMeasuring: "Avvia la misurazione",
    privacyNote:
      "Il suono viene analizzato solo in diretta – nulla viene registrato, salvato o inviato. Lo schermo deve restare acceso.",
    protocolTitle: "Registro notturno",
    clearAria: "Cancella il registro",
    clear: "Cancella",
    tooltipValue: (v: number) => `Livello ${v}`,
    tooltipName: "Massimo",
    tooltipLabel: (label: string) => `${label}`,
    protocolNote: (n: number) =>
      `Livello massimo per minuto (${n} min registrati, max. 8 h). La linea tratteggiata è la tua soglia di avviso. Il registro resta finché non lasci la pagina – ideale per il bilancio del mattino.`,
    settingsTitle: "Impostazioni del silenzio notturno",
    fromLabel: "Silenzio notturno dalle",
    toLabel: "Silenzio notturno fino alle",
    thresholdSetting: "Soglia di avviso",
    thresholdAria: "Soglia di avviso per il volume",
    tip: "Suggerimento: avvia la misurazione con un volume di conversazione normale e imposta la soglia appena sopra. Silenzio notturno abituale nei campeggi svizzeri: 22:00–07:00.",
  },
  lawn: {
    title: "Salvaprato",
    subtitle:
      "Per quanto tempo la tenda può stare sul prato prima che l'erba si rovini?",
    setupTitle: "La tua configurazione",
    loadingWeather: "Caricamento del meteo …",
    loadWeather: "Riprendi temperatura e umidità dal meteo",
    weatherNoteSoil: (temp: number, soil: string, moisture: string) =>
      `Massima del giorno ${temp} °C, umidità del suolo ${soil} % → suolo ${moisture}`,
    weatherNoteRain: (temp: number, rain: string, moisture: string) =>
      `Massima del giorno ${temp} °C, precipitazioni degli ultimi 2 giorni ${rain} mm → suolo ${moisture} (dedotto)`,
    moistureWet: "bagnato",
    moistureNormal: "normale",
    moistureDry: "secco",
    fromForecast: (note: string) =>
      `Ripreso dalle previsioni: ${note}. Modificabile manualmente.`,
    weatherError:
      "Meteo non disponibile – imposta temperatura e umidità a mano.",
    floorLabel: "Pavimento della tenda",
    floorMesh: "Mesh / senza pavimento",
    floorMeshHint: "luce e aria passano",
    floorStandard: "Pavimento standard",
    floorStandardHint: "catino del fondo abituale",
    floorFootprint: "Pavimento + footprint",
    floorFootprintHint: "sigilla completamente",
    grassLabel: "Stato del prato",
    grassRobust: "Robusto",
    grassRobustHint: "prato sportivo/da campeggio",
    grassNormal: "Normale",
    grassNormalHint: "prato comune",
    grassDelicate: "Delicato",
    grassDelicateHint: "prato ornamentale, appena seminato",
    sunLabel: "Insolazione della piazzola",
    sunShade: "Ombreggiato",
    sunPartial: "Mezz'ombra",
    sunFull: "Pieno sole",
    moistureLabel: "Umidità del suolo",
    moistureOptDry: "Secco",
    moistureOptNormal: "Normale",
    moistureOptWet: "Bagnato",
    tempLabel: "Temperatura diurna",
    tempAria: "Temperatura diurna in gradi Celsius",
    plannedLabel: "Permanenza prevista",
    plannedAria: "Permanenza prevista in giorni",
    days: (n: number) => `${n} giorn${n > 1 ? "i" : "o"}`,
    verdictSafe:
      "Nessun problema – il prato si riprende da solo in pochi giorni.",
    verdictCaution:
      "Attenzione – l'erba ingiallirà. Di solito si riprende in 1–2 settimane, pianifica lo spostamento.",
    verdictDamage:
      "Danni permanenti probabili – con questa permanenza l'erba sottostante muore. Sposta assolutamente la tenda.",
    statYellowing: "al primo ingiallimento",
    statDamage: "ai danni permanenti",
    statMove: "spostare al più tardi",
    tipsTitle: "Consigli per proteggere il prato",
    tip1Title: "Sposta regolarmente la tenda:",
    tip1Text:
      "Già uno spostamento di una larghezza di tenda restituisce luce e aria all'erba.",
    tip2Title: "Aera la tenda di giorno:",
    tip2Text:
      "Solleva il pavimento o apri gli absidi perché caldo e umidità possano uscire.",
    tip3Title: "Erba ingiallita:",
    tip3Text:
      "di solito si riprende da sola in 1–2 settimane – l'erba marrone e fradicia richiede spesso una risemina.",
    tip4Title: "Giornate calde:",
    tip4Text:
      "Sopra i 30 °C in pieno sole il prato sotto il pavimento della tenda soffre già dopo un giorno.",
  },
  spots: {
    title: "Campeggi",
    subtitle:
      "Salva le piazzole pianificate e consulta in anticipo meteo e posizione del sole.",
    loginFeature: "i tuoi campeggi",
    addSpot: "Aggiungi piazzola",
    empty:
      "Ancora nessun preferito. Salva la tua prima piazzola pianificata – con le coordinate o direttamente con la tua posizione attuale.",
    saved: "Piazzola salvata",
    deleteAria: name => `Elimina ${name}`,
    elevation: (value: string) => `${value} m s.l.m.`,
    dossierLink: "Dossier →",
    sunLink: "Posizione del sole →",
    loadForecast: "Carica anteprima meteo",
    weatherFailed: "Impossibile caricare il meteo.",
    retry: "Riprova",
    gusts: n => `Raffiche ${n} km/h`,
    pushEnabled:
      "Allerte maltempo attivate – riceverai una notifica in caso di tempesta o temporale sulle tue piazzole",
    pushDisabled: "Allerte maltempo disattivate",
    pushTitle: "Allerte maltempo per le tue piazzole",
    pushDesc:
      "Notifica push in caso di tempesta, temporale o pioggia intensa su una delle tue piazzole salvate. CampMesser ti ricorda inoltre quando gli alimenti nel frigo box stanno per scadere – e 3 giorni prima di un soggiorno pianificato, con lo stato della lista bagagli.",
    pushSaveFirst: "Salva prima una piazzola.",
    pushProfileHint: "Impostazioni dettagliate nel profilo →",
    pushAria: "Attiva le allerte maltempo per le piazzole salvate",
    geoUnsupported: "Il tuo dispositivo non supporta la geolocalizzazione.",
    geoUnavailable: "Posizione non disponibile.",
    nameRequired: "Inserisci un nome.",
    coordsInvalid: "Inserisci coordinate valide (ad es. 46.8182 e 8.2275).",
    dialogTitle: "Salva piazzola",
    dialogDesc:
      "Tocca la mappa, riprendi la tua posizione attuale o inserisci le coordinate a mano.",
    nameLabel: "Nome",
    namePlaceholder: "ad es. Camping Grindelwald",
    mapLabel: "Scegli il luogo sulla mappa",
    mapHide: "Nascondi mappa",
    mapShow: "Mostra mappa",
    latLabel: "Latitudine",
    lonLabel: "Longitudine",
    locating: "Rilevamento della posizione …",
    useLocation: "Usa la posizione attuale",
    noteLabel: "Nota (facoltativa)",
    notePlaceholder: "ad es. posto vicino al ruscello, ombreggiato al mattino",
    attrFilterAria: "Filtra per caratteristiche",
    sortByDistance: "Per distanza",
    distanceFromHome: (km: string) => `${km} da casa`,
    attrFilterShade: "Molta ombra",
    attrFilterQuiet: "Tranquillo",
    attrFilterWifi: "Wi-Fi",
    attrFilterPower: "Corrente in piazzola",
    attrFilterDogs: "Cani ammessi",
    attrFilterKids: "Adatto ai bambini",
    attrFilterEmpty:
      "Nessuna piazzola salvata soddisfa tutte le caratteristiche scelte.",
    routeLink: "Percorso →",
    routeAria: (name: string) =>
      `Apri il percorso verso la piazzola ${name} nell'app di mappe`,
  },
  mapView: {
    title: "Mappa",
    subtitle:
      "Tutte le piazzole salvate a colpo d'occhio – con i pernottamenti di «I miei viaggi». La mappa richiede una connessione Internet.",
    loginFeature: "la tua mappa delle piazzole",
    mapAria: "Mappa con le tue piazzole salvate",
    empty:
      "Ancora nessuna piazzola sulla mappa. Salva prima una piazzola preferita: apparirà qui come segnaposto.",
    emptyCta: "Alle piazzole preferite",
    nightsHere: (n: number) =>
      n === 1
        ? "1 pernottamento secondo «I miei viaggi»"
        : `${n} pernottamenti secondo «I miei viaggi»`,
    toDossier: "Al dossier →",
    legend: (n: number) =>
      n === 1
        ? "1 piazzola salvata sulla mappa"
        : `${n} piazzole salvate sulla mappa`,
    targetKind: "Meta del Trova-tenda",
    aimTarget: "Punta qui →",
    targetLegend: (n: number) =>
      n === 1
        ? "1 meta del Trova-tenda sulla mappa"
        : `${n} mete del Trova-tenda sulla mappa`,
    routeLink: "Percorso →",
    locateButton: "La mia posizione",
    locateFailed: "Impossibile determinare la posizione.",
    measureButton: "Misura",
    measureHint: "Tocca due punti sulla mappa",
    discoverSearchHere: "Cerca in questa zona",
    discoverLoading: "Caricamento dei campeggi …",
    discoverZoomHint: "Zooma di più per cercare i campeggi.",
    discoverError: "Impossibile caricare i campeggi – riprova più tardi.",
    discoverCount: (n: number) =>
      n === 0
        ? "Nessun campeggio trovato in questa zona."
        : n === 1
          ? "1 campeggio trovato"
          : `${n} campeggi trovati`,
    discoverLegend: (n: number) =>
      n === 1
        ? "1 campeggio scoperto (OpenStreetMap)"
        : `${n} campeggi scoperti (OpenStreetMap)`,
    osmFallbackName: "Campeggio",
    osmWebsite: "Sito web →",
    osmSource: "© OpenStreetMap",
    adoptFavorite: "Salva come preferito",
    adopted: (name: string) => `«${name}» salvato tra i preferiti`,
    createTitle: "Creare qui un preferito?",
    createDesc: (lat: string, lon: string) =>
      `Posizione ${lat}, ${lon} – dai un nome alla nuova piazzola.`,
    createNameLabel: "Nome",
    createNamePlaceholder: "es. Camping Seeblick",
    createNameRequired: "Inserisci prima un nome.",
    createConfirm: "Crea preferito",
    createdToast: (name: string) => `«${name}» creato come preferito`,
    createdToastAction: "Al dossier",
    sightingKind: "Osservazione della natura",
    sightingLegend: (n: number) =>
      n === 1
        ? "1 osservazione della natura sulla mappa"
        : `${n} osservazioni della natura sulla mappa`,
    layerGroupAria: "Scegli la visualizzazione della mappa",
    layerMap: "Mappa",
    layerSatellite: "Satellite",
    clusterAria: (n: number) =>
      `Gruppo di ${n} segnaposto – tocca per ingrandire`,
    layerFilterAria: "Mostra o nascondi i livelli dei segnaposto",
    layerFavorites: "Preferiti",
    layerTargets: "Mete",
    layerSightings: "Osservazioni",
    layerCampsites: "Campeggi (OSM)",
    layerExcursions: "Gite",
    excursionLegend: (n: number) =>
      n === 1 ? "1 meta per una gita" : `${n} mete per una gita`,
    layerFirepits: "Focolari",
    firepitLoading: "Ricerca dei focolari …",
    firepitZoomHint: "Ingrandisci di più per cercare i focolari.",
    firepitError:
      "Non è stato possibile caricare i focolari – riprova più tardi.",
    firepitCount: (n: number) =>
      n === 0
        ? "Nessun focolare trovato in questa zona."
        : n === 1
          ? "1 focolare trovato"
          : `${n} focolari trovati`,
    firepitLegend: (n: number) =>
      n === 1
        ? "1 focolare / griglia (OpenStreetMap)"
        : `${n} focolari / griglie (OpenStreetMap)`,
    firepitSearchHint: "Tocca «Cerca in questa zona».",
    layerFamily: "Famiglia",
    familyLoading: "Ricerca di parchi giochi e punti balneabili …",
    familyZoomHint:
      "Ingrandisci di più per cercare parchi giochi e punti balneabili.",
    familyError:
      "Non è stato possibile caricare parchi giochi e punti balneabili – riprova più tardi.",
    familyCount: (n: number) =>
      n === 0
        ? "Nessun parco giochi o punto balneabile trovato in questa zona."
        : n === 1
          ? "1 parco giochi / punto balneabile trovato"
          : `${n} parchi giochi e punti balneabili trovati`,
    familyLegend: (n: number) =>
      n === 1
        ? "1 parco giochi / punto balneabile (OpenStreetMap)"
        : `${n} parchi giochi e punti balneabili (OpenStreetMap)`,
    familySearchHint: "Tocca «Cerca in questa zona».",
  },
  spotDetail: {
    tariffCurrencyAria: "Valuta",
    tariffUnitPlaceholder: "ad es. al giorno",
    tariffPeriodAdd: "Aggiungi periodo",
    tariffPeriodFromAria: "Valido dal (GG.MM.)",
    tariffPeriodToAria: "Valido fino al (GG.MM.)",
    tariffPeriodRemoveAria: "Rimuovi periodo",
    tariffActiveNow: "in vigore",
    tariffCopySuffix: "(copia)",
    tariffDuplicateAria: (name: string) => `Duplica la tariffa ${name}`,
    tariffRowLabelMissing:
      "Una riga della tariffa ha un prezzo ma nessuna descrizione.",
    tariffRowPriceInvalid: (label: string) =>
      `Il prezzo per «${label}» manca o non è leggibile.`,
    fallbackTitle: "Piazzola",
    backLabel: "Piazzole",
    notFoundTitle: "Piazzola non trovata",
    elevation: (value: string) => `${value} m s.l.m.`,
    sunTitle: "Sole oggi in questa piazzola",
    sunrise: "Alba",
    noon: "Culmine",
    sunset: "Tramonto",
    sunCompassLink: "Guarda il percorso del sole e le ombre nella bussola",
    weatherTitle: "Anteprima meteo",
    weatherFailed: "Impossibile caricare il meteo (offline?).",
    moreAlerts: n => ` (+${n} ${n === 1 ? "altra" : "altre"})`,
    noAlerts: "Nessuna allerta maltempo nelle prossime 48 ore.",
    obstacleTitle: "Profilo ostacoli",
    obstaclesRecorded: n =>
      `${n} ostacol${n === 1 ? "o" : "i"} registrat${n === 1 ? "o" : "i"} – le ore d'ombra e l'orientamento dei pannelli tengono automaticamente conto di questo profilo.`,
    obstacleEmpty:
      "Per questa piazzola non è ancora registrato un profilo ostacoli. Inserisci alberi, montagne o edifici nella bussola solare per vedere le ore d'ombra.",
    obstacleEdit: "Modifica il profilo nella bussola solare",
    obstacleCreate: "Crea il profilo nella bussola solare",
    staysTitle: "I tuoi soggiorni qui",
    nightsTotalLabel: n => `${n === 1 ? "notte" : "notti"} in totale`,
    staysCountLabel: n => (n === 1 ? "soggiorno" : "soggiorni"),
    staysEmpty:
      "Ancora nessun soggiorno in questa piazzola in «I miei viaggi».",
    toDiary: "A «I miei viaggi»",
    shareTitle: "Condividi piazzola",
    shareDesc:
      "Chi ha il link vede nome, coordinate, meteo e orari del sole di questa piazzola – senza accesso e in sola lettura. Le tue note, gli ostacoli e le voci di viaggio restano privati.",
    stopShare: "Termina condivisione",
    stopShared: "Condivisione terminata – il link non è più valido",
    shareLinkCopied: "Link di condivisione copiato",
    shareLinkCreated: "Link di condivisione creato – copialo qui sopra",
    shareFailed: "Condivisione non riuscita",
    shareButton: "Condividi piazzola tramite link",
    qrAlt: name => `Codice QR del link di condivisione della piazzola ${name}`,
    qrTitle: "Da passare direttamente sul posto",
    qrText:
      "Fai scansionare il codice con la fotocamera del telefono – il dossier della piazzola si apre subito, senza digitare né accedere.",
    climateTitle: "Miglior periodo di viaggio",
    climateIntro:
      "Valori mensili da cinque anni di archivio meteo: massime e minime medie e giorni di pioggia al mese in questa piazzola.",
    climateLoadingAria: "Caricamento dei dati climatici",
    climateFailed: "Impossibile caricare i dati climatici.",
    climateRetry: "Riprova",
    climateBestTitle: "Mesi migliori:",
    climateChartMax: "Massima media giornaliera",
    climateChartMin: "Minima media giornaliera",
    climateChartRain: "Giorni di pioggia",
    climateDaysUnit: "giorni",
    climateLegend:
      "Linee = massima/minima media giornaliera (°C, asse sinistro) · Barre = giorni di pioggia al mese (oltre 1 mm, asse destro).",
    climateSource: (from, to) =>
      `Fonte: archivio meteo Open-Meteo, anni ${from}–${to}. Mesi migliori = i più caldi con meno giorni di pioggia.`,
    photosTitle: "Foto",
    photosHint:
      "Ricorda la piazzola con le immagini – posto tenda, vista, bacheca. Visibili solo a te; la vista condivisa del dossier non mostra alcuna foto.",
    addPhotos: "Aggiungi foto",
    addPhotosAria: (name: string) => `Aggiungi foto alla piazzola ${name}`,
    photoCountHint: (n: number, max: number) => `${n} di ${max} foto`,
    photoUploading: (n: number) =>
      n === 1 ? "1 foto in caricamento …" : `${n} foto in caricamento …`,
    photoUploaded: (n: number) =>
      n === 1 ? "Foto salvata" : `${n} foto salvate`,
    photoLimitReached: (max: number) =>
      `Massimo ${max} foto per piazzola – quelle in eccesso sono state ignorate`,
    photoTooLarge: (name: string) =>
      `${name}: l'immagine è troppo grande (max. 5 MB)`,
    photoUnsupportedType: (name: string) =>
      `${name}: formato non supportato – sono ammessi JPEG, PNG e WebP`,
    photoHeic: (name: string) =>
      `${name}: HEIC/HEIF non è supportato – esporta la foto come JPEG`,
    photoReadFailed: (name: string) =>
      `${name}: impossibile leggere l'immagine`,
    photoUploadFailed: (name: string) => `${name}: caricamento non riuscito`,
    photosLoadFailed: "Impossibile caricare le foto",
    photoDeleteConfirm: "Eliminare definitivamente questa foto?",
    photoDeleted: "Foto eliminata",
    photoDeleteAria: (n: number) => `Elimina la foto ${n}`,
    photoAlt: (n: number, place: string) => `Foto ${n} della piazzola ${place}`,
    photoOpenAria: (n: number, place: string) =>
      `Apri la foto ${n} di ${place} a schermo intero`,
    galleryTitle: (place: string) => `Foto – ${place}`,
    galleryCounter: (n: number, total: number) => `Foto ${n} di ${total}`,
    galleryPrev: "Foto precedente",
    galleryNext: "Foto successiva",
    attributesTitle: "Caratteristiche",
    attributesEmpty:
      "Nessuna caratteristica ancora registrata – annota cosa contraddistingue la piazzola: ombra, sanitari, rumore e altro.",
    attributesEditButton: "Modifica caratteristiche",
    attributesDialogTitle: "Modifica caratteristiche",
    attributesDialogDesc:
      "Scegli il valore adatto per ogni caratteristica – lascia vuoto ciò che (ancora) non sai.",
    attributeUnset: "Nessuna indicazione",
    attributeGroupAria: (name: string) => `Scegli il valore per ${name}`,
    attributesSaved: "Caratteristiche salvate",
    sectionPlace: "La piazzola",
    sectionArrival: "Il viaggio",
    sectionWeather: "Meteo e cielo",
    sectionAround: "Nei dintorni",
    sectionOwn: "Personale",
    sectionNavAria: "Sezioni del dossier",
    routeButton: "Percorso",
    routeAria: "Apri il percorso verso questa piazzola nell'app di mappe",
    contactTitle: "Contatto & check-in",
    contactEmpty:
      "Nessun contatto salvato – annota il telefono della reception, gli orari di check-in e il numero della tua piazzola.",
    contactEditButton: "Modifica contatti",
    contactDialogTitle: "Modifica contatto & check-in",
    contactDialogDesc:
      "Tutti i campi sono facoltativi – i campi vuoti non vengono mostrati.",
    contactPhoneLabel: "Telefono reception",
    contactPhonePlaceholder: "es. +41 33 123 45 67",
    contactPhoneAria: (name: string) => `Chiama la reception di ${name}`,
    contactCheckinLabel: "Orari di check-in",
    contactCheckinPlaceholder: "es. check-in 14–18, check-out entro le 11",
    contactParcelLabel: "Numero piazzola",
    contactParcelPlaceholder: "es. B12",
    contactSaved: "Contatti salvati",
    costTitle: "Costo per notte",
    costEmpty:
      "Nessun prezzo registrato – annota quanto costa una notte qui, così potrai confrontare le piazzole nelle statistiche.",
    costEditButton: "Modifica i costi",
    tariffsTitle: "Altre tariffe",
    tariffsEmpty: "Nessuna tariffa registrata.",
    tariffRowsEmpty: "Nessuna riga.",
    tariffsHint:
      "Per il confronto delle piazzole nelle statistiche vale sempre il prezzo per notte qui sopra – un confronto su più tariffe non sarebbe più un confronto.",
    tariffsEditButton: "Modifica tariffe",
    tariffsSaved: "Tariffe salvate",
    tariffAdd: "Aggiungi tariffa",
    tariffRowAdd: "Aggiungi riga",
    tariffNamePlaceholder: "p. es. alta stagione",
    tariffRowLabelPlaceholder: "p. es. adulti",
    tariffRowPriceAria: "Prezzo per notte",
    tariffTotal: (amount: string) => `In tutto ${amount}`,
    tariffRowOneOff: "una tantum",
    tariffRowOneOffAria: (label: string) =>
      `${label}: una tantum invece che a notte`,
    tariffRemoveAria: (name: string) => `Rimuovi la tariffa ${name}`,
    tariffRowRemoveAria: (label: string) => `Rimuovi la riga ${label}`,
    costPriceLabel: "Piazzola per notte",
    costExtraLabel: "Tassa di soggiorno e spese accessorie",
    costNightlyLabel: "Totale per notte",
    costEstimate: (nights: number, amount: string) =>
      `Le tue ${nights === 1 ? "1 notte" : `${nights} notti`} qui fanno circa ${amount} – stima approssimativa.`,
    costHint:
      "È solo una stima: CampMesser non conosce sconti, bambini, cane o supplementi stagionali. Quanto hai pagato davvero è nella cassa del viaggio corrispondente.",
    costDialogTitle: "Modifica il costo per notte",
    costDialogDesc:
      "Entrambi i campi sono facoltativi – lasciarli vuoti significa «non registrato».",
    costPriceInputLabel: "Piazzola per notte (CHF)",
    costPricePlaceholder: "per es. 42.00",
    costExtraInputLabel:
      "Tassa di soggiorno e spese accessorie per notte (CHF)",
    costExtraPlaceholder: "per es. 3.50",
    costExtraHelp:
      "Tutto ciò che si aggiunge per notte: tassa di soggiorno, corrente, gettoni doccia, cane.",
    costSaved: "Costi salvati",
    offlineMapTitle: "Mappa offline",
    offlineMapDesc:
      "Scarica in anticipo le tessere della mappa attorno a questa piazzola – così mappa e trova-tenda funzionano anche senza campo.",
    offlineMapRadiusLabel: "Raggio",
    offlineMapRadiusGroupAria: "Scegli il raggio della mappa offline",
    offlineMapRadiusOption: km => `${km} km`,
    offlineMapDetailLabel: "Livello di dettaglio",
    offlineMapDetailGroupAria:
      "Scegli il livello di dettaglio della mappa offline",
    offlineMapDetailOption: zoom => `fino allo zoom ${zoom}`,
    offlineMapTileCount: n => (n === 1 ? "1 tessera" : `${n} tessere`),
    offlineMapLayerNote: layer => `Vista: ${layer}`,
    offlineMapCapped: max =>
      `Limite di ${max} tessere raggiunto – il download parte dal centro verso l'esterno.`,
    offlineMapDownload: "Scarica",
    offlineMapDownloadAria: name => `Scarica la mappa offline per ${name}`,
    offlineMapCancel: "Annulla",
    offlineMapProgress: (done, total) => `${done} tessere su ${total}`,
    offlineMapSaved: (tiles, size) =>
      `Salvato: ${tiles} tessere, circa ${size} MB`,
    offlineMapSavedAt: date => `Scaricato il ${date}`,
    offlineMapDelete: "Elimina",
    offlineMapDeleteAria: name => `Elimina la mappa offline di ${name}`,
    offlineMapDeleted: "Mappa offline eliminata",
    offlineMapDone: n =>
      `${n} tessere salvate – qui la mappa ora funziona anche offline.`,
    offlineMapNothing:
      "Non è stato possibile caricare nessuna tessera (offline?).",
    offlineMapCancelled:
      "Download annullato – le tessere già caricate restano salvate.",
    offlineMapUnsupported: "Questo browser non può salvare mappe offline.",
    offlineMapFairUse:
      "Le tessere arrivano da OpenStreetMap ed Esri e sono messe a disposizione gratuitamente. Scarica quindi solo ciò che ti serve davvero – da qui il limite per piazzola.",
  },
  tentFinder: {
    title: "Trova-tenda",
    subtitle:
      "Rotta bussola e distanza per ritrovare la tua tenda – anche di notte o nei campeggi grandi.",
    targetTitle: "Meta",
    ownTargetsTitle: "Le tue mete",
    empty:
      "Nessuna meta salvata finora. Mettiti dove vorrai tornare più tardi – ad esempio proprio accanto alla tenda – dai un nome al punto e salva la tua posizione.",
    addTitle: "Salva la posizione attuale come …",
    nameAria: "Nome della meta",
    namePlaceholder: "es. Tenda o Docce",
    suggestionsAria: "Suggerimenti di nomi",
    suggestionTent: "Tenda",
    suggestionShowers: "Docce",
    suggestionWc: "WC",
    suggestionDishes: "Lavaggio stoviglie",
    suggestionPlayground: "Parco giochi",
    suggestionReception: "Reception",
    iconLabel: "Simbolo",
    iconNames: {
      tent: "Tenda",
      shower: "Docce",
      wc: "WC",
      water: "Acqua",
      playground: "Parco giochi",
      reception: "Reception",
      car: "Auto",
      waste: "Rifiuti",
      other: "Altro",
    },
    saveButton: "Salva posizione",
    nameMissing: "Dai prima un nome alla meta",
    tooMany: "Troppe mete – eliminane prima una",
    savedToast: name => `«${name}» salvata – ora ritroverai la strada fin qui`,
    deleteAria: name => `Elimina la meta «${name}»`,
    deleteConfirm: name => `Eliminare davvero la meta «${name}»?`,
    deletedToast: name => `«${name}» eliminata`,
    renameAria: (name: string) => `Rinomina la meta «${name}»`,
    renameInputAria: "Nuovo nome della meta",
    renamedToast: (name: string) => `Rinominata in «${name}»`,
    remembering: "Ricerca della posizione …",
    rememberFailed: "Impossibile determinare la posizione",
    noTarget:
      "Nessuna meta scelta. Tocca una meta qui sopra – oppure salva la tua posizione attuale con un nome.",
    geoUnsupported: "Il tuo dispositivo non supporta la geolocalizzazione.",
    geoDenied:
      "Accesso alla posizione negato – consentilo nelle impostazioni del browser.",
    geoFailed: "Posizione non disponibile.",
    geoWaiting: "Ricerca della posizione GPS …",
    accuracyInfo: m => `Precisione GPS ±${m} m`,
    directionText: (dir, dist) =>
      `La meta è in direzione ${dir}, a ${dist} da qui.`,
    arrowAria: (dir, dist) =>
      `Freccia di direzione: meta in direzione ${dir}, a ${dist}`,
    arrived: "Ci sei quasi – guardati attorno!",
    compassActivate: "Attiva la bussola",
    compassActivateHint:
      "Perché la freccia possa ruotare, CampMesser ha bisogno di accedere alla bussola del tuo dispositivo.",
    movementHint:
      "Direzione ricavata dal tuo movimento – la freccia è corretta solo finché avanzi.",
    noCompassHint:
      "Nessuna bussola disponibile: la freccia non può ruotare. Orientati con il punto cardinale – oppure fai qualche passo e CampMesser ricaverà la direzione dal tuo movimento.",
    mapTitle: "Mini-mappa",
    mapAria: "Mappa con la tua posizione e le tue mete salvate",
    mapHint: "Punto blu: la tua posizione. Tocca un pin per puntare la meta.",
    mapNoTargets:
      "Punto blu: la tua posizione. Le mete salvate appaiono come pin.",
    mapOffline:
      "Offline – la mappa non può caricare le tessere. La bussola continua a funzionare.",
    mapLoadFailed: "Impossibile caricare la mappa.",
    mapRetry: "Riprova",
  },
  hike: {
    title: "Registra un'escursione",
    subtitle:
      "Registra escursioni e passeggiate dalla piazzola – con distanza, durata, andatura e dislivello. La traccia resta sul tuo dispositivo finché non la salvi.",
    loginFeature: "le escursioni salvate",
    recorderTitle: "Registrazione",
    recorderIntro:
      "All'avvio CampMesser imposta il GPS sull'alta precisione. Le misure imprecise e i salti vengono filtrati, così distanza e dislivello sono corretti. La registrazione continua anche se cambi pagina.",
    start: "Avvia la registrazione",
    pause: "Pausa",
    resume: "Riprendi",
    stop: "Ferma",
    discard: "Scarta",
    discardConfirm:
      "Vuoi davvero scartare la registrazione? I punti registrati andranno persi.",
    statusRecording: "Registrazione in corso",
    statusPaused: "In pausa",
    startedAt: (time: string) => `Partenza ${time}`,
    pointCount: (n: number) => (n === 1 ? "1 punto" : `${n} punti`),
    statDistance: "Distanza",
    statDuration: "Durata",
    statSpeed: "Andatura media",
    statElevation: "Dislivello",
    statAscent: "Salita",
    statDescent: "Discesa",
    waitingFix: "In attesa di un segnale GPS preciso …",
    accuracy: (m: number) => `Precisione ±${m} m`,
    pausedHint:
      "In pausa – la pausa non conta né nella durata né nella distanza.",
    geoUnsupported: "Questo dispositivo non fornisce dati di posizione.",
    geoDenied:
      "Accesso alla posizione negato – consentilo nelle impostazioni del browser.",
    geoFailed: "Non è stato possibile rilevare la posizione.",
    keepAwakeLabel: "Tieni acceso lo schermo",
    tooFewPoints:
      "Troppi pochi punti utilizzabili – la registrazione è stata scartata.",
    saveTitle: "Salva l'escursione",
    saveDesc: "Dai un nome all'escursione e assegnala a un viaggio.",
    saveNeedsLogin:
      "Per salvarla ti serve un account – l'esportazione GPX funziona anche senza.",
    nameLabel: "Nome",
    namePlaceholder: "p. es. Giro del lago",
    nameRequired: "Inserisci un nome",
    defaultName: (date: string) => `Escursione del ${date}`,
    saved: "Escursione salvata",
    tripLabel: "Viaggio (facoltativo)",
    tripNone: "Senza viaggio",
    tripBadge: (name: string) => `Viaggio: ${name}`,
    listTitle: "Le mie escursioni",
    listEmpty: "Nessuna escursione registrata finora",
    listEmptyHint:
      "Avvia la registrazione qui sopra – dopo lo stop l'escursione compare qui.",
    showMap: "Mostra la mappa",
    hideMap: "Nascondi la mappa",
    mapAria: "Mappa dell'escursione registrata",
    mapFailed: "Non è stato possibile caricare la mappa.",
    mapEmpty: "Per questa escursione non sono salvati punti.",
    gpxExport: "Scarica il GPX",
    gpxDone: "File GPX creato",
    gpxImport: "Importa GPX",
    gpxImporting: "Importazione …",
    gpxImported: "Escursione importata.",
    gpxImportedEstimated:
      "Escursione importata. Il file non aveva orari – durata e passo sono dedotti da 4 km/h.",
    gpxImportFailed: "Impossibile leggere il file come GPX.",
    gpxFailed: "Esportazione GPX non possibile",
    gpxFallbackName: "Escursione",
    gpxAria: (name: string) => `Scarica ${name} in GPX`,
    shareAria: (name: string) => `Condividi ${name} con un link`,
    shareTitle: "Condividere l'escursione",
    shareDesc:
      "Chi conosce il link vede mappa, dati principali e profilo altimetrico di questa escursione – senza account. Il tuo nome non compare.",
    shareCopied: "Link copiato.",
    shareFailed: "Il link non è stato creato.",
    unshare: "Termina la condivisione",
    unshared: "Il link non è più valido.",
    unshareFailed: "La condivisione non è stata terminata.",
    editTitle: "Modifica l'escursione",
    editDesc: "Cambia il nome e il viaggio assegnato.",
    editAria: (name: string) => `Modifica ${name}`,
    deleteAria: (name: string) => `Elimina ${name}`,
    deleteConfirm: "Vuoi davvero eliminare questa escursione?",
    deleted: "Escursione eliminata",
  },
  locationShare: {
    title: "Sono qui",
    desc: "Manda ai tuoi compagni di viaggio un link con la tua posizione attuale. Il link scade automaticamente e puoi disattivarlo quando vuoi.",
    loginHint:
      "Per condividere la tua posizione ti serve un account CampMesser.",
    validityLabel: "Valido",
    validityAria: "Durata di validità del link della posizione",
    validityHours: (h: number) => (h === 1 ? "1 ora" : `${h} ore`),
    createButton: "Condividi la posizione",
    locating: "Rilevamento della posizione …",
    created: "Link della posizione creato",
    createdCopied: "Link della posizione creato e copiato",
    failed: "Non è stato possibile creare il link della posizione",
    refresh: "Aggiorna la posizione",
    refreshed: "Posizione aggiornata",
    stop: "Disattiva il link",
    stopConfirm:
      "Vuoi davvero disattivare il link? Chi lo ha non vedrà più la tua posizione.",
    stopped: "Link disattivato",
    share: "Condividi",
    shareTitle: "La mia posizione",
    updatedAgo: (ago: string) => `Posizione aggiornata ${ago}`,
    accuracy: (m: number) => `Precisione ±${m} m`,
    expiresAt: (date: string) => `Scade il ${date}`,
    qrTitle: "Codice QR",
    qrText:
      "Da scansionare direttamente dallo schermo – senza inviare il link.",
    qrAlt: "Codice QR del link della posizione",
  },
  sharedLocation: {
    badge: "Posizione condivisa",
    title: "Posizione",
    titleNamed: (name: string) => `Posizione di ${name}`,
    capturedAgo: (ago: string) => `Aggiornata ${ago}`,
    capturedAt: (time: string) => `rilevata alle ${time}`,
    accuracy: (m: number) => `Precisione ±${m} m`,
    coordsLabel: "Coordinate",
    coordsCopied: "Coordinate copiate",
    copyAria: "Copia le coordinate",
    navigate: "Indicazioni stradali",
    mapAria: "Mappa con la posizione condivisa",
    mapFailed: "Non è stato possibile caricare la mappa.",
    invalidHint:
      "I link della posizione scadono dopo poco tempo o vengono disattivati a mano. Chiedi un nuovo link.",
    expiresNote: (date: string) => `Questo link è valido fino al ${date}.`,
    footer: "Condiviso con CampMesser",
  },
  sharedSpot: {
    tariffsTitle: "Tariffe",
    tariffRowOneOff: "una tantum",
    invalid: "Questo link di condivisione è scaduto o non è più valido.",
    invalidHint:
      "È scaduto oppure la proprietaria o il proprietario ha terminato la condivisione.",
    badge: "Piazzola condivisa",
    sunTitle: "Sole oggi",
    sunrise: "Alba",
    noon: "Culmine",
    sunset: "Tramonto",
    weatherTitle: "Anteprima meteo",
    weatherFailed: "Impossibile caricare il meteo.",
    moreAlerts: n => ` (+${n} ${n === 1 ? "altra" : "altre"})`,
    noAlerts: "Nessuna allerta maltempo nelle prossime 48 ore.",
    contactTitle: "Contatto & check-in",
    contactPhone: "Telefono reception",
    contactCheckin: "Check-in",
    contactParcel: "Piazzola",
    footer:
      "Condiviso con CampMesser – il coltellino svizzero per il campeggio in tenda.",
  },
  trips: {
    detailSubtitle: "Un soggiorno in dettaglio",
    backToList: "Tutti i soggiorni",
    openDetailAria: (name: string) => `Apri il soggiorno ${name}`,
    openTrip: "Apri il viaggio",
    foodButton: "Frigo box e scorte",
    foodAria: (name: string) => `Apri frigo box e dispensa per ${name}`,
    detailNotFound:
      "Questo soggiorno non esiste più – forse è stato eliminato.",
    title: "I miei viaggi",
    subtitle: "Annota i tuoi soggiorni in campeggio: luoghi, notti e ricordi.",
    loginFeature: "i tuoi viaggi",
    packProgress: (name, checked, total) =>
      `${name}: ${checked} su ${total} pronti`,
    entrySaved: "Voce salvata",
    entrySaveFailed: "Impossibile salvare la voce",
    editEntryTitle: "Modifica viaggio",
    editEntryAria: (name: string) => `Modifica la voce ${name}`,
    saveChanges: "Salva le modifiche",
    entryUpdated: "Voce aggiornata",
    entryUpdateFailed: "Impossibile aggiornare la voce",
    unknownPlace: "Luogo sconosciuto",
    nightsInYear: year => `Notti ${year}`,
    nightsTotal: "Notti in totale",
    staysLabel: "Soggiorni",
    favoriteLabel: "Piazzola preferita",
    yearReviewTitle: "Retrospettiva dell'anno",
    yearReviewYearAria: "Scegli l'anno della retrospettiva",
    yearReviewPlaces: "Luoghi diversi",
    yearReviewTopPlace: "Piazzola top",
    yearReviewLongest: "Soggiorno più lungo",
    yearReviewShare: "Condividi come immagine",
    yearReviewShareAria: (year: number) =>
      `Condividi la retrospettiva ${year} come immagine`,
    yearReviewImageSaved: "Immagine scaricata",
    yearReviewShareFailed: "Impossibile creare l'immagine",

    // Collage di foto per viaggio (#226)
    collageButton: "Collage di foto",
    collageTitle: "Collage di foto",
    collageDescription:
      "Scegli le foto e la disposizione – CampMesser ne fa un'immagine da condividere, con nome del viaggio e periodo.",
    collageLayoutLabel: "Disposizione",
    collageLayoutNames: {
      grid2: "Griglia 2×2",
      grid3: "Griglia 3×3",
      hero: "Un'immagine grande",
    },
    collageSelected: (used: number, capacity: number) =>
      `Foto: ${used} posti occupati su ${capacity}`,
    collageSelectAria: (name: string) => `Foto di ${name} per il collage`,
    collageTooMany: (capacity: number) =>
      `In questa disposizione stanno ${capacity} foto – le altre restano fuori.`,
    collageNone: "Scegli almeno una foto.",
    collageShare: "Condividi",
    collageDownload: "Scarica",
    collageBusy: "Creazione dell'immagine …",
    collageSaved: "Collage scaricato",
    collageFailed: "Impossibile creare il collage",
    newTripButton: "Nuovo viaggio",
    tripFormDialogDesc: "Annota luogo, date e ricordi del tuo soggiorno.",
    choosePlaceError: "Scegli una piazzola o inserisci un luogo",
    placeLabel: "Luogo",
    freeLocationOption: "Inserisci luogo liberamente …",
    locationNameLabel: "Nome del luogo",
    locationPlaceholder: "ad es. Camping Aareschlucht",
    packListLabel: "Lista bagagli (facoltativa)",
    noPackList: "Senza lista bagagli",
    pitchSectionTitle: "Dettagli della piazzola",
    pitchSectionHint:
      "Ciò che vale solo per questo soggiorno – il numero cambierà la prossima volta.",
    pitchNumberLabel: "Numero della piazzola",
    pitchNumberPlaceholder: "p. es. B14",
    wifiNameLabel: "Nome del wifi",
    wifiNamePlaceholder: "p. es. Camping-Ospiti",
    wifiPasswordLabel: "Password wifi",
    wifiPasswordPlaceholder: "dalla reception",
    wifiPasswordShow: "Mostra la password",
    wifiPasswordHide: "Nascondi la password",
    wifiPasswordCopy: "Copia la password",
    pitchNotesLabel: "Note sulla piazzola",
    pitchNotesPlaceholder:
      "p. es. quadro elettrico dietro la siepe, rubinetto 20 passi a destra",
    arrivalTimeLabel: "Ora di arrivo (facoltativo)",
    departureTimeLabel: "Ora di partenza (facoltativo)",
    timesLine: (a: string | null, d: string | null) =>
      [a ? `Arrivo ${a}` : null, d ? `Partenza ${d}` : null]
        .filter(Boolean)
        .join(" · "),
    yearCompareTitle: "Notti per anno",
    arrivalLabel: "Arrivo",
    departureLabel: "Partenza",
    titleLabel: "Titolo (facoltativo)",
    titlePlaceholder: "ad es. Vacanze in famiglia al lago",
    notesLabel: "Note (facoltative)",
    notesPlaceholder:
      "La piazzola più bella, la ricetta migliore, cosa cambiare la prossima volta …",
    submit: "Salva voce",
    moreSections: "Altro sul viaggio",
    statsLink: "Vedi statistiche e traguardi",
    plannedTitle: "Soggiorni pianificati",
    holidaySectionLabel: "Vacanze scolastiche & giorni festivi",
    holidayCantonAria:
      "Scegli il cantone per le indicazioni su vacanze e giorni festivi",
    holidayCantonNone: "Nessun cantone – nessuna indicazione",
    holidaySchoolBadge: name => `Cade nelle vacanze scolastiche (${name})`,
    holidayPublicBadge: (date, name) => `Giorno festivo il ${date}: ${name}`,
    holidaySource:
      "Dati su vacanze e giorni festivi: OpenHolidays API, senza garanzia.",
    countdown: days =>
      days === 0
        ? "Si parte oggi!"
        : days === 1
          ? "Si parte domani!"
          : `Ancora ${days} giorni`,
    nightsCount: n => (n === 1 ? "1 notte" : `${n} notti`),
    menuPlanButton: "Piano dei pasti",
    roadRulesButton: "Pedaggi e regole",
    roadRulesAria: (name: string) =>
      `Pedaggi e regole per la destinazione di ${name}`,
    menuPlanAria: (name: string) => `Apri il piano dei pasti di ${name}`,
    deletePlannedAria: name => `Elimina il soggiorno pianificato ${name}`,
    deleteEntryAria: name => `Elimina la voce ${name}`,
    dossierAria: (name: string) => `Apri il dossier di ${name}`,
    entriesTitle: "I tuoi soggiorni",
    empty:
      "Ancora nessuna voce – annota il tuo primo soggiorno in campeggio con «Nuovo viaggio».",
    addPhotos: "Aggiungi foto",
    addPhotosAria: name => `Aggiungi foto al soggiorno ${name}`,
    photoCountHint: (n, max) => `${n} di ${max} foto`,
    photoUploading: n =>
      n === 1 ? "1 foto in caricamento …" : `${n} foto in caricamento …`,
    photoUploaded: n => (n === 1 ? "Foto salvata" : `${n} foto salvate`),
    photoLimitReached: max =>
      `Massimo ${max} foto per soggiorno – quelle in eccesso sono state ignorate`,
    photoTooLarge: name => `${name}: l'immagine è troppo grande (max. 5 MB)`,
    photoUnsupportedType: name =>
      `${name}: formato non supportato – sono ammessi JPEG, PNG e WebP`,
    photoHeic: name =>
      `${name}: HEIC/HEIF non è supportato – esporta la foto come JPEG`,
    photoReadFailed: name => `${name}: impossibile leggere l'immagine`,
    photoUploadFailed: name => `${name}: caricamento non riuscito`,
    photosLoadFailed: "Impossibile caricare le foto",
    photoDeleteConfirm: "Eliminare definitivamente questa foto?",
    photoDeleted: "Foto eliminata",
    photoDeleteAria: n => `Elimina la foto ${n}`,
    photoAlt: (n, place) => `Foto ${n} del soggiorno ${place}`,
    photoOpenAria: (n, place) =>
      `Apri la foto ${n} di ${place} a schermo intero`,
    galleryTitle: place => `Foto – ${place}`,
    galleryCounter: (n, total) => `Foto ${n} di ${total}`,
    galleryPrev: "Foto precedente",
    galleryNext: "Foto successiva",
    coverSetButton: "Come copertina",
    coverRemoveButton: "Rimuovi copertina",
    coverBadge: "Copertina",
    coverSet: "Copertina impostata",
    coverRemoved: "Copertina rimossa",
    coverSaveFailed: "La copertina non è stata salvata",
    coverAlt: place => `Foto di copertina del soggiorno ${place}`,
    ratingLabel: "Valutazione (facoltativa)",
    ratingFormAria: "Scegliere una valutazione in stelle",
    ratingGroupAria: (name: string) => `Valutazione per ${name}`,
    rateStarAria: (n: number) =>
      n === 1 ? "Valutare con 1 stella" : `Valutare con ${n} stelle`,
    removeRatingAria: "Rimuovi la valutazione",
    ratingSaveFailed: "Impossibile salvare la valutazione",
    avgRatingLabel: "Valutazione media",
    bestRatedLabel: "Piazzola meglio valutata",
    starsAvg: (value: string) => `Ø ${value} stelle`,
    packSuggestionsTitle: "Suggerimenti bagagli in base al meteo",
    packSuggestionsBadge: n =>
      n === 1 ? "1 suggerimento" : `${n} suggerimenti`,
    packSuggestionsHint:
      "In base alle previsioni Open-Meteo per il periodo del viaggio – non ancora nella tua lista:",
    packSuggestionsAdd: "Aggiungi",
    packSuggestionsAddAria: name => `Aggiungi ${name} alla lista bagagli`,
    packSuggestionsAddAll: "Aggiungi tutti",
    packSuggestionsAdded: name => `«${name}» aggiunto`,
    packSuggestionsAddedAll: n => `${n} voci aggiunte`,
    packSuggestionsAddFailed: "Impossibile aggiungere la voce",
    readinessTitle: "Preparazione",
    readinessToggleAria: (name: string) =>
      `Mostra/nascondi la preparazione di ${name}`,
    readinessLoading: "Verifica in corso …",
    readinessAllDone: "Tutto pronto",
    readinessOpenCount: (n: number) =>
      n === 1 ? "1 punto aperto" : `${n} punti aperti`,
    readinessStatusOk: "fatto",
    readinessStatusOpen: "aperto",
    readinessOpenLink: "Apri",
    readinessOpenAria: (label: string) => `Apri ${label}`,
    readinessEditLink: "Completa",
    readinessEditAria: (name: string) => `Completa i dati di ${name}`,
    readinessPackListLabel: "Lista bagagli",
    readinessPackListDone: "tutto preparato",
    readinessPackListOpen: (pct: number) => `preparata solo al ${pct} %`,
    readinessPackListMissing: "nessuna lista collegata",
    readinessMenuLabel: "Piano dei pasti",
    readinessMenuDone: "tutti i pasti principali sono pianificati",
    readinessMenuOpen: (n: number) =>
      n === 1 ? "1 pasto senza piano" : `${n} pasti senza piano`,
    readinessShoppingLabel: "Spesa del viaggio",
    readinessShoppingDone: "niente in sospeso",
    readinessShoppingOpen: (n: number) =>
      n === 1 ? "1 voce in sospeso" : `${n} voci in sospeso`,
    readinessSpotLabel: "Piazzola",
    readinessSpotDone: "piazzola collegata",
    readinessSpotMissing: "nessuna piazzola collegata",
    readinessArrivalLabel: "Ora di arrivo",
    readinessArrivalDone: "registrata",
    readinessArrivalMissing: "non ancora registrata",
    weatherTitle: "Meteo durante il soggiorno",
    weatherSummary: (max, min) => `${max}° / ${min}°`,
    weatherRainDays: n =>
      n === 1 ? "1 giorno di pioggia" : `${n} giorni di pioggia`,
    weatherLuckTitle: "Fortuna meteo",
    weatherLuckDry: pct =>
      `Il ${pct} % dei tuoi giorni di campeggio è stato asciutto`,
    weatherLuckAvgMax: temp => `massima giornaliera media ${temp}°`,
    weatherLuckWarmest: (place, temp) => `luogo più caldo: ${place} (${temp}°)`,
    weatherLuckHint: n =>
      n === 1
        ? "Dall'archivio meteo di 1 soggiorno"
        : `Dall'archivio meteo di ${n} soggiorni`,
    weatherLuckYear: (pct, temp) =>
      `Fortuna meteo: ${pct} % di giorni asciutti · massima giornaliera media ${temp}°`,
    sharedBadge: "Condiviso",
    runningBadge: (day: number, total: number) =>
      `In corso · giorno ${day} di ${total}`,
    sharedWith: name => `Viaggio di ${name}`,
    membersButton: "Compagni di viaggio",
    membersAria: name => `Gestisci i compagni di viaggio di ${name}`,
    membersDialogDesc:
      "Invita altri account CampMesser – i compagni di viaggio possono vedere e modificare il viaggio (solo tu puoi eliminarlo).",
    membersListTitle: "Compagni di viaggio",
    membersOwnerBadge: "Proprietario/a",
    memberRemoveAria: name => `Rimuovi ${name} dal viaggio`,
    memberRemoveConfirm: name => `Rimuovere ${name} dal viaggio?`,
    memberRemoved: "Compagno/a di viaggio rimosso/a",
    memberRemoveFailed: "Rimozione non riuscita",
    inviteSectionTitle: "Link di invito",
    inviteHint: "Chi apre il link ed è connesso può unirsi al viaggio.",
    inviteCreate: "Crea link di invito",
    inviteCreateFailed: "Impossibile creare il link",
    inviteQrAlt: name => `Codice QR del link di invito per ${name}`,
    inviteQrHint: "Basta scansionarlo per unirsi.",
    inviteRevoke: "Revoca link",
    inviteRevoked: "Link di invito revocato",
    inviteRevokeFailed: "Revoca non riuscita",
    leaveTrip: "Lascia il viaggio",
    leaveTripAria: name => `Lascia il viaggio ${name}`,
    leaveConfirm: name => `Vuoi davvero lasciare il viaggio «${name}»?`,
    leftTrip: "Hai lasciato il viaggio",
    leaveFailed: "Impossibile lasciare il viaggio",
    hubShareAria: name => `Condividere l'hub del viaggio ${name}`,
    hubDialogTitle: "Condividere l'hub del viaggio",
    hubDialogDesc:
      "Un link pubblico raggruppa info del viaggio, piazzola, piano dei menu e lista bagagli (sola lettura, senza foto). La lista bagagli si può spuntare tramite il link.",
    hubCreate: "Crea il link dell'hub",
    hubCreateFailed: "Impossibile creare il link",
    hubLinkCreated: "Link dell'hub creato",
    hubStopShare: "Termina la condivisione",
    hubStopped: "Condivisione terminata – il link non è più valido",
    hubStopFailed: "Terminazione non riuscita",
    hubQrAlt: name => `Codice QR del link dell'hub per ${name}`,
    hubQrHint: "Basta scansionarlo per aprirlo.",
    printEntryAria: name => `Stampare il rapporto di viaggio di ${name}`,
    icsButton: "Calendario",
    icsAria: name => `Scaricare ${name} come voce di calendario (.ics)`,
    icsAllButton: "Tutti nel calendario",
    icsAllAria:
      "Scaricare tutti i viaggi in programma in un unico file di calendario (.ics)",
    icsDone: n =>
      n === 1
        ? "File di calendario creato – aprilo per aggiungere il viaggio"
        : `File di calendario con ${n} viaggi creato – aprilo per aggiungerli`,
    icsFailed: "Impossibile creare il file di calendario",
    milestonesTitle: "Traguardi",
    milestonesNextTitle: "Prossimi obiettivi",
    milestonesProgress: (current, target) => `${current} di ${target}`,
    viewToggleAria: "Scegli la vista dei soggiorni",
    viewList: "Elenco",
    viewCalendar: "Calendario",
    calPrevMonth: "Mese precedente",
    calNextMonth: "Mese successivo",
    calGridAria: month => `Calendario ${month}`,
    calTripAria: name => `Modifica il soggiorno ${name}`,
    calDayTrips: n => (n === 1 ? "1 soggiorno" : `${n} soggiorni`),
    calSchoolHolidayTitle: names => `Vacanze scolastiche: ${names}`,
    calPublicHolidayTitle: names => `Giorno festivo: ${names}`,
    calLegendOwn: "Il tuo viaggio",
    calLegendShared: "Viaggio condiviso",
    calLegendSchool: "Vacanze scolastiche",
    calLegendPublic: "Giorno festivo",
    duplicateAria: (name: string) => `Duplica il viaggio ${name}`,
    duplicateDialogTitle: "Duplica viaggio",
    duplicateDialogDesc:
      "Luogo, piazzola, lista bagagli e piano dei menu vengono ripresi – note, valutazione, foto e meteo no. Scegli le nuove date del viaggio.",
    duplicateSubmit: "Duplica",
    duplicated: "Viaggio duplicato – lo trovi tra i soggiorni pianificati",
    duplicateFailed: "Duplicazione non riuscita",
    journalTitle: "Diario di viaggio",
    journalToggleAria: (name: string) =>
      `Apri o chiudi il diario di viaggio di ${name}`,
    journalHint:
      "Annota giorno per giorno com'è andata – lo vedete solo tu e i tuoi compagni di viaggio.",
    journalCount: (n: number) => (n === 1 ? "1 voce" : `${n} voci`),
    journalEmptyDay: "Ancora nulla di annotato",
    journalPlaceholder: "Com'è andata oggi?",
    journalEditAria: (day: string) => `Modifica la voce del ${day}`,
    journalSave: "Salva",
    journalSaved: "Voce del diario salvata",
    journalDeleted: "Voce del diario eliminata",
    journalSaveFailed: "Impossibile salvare la voce del diario",
    journalBy: (name: string) => `di ${name}`,
  },
  clientErrors: {
    title: "Segnalazioni di crash",
    toggleAria: "Apri o chiudi le segnalazioni di crash",
    hint: "Ciò che il browser ha segnalato quando l’interfaccia è andata in crash – prima le più recenti. Visibile solo a te come gestore.",
    empty: "Nessun crash segnalato finora. È così che deve essere.",
    loadFailed: "Non è stato possibile leggere il registro.",
    count: (n: number) => (n === 1 ? "1 segnalazione" : `${n} segnalazioni`),
  },
  tripBoard: {
    title: "Bacheca",
    toggleAria: (name: string) => `Apri o chiudi la bacheca di ${name}`,
    hint: "Messaggi brevi e compiti per tutti i compagni di viaggio – la bacheca si aggiorna da sola.",
    hintSolo:
      "Note e compiti per questo soggiorno – ciò che resta in sospeso compare anche nella vista Oggi.",
    kindAria: "Scegli il tipo di biglietto",
    textAria: "Testo del biglietto",
    messagePlaceholder: "p. es. ritrovo alle 18 al parco giochi",
    taskPlaceholder: "p. es. comprare il pane",
    addButton: "Appendi",
    added: "Appeso in bacheca",
    addFailed: "Impossibile appendere il biglietto",
    textRequired: "Scrivi prima qualcosa.",
    empty: "Ancora niente in bacheca – scrivi il primo messaggio.",
    openTasks: (n: number) =>
      n === 1 ? "1 compito aperto" : `${n} compiti aperti`,
    byLine: (name: string, ago: string) => `di ${name} · ${ago}`,
    doneLine: (name: string, ago: string) => `fatto da ${name} · ${ago}`,
    doneAria: (text: string) => `Spunta il compito «${text}»`,
    doneFailed: "Impossibile spuntare il compito",
    unknownPerson: "qualcuno",
    removeAria: (text: string) => `Togli il biglietto «${text}»`,
    removeConfirm: "Vuoi davvero togliere questo biglietto?",
    removed: "Biglietto tolto",
    removeFailed: "Impossibile togliere il biglietto",
  },
  tripExpenses: {
    fuelTitle: "Calcolare i costi di viaggio",
    fuelHint:
      "Chilometri × consumo × prezzo del carburante. Si calcola con il consumo medio – chi vuole più precisione inserisce l'importo a mano.",
    fuelKmLabel: "Distanza (km)",
    fuelConsumptionLabel: "Consumo (l/100 km)",
    fuelPriceLabel: "Prezzo (CHF/l)",
    fuelRoundTrip: "Andata e ritorno",
    fuelResult: (km: number, liters: string, amount: string) =>
      `${km} km · ${liters} l · ${amount}`,
    fuelApply: "Riprendere nella cassa",
    fuelInvalid: "Inserisci distanza, consumo e prezzo.",
    fuelDescription: (km: number) => `Tragitto ${km} km`,
    fuelFromLog: (l100: string) =>
      `Riprendi la media del libretto: ${l100} l/100 km`,
    powerTitle: "Contatore elettrico della piazzola",
    powerHint:
      "Lettura all'arrivo e alla partenza, il prezzo per kWh è indicato sulla colonnina. I valori restano memorizzati per viaggio.",
    powerStartLabel: "Lettura arrivo (kWh)",
    powerEndLabel: "Lettura partenza (kWh)",
    powerPriceLabel: "Prezzo per kWh (CHF)",
    powerResult: (kwh: string, amount: string) => `${kwh} kWh ≈ ${amount}`,
    powerApply: "Riprendere nella cassa",
    powerInvalid: "Inserisci entrambe le letture e il prezzo.",
    powerDescription: (kwh: number) => `Elettricità ${kwh} kWh`,
    csvButton: "Esportare come CSV",
    csvAria: (trip: string) => `Scaricare la cassa di ${trip} come CSV`,
    csvHeaders: [
      "Data",
      "Categoria",
      "Descrizione",
      "Pagato da",
      "Valuta",
      "Importo",
    ],
    currencyAria: "Valuta dell'importo",
    eurRateSaved: "Cambio dell'euro salvato",
    eurRateInvalid: "Cambio non valido – ammesso da 0.5 a 2.0 CHF per euro.",
    eurRateLine: (rate: string) => `Cambio: 1 € = ${rate} CHF`,
    eurRateMissing: "Spese in euro registrate, ma nessun cambio impostato.",
    eurRateSet: "Imposta il cambio",
    eurRateEdit: "Modifica il cambio",
    eurRateRemove: "Rimuovi il cambio",
    eurRateHint:
      "Vale per totale, budget e «chi deve a chi» di questo viaggio. Le ricevute restano salvate in euro.",
    eurConvertedNote: (eur: string, rate: string) =>
      `di cui ${eur}, convertiti al cambio ${rate}`,
    eurUnconvertedNote: (eur: string) =>
      `${eur} senza cambio – esclusi da totale, budget e conguaglio`,
    budgetTitle: "Budget",
    budgetLabel: "Budget (CHF)",
    budgetSet: "Impostare un budget",
    budgetEdit: "Modificare il budget",
    budgetRemove: "Rimuovere il budget",
    budgetSaved: "Budget salvato",
    budgetSaveFailed: "Impossibile salvare il budget",
    budgetInvalid: "Inserisci un importo maggiore di zero.",
    budgetBarAria: (percent: number) => `${percent} % del budget utilizzato`,
    budgetLeft: (amount: string, percent: number) =>
      `Restano ${amount} (${percent} % utilizzato).`,
    budgetOver: (amount: string, percent: number) =>
      `${amount} oltre il budget (${percent} % utilizzato).`,
    forecastLine: (amount: string, day: number, total: number) =>
      `Di questo passo circa ${amount} entro la fine (giorno ${day} di ${total}).`,
    forecastOver: "Supera il limite.",
    forecastNote:
      "Campeggio e carburante contano una volta nella proiezione, non ogni giorno.",
    title: "Cassa del viaggio",
    toggleAria: (name: string) => `Apri o chiudi la cassa del viaggio ${name}`,
    hint: "Annota quanto costa il viaggio – alla fine vedi chi deve cosa a chi.",
    currency: "CHF",
    total: "Totale",
    empty: "Ancora nulla – inserisci la prima spesa.",
    categoryTitle: "Per categoria",
    categoryShare: (percent: number) => `${percent} %`,
    settleTitle: "Chi deve cosa a chi",
    settleNone: "Tutto in pari – nessuno deve niente.",
    settleHint: "Calcolato con quote uguali per tutti quelli che hanno pagato.",
    settleLine: (from: string, to: string, amount: string) =>
      `${from} versa ${amount} a ${to}`,
    addButton: "Registra spesa",
    newTitle: "Nuova spesa",
    editTitle: "Modifica spesa",
    amountLabel: "Importo (CHF)",
    amountPlaceholder: "p. es. 24.50",
    amountInvalid: "Indica un importo in franchi (p. es. 24.50).",
    dayLabel: "Data",
    categoryLabel: "Categoria",
    categoryAria: "Scegli la categoria",
    descriptionLabel: "Descrizione (facoltativa)",
    descriptionPlaceholder: "p. es. cena al negozio del paese",
    paidByLabel: "Chi ha pagato?",
    paidByPlaceholder: "Nome",
    paidByRequired: "Indica chi ha pagato.",
    paidBySuggestionsAria: "Persone già registrate",
    meFallback: "Io",
    save: "Salva",
    saved: "Spesa registrata",
    updated: "Spesa aggiornata",
    saveFailed: "La spesa non è stata salvata",
    deleted: "Spesa eliminata",
    deleteFailed: "La spesa non è stata eliminata",
    deleteConfirm: (label: string) =>
      `Vuoi davvero eliminare la spesa «${label}»?`,
    editAria: (label: string) => `Modifica la spesa ${label}`,
    deleteAria: (label: string) => `Elimina la spesa ${label}`,
    paidByLine: (name: string) => `pagato da ${name}`,
    byLine: (name: string) => `registrato da ${name}`,
    untitled: "Senza descrizione",
  },
  tripInvite: {
    badge: "Invito al viaggio",
    title: "Invito a un viaggio",
    invalid: "Questo invito non è valido",
    invalidHint:
      "Il link è stato revocato o non esiste. Fatti inviare un nuovo link.",
    ownerLine: name => `${name} ti invita a viaggiare insieme.`,
    ownerFallback: "Qualcuno",
    unknownPlace: "Luogo sconosciuto",
    editNote:
      "Come compagno/a di viaggio vedi il viaggio in «I miei viaggi» e puoi contribuire a foto, menu e lista bagagli.",
    accept: "Accetta l'invito",
    accepting: "Accettazione in corso …",
    accepted: "Ora fai parte del viaggio!",
    acceptedOwn: "Questo è il tuo viaggio.",
    acceptFailed: "Impossibile accettare l'invito",
    loginHint: "Accedi o crea un account per accettare l'invito.",
    loginCta: "Accedi e unisciti",
  },
  sharedTrip: {
    badge: "Viaggio condiviso",
    invalid: "Questo link di condivisione è scaduto o non è più valido.",
    invalidHint:
      "È scaduto oppure la proprietaria o il proprietario ha terminato la condivisione.",
    notesTitle: "Note",
    ratingAria: n => `Valutazione: ${n} stelle su 5`,
    spotTitle: "Piazzola",
    menuTitle: "Piano dei menu",
    dayHeader: "Giorno",
    packListTitle: "Lista bagagli",
    contactPhone: "Telefono reception",
    contactCheckin: "Check-in",
    contactParcel: "Piazzola",
    packListNotShared:
      "Questa lista bagagli al momento non è condivisa separatamente – solo visualizzazione, non si può spuntare.",
    footer:
      "Condiviso con CampMesser – il coltellino svizzero per il campeggio in tenda.",
  },
  tripPrint: {
    docTitle: name => `${name} – Rapporto di viaggio da stampare`,
    docTitleFallback: "Rapporto di viaggio",
    appTitle: "CampMesser – Il coltellino svizzero per il campeggio in tenda",
    notFound: "Questo soggiorno non è stato trovato.",
    printButton: "Stampa / Salva come PDF",
    printBrowserHint:
      "Nell'app installata questo pulsante apre la vista nel browser – lì stampa o salva come PDF dal menu.",
    headerKicker: "CampMesser · Rapporto di viaggio",
    printedOn: date => `Stato: ${date}`,
    ratingAria: n => `Valutazione: ${n} stelle su 5`,
    notesTitle: "Note",
    menuTitle: "Piano dei menu",
    dayHeader: "Giorno",
    photosTitle: "Foto",
    photoAlt: (n, name) => `Foto ${n} del soggiorno ${name}`,
    footer:
      "Bei ricordi! · CampMesser – il coltellino svizzero per il campeggio in tenda",
  },
  firstAid: {
    title: "Guida di primo soccorso",
    subtitle:
      "Guida compatta per gli infortuni tipici all'aria aperta – completamente disponibile offline.",
    offlineNote:
      "Tutti i contenuti sono salvati nell'app e utilizzabili senza connessione a Internet.",
    filterAria: "Filtra per gravità",
    filterAll: "Tutti i temi",
    severity: {
      leicht: "lieve",
      mittel: "medio",
      ernst: "grave",
    },
    recognizeTitle: "Riconoscere",
    helpTitle: "Come aiutare",
    disclaimer:
      "Nota: questa guida non sostituisce né un consulto medico né un corso di primo soccorso. Nel dubbio, chiamare sempre il 112 o la Rega al 1414.",
    tickTitle: "Promemoria morsi di zecca",
    tickSubtitle:
      "Annota un morso di zecca e tieni d'occhio il punto del morso per due settimane.",
    tickGuestHint:
      "Accedi per annotare i morsi di zecca e ricevere il promemoria dell'osservazione.",
    tickMedicalNote:
      "Importante: se attorno al punto del morso compare un rossore che si allarga, oppure se arrivano febbre, mal di testa o dolori muscolari, fatti visitare da un medico. Vale anche a settimane di distanza dal morso.",
    tickDateLabel: "Data del morso",
    tickBodyPartLabel: "Parte del corpo (facoltativo)",
    tickBodyPartPlaceholder: "p. es. incavo del ginocchio sinistro",
    tickNoteLabel: "Nota (facoltativo)",
    tickNotePlaceholder: "p. es. zecca rimossa completamente",
    tickAddButton: "Annota il morso",
    tickAdded: "Morso di zecca annotato",
    tickAddFailed: "Impossibile annotare il morso di zecca",
    tickOpenTitle: "In osservazione",
    tickOpenEmpty: "Al momento nessun morso di zecca è in osservazione.",
    tickDaysLeft: (n: number) =>
      n === 1
        ? "ancora 1 giorno da osservare"
        : `ancora ${n} giorni da osservare`,
    tickBitAt: (date: string) => `Morso il ${date}`,
    tickResolveButton: "fatto",
    tickResolveAria: (date: string) =>
      `Concludi l'osservazione del morso del ${date}`,
    tickResolved: "Osservazione conclusa",
    tickResolveFailed: "Impossibile concludere l'osservazione",
    tickReopenAria: (date: string) =>
      `Rimetti in osservazione il morso del ${date}`,
    tickDeleteAria: (date: string) => `Elimina il morso del ${date}`,
    tickDeleteConfirm: "Vuoi davvero eliminare questa voce?",
    tickDeleted: "Voce eliminata",
    tickDoneTitle: (n: number) => `Conclusi (${n})`,
    tickDoneToggleAria: "Apri o chiudi i morsi di zecca conclusi",
  },
  knots: {
    title: "Biblioteca dei nodi",
    subtitle:
      "I nodi outdoor più importanti con istruzioni passo per passo – disponibili offline.",
    offlineNote:
      "Tutte le istruzioni sono salvate nell'app e utilizzabili senza connessione a Internet.",
    quizTitle: "Quiz dei nodi",
    quizStartAria: "Avvia il quiz dei nodi",
    quizTeaser: "8 situazioni, 4 risposte – qual è il nodo giusto?",
    quizDescription:
      "Quale nodo si adatta alla situazione? Esercitati finché i gesti non sono automatici.",
    quizProgressAria: "Avanzamento del quiz",
    questionOf: (current, total) => `Domanda ${current} di ${total}`,
    points: n => `${n} punti`,
    answerAria: option => `Risposta: ${option}`,
    resultLine: (score, total) => `${score} su ${total} giuste!`,
    resultPerfect:
      "Esperto di nodi! Ora manca solo l'esercizio con una corda vera.",
    resultGood: "Solido! Riguarda i nodi sbagliati nella biblioteca qui sotto.",
    resultTryAgain:
      "Nessun problema – la biblioteca qui sotto spiega ogni nodo passo per passo.",
    newRound: "Nuova partita",
    finish: "Fine",
    showResult: "Mostra il risultato",
    nextQuestion: "Prossima domanda",
    filterAria: "Filtra per categoria",
    filterAll: "Tutti",
    difficultyAria: level => `Difficoltà ${level} di 3`,
    openAria: name => `Apri le istruzioni per ${name}`,
    cardImageAlt: name => `Istruzioni passo per passo: ${name}`,
    detailImageAlt: name => `Immagine passo per passo: fare il nodo ${name}`,
    alsoKnownAs: name => `anche: ${name}`,
    campingTitle: "In campeggio",
    stepsTitle: "Passo per passo",
    proTipTitle: "Consiglio da pro",
    masterySecure: "Sicuro",
    masteryPractice: "Da ripassare",
    openAriaLevel: (name, level) =>
      `Apri le istruzioni per ${name} – livello: ${level}`,
    practiceFilter: "Solo da ripassare",
    practiceFilterAria: "Mostra solo i nodi da ripassare",
    practiceEmpty:
      "Nessun nodo da ripassare in questa selezione – avvia il quiz per costruire il tuo livello.",
    reviewTitle: "Questi nodi hanno ancora bisogno di esercizio:",
    reviewAllSecure:
      "Tutti i nodi del quiz sono sicuri – continua con una corda vera!",
  },
  phrasebook: {
    title: "Aiuto linguistico",
    subtitle:
      "Le frasi da campeggio più importanti in tedesco, francese, italiano e inglese – disponibili offline.",
    offlineNote:
      "Tutte le frasi sono salvate nell'app e funzionano senza connessione a Internet.",
    targetLabel: "Lingua di destinazione",
    targetAria: "Scegli la lingua di destinazione",
    sameLanguageHint:
      "La lingua di destinazione è uguale a quella dell'app – scegline un'altra qui sopra per vedere la traduzione.",
    searchPlaceholder: "Cerca una frase …",
    searchAria: "Cerca nell'aiuto linguistico",
    searchEmpty: "Nessuna frase trovata – prova con un'altra parola chiave.",
    copyAria: (text: string) => `Copia «${text}»`,
    copied: "Frase copiata.",
    copyFailed: "La copia non è riuscita.",
    speakAria: (text: string) => `Leggi «${text}» ad alta voce`,
    stopAria: "Interrompi la lettura",
    countLine: (n: number) => `${n} frasi`,
  },
  clouds: {
    title: "Lessico delle nuvole",
    subtitle:
      "Riconosci il tipo di nuvola e sai che tempo arriva – disponibile offline.",
    offlineNote:
      "Tutte le nuvole sono salvate nell'app e funzionano senza connessione a Internet.",
    howToTitle: "Come leggere il cielo",
    howToText:
      "Guarda prima a che piano si trova la nuvola: alta e filamentosa, media con lati in ombra oppure bassa e grigia. Poi confronta l'aspetto – e infine leggi che cosa ne consegue.",
    filterAria: "Filtra per piano",
    filterAll: "Tutte",
    urgencyGood: "Buon segno",
    urgencyWatch: "Da osservare",
    urgencyWarning: "Allerta",
    appearanceTitle: "Come riconoscerla",
    meaningTitle: "Che cosa ne consegue",
    campTipTitle: "Sul posto",
    leadNone: "Non annuncia nulla",
    leadNow: (to: number) => `Ora fino a ${to} ore`,
    leadRange: (from: number, to: number) => `Tra ${from}–${to} ore`,
    leadDisclaimer:
      "L'indicazione temporale è una regola empirica per i fronti dell'Europa centrale, non un conto alla rovescia. In caso di rischio temporali vale sempre l'allerta attuale nel modulo meteo.",
    openAria: (name: string) => `Apri la nuvola ${name}`,
    countLine: (n: number) => `${n} tipi di nuvole nel lessico`,
  },
  care: {
    offlineNote:
      "Tutte le istruzioni sono salvate nell'app e funzionano senza connessione a Internet.",
    openAria: (name: string) => `Apri le istruzioni «${name}»`,
    whenTitle: "Quando serve",
    materialsTitle: "Che cosa ti serve",
    stepsTitle: "Passo dopo passo",
    mistakeTitle: "Errore più frequente",
    minutes: (n: number) => `${n} min di lavoro`,
    intervalMonths: (n: number) =>
      n === 12
        ? "ogni anno"
        : n % 12 === 0
          ? `ogni ${n / 12} anni`
          : `ogni ${n} mesi`,
    intervalNone: "all'occorrenza",
    reminderHint:
      "I lavori ricorrenti puoi annotarli nell'inventario come promemoria di manutenzione – così l'app si fa viva prima che sia troppo tardi.",
  },
  thunder: {
    title: "Distanza del temporale",
    subtitle:
      "Tocca al lampo, tocca al tuono – l'app calcola la distanza e dice se il temporale si avvicina.",
    tapLightning: "Lampo visto",
    tapThunder: "Tuono sentito",
    tapLightningAria: "Avvia il conteggio al lampo",
    tapThunderAria: "Ferma il conteggio al tuono",
    tapLightningHint: "Tocca appena vedi il lampo.",
    tapThunderHint: "Tocca appena senti il tuono.",
    lastStrike: "Ultimo lampo",
    distanceKm: (km: string) => `a ${km} km`,
    secondsCounted: (seconds: string) => `${seconds} secondi contati`,
    trendCloser: "Il temporale si avvicina.",
    trendFurther: "Il temporale si allontana.",
    trendSame: "La distanza resta più o meno uguale.",
    advice: {
      gefahr:
        "Proprio sopra di te. Subito in auto o in un edificio solido – una tenda non protegge dai fulmini.",
      warnung:
        "Abbastanza vicino: mettiti al riparo ora, non al prossimo lampo. Lontano da alberi isolati, pali e acqua.",
      beobachten:
        "Ancora lontano, ma tieni d'occhio – ritira la vela ombreggiante e fissa le cose sciolte.",
    },
    allClearIn: (minutes: number) =>
      `Cessato allarme tra ${minutes} min se non arrivano altri tuoni.`,
    allClearReached: (minutes: number) =>
      `Nessun tuono da ${minutes} minuti – puoi uscire di nuovo.`,
    historyTitle: "Lampi contati",
    reset: "Azzera",
    ruleTitle: "La regola 30-30",
    ruleText:
      "Se tra lampo e tuono passano meno di 30 secondi (circa 10 km), mettiti al riparo. E esci solo 30 minuti dopo l'ultimo tuono – gli ultimi fulmini di un temporale cadono spesso già a cielo sereno.",
    methodNote: (max: number) =>
      `Si calcola con la velocità del suono, circa tre secondi al chilometro. Oltre ${max} secondi non si conta più nulla – a quella distanza il tuono non si sente comunque.`,
  },
  chores: {
    title: "Piano dei compiti",
    subtitle:
      "Distribuire i compiti a turno, spuntare e raccogliere punti – senza litigi su chi lava di nuovo i piatti.",
    loginFeature: "il piano dei compiti",
    noChildren:
      "Nessun bambino registrato. Inseriscili nella modalità famiglia – poi si può distribuire.",
    dayLabel: "Giorno",
    distribute: "Distribuisci a turno",
    dayPlanTitle: "Compiti del giorno",
    progressLine: (done: number, total: number) => `${done} di ${total} fatti`,
    progressAria: "Avanzamento della giornata",
    toggleAria: (title: string) => `Spunta ${title}`,
    assignAria: (title: string) => `Assegna ${title}`,
    unassigned: "Da assegnare",
    pointsLine: (points: number) =>
      points === 1 ? "1 punto" : `${points} punti`,
    scoreTitle: "Classifica",
    scoreLine: (points: number, done: number) => `${points} p. · ${done}×`,
    scoreHint:
      "I punti arrivano solo con la spunta – essere assegnati non è ancora un merito.",
    historyTitle: "Punti per settimana",
    historyBarAria: (week: string, points: number) =>
      `Settimana dal ${week}: ${points} punti`,
    choresTitle: "Compiti",
    newChore: "Nuovo compito",
    newChorePlaceholder: "ad es. lavare i piatti",
    pointsLabel: "Punti",
    addChore: "Aggiungi",
    removeAria: (title: string) => `Elimina ${title}`,
    personsTitle: "Persone",
    personsHint:
      "I turni vengono distribuiti a tutti. Fa punti solo chi ha l’interruttore attivo – così gli adulti partecipano senza falsare la classifica dei bambini.",
    addPersonPlaceholder: "Nome",
    addPerson: "Aggiungi persona",
    earnsPointsLabel: "Punti",
    earnsPointsAria: (name: string) => `${name} fa punti?`,
    removePersonAria: (name: string) => `Rimuovi ${name}`,
    removePersonConfirm: (name: string) =>
      `Rimuovere ${name}? Distintivi, punti e voci del passaporto spariscono con lei.`,
    personAdded: "Persona aggiunta",
    rotationHint:
      "Si distribuisce a turno e non a caso: chi oggi lava i piatti domani porta la legna. Il giorno sposta l'ordine di uno – così ogni bambino può verificare che sia giusto.",
  },
  songbook: {
    title: "Canzoniere del falò",
    subtitle:
      "Testi con accordi – trasponibili, con modalità luce rossa e utilizzabili senza rete.",
    offlineNote:
      "Tutte le canzoni sono salvate nell'app e funzionano senza connessione a Internet.",
    redLight: "Luce rossa",
    transposeAria: "Cambia tonalità",
    transposeLabel: (value: string) => `Capo ${value}`,
    transposeUpAria: "Un semitono più alto",
    transposeDownAria: "Un semitono più basso",
    copyrightNote:
      "Qui ci sono solo canzoni di dominio pubblico – canti popolari e opere i cui autori sono morti da oltre 70 anni. Per ogni brano è indicata l'origine. I classici moderni da falò mancano quindi: non potrebbero essere riprodotti.",
  },
  storyDice: {
    title: "Dadi delle storie",
    subtitle:
      "Tira i simboli e inventate insieme una storia – senza rete, senza preparazione.",
    howToTitle: "Come si gioca",
    howToText:
      "Tirate, poi il primo dice una frase che contiene un simbolo. Si continua a turno finché tutti i simboli sono usati – e chi vuole aggiunge un finale.",
    countLabel: "Dadi:",
    countAria: "Scegli il numero di dadi",
    rollButton: "Tira",
    rerollAria: (word: string) => `Ritira ${word}`,
    rerollHint:
      "Un simbolo proprio non ci sta? Toccalo – viene ritirato solo quel dado.",
    starterTitle: "Frase iniziale",
  },
  treasure: {
    title: "Caccia al tesoro GPS",
    subtitle:
      "Nascondi tesori sul posto – i bambini cercano con «caldo e freddo» e una freccia.",
    loginFeature: "la caccia al tesoro GPS",
    openSection: "Apri la caccia al tesoro",
    openSectionHint:
      "Posizione e bussola si avviano solo quando apri la caccia al tesoro – altrimenti consumerebbero batteria inutilmente.",
    defaultName: "Caccia al tesoro",
    newHunt: "Nuova caccia",
    removeHunt: "Elimina questa caccia",
    empty:
      "Ancora nessuna caccia al tesoro. Creane una, poi posiziona i nascondigli sul posto.",
    modeAria: "Scegli la modalità",
    modeHide: "Nascondere",
    modeSeek: "Cercare",
    hideAria: "Posizionare i nascondigli",
    seekAria: "Caccia in corso",
    progressLine: (found: number, total: number) =>
      `${found} di ${total} trovati`,
    progressAria: "Avanzamento della caccia al tesoro",
    addPointHere: "Metti un nascondiglio qui",
    addPointTitle: "Nuovo nascondiglio",
    addPointDescription:
      "Il punto viene salvato alla tua posizione attuale. Prima nascondi l'oggetto, poi salva.",
    pointName: "Nome della tappa",
    pointNamePlaceholder: "ad es. Tappa 1",
    pointHint: "Indizio (facoltativo)",
    pointHintPlaceholder: "ad es. «Dove l'acqua gorgoglia»",
    savePoint: "Salva il nascondiglio",
    accuracyLine: (meters: number) =>
      `Precisione della posizione: ±${meters} m`,
    maxPoints: (max: number) =>
      `Più di ${max} nascondigli per caccia non sono previsti.`,
    hideTip:
      "Nascondi bene in vista a terra o tra i rami – non sotterrare. Il telefono individua il punto con 10-15 metri di scarto, il resto lo fanno gli occhi.",
    noPoints: "Questa caccia non ha ancora nascondigli.",
    waitingForFix: "Ricerca della posizione …",
    geoError:
      "Nessuna posizione disponibile. Senza localizzazione non si può né nascondere né cercare – concedi l'accesso.",
    weakSignal:
      "Il segnale è debole in questo momento – la distanza può sbagliare di alcuni metri.",
    stationLine: (index: number, total: number) => `Tappa ${index} di ${total}`,
    arrowAria: "Freccia verso il prossimo nascondiglio",
    markFound: "Trovato!",
    tooFarAway: "Ancora troppo lontano",
    hiddenName: "Prossimo nascondiglio",
    allFound: "Tutti i nascondigli trovati!",
    reset: "Gioca di nuovo",
    hideAgainAria: (name: string) => `Nascondi di nuovo ${name}`,
    removePointAria: (name: string) => `Elimina ${name}`,
  },
  gearRepair: {
    title: "Guida alle riparazioni",
    subtitle:
      "Sette riparazioni che salvano un viaggio – dal materassino alla fibbia dello zaino.",
  },
  tentCare: {
    title: "Cura della tenda",
    subtitle:
      "Sette lavori che tengono una tenda impermeabile per anni – dall'impregnazione alla muffa.",
  },
  nature: {
    title: "Esploratore della natura",
    subtitle:
      "Tracce di animali, costellazioni, alberi, funghi e bacche selvatiche – spiegati a misura di bambino e disponibili offline.",
    offlineNote:
      "L'intero lessico è salvato nell'app e utilizzabile senza connessione Internet.",
    moonSectionAria: "Calendario delle fasi lunari",
    moonTitle: "La luna stanotte",
    illuminated: pct => `Illuminata al ${pct} %`,
    stargazing: label => `Osservare le stelle: ${label}`,
    quality: {
      hervorragend: "eccellente",
      gut: "buona",
      mittel: "media",
      schlecht: "scarsa",
    },
    fullMoonsTitle: "🌕 Prossime lune piene",
    fullMoonsNote:
      "Ideale per le escursioni notturne – la luna illumina il cammino.",
    newMoonsTitle: "🌑 Prossime lune nuove",
    newMoonsNote:
      "Cielo più scuro – le notti migliori per costellazioni e Via Lattea.",
    moonCalcNote:
      "Il calcolo avviene direttamente sul dispositivo (precisione ±1 giorno) – funziona anche offline.",
    moonMonthToggleShow: "Apri la vista mensile",
    moonMonthToggleHide: "Chiudi la vista mensile",
    moonMonthTableAria: (month: string) => `Calendario lunare ${month}`,
    moonMonthPrev: "Mese precedente",
    moonMonthNext: "Mese successivo",
    moonMonthToday: "Torna a oggi",
    moonMonthNewShort: "LN",
    moonMonthFullShort: "LP",
    moonMonthDayAria: (date: string, phase: string) => `${date}: ${phase}`,
    moonMonthMeteorAria: (names: string) => `Stelle cadenti: ${names}`,
    moonMonthTodayAria: "oggi",
    moonMonthLegendNew: "Luna nuova – cielo più scuro",
    moonMonthLegendFull: "Luna piena – notte chiara",
    moonMonthLegendMeteor: (days: number) =>
      `Notte di stelle cadenti (massimo ±${days} giorni)`,
    moonMonthLegendToday: "Oggi",
    moonMonthNote:
      "I simboli mostrano la parte illuminata verso mezzogiorno – precisione ±1 giorno.",
    meteorSectionAria: "Calendario delle stelle cadenti",
    meteorTitle: "Prossime notti di stelle cadenti",
    activeNow: "Attivo ora",
    peakToday: "Massimo stanotte!",
    peakTomorrow: "Massimo domani",
    peakInDays: n => `Massimo tra ${n} giorni`,
    meteorRate: n => `fino a ${n} meteore/h`,
    radiantDirection: r => `direzione ${r}`,
    moonInterferes: pct =>
      `La luna disturba: al massimo è illuminata al ${pct} % – le meteore luminose restano comunque visibili.`,
    moonOk: pct => `Buona posizione della luna: illuminata solo al ${pct} %.`,
    meteorFootnote:
      "I tassi valgono per un cielo scuro senza inquinamento luminoso. Le date sono circa le stesse ogni anno, calcolo offline sul dispositivo.",
    redLightSectionAria: "Modalità luce rossa per osservare le stelle",
    redLightTitle: "Modalità luce rossa",
    redLightHint:
      "Una luce rossa attenuata preserva l'adattamento al buio dei tuoi occhi: dopo uno sguardo al telefono torni a vedere molto più in fretta le stelle deboli. Il filtro copre tutta l'app, che resta utilizzabile – al ricaricamento si disattiva da solo.",
    redLightOn: "Attiva la luce rossa",
    redLightOff: "Spegni la luce rossa",
    redLightOffAria: "Esci dalla modalità luce rossa",
    categoryAria: "Scegli una categoria",
    imageAlt: name => `Illustrazione: ${name}`,
    featuresTitle: "Segni di riconoscimento",
    funFactTitle: "Lo sapevi?",
    kidsTitle: "Per i bambini:",
    seasonLine: (from: string, to: string) => `Stagione: ${from}–${to}`,
    nowFilter: "Visibile adesso",
    nowFilterAria: "Mostra solo le voci attualmente di stagione",
    nowFilterEmpty:
      "In questa categoria al momento niente è di stagione – disattiva il filtro per vedere tutte le voci.",
    safetyTitle: "Prima identifica, poi mangia",
    rulesTitle: "La raccolta è regolata dai cantoni",
    habitatTitle: "Dove lo trovi:",
    useTitle: "Uso:",
    lookalikeTitle: "Rischio di confusione",
    lookalikeIntro:
      "Queste specie si assomigliano – leggile prima di portare via qualcosa.",
    lookalikeCheck:
      "Nel dubbio: non mangiare, ma mostrare tutto il raccolto all'ispettorato ufficiale dei funghi. Sospetta intossicazione: Tox Info Suisse 145.",
    collection: {
      title: "Album delle specie",
      progress: (seen: number, total: number) =>
        `${seen} specie osservate su ${total}`,
      progressAria: "Progressi della collezione",
      notSeen: "ancora da trovare",
      seenAria: (name: string, date: string) =>
        `${name} – osservato per la prima volta il ${date}. Apri la voce del lessico.`,
      openAria: (name: string) =>
        `${name} – non ancora osservato. Apri la voce del lessico.`,
      hint: "Collega un'osservazione a una specie del lessico affinché qui appaia a colori.",
    },
    sightings: {
      title: "Le mie osservazioni",
      sectionAria: "Le mie osservazioni della natura",
      intro:
        "Annota ciò che hai scoperto all'aperto – con data, posizione, nota e foto. Le osservazioni con posizione appaiono anche come pin sulla mappa.",
      loginFeature: "il tuo diario delle osservazioni",
      loadFailed: "Le osservazioni non sono state caricate.",
      empty:
        "Ancora nessuna osservazione – registra il tuo primo avvistamento, per esempio un capriolo al margine del bosco.",
      count: (n: number) => (n === 1 ? "1 osservazione" : `${n} osservazioni`),
      addButton: "Aggiungi osservazione",
      addAria: "Aggiungi una nuova osservazione",
      dialogTitleNew: "Nuova osservazione",
      dialogTitleEdit: "Modifica osservazione",
      dialogDescription:
        "Scegli una voce del lessico come suggerimento oppure inserisci un titolo tuo.",
      entryLabel: "Specie dal lessico (facoltativo)",
      entryNone: "Nessuna voce del lessico",
      titleLabel: "Titolo",
      titlePlaceholder: "es. Capriolo al margine del bosco",
      titleRequired: "Inserisci un titolo o scegli una voce del lessico.",
      dateLabel: "Data",
      locationLegend: "Posizione (facoltativo)",
      useLocation: "Usa la posizione attuale",
      locating: "Ricerca della posizione …",
      locationSet: (lat: string, lon: string) => `Posizione: ${lat}, ${lon}`,
      removeLocation: "Rimuovi la posizione",
      locationFailed:
        "Impossibile determinare la posizione – controlla l'autorizzazione.",
      locationUnsupported: "Questo dispositivo non fornisce la posizione.",
      onMapHint: "Appare come pin sulla mappa.",
      noteLabel: "Nota (facoltativo)",
      notePlaceholder: "es. tracce nel fango, due cuccioli",
      photoLabel: "Foto (facoltativo)",
      photoChoose: "Scegli foto",
      photoChange: "Cambia foto",
      photoRemove: "Rimuovi foto",
      photoPreviewAlt: "Anteprima della foto dell'osservazione",
      photoHint:
        "JPEG, PNG o WebP – viene ridotta automaticamente prima del caricamento.",
      photoUploading: "Caricamento della foto …",
      photoUploadFailed: "Salvato, ma la foto non è stata caricata.",
      photoTooLarge: "La foto è troppo grande (max. 5 MB).",
      photoHeic: "Il browser non può leggere HEIC/HEIF – esporta come JPEG.",
      photoReadFailed: "L'immagine non è stata letta.",
      photoRemoveFailed: "La foto non è stata rimossa.",
      photoAlt: (title: string) => `Foto dell'osservazione ${title}`,
      created: "Osservazione salvata",
      updated: "Modifiche salvate",
      deleted: "Osservazione eliminata",
      editAria: (title: string) => `Modifica l'osservazione «${title}»`,
      deleteAria: (title: string) => `Elimina l'osservazione «${title}»`,
      deleteConfirm: (title: string) =>
        `Eliminare davvero l'osservazione «${title}»?`,
    },
  },
  /** Rischio zecche per regione (#224). */
  fishing: {
    title: "Libretto delle catture",
    sectionAria: "Libretto delle catture – le mie catture",
    intro:
      "Annota ogni cattura: specie, lunghezza, peso, corso d'acqua, esca e foto. L'app ne ricava i tuoi record e le catture per anno.",
    loginFeature: "il tuo libretto delle catture",
    loadFailed: "Impossibile caricare le catture.",
    empty:
      "Ancora nessuna cattura – registra la prima, per esempio una trota di torrente della Sihl.",
    count: (n: number) => (n === 1 ? "1 cattura" : `${n} catture`),
    addButton: "Registra una cattura",
    addAria: "Registra una nuova cattura",
    legalTitle: "L'ultima parola spetta al cantone",
    legalText:
      "In Svizzera la pesca è regolata dai cantoni: periodi di protezione, misure minime di cattura e limiti di cattura variano da cantone a cantone e persino da acqua ad acqua. Qui trovi le prescrizioni minime della Confederazione – il tuo cantone può essere più severo, e quasi sempre lo è. Fanno fede l'ordinanza cantonale sulla pesca e la tua patente.",
    legalSource: (version: string, date: string) =>
      `Base: ordinanza concernente la legge federale sulla pesca (${version}). Stato dei dati: ${date}.`,
    filterSpeciesLabel: "Specie",
    filterWaterLabel: "Acqua",
    filterAll: "Tutte",
    filterEmpty: "Nessuna cattura per questa selezione.",
    released: "rilasciata",
    kept: "trattenuta",
    lengthShort: (value: string) => `${value} cm`,
    weightShort: (value: string) => `${value} kg`,
    photoAlt: (name: string) => `Foto della cattura: ${name}`,
    editAria: (name: string) => `Modifica la cattura «${name}»`,
    deleteAria: (name: string) => `Elimina la cattura «${name}»`,
    deleteConfirm: (name: string) =>
      `Vuoi davvero eliminare la cattura «${name}»?`,
    statsTitle: "Statistica",
    statsSummary: (total: number, released: number, kept: number) =>
      `${total} catture · ${released} rilasciate · ${kept} trattenute`,
    recordsTitle: "Cattura più grande per specie",
    recordNoLength: "mai misurata",
    recordCount: (n: number) => (n === 1 ? "1 cattura" : `${n} catture`),
    yearsTitle: "Catture per anno",
    yearLine: (total: number, released: number) =>
      `${total} catture, di cui ${released} rilasciate`,
    dialogTitleNew: "Nuova cattura",
    dialogTitleEdit: "Modifica la cattura",
    dialogDescription:
      "Scegli una specie dai dati – l'app controlla subito il periodo di protezione e la misura minima federale.",
    speciesLabel: "Specie di pesce",
    speciesOwn: "Inserisci una specie libera",
    nameLabel: "Nome della specie",
    namePlaceholder: "p. es. trota di torrente",
    nameRequired: "Inserisci il nome di una specie o scegline una.",
    dateLabel: "Data",
    timeLabel: "Ora",
    lengthLabel: "Lunghezza (cm)",
    weightLabel: "Peso (kg)",
    waterLabel: "Acqua",
    waterPlaceholder: "p. es. lago di Zurigo o Sihl presso Langnau",
    waterRequired: "Indica l'acqua.",
    methodLabel: "Esca / metodo",
    methodPlaceholder: "p. es. ninfa, esca siliconica 10 cm",
    releasedLabel: "Rilasciata con delicatezza",
    noteLabel: "Nota (facoltativa)",
    notePlaceholder: "p. es. mattino presto, pioggia leggera",
    photoLabel: "Foto (facoltativa)",
    photoChoose: "Scegli una foto",
    photoChange: "Cambia foto",
    photoRemove: "Rimuovi la foto",
    photoPreviewAlt: "Anteprima della foto della cattura",
    photoHint:
      "JPEG, PNG o WebP – viene ridotta automaticamente prima del caricamento.",
    photoUploading: "Caricamento della foto …",
    photoUploadFailed: "Salvato, ma la foto non è stata caricata.",
    photoTooLarge: "La foto è troppo grande (max. 5 MB).",
    photoHeic:
      "Il browser non può leggere HEIC/HEIF – esporta come JPEG, per favore.",
    photoReadFailed: "Non è stato possibile leggere l'immagine.",
    photoRemoveFailed: "Non è stato possibile rimuovere la foto.",
    created: "Cattura salvata",
    updated: "Modifiche salvate",
    deleted: "Cattura eliminata",
    hints: {
      ban: "Divieto di cattura della Confederazione: questa specie è in pericolo d'estinzione e non può essere catturata. Slama in acqua e rilascia subito il pesce.",
      report:
        "Obbligo di annuncio: annuncia questo pesce senza indugio al servizio cantonale della pesca.",
      closedSeason:
        "In questa data vale il periodo di protezione indicativo di questa specie – nella maggior parte dei cantoni ora non puoi trattenerla. Controlla l'ordinanza cantonale sulla pesca.",
      underMinLength: (cm: number) =>
        `Sotto la misura minima federale di ${cm} cm – rilascia. Il cantone chiede spesso ancora di più.`,
      nearMinLength: (cm: number) =>
        `Appena sopra la misura federale di ${cm} cm: molti cantoni chiedono nettamente di più – controlla prima di trattenere.`,
      cantonal:
        "Fanno fede l'ordinanza cantonale sulla pesca e la tua patente.",
    },
    speciesTitle: "Specie, periodi di protezione e misure minime",
    speciesIntro:
      "Le specie più importanti della pesca con la lenza in Svizzera, con le prescrizioni minime della Confederazione e ciò che i cantoni regolano più severamente nella pratica.",
    federalMin: (cm: number) => `Confederazione: almeno ${cm} cm`,
    federalMinNone: "Confederazione: nessuna misura minima",
    federalWeeks: (weeks: number) =>
      `periodo di protezione di almeno ${weeks} settimane`,
    federalWeeksNone:
      "nessun periodo di protezione prescritto dalla Confederazione",
    guideSeason: (from: string, to: string) =>
      `Periodo di protezione indicativo: dal ${from} al ${to}`,
    guideSeasonNone: "Nessun periodo di protezione diffuso registrato",
    guideSeasonHint:
      "Valore indicativo, non vincolante: la Confederazione fissa solo la durata in settimane, inizio e fine li stabilisce il cantone.",
    cantonTitle: "Nel cantone spesso più severo:",
    habitatTitle: "Dove si trova:",
    methodTitle: "Esca e metodo:",
    bannedBadge: "Divieto di cattura",
    waters: {
      fliessend: "Acque correnti",
      stehend: "Acque stagnanti",
      beide: "Acque correnti e stagnanti",
    },
    measureHint:
      "Si misura dalla punta del capo all'estremità della pinna caudale naturalmente distesa (art. 2 cpv. 2 OLFP).",
  },
  tickRisk: {
    sectionAria: "Rischio zecche in questo luogo",
    title: "Rischio zecche",
    activity: {
      none: "quasi inattive",
      low: "poco attive",
      moderate: "mediamente attive",
      high: "molto attive",
    },
    activityLine: (month: string) =>
      `Ecco quanto sono attive le zecche in ${month}.`,
    aboveTickLine: (limitM: number) =>
      `La piazzola si trova sopra i ${limitM} m – a quest'altitudine le zecche sono rare.`,
    inRiskArea:
      "Questo luogo si trova in una zona che l'UFSP classifica come area a rischio TBE. Se stai molto all'aperto, parla della vaccinazione con il tuo medico di famiglia.",
    outsideRiskArea: (region: string) =>
      `Il Cantone ${region} non rientra nelle aree a rischio TBE dell'UFSP. Le zecche ci sono lo stesso – la borreliosi si trasmette a prescindere da questa classificazione.`,
    outsideSwitzerland:
      "Fuori dalla Svizzera CampMesser non fornisce una classificazione TBE. Informati sul tuo paese di destinazione prima di partire.",
    switzerlandGeneral:
      "In Svizzera tutto il paese è considerato area a rischio TBE – tranne i Cantoni Ginevra e Ticino.",
    tipsTitle: "Come prevenire",
    tips: [
      "Resta sui sentieri ed evita erba alta, sottobosco e margini del bosco.",
      "Pantaloni lunghi, scarpe chiuse, calze sopra i pantaloni – vestiti chiari, così vedi prima la zecca.",
      "Applica un repellente su pelle e vestiti e rinnovalo dopo qualche ora.",
      "La sera controlla tutto il corpo; nei bambini soprattutto attaccatura dei capelli, orecchie, ascelle, inguine e cavo del ginocchio.",
      "Rimuovi la zecca il prima possibile e annota il punto nel promemoria punture di zecca.",
    ],
    sourceNote:
      "Classificazione: UFSP, stato febbraio 2019. Attività stimata a grandi linee secondo mese e altitudine – un orientamento, non un parere medico.",
  },

  /** Info balneazione nel dossier della piazzola (#223). */
  bathingWater: {
    title: "Acqua e balneazione",
    stationLine: (waterBody: string, station: string, distance: string) =>
      `${waterBody} · stazione di misura ${station}, a ${distance}`,
    marineLine: "Temperatura dell'acqua di mare alla tua piazzola",
    noTemperature:
      "Questa stazione non misura la temperatura dell'acqua – ci sono solo livello e portata.",
    comfort: {
      cold: "fredda",
      brisk: "fresca",
      pleasant: "piacevole",
      warm: "calda",
    },
    trend: {
      rising: "in aumento",
      steady: "stabile",
      falling: "in calo",
    },
    flowLabel: "Portata",
    flowValue: (value: string) => `${value} m³/s`,
    levelLabel: "Livello",
    levelValue: (value: string) => `${value} m s.l.m.`,
    measuredAt: (when: string) => `Misurato il ${when}`,
    sourceStation:
      "Fonte: dati idrologici aperti dell'UFAM tramite api.existenz.ch",
    sourceMarine: "Fonte: Open-Meteo Marine",
    safetyNote:
      "Sono i valori della stazione più vicina, non del tuo punto di balneazione. Non dicono nulla su corrente, qualità dell'acqua e regole di balneazione – guarda la segnaletica sul posto.",
  },

  /** Passaggi della ISS nella parte astro (#222). */
  iss: {
    sectionAria: "Passaggi visibili della stazione spaziale ISS",
    title: "Passaggi della ISS",
    subtitle:
      "I prossimi passaggi visibili della stazione spaziale dalla tua posizione.",
    subtitleAtPlace: (place: string) =>
      `I prossimi passaggi visibili della stazione spaziale vicino a ${place}.`,
    loading: "Calcolo dei passaggi …",
    noLocation:
      "Per i passaggi CampMesser ha bisogno della tua posizione – autorizza la localizzazione o salva una piazzola.",
    loadFailed:
      "Al momento non è stato possibile caricare i passaggi. Riprova più tardi.",
    noneVisible:
      "Nei prossimi quattro giorni da qui non è visibile nessun passaggio. Cambia ogni poche settimane – ripassa più tardi.",
    duration: (minutes: number) =>
      minutes === 1 ? "1 minuto" : `${minutes} minuti`,
    path: (path: string) => `Percorso nel cielo: ${path}`,
    maxElevation: (degrees: number) => `fino a ${degrees}° sopra l'orizzonte`,
    brightness: (magnitude: string) => `Luminosità ca. ${magnitude} mag`,
    footnote:
      "La ISS è visibile solo al crepuscolo e nella prima metà della notte: a terra deve essere buio mentre il sole illumina ancora la stazione. Attraversa il cielo come un punto luminoso e regolare – senza lampeggiare. Orari e luminosità sono valori approssimativi, esci qualche minuto prima.",
  },

  /** Trova-costellazioni: alza il telefono verso il cielo (#225). */
  skyFinder: {
    sectionAria: "Trova-costellazioni con bussola e inclinazione",
    title: "Trova-costellazioni",
    subtitle:
      "Alza il telefono verso il cielo – CampMesser ti dice cosa si trova in quella direzione.",
    subtitleAtPlace: (place: string) =>
      `Alza il telefono verso il cielo – ecco com'è il cielo a ${place}.`,
    locating: "Rilevamento della posizione …",
    noLocation:
      "Per il trova-costellazioni CampMesser ha bisogno della tua posizione – autorizza la localizzazione o salva una piazzola.",
    viewTitle: "Nella tua direzione",
    viewDirection: (direction: string, degrees: number) =>
      `${direction}, ${degrees}° sopra l'orizzonte`,
    viewNothing:
      "In questa direzione al momento non c'è nulla del repertorio. Muovi lentamente il telefono più in là.",
    viewGround:
      "Stai puntando sotto l'orizzonte – alza ancora il telefono verso il cielo.",
    separation: (degrees: number) => `a circa ${degrees}° dal centro`,
    lexiconLink: "Leggi nel lessico",
    compassStart: "Avvia la bussola",
    compassHint:
      "Per la direzione dello sguardo CampMesser ha bisogno della bussola del tuo dispositivo – tocca «Avvia la bussola» e concedi l'accesso.",
    compassDenied:
      "Senza accesso alla bussola non è possibile determinare la direzione dello sguardo. Puoi riprovare – l'elenco qui sotto resta valido.",
    noCompass:
      "Il tuo dispositivo non ha una bussola. L'elenco qui sotto ti dice comunque cosa c'è stanotte in cielo – con direzione e altezza sopra l'orizzonte.",
    daylightHint:
      "Al momento è ancora troppo chiaro per le stelle. L'elenco mostra com'è il cielo nella notte che arriva.",
    tonightTitle: (time: string) => `Visibile stanotte (alle ${time})`,
    tonightEmpty:
      "A quest'ora nulla del repertorio è abbastanza alto nel cielo.",
    position: (direction: string, degrees: number) =>
      `${direction} · ${degrees}° di altezza`,
    footnote:
      "Tutto è calcolato offline da luogo e ora; le indicazioni valgono per un orizzonte libero. Le bussole dei telefoni sono precise a 10-15 gradi – tieni il dispositivo piatto in mano, lontano da metallo e calamite.",
  },

  /** Sentieri escursionistici nelle vicinanze (#238). */
  nearbyHikes: {
    sectionAria: "Sentieri escursionistici segnalati nei dintorni",
    title: "Escursioni nei dintorni",
    subtitle: "Sentieri escursionistici segnalati attorno alla tua posizione.",
    subtitleAtPlace: (place: string) =>
      `Sentieri escursionistici segnalati attorno a ${place}.`,
    radiusLabel: "Raggio",
    radiusGroupAria: "Scegli il raggio di ricerca",
    radiusOption: (km: number) => `${km} km`,
    searchButton: "Cerca sentieri",
    searchAgain: "Cerca di nuovo",
    locating: "Posizione in corso di rilevamento …",
    loading: "Ricerca dei sentieri …",
    noLocation:
      "Per la ricerca CampMesser ha bisogno della tua posizione – abilita la localizzazione oppure apri la sezione nel dossier di una piazzola salvata.",
    loadFailed:
      "I sentieri non si sono potuti caricare. Overpass è un servizio gratuito che frena in caso di troppe richieste – riprova tra qualche minuto.",
    empty: (km: number) =>
      `Entro ${km} km in OpenStreetMap non è registrato nessun itinerario escursionistico segnalato. Prova con un raggio più grande.`,
    resultCount: (n: number) =>
      n === 1 ? "1 sentiero trovato" : `${n} sentieri trovati`,
    unnamed: "Itinerario senza nome",
    routeWithRef: (ref: string) => `Itinerario ${ref}`,
    distanceLabel: "In linea d'aria",
    lengthLabel: "Lunghezza",
    durationLabel: "Tempo di marcia",
    ascentLabel: "Salita",
    unknown: "–",
    network: {
      iwn: "Itinerario internazionale a lunga percorrenza",
      nwn: "Itinerario nazionale",
      rwn: "Itinerario regionale",
      lwn: "Itinerario locale",
    },
    showMap: "Mostra sulla carta",
    hideMap: "Chiudi la carta",
    mapAria: (name: string) => `Carta dell'itinerario ${name}`,
    mapFailed: "La carta non si è potuta caricare.",
    sectionLength: (value: string, km: number) =>
      `Entro ${km} km l'itinerario si estende per ${value} – la carta mostra solo questo tratto.`,
    navButton: "Naviga verso l'accesso",
    navAria: (name: string) =>
      `Navigazione verso il punto più vicino dell'itinerario ${name}`,
    websiteLink: "Sito web dell'itinerario",
    durationFlatOnly:
      "Senza dati altimetrici in OpenStreetMap – il tempo di marcia vale per terreno pianeggiante.",
    durationNote:
      "Tempo di marcia secondo la regola del CAS: 4 km/h in piano, più 400 metri di dislivello all'ora in salita e 800 in discesa; si conta la parte maggiore più la metà di quella minore. Le pause non sono comprese.",
    footnote:
      "Dati di OpenStreetMap tramite l'API Overpass – interrogata solo su tuo clic. Lunghezza, dislivello e difficoltà compaiono solo dove sono curati in OSM, altrimenti «–». La segnaletica sul terreno e lo stato del sentiero possono differire: porta con te carta e bollettino meteo.",
  },

  /** Focolari e griglie da OpenStreetMap (#247). */
  tentWind: {
    sectionAria: "Orientare tenda o telo secondo il vento",
    title: "Orientamento al vento",
    subtitle:
      "Come mettere tenda o telo perché il vento non prema contro la parete.",
    refreshAria: "Ricarica i valori del vento",
    shapeGroupAria: "Scegli il tipo",
    shape: {
      tunnel: "Tenda a tunnel o canadese",
      dome: "Tenda a igloo",
      tarp: "Telo",
    },
    shapeHint: {
      tunnel:
        "Il lato stretto verso il vento – così scorre lungo il lato lungo.",
      dome: "L'ingresso al riparo dal vento, altrimenti la tenda si gonfia all'apertura.",
      tarp: "Il bordo basso verso il vento, il lato aperto dalla parte opposta.",
    },
    loading: "Caricamento dei valori del vento …",
    loadFailed:
      "I valori del vento non erano disponibili. Riprova tra un istante.",
    roseAria: (from: string, point: string) =>
      `Vento da ${from}, orienta la punta verso ${point}`,
    windFromLabel: "Vento da",
    speedLabel: "Intensità",
    speedValue: (speed: number, gust: number) =>
      `${speed} km/h, raffiche ${gust} km/h`,
    pointLabel: "Punta verso",
    levelHint: {
      calm: "Poco vento – l'orientamento è una rifinitura.",
      breezy:
        "Vento percepibile: tira bene i tiranti e pianta a fondo i picchetti.",
      windy:
        "Raffiche forti: tutti i tiranti in tensione, fissa ciò che è sciolto, ritira la veranda.",
      storm:
        "Raffiche di tempesta: se puoi, cerca una piazzola riparata. Una tenda raramente regge.",
    },
    startCompass: "Avvia la bussola",
    noCompass:
      "Senza bussola questo dispositivo mostra solo la direzione – il consiglio vale comunque.",
    compassDenied:
      "L'accesso alla bussola è negato. Il consiglio per direzione resta valido.",
    alignedNow: "Va bene – la tenda è messa giusta rispetto al vento.",
    turnLeft: (deg: number) => `Ruota ancora di ${deg}° a sinistra.`,
    turnRight: (deg: number) => `Ruota ancora di ${deg}° a destra.`,
    source: "Valori del vento da Open-Meteo, regole pratiche di montaggio.",
  },
  briefing: {
    title: "Briefing del mattino",
    sectionAria: "Briefing del mattino per il soggiorno in corso",
    astroLine: (phase: string, percent: number) =>
      `${phase} – la luna è illuminata al ${percent} %.`,
    moreTasks: (count: number) =>
      count === 1 ? "e 1 altro compito" : `e altri ${count} compiti`,
    openToday: "Vai alla vista Oggi",
  },
  guestbook: {
    title: "Libro degli ospiti",
    toggleAria: (trip: string) => `Aprire il libro degli ospiti di ${trip}`,
    hint: "Saluti e ricordi del viaggio – dai compagni di viaggio e da tutti quelli che hanno il link condiviso.",
    empty: "Ancora nessun messaggio. Scrivi il primo saluto.",
    count: (total: number) =>
      total === 1 ? "1 messaggio" : `${total} messaggi`,
    messagePlaceholder: "Il tuo saluto …",
    messageAria: "Messaggio del libro degli ospiti",
    messageRequired: "Senza testo niente messaggio.",
    addButton: "Pubblicare",
    added: "Messaggio salvato",
    addFailed: "Impossibile salvare il messaggio",
    removed: "Messaggio eliminato",
    removeFailed: "Impossibile eliminare il messaggio",
    removeAria: (author: string) => `Eliminare il messaggio di ${author}`,
    guestFallback: "Ospite",
    viaLink: "tramite il link condiviso",
    noPhoto: "Senza immagine",
    photoOption: (index: number) => `Foto ${index}`,
    photoSelectAria: "Allegare una foto dalla galleria del viaggio",
    photoAlt: (author: string) => `Foto del messaggio di ${author}`,
    photoGone: "La foto allegata è stata eliminata.",
    nameLabel: "Il tuo nome",
    namePlaceholder: "p. es. nonna Vreni",
    guestHint:
      "Non sei registrato – il tuo messaggio comparirà come ospite. Qui non puoi allegare un'immagine.",
    guestAdded: "Grazie per il tuo saluto!",
  },
  datePoll: {
    title: "Trova-data",
    toggleAria: (trip: string) => `Aprire il trova-data per ${trip}`,
    hint: "Proponi periodi e rispondete per ciascuno con Sì, Forse o No. Vince il periodo senza rifiuti – anche con meno Sì.",
    empty:
      "Ancora nessuna proposta. Inserisci un periodo, poi tutti possono rispondere.",
    startLabel: "Arrivo",
    endLabel: "Partenza",
    notePlaceholder: "Nota, p. es. «ponte»",
    noteAria: "Nota sulla proposta",
    addButton: "Proporre",
    added: "Proposta aggiunta",
    addFailed: "Impossibile salvare la proposta",
    rangeInvalid: "La partenza deve essere dopo l'arrivo.",
    removed: "Proposta eliminata",
    removeFailed: "Impossibile eliminare la proposta",
    removeAria: (range: string) => `Eliminare la proposta ${range}`,
    voteFailed: "Impossibile salvare la risposta",
    voteGroupAria: "La tua risposta per questo periodo",
    voteLabel: { yes: "Sì", maybe: "Forse", no: "No" },
    nights: (count: number) => (count === 1 ? "1 notte" : `${count} notti`),
    unanimous: "Tutti d'accordo",
    leadingAria: "Attualmente in testa",
    missing: (names: string) => `Manca ancora: ${names}`,
    progress: (answered: number, expected: number) =>
      `${answered} risposte su ${expected}`,
    decided: (range: string) =>
      `Hanno risposto tutti – ${range} è in testa e sarebbe la data.`,
    applyButton: "Adottare come data del viaggio",
    applied: "Data del viaggio adottata",
    applyFailed: "Impossibile adottare la data",
    currentDate: "Data attuale del viaggio",
    maxReached: (max: number) =>
      `Oltre ${max} proposte non risponde più nessuno – eliminane una per fare spazio.`,
  },
  boxes: {
    saveImageButton: "Salvare come immagine",
    saveImageDone: "Etichetta salvata come immagine",
    saveImageFailed: "Impossibile creare l'immagine",
    printFallbackHint:
      "Su iPhone un'app installata non stampa direttamente – scegli «Salvare come immagine» e stampa o condividi da Foto.",
    title: "Casse",
    subtitle:
      "Quale attrezzatura sta in quale cassa – con etichetta e codice QR da stampare.",
    loginFeature: "la gestione delle casse",
    addBox: "Nuova cassa",
    editBox: "Modifica la cassa",
    dialogHint:
      "La sigla compare grande sull'etichetta e nel codice QR. Tienila corta – «K3» si legge da due metri.",
    codeLabel: "Sigla",
    nameLabel: "Nome",
    namePlaceholder: "p. es. Cucina",
    locationLabel: "Dove sta a casa",
    locationPlaceholder: "p. es. cantina, scaffale a sinistra",
    notesLabel: "Note",
    saved: "Cassa salvata",
    removed: "Cassa eliminata – l'attrezzatura resta",
    removeConfirm: (name: string) =>
      `Eliminare davvero la cassa «${name}»? L'attrezzatura al suo interno resta e non sarà più assegnata a nessuna cassa.`,
    empty:
      "Nessuna cassa finora. Creane una, stampa l'etichetta e attaccala sulla scatola.",
    boxEmpty: "Questa cassa è ancora vuota.",
    summary: (count: number, weight: string) =>
      count === 1 ? `1 pezzo · ${weight}` : `${count} pezzi · ${weight}`,
    removeFromBox: "Togli",
    looseTitle: "In nessuna cassa",
    looseHint: "Attrezzatura del tuo inventario non assegnata a nessuna cassa.",
    assignPlaceholder: "Metti nella cassa …",
    assignAria: (name: string) => `Assegna ${name} a una cassa`,
    labelButton: "Etichetta",
    labelTitle: "Stampa l'etichetta",
    labelHint:
      "Quattro etichette uguali per foglio – attaccale e una scansione mostrerà il contenuto.",
    printButton: "Stampa",
    qrAlt: (code: string) => `Codice QR della cassa ${code}`,
    unknownCode: (code: string) =>
      `Nessuna cassa corrisponde alla sigla «${code}». Forse è stata eliminata o appartiene a un altro account.`,
  },
  picnicStops: {
    sectionAria: "Soste lungo il tragitto",
    title: "Sosta lungo la strada",
    subtitle: "Aree picnic e tavoli sulla strada verso la piazzola.",
    subtitleAtPlace: (place: string) =>
      `Aree picnic e tavoli sulla strada verso ${place}.`,
    startLabel: "Partenza",
    startGroupAria: "Scegli il punto di partenza",
    startHome: "Casa",
    startCurrent: "Posizione attuale",
    radiusLabel: "Corridoio",
    radiusGroupAria: "Scegli la larghezza del corridoio",
    radiusOption: (km: number) => `${km} km`,
    searchButton: "Cerca una sosta",
    lineHint:
      "La ricerca segue il percorso stradale calcolato; i riferimenti chilometrici contano dalla partenza, lungo la strada.",
    lineHintEstimate:
      "Senza rete niente calcolo del percorso: la ricerca segue la linea d'aria – in montagna il percorso reale può discostarsi parecchio.",
    locating: "Rilevamento della posizione …",
    loading: "Ricerca delle aree di sosta …",
    noHome:
      "Serve un indirizzo di casa nel profilo – oppure scegli «Posizione attuale».",
    noPosition:
      "Non è stato possibile rilevare la tua posizione. Consenti l'accesso oppure scegli casa come partenza.",
    loadFailed:
      "Le aree di sosta non si sono caricate. Overpass è un servizio gratuito che limita le richieste – riprova tra qualche minuto.",
    empty: (km: number) =>
      `In un corridoio di ${km} km lungo il tragitto non risulta nessuna area in OpenStreetMap. Prova con un corridoio più largo.`,
    resultCount: (n: number, km: number) =>
      n === 1 ? `1 area su ${km} km` : `${n} aree su ${km} km`,
    kmMark: (along: number, total: number) => `km ${along} di ${total}`,
    offsetHint: (value: string) => `${value} a lato del tragitto`,
    kind: {
      site: "Area picnic",
      table: "Tavolo da picnic",
    },
    kindHint: {
      site: "area attrezzata",
      table: "tavolo singolo lungo la via",
    },
    covered: "coperto",
    fireplace: "focolare",
    drinkingWater: "acqua potabile",
    navButton: "Naviga",
    navAria: (name: string) => `Navigazione verso ${name}`,
    source: "Dati da OpenStreetMap, curati da volontari.",
  },
  firepits: {
    sectionAria: "Focolari e griglie ufficiali nei dintorni",
    title: "Focolari nei dintorni",
    subtitle: "Focolari e griglie ufficiali attorno alla tua posizione.",
    subtitleAtPlace: (place: string) =>
      `Focolari e griglie ufficiali attorno a ${place}.`,
    radiusLabel: "Raggio",
    radiusGroupAria: "Scegliere il raggio di ricerca",
    radiusOption: (km: number) => `${km} km`,
    loading: "Ricerca dei focolari …",
    loadFailed:
      "Al momento non è stato possibile caricare i focolari. Overpass è un servizio gratuito che rallenta con troppe richieste – riprova tra qualche minuto.",
    empty: (km: number) =>
      `Nel raggio di ${km} km non è registrato in OpenStreetMap nessun focolare o griglia. Prova con un raggio più grande.`,
    resultCount: (n: number) =>
      n === 1 ? "1 posto trovato" : `${n} posti trovati`,
    kind: {
      firepit: "Focolare",
      bbq: "Griglia",
    },
    kindHint: {
      firepit: "focolare aperto",
      bbq: "griglia fissa",
    },
    covered: "coperto",
    firewood: "legna sul posto",
    drinkingWater: "acqua potabile",
    distanceAway: (value: string) => `a ${value}`,
    navButton: "Vai lì",
    navAria: (name: string) => `Navigazione verso ${name}`,
    fireDangerLink: "Vedere il pericolo di incendi boschivi e i divieti",
    fireDangerShort: "Controlla il pericolo di incendi",
    source:
      "Dati da OpenStreetMap tramite l'API Overpass – interrogata solo al tuo clic. Le caratteristiche compaiono solo dove sono curate in OSM.",
  },

  /** Parchi giochi e punti balneabili da OpenStreetMap (#248). */
  routeWeather: {
    sectionAria: "Maltempo sul percorso",
    title: "Meteo e traffico lungo il tragitto",
    subtitle: "Che cosa ti aspetta per strada – non solo all'arrivo.",
    subtitleAtPlace: (place: string) =>
      `Che cosa ti aspetta sulla strada per ${place} – non solo all'arrivo.`,
    /** Hin- oder Rückfahrt (#368) */
    directionGroupAria: "Scegli andata o ritorno",
    directionThere: "Andata",
    directionBack: "Ritorno",
    directionBackHint: "Ritorno a casa – partenza dalla piazzola.",
    startGroupAria: "Scegli il punto di partenza",
    startHome: "Da casa",
    startCurrent: "Dalla mia posizione",
    departureLabel: "Partenza",
    loading: "Recupero del meteo lungo il percorso …",
    loadFailed:
      "Non è stato possibile caricare il meteo lungo il percorso – riprova più tardi.",
    noStart:
      "Nessun punto di partenza: registra un domicilio nel profilo o consenti la posizione.",
    tooShort: (km: number) =>
      `Sotto i ${km} km il controllo del percorso non serve – basta l'allerta all'arrivo.`,
    summary: (distance: string, minutes: number, estimated: boolean) =>
      estimated
        ? `${distance} in linea d'aria, circa ${Math.floor(minutes / 60)} h ${minutes % 60} min di viaggio.`
        : `${distance} su strada, ${Math.floor(minutes / 60)} h ${minutes % 60} min di viaggio.`,
    allClear: "Su tutto il percorso, agli orari stimati, nulla di rilevante.",
    worstLine: {
      info: "Piccolezze lungo la strada – nulla che riguardi la guida.",
      warnung:
        "Lungo la strada è previsto brutto tempo. Sposta la partenza o prevedi una sosta.",
      gefahr:
        "Sul percorso minaccia maltempo. Se puoi parti più tardi – sotto il temporale con rimorchio o caravan non ci guadagna nessuno.",
    },
    risk: {
      gewitter: "Temporale",
      sturm: "Raffiche di tempesta",
      regen: "Pioggia intensa",
      schnee: "Neve",
    },
    traffic: {
      normal: "Scorrevole",
      slow: "Rallentato",
      jam: "Coda",
    },
    allClearButJam: (count: number) =>
      count === 1
        ? "Meteo tranquillo – ma in un punto il traffico è fermo."
        : `Meteo tranquillo – ma in ${count} punti il traffico è fermo.`,
    riskNone: "Tranquillo",
    kmMark: (km: number) => `km ${km}`,
    gusts: (kmh: number) => `${kmh} km/h`,
    methodNote:
      "Vengono controllati fino a otto punti lungo il percorso stradale calcolato, ciascuno per l'orario di arrivo in quel punto. Distanza e durata provengono dal calcolo del percorso (OpenStreetMap); code e cantieri si aggiungono.",
    methodNoteEstimate: (speed: number) =>
      `Senza rete niente calcolo del percorso: si controllano otto punti lungo la linea d'aria con ${speed} km/h – una stima approssimativa che in montagna può sbagliare di molto.`,
    methodNoteTraffic:
      "Distanza e tempo di percorrenza vengono dal calcolo del percorso di Google – con la previsione del traffico per il tuo orario di partenza. I punti di controllo restano sul percorso di OpenStreetMap. Poiché il traffico sposta l'orario di arrivo a ogni punto, sposta anche quale ora di previsione conta.",
    source: "Dati: Open-Meteo",
  },
  packHistory: {
    sectionAria: "Suggerimenti dai viaggi passati",
    title: "Portato l'ultima volta",
    subtitle: (trips: number) =>
      trips === 1
        ? "Dal tuo ultimo soggiorno in questo posto – non ancora in questa lista."
        : `Dai tuoi ultimi ${trips} soggiorni in questo posto – non ancora in questa lista.`,
    everyTime: "ogni volta",
    tripCount: (n: number, of: number) => `${n} su ${of}`,
    addAria: (name: string) => `Aggiungi ${name} alla lista`,
    addAll: (n: number) => `Aggiungi tutti (${n})`,
    note: "Vengono proposte solo cose che c'erano davvero nelle liste precedenti di questo posto – non una lista standard, ma la tua esperienza.",
  },
  spotRating: {
    sectionAria: "La tua valutazione di questa piazzola",
    title: "La tua valutazione",
    subtitle:
      "Quattro criteri separati – così la prossima volta sai perché il posto ti era piaciuto.",
    overall: (value: string, rated: number, total: number) =>
      `media ${value} (${rated} su ${total} valutati)`,
    notRated: "Non ancora valutato – toccando di nuovo si annulla.",
    starAria: (stars: number, criterion: string) =>
      `${criterion}: ${stars} stelle su 5`,
    saveFailed: "Non è stato possibile salvare la valutazione.",
    note: "Un criterio può restare vuoto. Chi sotto la pioggia non è mai stato fuori non può giudicare l'ombra – un tre inventato vale meno di un vuoto onesto.",
    compareTitle: "Confronta per criterio",
    compareAll: "Totale",
    unrated: "–",
  },
  spotCompare: {
    title: "Confronta due piazzole",
    hint: "L'aiuto alla decisione prima di prenotare – prezzo, distanza, altitudine, caratteristiche e la tua valutazione fianco a fianco. Il confronto dei costi di tutte le piazzole è nelle statistiche.",
    spotA: "Piazzola A",
    spotB: "Piazzola B",
    choose: "Scegli …",
    pickBoth:
      "Scegli una piazzola a sinistra e una a destra: apparirà il confronto.",
    rowHeader: "Criterio",
    price: "Prezzo a notte",
    distance: "Distanza da casa",
    elevation: "Altitudine",
    rating: "La tua valutazione",
    ratingValue: (value: string, rated: number) =>
      rated === 1 ? `${value} ★ (1 criterio)` : `${value} ★ (${rated} criteri)`,
    none: "–",
  },
  sharedTrack: {
    loading: "Caricamento dell'escursione …",
    notFoundTitle: "Escursione non trovata",
    invalidLink:
      "Questo link non è valido o è scaduto. Chiedine uno nuovo a chi te l'ha mandato.",
    backHome: "Alla pagina iniziale",
    distance: "Distanza",
    duration: "Durata",
    ascent: "Salita",
    descent: "Discesa",
    download: "Scarica in GPX",
    note: "Vista condivisa – mappa e profilo provengono dalla registrazione. La serie di punti è stata alleggerita per la panoramica.",
  },
  parking: {
    title: "Auto",
    targetName: "Auto",
    empty: "Nessuna posizione memorizzata. Basta un tocco scendendo.",
    park: "Parcheggiata qui",
    reparked: "Parcheggiata altrove",
    parkedToast: "Posizione dell'auto memorizzata.",
    parkedSince: (time: string, duration: string) =>
      `Qui dalle ${time} – ${duration}.`,
    durationHours: (h: number, m: number) => `${h} h ${m} min`,
    durationMinutes: (m: number) => `${m} min`,
    limit: "Tempo di sosta:",
    limitNone: "senza",
    limitLabel: (minutes: number) =>
      minutes < 60 ? `${minutes} min` : `${minutes / 60} h`,
    remaining: (duration: string) => `Ancora ${duration} di sosta.`,
    expired: "Tempo di sosta scaduto.",
    noteLabel: "Nota sulla posizione",
    notePlaceholder: "p. es. livello 3, fila C",
    navigate: "Torna all'auto",
    forgetAria: "Elimina la posizione dell'auto",
    forgotten: "Posizione dell'auto eliminata.",
  },
  tripTemplates: {
    button: "Da modello",
    title: "Viaggio da modello",
    description:
      "Durata, lista bagagli e menu in un passo solo. Dopo si può cambiare tutto.",
    nights: (n: number) => (n === 1 ? "1 notte" : `${n} notti`),
    startLabel: "Arrivo",
    endLine: (end: string) => `Partenza: ${end}`,
    spotLabel: "Piazzola",
    spotFree: "Inserire il luogo liberamente",
    locationLabel: "Luogo",
    locationPlaceholder: "p. es. Camping Waldheim",
    placeMissing: "Scegli una piazzola o inserisci un luogo.",
    withPackList: "Creare la lista bagagli",
    withMenu: "Precompilare il menu",
    menuNote:
      "Vengono precompilate le cene di ogni notte e la colazione dal secondo giorno. I pranzi restano liberi – in viaggio a mezzogiorno si mangia quello che capita.",
    create: "Crea il viaggio",
    created: (end: string, meals: number, list: boolean) =>
      `Viaggio creato fino al ${end}${list ? ", lista bagagli creata" : ""}${
        meals > 0 ? `, ${meals} pasti inseriti` : ""
      }.`,
    createFailed: "Il viaggio non è stato creato.",
  },
  departure: {
    title: "Orario di partenza migliore",
    intro: "Quando partire per arrivare all'ora del check-in – pause incluse.",
    openButton: "Calcola la partenza",
    loginNote: "Per questo devi essere connesso.",
    noHome: "Per il calcolo manca il tuo domicilio.",
    noHomeLink: "Impostalo nel profilo",
    arrivalLabel: "Arrivo / check-in",
    directionAria: "Scegli la direzione",
    directionOut: "Andata",
    directionBack: "Ritorno",
    homeArrivalLabel: "Essere a casa alle",
    checkoutLabel: "Check-out in piazzola",
    departureAtCheckout: "Partenza – più tardi non si può",
    checkoutNote: (checkout: string, arrival: string, daysLater: number) =>
      `Il campeggio rivuole la piazzola alle ${checkout}. Se parti allora, sei a casa alle ${arrival}${
        daysLater > 0 ? " il giorno dopo" : ""
      } – prima del previsto.`,
    profileLabel: "Chi viaggia?",
    profiles: {
      keine: "Senza pause",
      erwachsene: "Adulti (ogni 3 h)",
      kinder: "Con bambini (ogni 2 h)",
      kleinkinder: "Con bimbi piccoli (ogni 1,5 h)",
    },
    departureLabel: "Partenza",
    departureDayBefore: (days: number) =>
      days === 1
        ? "Partenza – il giorno prima"
        : `Partenza – ${days} giorni prima`,
    driveLine: (distance: string, estimated: boolean) =>
      estimated
        ? `Viaggio (${distance} in linea d'aria, stimato)`
        : `Viaggio (${distance} su strada)`,
    breaksLine: (count: number, each: number) =>
      count === 0
        ? "Nessuna pausa necessaria"
        : count === 1
          ? `1 pausa di ${each} min`
          : `${count} pause di ${each} min`,
    bufferLine: "Margine per sbarra e registrazione",
    totalLine: "Totale in viaggio",
    stopsLine: (times: string) => `Pause verso le ${times}.`,
    routing: "Calcolo del percorso …",
    note: "Distanza e durata provengono dal calcolo del percorso su strada (OpenStreetMap). Code, cantieri e attese al confine si aggiungono.",
    noteEstimate:
      "Senza rete niente calcolo del percorso: questi valori sono stimati in linea d'aria (con fattore di deviazione) e possono essere molto lontani dal vero – soprattutto in montagna.",
    noteTraffic:
      "Distanza e tempo di percorrenza vengono dal calcolo del percorso di Google – con la previsione del traffico per quest'ora del giorno. Cantieri e attese alla frontiera si aggiungono ancora.",
  },
  officialWarnings: {
    sectionAria: "Allerte meteo ufficiali",
    badge: "Ufficiale",
    issuedFor: (issuer: string, area: string) =>
      `${issuer} segnala un'allerta per ${area}.`,
    until: (time: string) => `Valida fino alle ${time}`,
    source: (issuer: string, source: string) =>
      `Allerte ufficiali: ${issuer}, tramite ${source}.`,
  },
  passport: {
    title: "Passaporto di viaggio",
    intro:
      "Un timbro per ogni campeggio visitato. I timbri vengono dai tuoi viaggi – ciò che è registrato è registrato.",
    noRank: "Ancora nessun timbro",
    summary: (places: number, nights: number) =>
      `${places === 1 ? "1 campeggio" : `${places} campeggi`} · ${nights === 1 ? "1 notte" : `${nights} notti`}`,
    toNext: (missing: number, title: string) =>
      missing === 1
        ? `Ancora 1 campeggio fino a «${title}»`
        : `Ancora ${missing} campeggi fino a «${title}»`,
    nights: (count: number) => (count === 1 ? "1 notte" : `${count} notti`),
    stampAria: (place: string, visits: number) =>
      `Timbro ${place}, visitato ${visits} volte`,
    empty:
      "Ancora nessun timbro. Registra un viaggio col nome del campeggio – comparirà qui.",
    family: "Famiglia",
    personLabel: "Passaporto di",
    personGroupAria: "Scegli la persona",
    addPerson: "Aggiungi persona",
    addPersonPlaceholder: "Nome",
    addPersonSave: "Crea",
    addPersonHint:
      "Sono le stesse persone della modalità famiglia – chi è già registrato lì compare anche qui.",
    whoWasThere: "Chi c'era?",
    whoWasThereHint:
      "Senza modifiche ogni viaggio vale per tutti. Togli il segno dove qualcuno non c'era – per esempio prima che un bambino nascesse.",
    tripUnnamed: "Senza nome del luogo",
    presenceAria: (place: string, person: string) =>
      `${person} era presente a «${place}»`,
    noTrips: "Nessun viaggio registrato finora.",
    personEmpty: (person: string) =>
      `${person} non ha ancora partecipato a nessun viaggio. Metti i segni qui sotto.`,
    noPlaceEmpty:
      "I viaggi contano, ma manca il nome del posto – un timbro ha bisogno di un luogo. Aggiungi un campeggio o un luogo al viaggio e il timbro apparirà.",
    tripNoStamp: "Nessun timbro – al viaggio manca il campeggio o il luogo.",
    print: "Stampa il passaporto",
    note: "I timbri nascono dai viaggi del diario; nulla viene registrato due volte. Ogni campeggio riceve dal proprio nome la stessa forma, lo stesso colore e la stessa inclinazione – uguali su ogni dispositivo.",
  },
  drill: {
    title: "Esercitazione d'emergenza",
    intro:
      "Nel momento vero viene in mente ciò che si è già fatto – non ciò che si è sentito una volta.",
    ageLabel: "Età del bambino",
    ageYears: (years: number) => `${years} anni`,
    stepsTitle: "Ecco come si fa, nell'ordine",
    mistakesTitle: "Questo no",
    practiceTitle: "Come esercitarsi in piazzola",
    questionTitle: "Domanda di controllo",
    right: "Giusto.",
    wrong: "Non proprio.",
    markDone: "Esercitato",
    answerFirst: "Rispondi prima correttamente alla domanda.",
    lastPracticed: (date: string) => `ultima volta il ${date}`,
    neverPracticed: "mai esercitato",
    openCount: (count: number) =>
      count === 1
        ? "1 esercitazione da rifare"
        : `${count} esercitazioni da rifare`,
    allDone: "Tutto esercitato – di nuovo fra sei mesi.",
    note: "Viene salvata solo la data di ogni esercitazione, su questo dispositivo. Nessun nome, nessun numero: ciò che un bambino deve sapere a memoria si esercita con lui, invece di depositarlo in un'app. Dopo sei mesi un'esercitazione va rifatta – i bambini crescono e il campeggio sarà un altro.",
  },
  quickBar: {
    title: "Barra di accesso rapido",
    intro: "I quattro posti al centro della barra in basso li scegli tu.",
    slotAria: (slot: number) => `Modulo per il posto ${slot}`,
    fixed:
      "«Home» e «SOS» restano ai bordi: la home è la via di ritorno a tutto il resto, e il tasto SOS lo si cerca proprio quando non si riesce a pensare.",
    reset: "Ripristina l'impostazione predefinita",
  },
  today: {
    title: "Oggi",
    noTrip:
      "Al momento non c'è nessun viaggio in corso. Appena ne inizia uno, qui c'è la tua giornata.",
    toModules: "Tutti i moduli",
    dayOf: (day: number, total: number) => `Giorno ${day} di ${total}`,
    nightsLeft: (nights: number) =>
      nights === 1 ? "ancora 1 notte" : `ancora ${nights} notti`,
    departureToday: "Oggi si parte",
    weather: "Meteo",
    menu: "Menu",
    shopping: "Lista della spesa",
    mealsTitle: "Oggi nel piatto",
    mealsEmpty: "Per oggi non c'è nulla di previsto.",
    mealsLink: "Apri il menu",
    mealUnknown: "Previsto",
    tasksTitle: "Ancora da fare",
    tasksEmpty: "Niente in sospeso. Goditi la giornata.",
    tasksLink: "Vai alla bacheca",
    weatherLine: (min: number, max: number, label: string) =>
      label ? `${min}–${max} °C · ${label}` : `${min}–${max} °C`,
    choresTitle: "Turni di oggi",
    choresEmpty: "Per oggi non è assegnato nulla.",
    choresToggleAria: (title: string) => `Spunta ${title}`,
    choresAll: "Tutti i turni",
    expiryTitle: "In scadenza",
    expiryLink: "Vai al frigo",
    journal: "Scrivi nel diario",
    startSetting: "Durante un viaggio parti da «Oggi»",
    note: "Il salto avviene una volta all'apertura dell'app – se poi tocchi «Home» ottieni i riquadri, senza essere rispedito qui.",
  },
  tripHistory: {
    title: "Cronologia delle modifiche",
    toggleAria: (trip: string) => `Mostra la cronologia di ${trip}`,
    count: (count: number) => (count === 1 ? "1 voce" : `${count} voci`),
    empty: "Qui non è ancora successo nulla.",
    someone: "Qualcuno",
    line: (who: string, area: string, action: string, count: number) =>
      count > 1
        ? `${who} ha ${action} ${count}× qualcosa in «${area}»`
        : `${who} ha ${action} «${area}»`,
    andMore: (count: number) => `e altri ${count}`,
    note: "Si registra CHI ha cambiato COSA e QUANDO, in quale ambito – non il vecchio e il nuovo valore. Ciò che qualcuno fa in rapida successione sta su una riga con il numero: dodici voci sulla lista della spesa non devono seppellire tutto il resto.",
  },
  packExperience: {
    title: "Dai viaggi precedenti",
    missingHint: "Questo è già mancato una volta:",
    unusedHint: "Questo è partito più volte senza servire:",
    unusedCount: (times: number) => `${times}× non usato`,
    addAria: (name: string) => `Aggiungi «${name}» alla lista`,
    added: (name: string) => `«${name}» aggiunto.`,
  },
  sitePlan: {
    title: "Piantina del campeggio",
    empty:
      "Nessuna piantina ancora. Fotografa la piantina alla reception – la prossima volta saprai dove si trova tutto.",
    add: "Carica piantina",
    replace: "Sostituisci piantina",
    remove: "Rimuovi",
    uploading: "Caricamento …",
    uploaded: "Piantina salvata.",
    uploadFailed: "Caricamento non riuscito. Riprova.",
    readFailed: "Impossibile leggere l’immagine.",
    deleteConfirm: "Rimuovere davvero la piantina?",
    deleted: "Piantina rimossa.",
    alt: (name: string) => `Piantina del campeggio ${name}`,
    openAria: (name: string) =>
      `Mostra la piantina del campeggio ${name} ingrandita`,
  },
  legal: {
    imprintTitle: "Impressum",
    privacyTitle: "Dichiarazione sulla protezione dei dati",
    cookieText:
      "CampMesser usa solo cookie tecnicamente necessari e la memoria locale – nessun tracciamento, nessuna pubblicità. Dettagli:",
    cookieOk: "Capito",
    cookieAria: "Informazione sui cookie",
  },
  rewards: {
    title: "Obiettivi premio",
    hint: "Riscatta i punti dei compiti: stabilisci quanto costa un obiettivo – la barra mostra quanto manca.",
    availableLine: (name: string, points: number) =>
      `${name} ha ${points} punt${points === 1 ? "o" : "i"} da riscattare.`,
    empty:
      "Ancora nessun obiettivo. Crea il primo – per esempio «gelato al chiosco».",
    pointsLine: (points: number) => `${points} p.`,
    redeem: "Riscatta",
    redeemed: "Riscattato!",
    removeAria: (title: string) => `Elimina l’obiettivo «${title}»`,
    progressAria: (name: string, title: string, percent: number) =>
      `${name} è al ${percent} % di «${title}»`,
    titlePlaceholder: "es. gelato al chiosco",
    pointsPlaceholder: "Punti",
    addAria: "Aggiungi obiettivo",
    formError: "Indica un titolo e punti maggiori di zero.",
    historyTitle: "Riscattato",
    historyLine: (name: string, title: string, points: number, date: string) =>
      `${name}: «${title}» per ${points} p. il ${date}`,
    reachedToast: (name: string, title: string) =>
      `${name} ora ha abbastanza punti per «${title}»!`,
  },
  nextTime: {
    title: "La prossima volta",
    empty:
      "Ancora nessuna nota. Cosa deve andare diversamente alla prossima visita?",
    placeholder: "es. prolunga 25 m",
    add: "Annota",
    removeAria: (note: string) => `Elimina la nota «${note}»`,
    hint: "La nota riappare da sola quando pianifichi il prossimo viaggio verso questo campeggio. Ciò che è fatto, lo elimini.",
    reminderTitle: (place: string) =>
      `La prossima volta al ${place} – le tue note dell’ultima visita:`,
    reminderLink: "Al dossier del campeggio",
  },
  condensation: {
    title: "Rugiada nella notte",
    high: (time: string) =>
      `Notte serena e calma: verso le ${time} l’aria raggiunge il punto di rugiada – la tenda sarà probabilmente bagnata.`,
    possible: (time: string) =>
      `L’aria si avvicina al punto di rugiada (verso le ${time}) – è possibile rugiada sulla tenda.`,
    advice:
      "Prima di smontare al mattino, lascia asciugare – la finestra asciutta qui sotto aiuta a pianificare.",
    note: "Stima da temperatura, umidità, nuvole e vento. Avvallamenti, prati e vicinanza ai ruscelli sono più umidi di quanto sappia la previsione.",
  },
  spotPrint: {
    kicker: "Dossier del campeggio",
    docTitle: (name: string) => `Dossier: ${name}`,
    openButton: "Stampa il dossier",
    notFound: "Campeggio non trovato.",
    coords: (lat: string, lon: string) => `${lat}, ${lon}`,
    elevation: (m: number) => `${m} m s.l.m.`,
    contactTitle: "Contatto e arrivo",
    phoneLabel: "Reception",
    checkinLabel: "Check-in/-out",
    parcelLabel: "Piazzola",
    tariffsTitle: "Prezzi",
    basePrice: (amount: string) => `Prezzo base a notte: ${amount}`,
    attributesTitle: "Dotazioni",
    nextTimeTitle: "La prossima volta",
    noteTitle: "Note",
    planTitle: "Piantina del campeggio",
  },
  choresPrint: {
    kicker: "Modalità famiglia",
    title: "Piano settimanale dei compiti",
    docTitle: "Piano dei compiti",
    openButton: "Stampa il piano",
    choreColumn: "Compito",
    empty: "Nessun compito o persona registrata.",
    note: "L'assegnazione segue la stessa rotazione dell'app – prevedibile, senza caso. Si spunta su carta.",
  },
  winter: {
    title: "Gelo e neve",
    frostLine: (nights: string) => `Gelo in vista: ${nights}.`,
    frostAdvice:
      "Svuotare serbatoio, tubi e taniche o riporli al riparo dal gelo.",
    snowLine: (m: number) =>
      `Il limite delle nevicate scende verso i ${m} m s.l.m.`,
    note: "Dalla previsione per questo luogo – conche e avvallamenti sono spesso più freddi.",
  },
  weatherTurn: {
    title: "Domani il tempo cambia",
    windLine: (kmh: number) =>
      `Domani raffiche fino a ${kmh} km/h – nettamente più di oggi.`,
    rainLine: (mm: number) =>
      `Domani circa ${mm} mm di pioggia – nettamente più di oggi.`,
    coldLine: (drop: number) => `Domani circa ${drop} °C in meno di oggi.`,
    windAdvice:
      "Stasera tendere i tiranti, controllare i picchetti, riporre la veranda e tutto ciò che è sciolto.",
    rainAdvice:
      "Controllare tiranti e scoli, mettere al riparo ciò che teme l'acqua.",
    coldAdvice: "Preparare strati caldi e sacchi a pelo.",
    note: "Confronto tra le previsioni di oggi e domani – un cambiamento, non un'allerta maltempo.",
  },
  homecoming: {
    title: (trip: string) => `Di ritorno da «${trip}»?`,
    intro: "Tre gesti finché te lo ricordi:",
    stepTent: "Asciugare tenda e teloni",
    stepTentAria: "Spunta l'asciugatura della tenda",
    dryingDay: (day: string) => `Miglior tempo per asciugare a casa: ${day}.`,
    stepReview: "Compila il bilancio: cosa è mancato, cosa era di troppo?",
    stepNextTime: "Annota «la prossima volta» sul campeggio",
    notePlaceholder: "es. prolunga da 25 m",
    noteSave: "Annota",
    dismissAria: "Nascondi il promemoria di rientro per questo soggiorno",
  },
  campfire: {
    stateOk: "Fuoco da campo: nulla in contrario.",
    stateCaution: "Fuoco da campo: solo con prudenza.",
    stateNo: "Fuoco da campo: oggi meglio di no.",
    reasonBan: (title: string) =>
      `Livello ufficiale «${title}» – un divieto di fuoco è probabile.`,
    reasonDanger: (title: string) => `Livello ufficiale «${title}».`,
    reasonStrongWind: (kmh: number) =>
      `Raffiche fino a ${kmh} km/h – un fuoco aperto non è una buona idea.`,
    reasonSparkWind: (kmh: number) =>
      `Raffiche fino a ${kmh} km/h – le scintille volano nel secco accanto.`,
    reasonNoDanger:
      "Fuori dalla Svizzera non esiste un livello di pericolo ufficiale – questo giudizio conosce solo il vento.",
    note: "Il regolamento del campeggio ha l'ultima parola. Fa fede:",
    portal: "waldbrandgefahr.ch",
  },
  tripOffline: {
    title: "Preparare per il viaggio",
    intro:
      "Scarica tutto per questo soggiorno su questo dispositivo: piazzola, lista bagagli, menu con ricette e mappe attorno al campeggio.",
    start: "Prepara ora",
    again: "Scarica di nuovo",
    running: "In corso …",
    lastRun: (when: string) => `Dati al ${when}.`,
    autoNote:
      "Poco prima del viaggio l’app aggiorna da sola i dati all’apertura – le mappe restano come scaricate.",
    stepTrip: "Soggiorno, piazzola e compagni",
    stepPacking: "Lista bagagli",
    stepMenu: "Menu e ricette",
    stepMap: "Mappe attorno alla piazzola",
    stepFailed: "Non è riuscito – senza rete questa parte mancherà.",
    noList: "Nessuna lista bagagli collegata.",
    noSpot: "Nessuna piazzola collegata.",
    noTileCache: "Questo dispositivo non può salvare mappe.",
    tileProgress: (done: number, total: number) =>
      `${done} di ${total} tasselli`,
    tilesStored: (count: number) => `${count} tasselli salvati`,
    note: "Qui si dice la verità: un passo rosso mancherà davvero offline. E il browser decide da solo cosa buttare quando lo spazio scarseggia – prima di un lungo viaggio conviene un secondo giro.",
  },
  pitchCost: {
    title: "Stimare il costo della piazzola",
    hint: (nights: number) =>
      nights === 1
        ? "1 notte. Indica in quanti siete."
        : `${nights} notti. Indica in quanti siete.`,
    tariffGroupAria: "Scegli la tariffa",
    countAria: (label: string) => `Numero di ${label}`,
    nightlyOnly:
      "Per questa piazzola non ci sono tariffe – si calcola con il prezzo per notte.",
    breakdown: (perNight: string, nights: number) =>
      `${perNight} a notte × ${nights}`,
    sourceNightly: "dal prezzo per notte",
    nothingYet: "Ancora niente da calcolare: inserisci il numero.",
    oneOffPart: (amount: string) => `più una tantum ${amount}`,
    seasonPart: (name: string, nights: number, perNight: string) =>
      `${name}: ${nights} nott${nights === 1 ? "e" : "i"} × ${perNight}`,
    seasonSplitNote:
      "Il soggiorno copre più periodi tariffari – ogni notte è conteggiata alla tariffa valida quel giorno.",
    addToExpenses: "Nella cassa",
    foreignCurrency: (currency: string) =>
      `La cassa di viaggio è tenuta in CHF – inserisci a mano gli importi in ${currency}.`,
    added: "Costo della piazzola registrato.",
    expenseLabel: (nights: number) =>
      nights === 1 ? "Piazzola, 1 notte" : `Piazzola, ${nights} notti`,
    meFallback: "Io",
    note: "Una stima, non una fattura: alla reception tassa di soggiorno, cane e corrente si contano spesso in altro modo. Si registra solo ciò che premi tu.",
  },
  altitudeCooking: {
    headline: (m: number, boiling: number) =>
      `A ${m} m l'acqua bolle a ${boiling} °C.`,
    estimate: (base: number, adjusted: number) =>
      `Conta circa ${adjusted} minuti invece di ${base} – valore indicativo, non misurato.`,
    pressureCooker:
      "A questa quota la pentola a pressione conviene per tutto ciò che sobbolle a lungo.",
    source: (spot: string) => `Quota di ${spot}, il tuo soggiorno in corso.`,
    guide: "Vale per tutto ciò che cuoce in acqua – non per padella e forno.",
  },
  dryWindow: {
    title: "Finestra asciutta",
    lengthGroupAria: "Quanto tempo ti serve per montare o smontare?",
    hours: (count: number) => (count === 1 ? "1 ora" : `${count} ore`),
    tooShort: "Le previsioni non bastano ancora per questa finestra.",
    verdictGood: "Va bene: abbastanza asciutto e calmo per montare e smontare.",
    verdictUsable: "Si può – ma metti in conto un po' di umido o di vento.",
    verdictPoor:
      "Nessuna buona finestra. La migliore fra tante cattive resta cattiva.",
    rainLabel: "Pioggia nella finestra",
    rainNone: "nessuna pioggia prevista",
    rainAmount: (mm: number) => `${mm} mm`,
    gustsLabel: "Raffica più forte",
    gusts: (kmh: number) => `${kmh} km/h`,
    gustWarning:
      "Con raffiche così non si monta una tenda da soli – aspetta o cerca riparo dal vento.",
    note: "Si cerca la migliore finestra continua nelle prossime 48 ore; a parità vince la più precoce. Il vento conta sulle RAFFICHE, non sulla media – una tenda vola nella raffica.",
  },
  weekendPicker: {
    title: "Dove andare nel fine settimana?",
    show: "Confronta",
    range: (from: string, to: string) => `Sabato ${from} a domenica ${to}`,
    sortWeather: "Per meteo",
    sortTravel: "Per tempo di viaggio",
    dry: (score: number) => `asciutto ${score}`,
    warmth: (score: number) => `caldo ${score}`,
    wind: (score: number) => `calmo ${score}`,
    noForecast: "Nessuna previsione disponibile.",
    failed: "Il servizio meteo non risponde al momento.",
    capped: (shown: number, total: number) =>
      `Vengono confrontate le prime ${shown} piazzole su ${total}.`,
    note: "Il voto pesa la pioggia al 55 %, la temperatura al 30 % e il vento al 15 % – la pioggia decide se si parte. Il tempo di viaggio NON è incluso; sta accanto, perché solo tu sai quanto vale un'ora di strada. E tutto questo è una previsione, non una promessa.",
  },
  pitchSketch: {
    title: "Schizzo della piazzola",
    empty:
      "Ancora nessuno schizzo. Alla seconda visita si sa di nuovo come stava tutto.",
    create: "Crea schizzo",
    edit: "Modifica",
    hint: "Scegli un oggetto, poi tocca il punto voluto. Tutto si aggancia al mezzo metro.",
    addTitle: "Aggiungi",
    full: (max: number) => `Più di ${max} oggetti non sono più uno schizzo.`,
    itemWidth: "Larghezza (m)",
    itemDepth: "Profondità (m)",
    pitchWidth: "Larghezza piazzola (m)",
    pitchDepth: "Profondità piazzola (m)",
    rotate: "Ruota",
    remove: "Togli",
    moveLeft: "← sinistra",
    moveRight: "destra →",
    moveUp: "↑ davanti",
    moveDown: "dietro ↓",
    edgeLeft: "Distanza a sinistra",
    edgeRight: "Distanza a destra",
    edgeTop: "Distanza davanti",
    edgeBottom: "Distanza dietro",
    nearest: "Oggetto più vicino",
    alone: "sta da solo",
    overlap: (a: string, b: string) => `${a} e ${b} si sovrappongono.`,
    areaLine: (width: string, depth: string, used: number, total: number) =>
      `Piazzola ${width} × ${depth} – occupati ${used} di ${total} m².`,
    sketchAria: (width: string, depth: string, count: number) =>
      `Schizzo della piazzola, ${width} per ${depth}, ${count} oggetti`,
    itemAria: (name: string, width: string, depth: string) =>
      `${name}, ${width} per ${depth}`,
    saved: "Schizzo salvato.",
  },
  tripReview: {
    title: "Bilancio",
    toggleAria: (trip: string) => `Apri il bilancio di ${trip}`,
    intro:
      "Due domande che migliorano la prossima lista. Nulla viene tolto o aggiunto automaticamente: l'app mostrerà solo ciò che è emerso.",
    unusedTitle: "Non usato",
    noList: "A questo viaggio non è collegata alcuna lista.",
    emptyList: "La lista è vuota.",
    missingTitle: "È mancato",
    missingPlaceholder: "p. es. mollette da bucato",
    missingAdd: "Aggiungi",
    missingRemove: (name: string) => `Togliere «${name}»`,
    save: "Salva il bilancio",
    saved: "Bilancio salvato.",
    note: "Una volta inutilizzato non dice nulla: la crema solare di un luglio piovoso riparte l'anno prossimo. Solo dalla seconda volta diventa un'indicazione. Ciò che è mancato viene proposto subito.",
  },
  turnaround: {
    stormForecast: (clock: string) => `Temporale annunciato dalle ${clock}.`,
    stormPropensity: (clock: string) =>
      `Aria instabile dalle ${clock} – possibili temporali locali.`,
    stormBeatsSunset:
      "Allora la scadenza è la nuvola, non il sole – pianifica il ritorno prima.",
    title: "Ora di rientro",
    shapeLabel: "Tipo di percorso",
    outAndBack: "Andata e ritorno",
    loop: "Anello",
    turnaroundLabel: "Torna indietro entro",
    latestStartLabel: "Partenza entro",
    left: (duration: string) => `ancora ${duration}`,
    overdue: "Torna indietro ora",
    tooLong: (duration: string) =>
      `La giornata non basta più per l'intero percorso (${duration}).`,
    bufferLabel: "Margine prima del tramonto (minuti)",
    sunsetAt: (time: string) => `Tramonto ${time}`,
    note: "Calcolato dal tramonto al punto di partenza. Nel bosco e in valle fa buio molto prima: il margine serve a questo.",
  },
  trash: {
    title: "Cestino",
    intro: (days: number) =>
      `Ciò che elimini resta ${days} giorni. Fino ad allora basta un clic per riaverlo.`,
    empty: "Niente di eliminato. Meglio così.",
    restore: "Ripristina",
    restored: "Ripristinato",
    restoreFailed: "Non ha funzionato. Ricarica la pagina.",
    itemCount: (count: number) =>
      count === 1 ? "1 voce collegata" : `${count} voci collegate`,
    deletedOn: (date: string) => `eliminato il ${date}`,
    daysLeft: (days: number) =>
      days === 1 ? "ancora 1 giorno" : `ancora ${days} giorni`,
    removeAria: (label: string) => `Elimina definitivamente ${label}`,
    removeConfirm: (label: string) =>
      `Eliminare «${label}» definitivamente? Dopo è perso.`,
    emptyAll: "Svuota il cestino",
    emptyConfirm: (count: number) =>
      count === 1
        ? "Eliminare definitivamente questa voce?"
        : `Eliminare definitivamente tutte le ${count} voci?`,
    note: (days: number) =>
      `Il ripristino riusa lo stesso numero di prima – i link condivisi e i codici QR tornano a funzionare. Le foto restano sul server finché resta la voce; ripristinare un viaggio senza le sue immagini non sarebbe un ripristino. Dopo ${days} giorni si cancella tutto definitivamente, file compresi.`,
    profileLink: "Apri il cestino",
  },
  meteorLog: {
    title: "Diario delle stelle cadenti",
    intro:
      "Conta una notte: a ogni stella cadente tocca la direzione da cui è arrivata – ora e direzione sono registrate.",
    startHint:
      "Sdraiati, lascia che gli occhi si abituino al buio per venti minuti, poi avvia il conteggio.",
    start: "Avvia la notte",
    tonight: (names: string) => `Attivi questa notte: ${names}`,
    observed: (duration: string) => `${duration} di osservazione`,
    rate: (perHour: number) => `${perHour} all'ora`,
    rateTooEarly: "Troppo presto per un tasso orario",
    mostlyFrom: (direction: string) =>
      `Molte venivano chiaramente da ${direction}`,
    tapHint: "Vista? Tocca la direzione da cui è arrivata.",
    directionUnknown: "incerta",
    pause: "Pausa",
    resume: "Riprendi",
    undo: "Annulla",
    showerLabel: "Quale sciame?",
    showerUnknown: "Indeterminato",
    distribution: "Da quale direzione",
    redLight: "Luce rossa",
    finish: "Termina la notte",
    pastNights: "Le tue notti",
    nightOf: (date: string) => `Notte del ${date}`,
    clear: "Cancella il diario",
    clearConfirm: "Cancellare tutte le notti registrate?",
    note: "Si conta solo il tempo in cui guardi davvero – per questo c'è il tasto pausa. Sotto il quarto d'ora non c'è tasso orario: trasformare una stella cadente in due minuti in trenta all'ora sarebbe un gioco di numeri. E il tuo numero resta sempre sotto il tasso del calendario: quello vale per un cielo perfettamente buio con il punto d'origine esattamente sopra di te. Le notti restano su questo dispositivo e non passano a un secondo.",
  },
  treeKey: {
    title: "Riconosci l'albero",
    intro:
      "Sei davanti a un albero e non sai quale sia? Rispondi a ciò che vedi – dopo tre o quattro domande hai la specie.",
    step: (number: number) => `Domanda ${number}`,
    resultLabel: "Probabilmente è questo",
    markLabel: "Da cosa lo riconosci",
    checkLabel: "Controprova",
    confusionLabel: "Si confonde con",
    toLexicon: "Leggi nel lessico della natura",
    back: "Domanda precedente",
    restart: "Ricomincia",
    note: "La chiave porta ai nove alberi più diffusi dei nostri boschi – non a ogni specie. Se la controprova non torna, è un altro albero: meglio continuare a cercare che decidere in fretta.",
  },
  rainyDay: {
    title: "Idee per giorni di pioggia",
    intro:
      "Piove dalla colazione? Indica età, durata e spazio – il resto compare qui sotto.",
    spaceLabel: "Quanto spazio",
    ageLabel: "Età",
    ageAny: "indifferente",
    ageYears: (years: number) => `${years} anni`,
    ageIgnore: "Non considerare l'età",
    ageUse: "Considerare l'età",
    ageRange: (from: number, to: number) =>
      to >= 99 ? `da ${from} anni` : `${from}–${to} anni`,
    minutesLabel: "Tempo da riempire",
    minutesValue: (minutes: number) => `${minutes} min`,
    quietLabel: "Solo cose tranquille (qualcuno dorme)",
    quietBadge: "tranquillo",
    togetherLabel: "Più persone presenti",
    needsLabel: "Serve",
    resultCount: (count: number) =>
      count === 1 ? "1 idea adatta" : `${count} idee adatte`,
    empty:
      "Niente trovato. Prendi più tempo, più spazio – o lascia perdere l'età.",
    materialsTitle: "Cosa ti serve",
    note: "Lo spazio è un filtro rigido: ciò che richiede un tavolo non serve nella tenda interna. Sulla durata c'è un margine – si può sempre smettere.",
  },
  lunchbox: {
    title: "Merenda e pranzo al sacco",
    intro: "Cosa mettere nello zaino per la gita – e quanto portare da bere.",
    adultsLabel: "Adulti",
    childrenLabel: "Bambini",
    lengthLabel: "Durata della gita",
    length: {
      halbtag: "Mezza giornata",
      ganztag: "Giornata intera",
      langertag: "Fino a sera",
    },
    effortLabel: "Impegno",
    effort: {
      gemuetlich: "Tranquilla",
      wandern: "Escursione",
      anstrengend: "Impegnativa",
    },
    temperatureLabel: "Temperatura massima (°C)",
    coolPackLabel: "Siberino incluso",
    bottles: (count: number) =>
      count === 1 ? "1 borraccia" : `${count} borracce`,
    waterHint: (liters: number, bottleMl: number) =>
      `${liters} l per tutti insieme, arrotondato a borracce da ${bottleMl} ml.`,
    znueniTitle: "Per la merenda",
    mittagTitle: "Per il pranzo",
    remindersTitle: "Non dimenticare",
    portions: (count: number) =>
      count === 1 ? "1 porzione" : `${count} porzioni`,
    addToList: "Nella lista della spesa",
    addedToList: "Aggiunto alla lista della spesa",
    nothingToAdd: "Nessuna proposta – inserisci prima le persone.",
    fromPlanner: "dal pianificatore del pranzo al sacco",
    note: "Suggerimenti, non prescrizioni: valori indicativi per persona e pasto. Senza siberino sparisce tutto ciò che va refrigerato – non è una questione di gusto. E il cioccolato nei giorni caldi resta a casa.",
  },
  firewood: {
    title: "Fabbisogno di legna",
    intro:
      "Quante reti caricare in auto – la legna conviene comprarla prima, non in piazzola.",
    eveningsLabel: "Sere con il fuoco",
    hoursLabel: "Ore per sera",
    kindLabel: "Tipo di fuoco",
    kinds: {
      kochfeuer: "Fuoco da cucina (piccolo)",
      feuerschale: "Braciere",
      lagerfeuer: "Fuoco da campo",
      waermefeuer: "Fuoco per scaldarsi (grande)",
    },
    woodLabel: "Tipo di legna",
    woods: {
      hart: "Legna dura (faggio, quercia)",
      gemischt: "Mista",
      weich: "Legna tenera (abete)",
    },
    netsLabel: "Reti da 10 kg",
    totalLabel: "Totale",
    perEveningLabel: "per sera",
    kindlingLine: (kg: number) =>
      `Inclusi ${kg} kg di legna d'accensione – senza trucioli e legnetti resti con faggio secco e senza brace.`,
    stockLabel: "Verifica la scorta (kg)",
    stockPlaceholder: "p. es. 20",
    stockLine: (evenings: number) =>
      evenings === 0
        ? "Non basta più per una sera intera."
        : evenings === 1
          ? "Basta ancora per una sera."
          : `Basta ancora per ${evenings} sere.`,
    note: "Valori pratici indicativi: vento, legna umida e chi cura il fuoco cambiano facilmente le cose della metà. Si arrotonda sempre per eccesso – una rete in più ci sarà ancora la prossima volta.",
  },
  routePlan: {
    sectionAria: "Disegnare il percorso in anticipo",
    title: "Disegnare il percorso",
    intro:
      "Tocca la mappa per porre punti di passaggio. L'app ne calcola lunghezza, dislivello e tempo di cammino.",
    mapAria: "Mappa per porre punti di passaggio",
    mapFailed: "La mappa non è stata caricata.",
    hint: "Poni almeno due punti di passaggio.",
    undo: "Annulla l'ultimo punto",
    clear: "Cancella tutto",
    loadElevation: "Carica le quote",
    elevationFailed: "Le quote non sono state caricate.",
    noElevationYet:
      "Senza quote il tempo di cammino considera solo la distanza – caricale, altrimenti il numero è troppo ottimista.",
    length: "Lunghezza",
    elevation: "Dislivello",
    walkingTime: "Tempo di cammino",
    pace: "Andatura:",
    paceLabels: { slow: "Tranquilla", normal: "Normale", fast: "Sostenuta" },
    snapping: "Calcolo del tracciato …",
    notRouted:
      "Nessun tracciato disponibile (niente rete o nessun sentiero trovato): si calcola con i tratti dritti fra i tuoi punti – in montagna decisamente troppo corto.",
    note: "Stima secondo il metodo usuale (4 km/h, 300 m di salita, 500 m di discesa all'ora), senza pause. Il calcolo segue i tratti in linea d'aria fra i tuoi punti, non il sentiero.",
    nameLabel: "Nome",
    namePlaceholder: "p. es. giro del lago",
    tripLabel: "Collega a un viaggio",
    tripNone: "Senza viaggio",
    save: "Salva il percorso",
    update: "Aggiorna il percorso",
    saved: "Percorso salvato.",
    saveFailed: "Il percorso non è stato salvato.",
    nameMissing: "Dai un nome al percorso.",
    removeFailed: "Il percorso non è stato eliminato.",
    savedTitle: "Percorsi salvati",
    summary: (distance: string, ascent: number, time: string) =>
      `${distance} · ↑${ascent} m · ${time}`,
    removeAria: (name: string) => `Elimina il percorso ${name}`,
  },
  trackProfile: {
    sectionAria: "Profilo altimetrico e tempi intermedi",
    title: "Profilo altimetrico",
    rangeLine: (min: number, max: number) => `${min}–${max} m s.l.m.`,
    chartAria: "Andamento dell'altitudine lungo il percorso",
    noElevation:
      "Questo dispositivo non ha fornito altitudini durante la registrazione – il grafico quindi manca.",
    tooltipElevation: "Altitudine",
    tooltipDistance: (km: string) => `a ${km} km`,
    splitsTitle: "Tempi intermedi",
    kmLabel: (km: number) => `km ${km}`,
    kmPartial: "Resto",
    climbLine: (up: number, down: number) => `↑${up} m ↓${down} m`,
    note: "L'altitudine è riportata sulla distanza e non sul tempo – altrimenti ogni pausa sembrerebbe un tratto piano. L'ultimo chilometro iniziato è segnato come «Resto».",
  },
  reservation: {
    title: "Prenotazione",
    empty: "Nessuna conferma di prenotazione salvata.",
    add: "Aggiungi la conferma",
    replace: "Sostituisci",
    openImage: "Vedi la conferma",
    openPdf: "Apri il PDF",
    viewerTitle: "Conferma di prenotazione",
    viewerClose: "Chiudi",
    viewerDownload: "Scarica",
    viewerNewWindow: "Apri in una nuova finestra",
    viewerPdfFallback:
      "Questo dispositivo non mostra i PDF direttamente nell'app. Scarica il file oppure aprilo in una nuova finestra.",
    removeAria: "Elimina la conferma di prenotazione",
    uploaded: "Conferma salvata.",
    uploadFailed: "Non è stato possibile salvare la conferma.",
    removeFailed: "Non è stato possibile eliminare la conferma.",
    tooLarge: "Il file è troppo grande (max 10 MB).",
    offlineNote:
      "Foto o PDF. Una volta aperta, la conferma resta consultabile anche senza rete – comodo alla sbarra alle 22.",
  },
  shops: {
    sectionAria: "Fare la spesa nei dintorni",
    title: "Fare la spesa nei dintorni",
    subtitle: "Supermercato, panetteria e vendita diretta attorno a te.",
    subtitleAtPlace: (place: string) =>
      `Supermercato, panetteria e vendita diretta attorno a ${place}.`,
    radiusLabel: "Raggio",
    radiusGroupAria: "Scegli il raggio di ricerca",
    radiusOption: (km: number) => `${km} km`,
    loading: "Ricerca dei negozi …",
    loadFailed: "Non è stato possibile caricare i negozi – riprova più tardi.",
    empty: (km: number) =>
      `Entro ${km} km non risulta alcun negozio in OpenStreetMap.`,
    resultCount: (n: number) =>
      n === 1 ? "1 negozio trovato" : `${n} negozi trovati`,
    distanceAway: (distance: string) => `${distance} in linea d'aria`,
    kind: {
      supermarket: "Supermercato",
      convenience: "Negozio di quartiere",
      bakery: "Panetteria",
      farm: "Vendita diretta",
      butcher: "Macelleria",
    },
    openNow: "Ora aperto",
    closedNow: "Ora chiuso",
    checkHours: "Verifica gli orari",
    todayHours: (hours: string) => `Oggi ${hours}`,
    noHours: "Orari non registrati",
    navButton: "Percorso",
    navAria: (name: string) => `Percorso verso ${name}`,
    website: "Sito web",
    hoursNote:
      "Gli orari vengono da OpenStreetMap e possono essere superati. Dove l'indicazione è troppo complessa (festivi, stagione, pausa pranzo con commento) compare «Verifica gli orari» invece di una supposizione – accanto sta il dato grezzo.",
    source: "Dati: contributori di OpenStreetMap (ODbL)",
  },
  familyPlaces: {
    sectionAria: "Parchi giochi e punti balneabili nei dintorni",
    title: "Per le famiglie nei dintorni",
    subtitle: "Parchi giochi e punti balneabili attorno alla tua posizione.",
    subtitleAtPlace: (place: string) =>
      `Parchi giochi e punti balneabili attorno a ${place}.`,
    radiusLabel: "Raggio",
    radiusGroupAria: "Scegliere il raggio di ricerca",
    radiusOption: (km: number) => `${km} km`,
    loading: "Ricerca di parchi giochi e punti balneabili …",
    loadFailed:
      "Al momento non è stato possibile caricare parchi giochi e punti balneabili. Overpass è un servizio gratuito che rallenta con troppe richieste – riprova tra qualche minuto.",
    empty: (km: number) =>
      `Nel raggio di ${km} km non è registrato in OpenStreetMap nessun parco giochi o punto balneabile. Prova con un raggio più grande.`,
    resultCount: (n: number) =>
      n === 1 ? "1 posto trovato" : `${n} posti trovati`,
    kind: {
      playground: "Parco giochi",
      bathing: "Punto balneabile",
    },
    minAge: (years: number) => `da ${years} anni`,
    maxAge: (years: number) => `fino a ${years} anni`,
    ageRange: (min: number, max: number) => `${min}–${max} anni`,
    fenced: "recintato",
    covered: "coperto",
    supervised: "sorvegliato",
    feePaid: "a pagamento",
    feeFree: "gratuito",
    distanceAway: (value: string) => `a ${value}`,
    navButton: "Vai lì",
    navAria: (name: string) => `Navigazione verso ${name}`,
    bathingNote: (section: string) =>
      `La temperatura dell'acqua alla tua piazzola è nella sezione «${section}». Fare il bagno resta sotto la tua responsabilità – osserva il posto prima di tuffarti.`,
    bathingNoteShort: "Bagno a tuo rischio",
    source:
      "Dati da OpenStreetMap tramite l'API Overpass – interrogata solo al tuo clic. Età, recinzione, sorveglianza e ingresso compaiono solo dove sono curati in OSM.",
  },

  /** Carta dell'oscurità per piazzola (#239). */
  darkSky: {
    sectionAria: "Oscurità stimata del cielo in questo luogo",
    title: "Cielo buio",
    badge: (bortle: number) => `Bortle ${bortle}`,
    subtitle: "Quanto è buio il cielo alla tua posizione?",
    subtitleAtPlace: (place: string) => `Quanto è buio il cielo a ${place}?`,
    outsideCoverage:
      "Per questo luogo non ci sono dati sulle sorgenti luminose – il set di dati copre la Svizzera e le zone di confine. Una classificazione qui sarebbe indovinata, perciò CampMesser preferisce non mostrarne nessuna.",
    scaleAria: (bortle: number) =>
      `Scala di Bortle da 1 (molto buio) a 9 (centro città), livello stimato ${bortle}`,
    scaleDark: "buio",
    scaleBright: "chiaro",
    classLine: (bortle: number, label: string) => `Bortle ${bortle} · ${label}`,
    locating: "Posizione in corso di rilevamento …",
    noLocation:
      "Per la classificazione CampMesser ha bisogno della tua posizione – abilita la localizzazione oppure salva una piazzola.",
    tonightTitle: "Questa notte",
    tonightLoading: "Caricamento della nuvolosità …",
    tonightWorthIt:
      "Questa notte ne vale particolarmente la pena: cielo buio, notte serena e poca luce lunare si incontrano. Concediti 20 minuti perché gli occhi si abituino.",
    tonightClouds: (percent: number) =>
      `Per questa notte è annunciato circa il ${percent} % di nuvolosità – meglio aspettare una notte più serena.`,
    tonightMoon: (percent: number) =>
      `La Luna è illuminata al ${percent} % e copre le stelle deboli. Per la Via Lattea sono migliori le notti attorno alla luna nuova.`,
    tonightBrightSky:
      "La notte è serena e la Luna disturba poco – ma qui il cielo è troppo chiaro per le stelle deboli. Luna, pianeti e passaggi della ISS valgono comunque la pena.",
    tonightUnknown:
      "Per questa notte non c'è al momento nessuna previsione di nuvolosità.",
    cloudLine: (percent: number) =>
      `Nuvolosità dalle 21: circa il ${percent} %`,
    moonLine: (percent: number) => `Luna: illuminata al ${percent} %`,
    astroLink: "Al cielo stellato nel modulo natura",
    nearestTitle: "Sorgenti luminose più vicine:",
    nearestItem: (name: string, distance: string) => `${name} ${distance}`,
    estimateNote:
      "Stima, non misura: non esiste una misura liberamente accessibile della luminosità del cielo. CampMesser calcola la classificazione dalla distanza dalle maggiori città e agglomerazioni. La formula non conosce le montagne che schermano un alone, i fari proprio accanto o l'aria umida – sul posto può essere più buio o più chiaro.",
  },

  excursions: {
    sectionAria: "Mete per una gita vicino a questa piazzola",
    title: "Gite nei dintorni",
    subtitle: "Che cosa puoi fare nei dintorni?",
    subtitleAtPlace: (place: string) =>
      `Che cosa puoi fare attorno a ${place}?`,
    loading: "Caricamento delle gite …",
    loadFailed: "Le gite non si sono potute caricare. Riprova più tardi.",
    empty:
      "Nella tua app Ausflugfinder non è ancora registrata nessuna meta con coordinate.",
    resultCount: (n: number) =>
      n === 1 ? "1 meta nei dintorni" : `${n} mete nei dintorni`,
    kind: "Meta per una gita",
    distanceAway: (value: string) => `${value} in linea d'aria`,
    costFree: "gratis",
    costLabel: "Costo",
    costAria: (level: number) => `Livello di costo ${level} su 4`,
    detailsShow: "Dettagli",
    detailsHide: "Chiudi i dettagli",
    navButton: "Navigazione",
    navAria: (name: string) => `Navigazione verso ${name}`,
    websiteLink: "Sito web",
    mapLink: "Mostra sulla mappa",
    photoAlt: (name: string) => `Immagine di ${name}`,
    addressLabel: "Indirizzo",
    niceToKnowLabel: "Buono a sapersi",
    openingHoursLabel: "Orari di apertura",
    parkingLabel: "Parcheggio",
    parkingFree: "gratuito",
    parkingPaid: "a pagamento",
    ageLabel: "Consigliato",
    babiesOk: "Fattibile con un bebè",
    lengthLabel: "Lunghezza",
    lengthKm: (km: string) => `${km} km`,
    tourLoop: "Percorso ad anello",
    tourAToB: "Da A a B",
    seasonsLabel: "Stagione",
    season: {
      spring: "Primavera",
      summer: "Estate",
      autumn: "Autunno",
      winter: "Inverno",
    },
    source: "Dalla tua app Ausflugfinder",
  },

  recipes: {
    title: "Ricettario Campfire",
    subtitle:
      "Ricette semplici per fornello a gas e fuoco vivo – filtrabili per ingredienti e tempo.",
    offlineNote:
      "Tutte le ricette sono salvate nell'app e utilizzabili senza connessione Internet.",
    searchPlaceholder:
      "Cerca una ricetta o un ingrediente (ad es. «fagioli») …",
    searchAria: "Cerca una ricetta o un ingrediente",
    methodFilterAria: "Filtra per metodo di cottura",
    timeFilterAria: "Filtra per tempo di preparazione",
    filterAll: "Tutte",
    timeAny: "Qualsiasi",
    timeMax: (n: number) => `≤ ${n} min`,
    minutes: (n: number) => `${n} min`,
    servings: (n: number) => `${n} porzioni`,
    createOwn: "Crea una ricetta personale",
    openRecipeAria: (name: string) => `Apri la ricetta ${name}`,
    photoAlt: (name: string) => `Foto: ${name}`,
    ownBadge: "Personale",
    onePotBadge: "One-pot",
    kidsBadge: "Bambini",
    emptyState:
      "Nessuna ricetta trovata – prova altri filtri o termini di ricerca.",
    ingredientsTitle: "Ingredienti",
    stepsTitle: "Preparazione",
    tipTitle: "Consiglio",
    deleteConfirm: (name: string) => `Eliminare davvero la ricetta «${name}»?`,
    favoritesFilter: "Preferiti",
    favoriteAria: (name: string) => `Salva ${name} tra i preferiti`,
    unfavoriteAria: (name: string) => `Rimuovi ${name} dai preferiti`,
    favoriteSave: "Salva tra i preferiti",
    favoriteSaved: "Preferito",
    favoritesEmpty:
      "Ancora nessun preferito – tocca il cuore di una ricetta per ritrovarla qui.",
    randomButton: "A caso",
    randomAria: "Aprire una ricetta a caso dalla selezione filtrata",
    randomAgain: "Tira di nuovo il dado",
    cookingMode: "Modalità cucina",
    cookingModeAria: (name: string) => `Avviare la modalità cucina per ${name}`,
    cookingStepProgress: (current: number, total: number) =>
      `Passo ${current} di ${total}`,
    cookingPrev: "Indietro",
    cookingNext: "Avanti",
    cookingDone: "Fatto",
    cookingIngredientsShow: "Mostra ingredienti",
    cookingIngredientsHide: "Nascondi ingredienti",
    shareButton: "Condividi",
    shareAria: (name: string) => `Condividi la ricetta ${name} tramite link`,
    shareTitle: "Condividi la ricetta",
    shareDescription:
      "Chi conosce il link vede la ricetta e può salvarla. La tua foto della ricetta resta privata.",
    shareCopied: "Link di condivisione copiato",
    shareFailed: "Non è stato possibile creare il link di condivisione",
    shareQrTitle: "Codice QR",
    shareQrText:
      "Fallo scansionare attorno al fuoco – più veloce che digitare.",
    shareQrAlt: (name: string) => `Codice QR della ricetta condivisa ${name}`,
    unshareButton: "Termina la condivisione",
    unshared: "Link di condivisione ritirato",
    unshareFailed: "Non è stato possibile ritirare il link di condivisione",
    destockButton: "Togli gli ingredienti dal frigo box",
    destockAria: (name: string) =>
      `Togli gli ingredienti di ${name} dal frigo box`,
    destockTitle: "Togli dal frigo box",
    destockDescription:
      "Queste scorte corrispondono agli ingredienti della ricetta. Scegli cosa hai consumato.",
    destockMatchedBy: (ingredient: string) => `corrisponde a «${ingredient}»`,
    destockNoMatches:
      "Nessuna voce corrispondente nel tuo frigo box – non c'è nulla da togliere.",
    destockConfirm: (n: number) =>
      n === 1 ? "Togli 1 voce" : `Togli ${n} voci`,
    destockDone: (n: number) =>
      n === 1
        ? "1 voce rimossa dal frigo box"
        : `${n} voci rimosse dal frigo box`,
    destockFailed: "Non è stato possibile rimuovere le voci",
    editor: {
      titleEdit: "Modifica ricetta",
      titleNew: "Crea una ricetta personale",
      description:
        "La tua ricetta appare nel ricettario e viene considerata nei suggerimenti del frigo box.",
      nameLabel: "Nome",
      namePlaceholder: "ad es. Gli Älplermagronen della nonna",
      methodLabel: "Cottura",
      difficultyLabel: "Difficoltà",
      timeLabel: "Tempo (minuti)",
      servingsLabel: "Porzioni",
      onePot: "One-pot",
      kidFriendly: "Adatta ai bambini",
      ingredientsLabel: "Ingredienti (uno per riga)",
      ingredientsPlaceholder:
        "400 g di maccheroni\n200 g di formaggio di montagna\n2 cipolle",
      stepsLabel: "Preparazione (un passo per riga)",
      stepsPlaceholder:
        "Porta l'acqua a ebollizione e cuoci i maccheroni.\nRosola le cipolle.\nDisponi a strati e lascia fondere il formaggio.",
      tipLabel: "Consiglio (facoltativo)",
      tipPlaceholder: "ad es. Servire con composta di mele",
      saved: "Ricetta salvata",
      updated: "Ricetta aggiornata",
      photoLabel: "Foto (facoltativo)",
      photoChoose: "Scegli una foto",
      photoChange: "Cambia foto",
      photoRemove: "Rimuovi foto",
      photoPreviewAlt: "Anteprima della foto della ricetta",
      photoHint:
        "JPEG, PNG o WebP – la foto viene ridotta automaticamente prima del caricamento.",
      photoUploading: "Caricamento della foto …",
      photoUploadFailed: "Ricetta salvata, ma la foto non è stata caricata.",
      photoTooLarge: "La foto è troppo grande (max. 5 MB).",
      photoHeic:
        "Il browser non può leggere HEIC/HEIF – esporta la foto come JPEG.",
      photoReadFailed: "L'immagine non è stata letta.",
      photoRemoveFailed: "La foto non è stata rimossa.",
    },
  },
  cookTimer: {
    title: "Timer da cucina",
    hint: "Il timer continua anche se cambi pagina – il tempo rimanente lo vedi in basso nell'app.",
    quickAria: "Scegli la durata del timer",
    quickMinutes: (n: number) => `${n} min`,
    customLabel: "Durata personalizzata in minuti",
    customPlaceholder: "Minuti",
    startButton: "Avvia",
    invalidMinutes: (max: number) => `Indica da 1 a ${max} minuti.`,
    tooMany: (max: number) =>
      `Ci sono già ${max} timer attivi – annullane prima uno.`,
    started: (minutes: number) => `Timer di ${minutes} min avviato`,
    stepTimerAria: (label: string) => `Avvia un timer di ${label}`,
    runningLabel: "in corso",
    pausedLabel: "in pausa",
    expired: "Pronto – il tempo è scaduto!",
    dismiss: "Fatto",
    dismissAria: (name: string) => `Conferma il timer ${name}`,
    pauseAria: (name: string) => `Metti in pausa il timer ${name}`,
    resumeAria: (name: string) => `Riprendi il timer ${name}`,
    cancelAria: (name: string) => `Annulla il timer ${name}`,
    expiredShort: "Pronto",
    pausedShort: "Pausa",
    moreCount: (n: number) => `+${n}`,
    barOpenAria: (name: string, time: string) =>
      `Timer ${name}: mancano ${time} – torna alla ricetta`,
    barExpiredAria: (name: string) =>
      `Il timer ${name} è scaduto – torna alla ricetta`,
  },
  servings: {
    question: "Per quante persone?",
    personCount: (n: number) => (n === 1 ? "1 persona" : `${n} persone`),
    decreaseAria: "Una persona in meno",
    increaseAria: "Una persona in più",
    baseHint: (n: number) =>
      `Ricetta base per ${n === 1 ? "1 persona" : `${n} persone`}`,
    scaledNote:
      "Le quantità sono convertite. Le righe senza quantità («Sale q.b.») restano come sono.",
    reset: "Reimposta",
    resetAria: "Torna alle porzioni della ricetta",
    menuTitle: "Converti le quantità",
    menuToggleAria: "Converti le quantità del menù per un numero di persone",
    menuOff: "come nella ricetta",
    menuHint:
      "Vale per l'anteprima degli ingredienti e per il trasferimento nella lista della spesa.",
    menuScaledTo: (n: number) =>
      `convertito per ${n === 1 ? "1 persona" : `${n} persone`}`,
  },
  converter: {
    openButton: "Convertitore",
    openAria: "Apri il convertitore di misure e temperature",
    title: "Misure e temperature",
    description:
      "Converti mentre cucini in piazzola: tazze, cucchiai, grammi e gradi.",
    amountLabel: "Quantità",
    unitLabel: "Misura",
    volumeTitle: "Tazze e cucchiai",
    weightTitle: "Grammi ↔ millilitri",
    ingredientLabel: "Ingrediente",
    directionAria: "Scegli il senso della conversione",
    gramsToMl: "g → ml",
    mlToGrams: "ml → g",
    weightHint:
      "Calcolato con la densità da cucina – valori per ingredienti non pressati, non una bilancia da laboratorio. 1 tazza = 2 dl, 1 cucchiaio = 15 ml, 1 cucchiaino = 5 ml.",
    tempTitle: "Temperatura",
    tempLabel: "Temperatura",
    tempUnitAria: "Scegli l'unità della temperatura inserita",
    gasMark: (n: number) => `Livello ${n}`,
    noGasMark: "fuori dalla scala del forno",
    ovenTitle: "Forno e livello del gas",
    ovenHint:
      "Vale per il calore sopra/sotto. Con la ventilazione imposta circa 20 °C in meno.",
  },
  food: {
    title: "Frigo box e dispensa",
    subtitleLoggedOut:
      "Cosa c'è ancora? Registra le tue scorte e ricevi suggerimenti di ricette adatte.",
    subtitleCooled:
      "Cosa c'è ancora? Registra le tue scorte refrigerate e ricevi suggerimenti di ricette one-pot adatte.",
    subtitleDry:
      "Conserve, pasta, caffè, spezie: tutto quello che non va in fresco nel secondo magazzino – ordinato per categorie.",
    loginFeature: "le tue scorte",
    storageAria: "Scegli il magazzino",
    noUnit: "senza unità",
    unitAria: "Unità della quantità (facoltativo)",
    noCategory: "Senza categoria",
    categoryAria: "Categoria nella dispensa (facoltativo)",
    addPlaceholderCooled: "ad es. pomodori, formaggio, fagioli …",
    addPlaceholderDry: "ad es. scatola di ravioli, spaghetti, caffè …",
    addNameAria: "Aggiungi alimento",
    expiryAria: "Termine minimo di conservazione (facoltativo)",
    submitAria: "Salva alimento",
    addFailed: "La voce non è stata salvata",
    dateHint:
      "Data = termine minimo di conservazione (facoltativo). Le scorte in scadenza passano in testa e vengono contrassegnate.",
    dateHintDry:
      "Data = termine minimo di conservazione (facoltativo). Anche nella dispensa quello che scade presto passa in testa e viene contrassegnato.",
    urgentOne: "Una scorta dovrebbe essere consumata presto",
    urgentMany: (n: number) => `${n} scorte dovrebbero essere consumate presto`,
    urgentSuffix: " – i suggerimenti di ricette qui sotto ti aiutano.",
    removeAria: (name: string) => `Rimuovi ${name}`,
    addToShoppingAria: (name: string) =>
      `Metti ${name} sulla lista della spesa`,
    addedToShopping: (name: string) => `${name} messo sulla lista della spesa`,
    alreadyOnShopping: (name: string) =>
      `${name} è già sulla lista della spesa`,
    addToShoppingFailed: "Impossibile aggiungerlo alla lista della spesa",
    deleteOnly: "Solo eliminare",
    deleteAndShop: "Elimina e metti sulla lista della spesa",
    emptyTitle: "Frigo box ancora vuoto",
    emptyText:
      "Registra quello che hai con te – ti suggeriamo le ricette adatte.",
    emptyTitleDry: "Dispensa ancora vuota",
    emptyTextDry:
      "Conserve, pasta, riso, caffè, spezie: registra quello che sta nella dispensa.",
    suggestionsTitle: "Usa gli avanzi",
    suggestionsSubtitle:
      "Cosa puoi cucinare con quello che c'è ancora – da frigo box e dispensa, prima le ricette con scorte che scadono presto.",
    haveCount: (have: number, total: number) =>
      `hai ${have} ingredienti su ${total}`,
    urgentInRecipe: (n: number) =>
      n === 1 ? "1 scorta scade presto" : `${n} scorte scadono presto`,
    havePrefix: "Hai:",
    missingPrefix: "Manca:",
    missingNone: "C'è tutto – puoi iniziare subito.",
    addMissing: "Quel che manca nella lista della spesa",
    addMissingAria: (name: string) =>
      `Metti gli ingredienti mancanti di ${name} nella lista della spesa`,
    openRecipe: "Apri la ricetta",
    minutes: (n: number) => `${n} min`,
    servings: (n: number) => `${n} porzioni`,
    onePotSuffix: " · one-pot",
    bookPrefix: "Trovi tutte le istruzioni nel ",
    bookLink: "ricettario Campfire",
    bookSuffix: ".",
    templateSaveButton: "Salva come modello",
    templateLoadButton: "Carica modello",
    templateSaveTitle: "Salva il contenuto attuale come modello",
    templateSaveDesc: (n: number) =>
      `${n === 1 ? "Verrà salvata 1 voce" : `Verranno salvate ${n} voci`} – per le scorte con TMC memorizziamo i giorni rimanenti.`,
    templateNameLabel: "Nome del modello",
    templateNamePlaceholder: "ad es. dotazione weekend",
    templateSaveConfirm: "Salva modello",
    templateSaved: "Modello salvato – disponibile tramite «Carica modello»",
    templateSaveFailed: "Il modello non è stato salvato",
    templateLoadTitle: "Carica modello",
    templateLoadDesc:
      "Le voci vengono aggiunte al frigo box. I giorni rimanenti salvati vengono convertiti in un TMC a partire da oggi; le voci omonime già presenti vengono saltate.",
    templateEmpty: "Nessun modello salvato finora.",
    templateItemCount: (n: number) => (n === 1 ? "1 voce" : `${n} voci`),
    templateApply: "Carica",
    templateApplied: (added: number, skipped: number) =>
      `${added === 1 ? "1 voce aggiunta" : `${added} voci aggiunte`}${
        skipped > 0 ? `, ${skipped} già presente/i – saltata/e` : ""
      }`,
    templateApplyFailed: "Il modello non è stato caricato",
    templateDeleted: "Modello eliminato",
    templateDeleteFailed: "Il modello non è stato eliminato",
    templateDeleteAria: (name: string) => `Elimina il modello ${name}`,
    templateDeleteConfirm: (name: string) =>
      `Eliminare davvero il modello «${name}»?`,
    quantityPlaceholder: "Quantità",
    addQuantityAria: "Quantità per la nuova voce (facoltativo)",
    editAria: (name: string) => `Modifica ${name} – quantità, magazzino e TMC`,
    editDesc:
      "Adatta quantità, unità, magazzino, categoria e termine minimo di conservazione – i campi vuoti rimuovono il valore.",
    editQuantityLabel: "Quantità",
    editQuantityPlaceholder: "es. 2× o 500 g",
    editUnitLabel: "Unità",
    editStorageLabel: "Magazzino",
    editCategoryLabel: "Categoria",
    editExpiryLabel: "Termine minimo di conservazione",
    editSave: "Salva",
    editFailed: "La modifica non è stata salvata",
    sortAria: "Ordina le provviste",
    sortByExpiry: "Per scadenza",
    sortByName: "Per nome",
  },
  shopping: {
    fromRecipe: (name: string) => `da: ${name}`,
    title: "Lista della spesa",
    subtitle:
      "Compra tutto per il campo: spunta le voci, riprendi gli ingredienti direttamente dal ricettario.",
    subtitleLoggedOut:
      "La tua lista della spesa per il campo – compilata a mano o direttamente dal ricettario.",
    loginFeature: "la tua lista della spesa",
    addPlaceholder: "es. spaghetti …",
    addNameAria: "Aggiungi una voce alla lista della spesa",
    addButton: "Aggiungi",
    addFailed: "La voce non è stata salvata",
    quantityPlaceholder: "Quantità",
    addQuantityAria: "Quantità per la nuova voce (facoltativa)",
    alreadyOnList: (name: string) =>
      `${name} è già sulla lista – adatta quantità e nota direttamente sulla voce`,
    detailsAria: (name: string) => `Modifica quantità e nota di ${name}`,
    detailsTitle: "Quantità & nota",
    detailsQuantityLabel: "Quantità",
    detailsQuantityPlaceholder: "es. 2× oppure 500 g",
    detailsNoteLabel: "Nota",
    detailsNotePlaceholder: "es. in azione, senza lattosio …",
    detailsPriceLabel: "Prezzo (CHF)",
    detailsPricePlaceholder: "es. 3.50",
    detailsPriceHint:
      "Lascia vuoto se non vuoi registrare un prezzo. Il totale è in cima alla lista.",
    lastPriceSuggestion: (amount: string) =>
      `L'ultima volta: ${amount} – riprendi`,
    detailsPriceBooked:
      "Già ripreso nella cassa di viaggio – il prezzo resta come è stato registrato.",
    totalLabel: "Totale:",
    totalBreakdown: (open: string, checked: string) =>
      `in sospeso ${open} · spuntati ${checked}`,
    totalBooked: (booked: string) => `registrato ${booked}`,
    bookedBadge: "registrato",
    bookButton: (sum: string) => `Nella cassa di viaggio (${sum})`,
    bookTitle: "Riprendi nella cassa di viaggio",
    bookDesc:
      "Gli acquisti spuntati con un prezzo vengono registrati come una sola spesa nella cassa di viaggio. Le voci registrate non contano una seconda volta.",
    bookNothing:
      "Niente da riprendere: non c'è nessuna voce spuntata con un prezzo.",
    bookItemAria: (name: string) => `Registra anche ${name}`,
    bookSumLabel: (n: number) =>
      n === 1 ? "1 voce – totale" : `${n} voci – totale`,
    bookTripLabel: "Viaggio",
    bookNoTrips:
      "Non hai ancora nessun viaggio nel diario – creane uno prima, poi ci sarà anche la cassa di viaggio.",
    bookCategoryLabel: "Categoria",
    bookDayLabel: "Data",
    bookDescriptionLabel: "Descrizione",
    bookDescriptionPlaceholder: "es. spesa grande Migros",
    bookPaidByLabel: "Pagato da",
    bookPaidByPlaceholder: "Nome",
    bookConfirm: (sum: string) => `Registra ${sum}`,
    bookDone: (n: number, sum: string) =>
      `${n === 1 ? "1 voce registrata" : `${n} voci registrate`} come ${sum} nella cassa di viaggio`,
    bookFailed: "La ripresa nella cassa di viaggio non è riuscita",
    detailsFailed: "Quantità/nota non salvata",
    openTitle: "Ancora da comprare",
    doneTitle: "Fatto",
    itemCheckAria: (name: string) => `Spunta ${name}`,
    itemUncheckAria: (name: string) => `Riapri ${name}`,
    removeAria: (name: string) => `Rimuovi ${name} dalla lista`,
    removeChecked: "Rimuovi le voci spuntate",
    clearAll: "Svuota la lista",
    clearConfirm: "Vuoi davvero cancellare tutta la lista della spesa?",
    emptyTitle: "La lista della spesa è vuota",
    emptyText:
      "Aggiungi voci qui sopra – oppure riprendi gli ingredienti direttamente da una ricetta del ricettario.",
    openCount: (n: number) => (n === 1 ? "1 voce aperta" : `${n} voci aperte`),
    addedFromRecipe: (n: number) =>
      n === 1
        ? "1 ingrediente aggiunto alla lista della spesa"
        : `${n} ingredienti aggiunti alla lista della spesa`,
    openList: "Alla lista della spesa",
    addIngredients: "Ingredienti sulla lista della spesa",
    noCategory: "Senza categoria",
    addCategoryAria: "Scegli la categoria della nuova voce",
    itemCategoryAria: (name: string) => `Cambia la categoria di ${name}`,
    categoryChangeFailed: "La categoria non è stata salvata",
    newCategoryOption: "Nuova categoria …",
    newCategoryPlaceholder: "Nuova categoria",
    newCategoryAria: "Nome della nuova categoria",
    newCategorySave: "Salva categoria",
    reorderAria: (name: string) => `Sposta ${name}`,
    reorderFailed: "Il nuovo ordine non è stato salvato",
    printButton: "Stampa",
    shareButton: "Condividi",
    shareAria: "Condividi la lista della spesa tramite link",
    shareTitle: "Condividi la lista della spesa",
    shareDescription:
      "Chiunque abbia questo link vede la tua lista della spesa e può spuntare le voci senza accedere.",
    shareCopied:
      "Link di condivisione copiato – invialo ai tuoi compagni di viaggio",
    shareFailed: "Impossibile creare il link di condivisione",
    unshareButton: "Termina condivisione",
    unshared: "Condivisione terminata – il link non è più valido",
    unshareFailed: "Impossibile terminare la condivisione",
    shareQrAlt: "Codice QR del link di condivisione della lista della spesa",
    shareQrTitle: "Scansiona il codice QR",
    shareQrText:
      "I compagni scansionano il codice con la fotocamera del telefono e arrivano direttamente alla lista.",
    suggestionsAria: "Suggerimenti dalla cronologia e dalla lista",
    putAwayButton: "Sistema la spesa",
    putAwayTitle: "Sistema la spesa",
    putAwayDesc:
      "Scegli il magazzino e gli acquisti spuntati e indica facoltativamente un termine minimo di conservazione. Le voci riprese passano nelle tue scorte e vengono tolte dalla lista della spesa.",
    putAwayStorageLabel: "Magazzino",
    putAwayItemAria: (name: string) => `Metti ${name} nelle scorte`,
    putAwayExpiryAria: (name: string) =>
      `Termine minimo di conservazione per ${name} (facoltativo)`,
    putAwayAlreadyInFood: "già nelle scorte",
    putAwayConfirm: (n: number) =>
      n === 1 ? "Sistema 1 voce" : `Sistema ${n} voci`,
    putAwayDone: (n: number) =>
      n === 1
        ? "1 acquisto messo nelle scorte"
        : `${n} acquisti messi nelle scorte`,
    putAwayOpenFood: "Alle scorte",
    putAwayFailed:
      "Sistemazione non riuscita – le voci non ancora riprese restano sulla lista",
    listsAria: "Scegli la lista della spesa",
    tripListsLabel: "Liste dei viaggi:",
    tripListsAria: "Liste della spesa dei viaggi",
    listCounts: (open: number, done: number) =>
      `${open} da comprare · ${done} fatti`,
    manageListsButton: "Liste",
    manageListsAria: "Gestisci le liste della spesa",
    manageListsTitle: "Gestisci le liste della spesa",
    manageListsDescription:
      "Crea altre liste (per es. «Spesa settimanale» e «Campeggio»), rinominale, riordinale – oppure elimina una lista con tutte le sue voci.",
    newListPlaceholder: "Nome della nuova lista",
    newListButton: "Crea",
    listCreated: (name: string) => `Lista «${name}» creata`,
    listCreateFailed: "Impossibile creare la lista",
    listNameAria: (name: string) => `Nome di ${name}`,
    listSaveNameAria: (name: string) => `Salva il nuovo nome di ${name}`,
    listRenamed: "Lista rinominata",
    listRenameFailed: "Impossibile rinominare la lista",
    listDeleteAria: (name: string) => `Elimina la lista ${name}`,
    listDeleteConfirm: (name: string) =>
      `Eliminare la lista «${name}» con tutte le sue voci?`,
    listDeleted: "Lista eliminata",
    listDeleteFailed: "Impossibile eliminare la lista",
    listDeleteLastHint: "L'ultima lista resta sempre.",
    listMoveUpAria: (name: string) => `Sposta ${name} in alto`,
    listMoveDownAria: (name: string) => `Sposta ${name} in basso`,
    listOrderFailed: "Impossibile salvare l'ordine delle liste",
    targetListLabel: "Lista di destinazione",
    targetListAria: "Scegli la lista di destinazione",
    addedToNamedList: (name: string, list: string) =>
      `${name} aggiunto a «${list}»`,
    addedFromRecipeToList: (n: number, list: string) =>
      n === 1
        ? `1 ingrediente aggiunto a «${list}»`
        : `${n} ingredienti aggiunti a «${list}»`,
  },
  sharedShopping: {
    loading: "Caricamento della lista della spesa condivisa …",
    notFoundTitle: "Link scaduto o non valido",
    backHome: "Pagina iniziale",
    invalidLink:
      "Questo link di condivisione è scaduto, non è valido o è stato ritirato dalla proprietaria o dal proprietario.",
    subtitle: (open: number, total: number) =>
      `Lista della spesa condivisa · ${open} di ${total} voci aperte`,
    sharedInfo:
      "Spesa in comune: chi ha questo link vede lo stesso stato – la visualizzazione si aggiorna automaticamente.",
    emptyList: "Questa lista della spesa è ancora vuota.",
    allDone: "Tutto comprato – nessuna voce aperta.",
    checkAria: (name: string) => `Spunta ${name}`,
    uncheckAria: (name: string) => `Riapri ${name}`,
    toggleFailed: "Spunta non riuscita",
  },
  shoppingPrint: {
    docTitle: "Lista della spesa da stampare",
    appTitle: "CampMesser – il coltellino svizzero per il campeggio in tenda",
    printButton: "Stampa / Salva come PDF",
    printBrowserHint:
      "Nell'app installata il pulsante apre la vista nel browser – da lì stampa o salva come PDF dal menu.",
    headerKicker: "CampMesser · Lista della spesa",
    title: "Lista della spesa",
    meta: (items: number, categories: number) =>
      `${items} ${items === 1 ? "voce aperta" : "voci aperte"} · ${categories} ${categories === 1 ? "categoria" : "categorie"}`,
    printedOn: (date: string) => `Stato: ${date}`,
    emptyList: "Nessuna voce aperta – tutto comprato.",
    footer:
      "Buona spesa! · CampMesser – il coltellino svizzero per il campeggio in tenda",
  },
  menuPlan: {
    title: "Piano dei pasti",
    subtitle:
      "Pianifica per ogni giorno del tuo soggiorno cosa arriva sul tavolo da campeggio.",
    loginFeature: "il tuo piano dei pasti",
    notFoundTitle: "Soggiorno non trovato",
    notFoundText:
      "Questo soggiorno non esiste oppure non appartiene al tuo account.",
    backToTrips: "A «I miei viaggi»",
    daysCount: (n: number) => (n === 1 ? "1 giorno" : `${n} giorni`),
    slotEmpty: "Ancora niente in programma",
    planSlotAria: (meal: string, day: string) => `Pianifica ${meal} il ${day}`,
    clearSlotAria: (meal: string, day: string) => `Svuota ${meal} il ${day}`,
    dialogTitle: (meal: string) => `Pianifica: ${meal}`,
    dialogDescription:
      "Scegli una ricetta dal ricettario oppure inserisci un testo libero.",
    searchPlaceholder: "Cerca una ricetta …",
    searchAria: "Cerca una ricetta",
    chooseRecipeAria: (name: string) => `Scegli la ricetta ${name}`,
    minutes: (n: number) => `${n} min`,
    ownBadge: "Propria",
    noRecipesFound: "Nessuna ricetta trovata – usa il testo libero qui sotto.",
    freeTextLabel: "Oppure testo libero",
    freeTextPlaceholder: "es. avanzi del giorno prima, pizzeria del paese …",
    freeTextSave: "Usa il testo libero",
    saved: "Piano dei pasti aggiornato",
    addIngredients:
      "Ingredienti delle ricette pianificate sulla lista della spesa",
    noPlannedRecipes:
      "Ancora nessuna ricetta assegnata – scegli prima le ricette negli slot dei pasti.",
    summedFrom: (count: number) => `somma di ${count} righe di ingredienti`,
    printButton: "Stampa",
    autofillButton: "Riempi automaticamente",
    autofillNothing: "Nessuno slot dei pasti vuoto da riempire.",
    autofillDone: (n: number) =>
      n === 1
        ? "1 pasto pianificato automaticamente"
        : `${n} pasti pianificati automaticamente`,
    autofillUndo: "Annulla",
    autofillUndone: "Pianificazione automatica rimossa",
    autofillFailed: "Riempimento automatico non riuscito",
    editedBy: name => `di ${name}`,
    editedByTitle: (name, date) => `Ultima modifica di ${name} il ${date}`,
    dayNoteAria: (day: string) => `Modificare la nota del giorno per ${day}`,
    dayNoteTitle: "Nota del giorno",
    dayNoteDescription:
      "Una breve nota per la giornata – tutti i compagni di viaggio la vedono nel piano dei menu.",
    dayNoteLabel: "Nota",
    dayNotePlaceholder: "ad es. Serata in pizzeria",
    dayNoteRemove: "Rimuovi la nota",
    dayNoteSaved: "Nota salvata",
    dayNoteRemoved: "Nota rimossa",
    previewAria: (name: string) => `Vedi la ricetta ${name}`,
    previewServings: (n: number) => `${n} porzioni`,
    previewIngredients: "Ingredienti",
    stockAllCovered: "Tutti gli ingredienti sono nel frigo o nella dispensa.",
    stockMissing: (list: string) => `Manca nella scorta: ${list}`,
    previewSteps: "Preparazione",
    previewTip: "Consiglio",
    previewOpenInBook: "Apri nel ricettario",
  },
  tripShopping: {
    title: "Lista della spesa del viaggio",
    subtitle:
      "La lista della spesa comune di questo viaggio – tutti i compagni di viaggio vedono e modificano lo stesso stato.",
    loginFeature: "la lista della spesa del viaggio",
    openButton: "Lista spesa del viaggio",
    openAria: (name: string) => `Apri la lista della spesa del viaggio ${name}`,
    backToMenuPlan: "Al piano dei pasti",
    toPersonalLists: "Liste personali",
    emptyTitle: "Ancora nessuna voce",
    emptyText:
      "Aggiungi voci qui sopra – oppure riprendi gli ingredienti delle ricette pianificate dal piano dei pasti.",
    byUser: (name: string) => `di ${name}`,
    chooseTitle: "Su quale lista della spesa?",
    chooseDescription:
      "Questo viaggio è condiviso: gli ingredienti possono andare sulla lista comune del viaggio o sulla tua lista personale.",
    chooseTripList: "Lista del viaggio",
    chooseTripListHint: "In comune con tutti i compagni di viaggio",
    choosePersonalList: "Lista personale",
    choosePersonalListHint: "Visibile solo a te",
    addedFromMenu: (n: number) =>
      n === 1
        ? "1 ingrediente aggiunto alla lista della spesa del viaggio"
        : `${n} ingredienti aggiunti alla lista della spesa del viaggio`,
    openList: "Alla lista del viaggio",
  },
  menuPlanPrint: {
    docTitle: (name: string) => `${name} – piano dei pasti da stampare`,
    docTitleFallback: "Piano dei pasti",
    appTitle: "CampMesser – il coltellino svizzero per il campeggio in tenda",
    notFound: "Questo soggiorno non è stato trovato.",
    printButton: "Stampa / Salva come PDF",
    printBrowserHint:
      "Nell'app installata il pulsante apre la vista nel browser – da lì stampa o salva come PDF dal menu.",
    headerKicker: "CampMesser · Piano dei pasti",
    printedOn: (date: string) => `Stato: ${date}`,
    dayHeader: "Giorno",
    footer:
      "Buon appetito! · CampMesser – il coltellino svizzero per il campeggio in tenda",
  },
  family: {
    title: "Modalità famiglia",
    subtitle:
      "Liste bagagli a misura di bambino, attività durante il montaggio della tenda e conoscenze sulla natura in forma di gioco.",
    offlineNote:
      "Cacce al tesoro e quiz funzionano completamente offline – l'ideale per campeggi isolati.",
    huntsTitle: "Cacce al tesoro",
    huntsSubtitle:
      "Qualcosa da fare per i bambini mentre si monta la tenda – i progressi vengono salvati sul dispositivo.",
    startHuntAria: (title: string) => `Avvia la caccia al tesoro ${title}`,
    durationShort: (n: number) => `ca. ${n} min`,
    durationLong: (n: number) => `ca. ${n} minuti`,
    stationsCount: (n: number) => `${n} ${n === 1 ? "tappa" : "tappe"}`,
    playOnPhone: "Gioca sul telefono",
    printPdf: "Da stampare (PDF)",
    ownHuntsTitle: "Le tue cacce al tesoro",
    ownHuntsSubtitle:
      "Inventa avventure tutte tue – su misura per il vostro campeggio e l'età dei tuoi bambini.",
    play: "Gioca",
    print: "Stampa",
    deleteConfirm: (title: string) =>
      `Eliminare davvero la caccia al tesoro «${title}»?`,
    newHunt: "Crea una nuova caccia",
    newHuntAria: "Crea una nuova caccia al tesoro",
    quizzesTitle: "Quiz sulla natura",
    quizzesSubtitlePrefix: "Imparare giocando – in abbinamento all'",
    quizzesSubtitleLink: "Esploratore della natura",
    quizzesSubtitleSuffix: ".",
    lexiconQuizTitle: "Quiz natura",
    lexiconQuizAgeHint: "da circa 7 anni",
    lexiconQuizBadge: "dal lessico",
    lexiconQuizHint:
      "Viene ricomposto dal lessico della natura a ogni avvio – giocabile anche in duello.",
    startQuizAria: (title: string) => `Avvia il quiz ${title}`,
    questionCount: (n: number) => `${n} domande`,
    progressAria: (done: number, total: number) =>
      `${done} tappe su ${total} completate`,
    collectedLetters: "Lettere raccolte:",
    stationDoneAria: (title: string) => `Tappa completata: ${title}`,
    letterBadge: (letter: string) => `Lettera: ${letter}`,
    showHint: "Mostra indizio",
    readAloudAria: (title: string) => `Leggi la tappa ${title} ad alta voce`,
    readAloudStopAria: (title: string) =>
      `Interrompi la lettura della tappa ${title}`,
    secretStations: (n: number) =>
      n === 1
        ? "Ancora 1 tappa segreta – spunta la tappa attuale per proseguire!"
        : `Ancora ${n} tappe segrete – spunta la tappa attuale per proseguire!`,
    solutionWordLine: (word: string) => `Parola segreta: ${word}`,
    allDone: "Tutte le tappe completate!",
    resetAria: "Azzera i progressi",
    restart: "Ricomincia",
    done: "Fatto",
    scoreLine: (score: number, total: number) => `${score} giuste su ${total}!`,
    verdictPerfect: "Perfetto – la natura non ha più segreti per te!",
    verdictGood: "Fortissimo! La prossima volta le azzecchi tutte.",
    verdictTryAgain: "La pratica rende maestri – riprova subito!",
    again: "Di nuovo",
    questionProgress: (current: number, total: number) =>
      `Domanda ${current} di ${total}`,
    points: (n: number) => `${n} ${n === 1 ? "punto" : "punti"}`,
    quizProgressAria: "Avanzamento del quiz",
    answerAria: (option: string) => `Risposta: ${option}`,
    showResult: "Mostra il risultato",
    nextQuestion: "Prossima domanda",
    ownBadge: "Personale",
    newQuiz: "Crea un nuovo quiz",
    newQuizAria: "Crea un nuovo quiz",
    quizDeleteConfirm: (title: string) =>
      `Eliminare davvero il quiz «${title}»?`,
    quizShareButton: "Condividi",
    quizShareAria: (title: string) => `Condividi il quiz ${title} tramite link`,
    quizShareTitle: "Condividi quiz",
    quizShareDescription:
      "Chi ha il link può vedere il quiz e, con un account, salvarlo come quiz personale.",
    quizShareCopied: "Link di condivisione copiato – inoltralo!",
    quizShareFailed: "Condivisione non riuscita",
    quizSharedBadge: "condiviso",
    quizUnshare: "Termina condivisione",
    quizUnshared: "Condivisione terminata – il link non è più valido",
    quizUnshareFailed: "Impossibile terminare la condivisione",
    quizQrAlt: (title: string) =>
      `Codice QR del link di condivisione del quiz ${title}`,
    quizQrTitle: "Passalo direttamente",
    quizQrText:
      "Fai scansionare il codice con la fotocamera del telefono – il quiz si apre subito.",
    stopwatchAria: "Tempo trascorso del cronometro",
    bestTimeBadge: (time: string) => `Record: ${time}`,
    newBestTimeLine: (time: string) => `${time} – Nuovo record!`,
    finishTimeLine: (time: string, best: string) =>
      `Il tuo tempo: ${time} · Record: ${best}`,
    childrenTitle: "Bambini e distintivi",
    childrenSubtitle:
      "Aggiungi i tuoi bambini – raccolgono distintivi nelle cacce al tesoro e nei quiz.",
    childrenEmpty:
      "Nessun bambino ancora – aggiungi un nome qui sotto per poter raccogliere distintivi.",
    childNamePlaceholder: "Nome del bambino",
    addChild: "Aggiungi bambino",
    renameChildAria: (name: string) => `Rinomina ${name}`,
    renameSaveAria: (name: string) => `Salva il nuovo nome di ${name}`,
    deleteChildConfirm: (name: string) =>
      `Eliminare davvero ${name} con tutti i distintivi raccolti?`,
    deleteChildAria: (name: string) => `Elimina ${name}`,
    badgeCount: (n: number, total: number) => `${n} distintivi su ${total}`,
    badgeEarnedOn: (date: string) => `Ottenuto il ${date}`,
    badgeEarnedToast: (child: string, badge: string) =>
      `${child} ha un nuovo distintivo: ${badge}`,
    whoPlaysTitle: "Chi gioca?",
    whoPlaysDescription:
      "Scegli chi gioca – il bambino raccoglie distintivi per cacce e quiz completati.",
    whoPlaysNobody: "Gioca senza distintivi",
    duelMode: "Duello: due bambini uno contro l'altro",
    duelSetupTitle: "Duello di quiz",
    duelSetupDescription:
      "Due bambini rispondono a turno alle stesse domande – passate il dispositivo dopo ogni turno.",
    duelPickFirst: "Chi comincia?",
    duelPickSecond: "Chi gioca contro?",
    duelFirstChosen: (name: string) => `Comincia ${name}.`,
    duelVs: (a: string, b: string) => `${a} contro ${b}`,
    duelNowPlaying: (name: string) => `Tocca a ${name}!`,
    duelHandoverHint: (name: string) => `Passa il dispositivo a ${name}.`,
    duelGo: "Si parte!",
    duelPassTo: (name: string) => `Avanti – tocca a ${name}`,
    duelScore: (name: string, points: number) => `${name}: ${points}`,
    duelTie: "Pareggio!",
    duelWinner: (name: string) => `Vince ${name}!`,
    quizEditor: {
      titleEdit: "Modifica quiz",
      titleNew: "Crea il tuo quiz",
      description:
        "Le tue domande con risposte e spiegazione – salvato nel tuo account, giocabile come i quiz integrati.",
      updated: "Quiz aggiornato",
      created: "Quiz creato",
      titleLabel: "Titolo",
      titlePlaceholder: "ad es. Il quiz del nostro campeggio",
      questionsTitle: (n: number) => `Domande (${n})`,
      questionPlaceholder: "Domanda, ad es. «Quale uccello canta di notte?»",
      questionAria: (n: number) => `Domanda ${n}`,
      removeQuestionAria: (n: number) => `Rimuovi la domanda ${n}`,
      correctHint: "Segna la risposta giusta con il punto a sinistra.",
      optionPlaceholder: (n: number) => `Risposta ${n}`,
      optionAria: (q: number, o: number) => `Risposta ${o} della domanda ${q}`,
      correctAria: (q: number, o: number) =>
        `Segna la risposta ${o} della domanda ${q} come corretta`,
      explanationPlaceholder: "Spiegazione dopo la risposta (facoltativa)",
      explanationAria: (n: number) => `Spiegazione della domanda ${n}`,
      addQuestion: "Aggiungi una domanda",
    },
    editor: {
      titleEdit: "Modifica caccia al tesoro",
      titleNew: "Crea la tua caccia al tesoro",
      description:
        "Storia, tappe e finale col tesoro – salvata nel tuo account, giocabile e stampabile come le cacce integrate.",
      updated: "Caccia al tesoro aggiornata",
      created: "Caccia al tesoro creata",
      titleLabel: "Titolo",
      titlePlaceholder: "ad es. Il segreto della riva del lago",
      ageLabel: "Età (facoltativo)",
      agePlaceholder: "ad es. da 6 anni",
      durationLabel: "Durata (minuti)",
      introLabel: "La missione (storia di cornice)",
      introPlaceholder:
        "Chi ha bisogno di aiuto? Che cosa è successo? Qual è l'obiettivo?",
      prepLabel: "Per gli adulti (facoltativo)",
      prepPlaceholder: "Che cosa va nascosto o preparato prima?",
      stationsTitle: (n: number) => `Tappe (${n})`,
      defaultStationTitle: (n: number) => `Tappa ${n}`,
      stationTitleAria: (n: number) => `Titolo della tappa ${n}`,
      removeStationAria: (n: number) => `Rimuovi la tappa ${n}`,
      storyPlaceholder:
        "Testo narrativo (facoltativo): come continua qui la storia?",
      storyAria: (n: number) => `Storia della tappa ${n}`,
      taskPlaceholder:
        "Compito o indovinello, ad es. «Trovate tre foglie diverse»",
      taskAria: (n: number) => `Compito della tappa ${n}`,
      hintPlaceholder: "Indizio se i bambini si bloccano (facoltativo)",
      hintAria: (n: number) => `Indizio della tappa ${n}`,
      letterPlaceholder: "Let.",
      letterAria: (n: number) =>
        `Lettera della tappa ${n} per la parola segreta`,
      addStation: "Aggiungi tappa",
      solutionPreviewLabel: "Parola segreta dalle lettere:",
      finaleLabel: "Il finale (tesoro/ricompensa)",
      finalePlaceholder:
        "Che cosa succede quando tutte le tappe sono completate?",
    },
  },
  travelBingo: {
    title: "Bingo di viaggio",
    subtitle:
      "Che cosa scoprite lungo la strada? Tocca quello che passa – una riga, una colonna o una diagonale completa è bingo.",
    empty:
      "Ancora nessuna cartella – creane una qui sotto. Due bambini ricevono due cartelle diverse.",
    howTo:
      "Ogni cartella viene mescolata di nuovo, così nessuna è uguale all'altra. I progressi restano sul dispositivo – anche senza rete.",
    namePlaceholder: "Nome",
    nameAria: (name: string) => `Nome della cartella di ${name}`,
    newNameAria: "Nome della nuova cartella",
    sizeBadge: (size: number) => `${size} × ${size} caselle`,
    sizeOption: (size: number) => `${size} × ${size}`,
    switchSize: (size: number) => `Passa a ${size} × ${size}`,
    switchSizeAria: (name: string, size: number) =>
      `Passare la cartella di ${name} a ${size} × ${size}`,
    cardFallbackName: (n: number) => `Cartella ${n}`,
    cellAria: (label: string) => `${label} – segna come trovato`,
    cellFoundAria: (label: string) => `${label} – trovato, tocca per annullare`,
    progressAria: (name: string) => `Progressi del bingo di ${name}`,
    foundCount: (done: number, total: number) => `${done} su ${total} trovati`,
    bingoBanner: (lines: number) =>
      lines === 1
        ? "Bingo! Una linea è completa."
        : `Bingo! Già ${lines} linee complete.`,
    fullCardBanner: "Cartella tutta piena – avete scoperto tutto!",
    bingoToast: (name: string) => `Bingo per ${name}!`,
    fullCardToast: (name: string) => `${name} ha riempito tutta la cartella!`,
    newCard: "Nuova cartella",
    newCardAria: (name: string) => `Mescola una nuova cartella per ${name}`,
    reset: "Azzera",
    resetAria: (name: string) => `Azzera i progressi di ${name}`,
    removeConfirm: (name: string) =>
      `Vuoi davvero rimuovere la cartella di ${name}?`,
    removeAria: (name: string) => `Rimuovi la cartella di ${name}`,
    addCard: "Aggiungi cartella",
    maxCardsReached: (n: number) =>
      `Non si possono avere più di ${n} cartelle insieme – rimuovine prima una.`,
  },
  bedtimeStories: {
    title: "Storie della buonanotte",
    subtitle:
      "Brevi storie da leggere ad alta voce – bosco, montagna e campeggio, da tre a cinque minuti, e poi si dorme.",
    empty:
      "Per questa selezione non c'è nessuna storia – scegli un'altra stagione o un'altra età.",
    seasonFilterLabel: "Stagione:",
    seasonAll: "Tutte",
    seasonAllYear: "tutto l'anno",
    season: {
      spring: "Primavera",
      summer: "Estate",
      autumn: "Autunno",
      winter: "Inverno",
    },
    ageFilterLabel: "Età:",
    ageAll: "Tutte",
    ageOption: (age: number) => `${age} anni`,
    ageBadge: (age: number) => `da ${age} anni`,
    minutesBadge: (minutes: number) => `${minutes} min di lettura`,
    readBadge: "già letta",
    openAria: (title: string) => `Apri la storia ${title}`,
    readAloud: "Ascolta la storia",
    readAloudStop: "Ferma la lettura",
    readAloudAria: (title: string) => `Leggi ad alta voce la storia ${title}`,
    readAloudStopAria: (title: string) => `Ferma la lettura di ${title}`,
    markRead: "Segna come letta",
    markUnread: "Togli il segno",
  },
  arrival: {
    title: "Quanto manca?",
    subtitle:
      "La barra di avanzamento per il sedile posteriore: quanta strada verso il campeggio avete già fatto?",
    loginHint:
      "Accedi, così CampMesser può proporti come meta le piazzole che hai salvato.",
    noSpots:
      "Nessuna piazzola salvata finora – crea prima una piazzola, poi potrai sceglierla come meta.",
    suggestedFromTrip:
      "Viene proposta la piazzola del tuo viaggio in corso o del prossimo – puoi anche sceglierne un'altra.",
    suggestedWithoutTrip: "Scegli la piazzola verso cui siete diretti.",
    targetSelectAria: "Scegli la meta del viaggio",
    targetPlaceholder: "Scegli la meta",
    start: "Si parte",
    startNote:
      "Toccando il pulsante la tua posizione attuale diventa il punto di partenza. Poi CampMesser misura in modo approssimativo una volta al minuto – così risparmia la batteria.",
    locationFailed:
      "Non è stato possibile determinare la posizione – senza punto di partenza purtroppo non funziona.",
    straightLineBadge: "in linea d'aria",
    straightLineNote:
      "Il calcolo è in linea d'aria. La strada è più lunga – su un passo molto più lunga.",
    stop: "Termina il viaggio",
    progressAria: (name: string) => `Avanzamento del viaggio verso ${name}`,
    startLabel: "Partenza",
    targetLabel: "Meta",
    percent: (value: number) => `${value} %`,
    remaining: (distance: string) => `ancora ${distance} in linea d'aria`,
    ofTotal: (distance: string) => `su ${distance} in totale`,
    arrived: (name: string) => `Arrivati – benvenuti a ${name}!`,
    encouragement: (next: number) =>
      next >= 100
        ? "L'ultimo pezzo – ci siete quasi!"
        : `Continuate così – al traguardo del ${next} per cento manca poco.`,
    milestoneToast: (percent: number) => `${percent} % fatto!`,
    refresh: "Misura adesso",
    lastFix: (time: string) => `ultima misura alle ${time}`,
    noFixYet: "ancora nessuna misura",
    geoDenied:
      "La posizione è bloccata – autorizzala nelle impostazioni del browser, altrimenti la barra resta ferma.",
    geoUnsupported: "Questo browser non conosce la geolocalizzazione.",
    geoFailed:
      "Al momento non è stato possibile rilevare la posizione – CampMesser riprova fra un minuto.",
  },
  huntPrint: {
    docTitle: (title: string) => `${title} – caccia al tesoro da stampare`,
    docTitleFallback: "Caccia al tesoro",
    appTitle: "CampMesser – il coltellino svizzero per il campeggio in tenda",
    notFound: "Questa caccia al tesoro non è stata trovata.",
    printButton: "Stampa / Salva come PDF",
    printBrowserHint:
      "Nell'app installata il pulsante apre la vista nel browser – da lì stampa o salva come PDF dal menu.",
    headerKicker: "CampMesser · Caccia al tesoro",
    meta: (age: string, minutes: number, stations: number) =>
      `${age} · ca. ${minutes} minuti · ${stations} ${stations === 1 ? "tappa" : "tappe"}`,
    missionTitle: "La missione",
    adultsTitle: "Per gli adulti (da leggere prima)",
    taskLabel: "Compito:",
    hintLabel: "Indizio (solo se siete bloccati):",
    doneLabel: "Fatto? Spuntate:",
    letterLabel: "La vostra lettera:",
    solutionTitle: "La parola segreta",
    solutionText: (n: number) =>
      `Scrivete le lettere raccolte in ordine (${n} lettere):`,
    finaleTitle: "Il finale",
    footer:
      "Buona scoperta! · CampMesser – il coltellino svizzero per il campeggio in tenda",
  },
  badgeCertificate: {
    docTitle: (name: string) => `Diploma per ${name}`,
    docTitleFallback: "Diploma",
    appTitle: "CampMesser – il coltellino svizzero per il campeggio in tenda",
    loginFeature: "il diploma dei distintivi",
    notFound: "Questo bambino non è stato trovato.",
    galleryLink: "Stampa il diploma",
    printButton: "Stampa il diploma",
    printBrowserHint:
      "Nell'app installata il pulsante apre la vista nel browser – da lì stampa o salva come PDF dal menu.",
    kicker: "CampMesser · Modalità famiglia",
    heading: "Diploma",
    awardedTo: "conferito a",
    badgesIntro: (n: number) =>
      n === 1
        ? "per questo distintivo guadagnato"
        : `per questi ${n} distintivi guadagnati`,
    earnedOn: (date: string) => `ottenuto il ${date}`,
    noBadges:
      "Nessun distintivo guadagnato finora – gioca a una caccia al tesoro o a un quiz e il diploma si riempirà.",
    issuedOn: (date: string) => `Rilasciato il ${date}`,
    footer: "CampMesser – il coltellino svizzero per il campeggio in tenda",
  },
  notFound: {
    heading: "Pagina non trovata",
    text1: "Questa pagina purtroppo non esiste.",
    text2: "Forse è stata spostata o eliminata.",
    goHome: "Alla pagina iniziale",
  },
  loginPrompt: {
    required: "Accesso richiesto",
    body: feature =>
      `Accedi per salvare ${feature} e sincronizzare su tutti i tuoi dispositivi.`,
    cta: "Accedi ora",
  },
  pageHeader: {
    overview: "Panoramica",
    backAria: label => `Torna a: ${label}`,
  },
  quickActions: {
    fabAria: "Apri le azioni rapide",
    title: "Azioni rapide",
    subtitle: "Parti subito – senza passare dalla pagina iniziale.",
    searchPlaceholder: "Cerca un'azione …",
    noResults: "Nessuna azione trovata.",
    newTrip: "Nuova voce di viaggio",
    newPackList: "Nuova lista bagagli",
    recipeSearch: "Cerca una ricetta",
    sos: "SOS & emergenza",
    shoppingAdd: "Aggiungi alla lista della spesa",
    shoppingPlaceholder: "ad es. latte …",
    shoppingSubmit: "Aggiungi",
    shoppingAdded: (name: string) => `${name} aggiunto alla lista della spesa`,
    shoppingExists: (name: string) => `${name} è già sulla lista della spesa`,
    shoppingFailed: "La voce non è stata salvata",
    backToActions: "Torna alle azioni",
  },
  install: {
    title: "Installa CampMesser",
    description:
      "Come app sul tuo dispositivo: si avvia più in fretta e funziona offline.",
    installButton: "Installa",
    iosStep1: "Tocca l'icona di condivisione",
    iosStep2: "e scegli «Aggiungi a Home» per installare l'app.",
    shareIcon: "Icona di condivisione",
    dismiss: "Chiudi l'avviso di installazione",
  },
  update: {
    title: "Nuova versione disponibile",
    description:
      "È pronta una versione aggiornata di CampMesser. Con l'aggiornamento la pagina si ricarica una volta.",
    reloadButton: "Aggiorna",
    dismiss: "Chiudi l'avviso di aggiornamento",
  },
  whatsNew: {
    title: "Novità",
    startIntro: "Ecco cosa è cambiato dalla tua ultima visita:",
    allIntro: "Tutte le novità in sintesi:",
    confirm: "Capito",
  },
  shareTarget: {
    title: "Foto condivise",
    subtitle:
      "Aggiungi direttamente a un viaggio le foto condivise dal tuo dispositivo.",
    loginFeature: "l'aggiunta di foto condivise",
    emptyTitle: "Nessuna foto condivisa trovata",
    emptyText:
      "Apri questa pagina tramite la funzione di condivisione del tuo dispositivo: scegli una foto → Condividi → CampMesser. La voce appare nel menu di condivisione dopo la (re)installazione o l'aggiornamento dell'app.",
    photosCount: (n: number) =>
      n === 1 ? "1 foto pronta" : `${n} foto pronte`,
    photoAlt: (n: number) => `Foto condivisa ${n}`,
    removePhotoAria: (n: number) => `Rimuovi la foto condivisa ${n}`,
    tripLabel: "A quale viaggio?",
    tripAria: "Scegli un viaggio",
    noTrips: "Ancora nessun viaggio – crea prima una voce in «I miei viaggi».",
    toTrips: "A «I miei viaggi»",
    upload: "Carica le foto nel viaggio",
    uploading: (done: number, total: number) =>
      `Caricamento della foto ${done} di ${total} …`,
    uploadFailed: (n: number) =>
      n === 1
        ? "1 foto non è stata caricata."
        : `${n} foto non sono state caricate.`,
    limitReached:
      "Limite di foto del viaggio raggiunto – non tutte le foto sono state salvate.",
    successTitle: "Foto salvate",
    successText: (n: number) =>
      n === 1
        ? "1 foto è stata aggiunta al viaggio."
        : `${n} foto sono state aggiunte al viaggio.`,
    toTrip: "Al viaggio",
  },

  notes: {
    title: "Note",
    subtitle:
      "Note libere con parole chiave – per tutto ciò che non trova posto in nessun altro modulo.",
    loginFeature: "le tue note",
    addButton: "Nuova nota",
    searchPlaceholder: "Cerca nelle note …",
    searchAria: "Cerca nei titoli, nei testi e nelle parole chiave",
    tagFilterAria: "Filtra per parole chiave",
    tagFilterClear: "Togli il filtro",
    emptyTitle: "Ancora nessuna nota",
    emptyBody:
      "Annota quello che non trova posto altrove – il numero del custode, il trucco per estrarre i picchetti, un'idea per la prossima estate.",
    noMatches: "Nessuna nota corrisponde alla tua ricerca.",
    untitled: "Senza titolo",
    updatedAt: (date: string) => `modificata il ${date}`,
    newTitle: "Nuova nota",
    editTitle: "Modifica la nota",
    dialogDesc:
      "Il titolo è facoltativo. Le parole chiave ti aiutano a ritrovare le note – compaiono come filtri sopra l'elenco.",
    titleLabel: "Titolo (facoltativo)",
    titlePlaceholder: "p. es. idee per il Ticino",
    textLabel: "Nota",
    textPlaceholder: "Scrivi liberamente …",
    tagsLabel: "Parole chiave",
    tagsPlaceholder: "p. es. Ticino, estate, tenda",
    tagsHint: (max: number) =>
      `Separale con la virgola, al massimo ${max} parole chiave. Maiuscole e minuscole non contano.`,
    textRequired: "Scrivi prima qualcosa.",
    save: "Salva",
    saved: "Nota salvata",
    updated: "Nota aggiornata",
    saveFailed: "Impossibile salvare la nota",
    deleted: "Nota eliminata",
    deleteFailed: "Impossibile eliminare la nota",
    deleteConfirm: "Vuoi davvero eliminare questa nota?",
    editAria: (title: string) => `Modifica la nota ${title}`,
    deleteAria: (title: string) => `Elimina la nota ${title}`,
    photoLabel: "Foto (facoltativa)",
    photoChoose: "Scegli foto",
    photoChange: "Cambia foto",
    photoRemove: "Rimuovi foto",
    photoPreviewAlt: "Anteprima della foto della nota",
    photoHint:
      "JPEG, PNG o WebP – ridotta automaticamente prima del caricamento.",
    photoUploading: "Caricamento della foto …",
    photoUploadFailed: "Salvato, ma la foto non è stata caricata.",
    photoTooLarge: "La foto è troppo grande (max. 5 MB).",
    photoHeic: "Il browser non legge HEIC/HEIF – esporta come JPEG.",
    photoReadFailed: "Impossibile leggere l'immagine.",
    photoRemoveFailed: "Impossibile rimuovere la foto.",
    photoAlt: (title: string) => `Foto della nota ${title}`,
  },
  shareLinks: {
    title: "Link di condivisione attivi",
    intro:
      "Tutto ciò che condividi attualmente tramite link, in un unico posto. La disattivazione è immediata – dopo, il link non porta più a nulla.",
    empty: "Al momento nulla è condiviso tramite link.",
    unnamed: "Senza nome",
    expires: (date: string) => `scade il ${date}`,
    copyAria: (label: string) => `Copia il link a ${label}`,
    revokeButton: "Disattiva",
    revokeConfirm: (label: string) =>
      `Disattivare il link di condivisione a «${label}»?`,
    revoked: "Link di condivisione disattivato",
    kinds: {
      spot: "Dossier della piazzola",
      packList: "Lista bagagli",
      packTemplate: "Modello di lista",
      trip: "Viaggio",
      recipe: "Ricetta",
      quiz: "Quiz",
      shopping: "Lista della spesa",
      track: "Escursione",
      location: "Posizione",
    },
  },
  devices: {
    title: "Dispositivi connessi",
    intro:
      "Ogni accesso a questo account, con l'ultima attività. Un dispositivo disconnesso è fuori subito – anche se è il telefono dimenticato sul treno.",
    empty: "Nessun accesso registrato.",
    unknownDevice: "Dispositivo sconosciuto",
    currentBadge: "Questo dispositivo",
    lastSeen: (date: string) => `Ultima attività: ${date}`,
    signedInAt: (date: string) => `Accesso: ${date}`,
    revokeButton: "Disconnetti",
    revokeConfirm: "Disconnettere questo dispositivo?",
    revoked: "Dispositivo disconnesso",
    revokeOthersButton: "Disconnetti tutti gli altri dispositivi",
    revokeOthersConfirm:
      "Disconnettere tutti gli altri dispositivi? Questo dispositivo resta connesso.",
    othersRevoked: (n: number) =>
      n === 1 ? "1 dispositivo disconnesso" : `${n} dispositivi disconnessi`,
    legacyHint:
      "Gli accessi precedenti a questa panoramica compaiono solo dopo il prossimo accesso del dispositivo.",
  },
  fuelLog: {
    title: "Libretto carburante",
    subtitle: "I pieni con chilometraggio – per il consumo reale.",
    loginFeature: "il libretto carburante",
    averageTitle: "Consumo medio",
    averageHint:
      "Ponderato su tutti i tratti plausibili. Il calcolatore dei costi di viaggio nella cassa può riprendere questo valore.",
    addTitle: "Registra un pieno",
    addHint:
      "Fai sempre il pieno completo – solo così il calcolo tra due pieni è corretto. Il prezzo è facoltativo.",
    dayLabel: "Data",
    odometerLabel: "Chilometraggio",
    litersLabel: "Litri",
    priceLabel: "Pagato (CHF, facoltativo)",
    addButton: "Registra",
    saved: "Pieno registrato",
    odometerInvalid: "Inserisci un chilometraggio valido.",
    litersInvalid: "Inserisci i litri (max. 200).",
    priceInvalid: "L'importo non è valido.",
    empty:
      "Nessun pieno registrato. Dal secondo pieno il libretto calcola il consumo.",
    segmentLine: (km: number, l100: string) =>
      `${km} km dall'ultimo pieno · ${l100} l/100 km`,
    segmentImplausible: "(non plausibile, escluso dalla media)",
    deleteConfirm: "Eliminare questo pieno?",
    deleteAria: (km: number) => `Elimina il pieno a ${km} km`,
  },
  stats: {
    expensesTitle: "Spese di tutti i viaggi",
    expensesLink: "Ai viaggi",
    expensesTotal: "Totale",
    expensesPerNight: "Ø a notte",
    expensesTopCategory: "Categoria più cara",
    expensesYearDetail: (trips: number, nights: number, perNight: string) =>
      `${trips === 1 ? "1 viaggio" : `${trips} viaggi`} · ${nights === 1 ? "1 notte" : `${nights} notti`} · ${perNight}/notte`,
    expensesHint:
      "Vengono contate le casse dei tuoi viaggi. Una spesa conta per l'anno del viaggio – un viaggio di Capodanno sta interamente nell'anno della partenza.",
    title: "Statistiche",
    subtitle:
      "Tutte le tue analisi in un colpo d'occhio – viaggi, fortuna meteo, traguardi, nodi, specie e famiglia.",
    loginFeature: "le statistiche",
    tripsTitle: "Statistiche dei viaggi",
    tripsLink: "I miei viaggi",
    tripsEmpty: "Nessun soggiorno registrato finora.",
    nightsInYear: year => `Notti ${year}`,
    nightsTotal: "Notti in totale",
    staysLabel: "Soggiorni",
    favoriteLabel: "Piazzola preferita",
    avgRatingLabel: "Valutazione media",
    weatherLuckTitle: "Fortuna meteo",
    weatherLuckDry: pct =>
      `Il ${pct} % dei tuoi giorni di campeggio è stato asciutto`,
    weatherLuckAvgMax: temp => `massima giornaliera media ${temp}°`,
    weatherLuckWarmest: (place, temp) => `luogo più caldo: ${place} (${temp}°)`,
    weatherLuckHint: n =>
      n === 1
        ? "Dall'archivio meteo di 1 soggiorno"
        : `Dall'archivio meteo di ${n} soggiorni`,
    spotCostsTitle: "Confronto piazzole: prezzo per notte",
    spotCostsLink: "Piazzole",
    spotCostsPerNight: (amount: string) => `${amount} / notte`,
    spotCostsEstimate: (nights: number, amount: string) =>
      `≈ ${amount} per ${nights === 1 ? "1 notte" : `${nights} notti`}`,
    spotCostsTotal: (amount: string) =>
      `Tutte le tue notti in queste piazzole insieme: circa ${amount}.`,
    spotCostsHint:
      "Prezzo per notte inclusa tassa di soggiorno e spese accessorie, la più conveniente in alto. I totali sono notti × prezzo e quindi solo una stima – quanto hai pagato davvero è nella cassa del viaggio corrispondente.",
    yearCompareTitle: "Notti per anno",
    nightsCount: n => (n === 1 ? "1 notte" : `${n} notti`),
    milestonesTitle: "Traguardi",
    milestonesAchieved: (achieved, total) =>
      `${achieved} traguardi raggiunti su ${total}`,
    milestonesNextTitle: "Prossimi obiettivi",
    milestonesProgress: (current, target) => `${current} di ${target}`,
    knotsTitle: "Progressi con i nodi",
    knotsLink: "Allenati",
    knotsSummary: (secure, total) => `${secure} nodi su ${total} sono sicuri`,
    knotsProgressAria: "Quota di nodi padroneggiati",
    knotsSecure: "sicuri",
    knotsPractice: "da ripassare",
    knotsFresh: "nuovi",
    natureTitle: "Album delle specie",
    natureLink: "Apri Natura",
    natureCollection: (seen, total) => `${seen} specie osservate su ${total}`,
    natureSightings: n => (n === 1 ? "1 osservazione" : `${n} osservazioni`),
    natureProgressAria: "Progresso dell'album delle specie",
    familyTitle: "Distintivi dei bambini",
    familyLink: "Modalità famiglia",
    familyBadges: (earned, total) => `${earned} distintivi su ${total}`,
    familyEmpty: "Nessun profilo bambino creato finora.",
    footnote:
      "Tutti i numeri nascono dalle tue registrazioni – questa pagina li mostra soltanto, li modifichi nel modulo corrispondente.",
  },

  transit: {
    sectionAria: "Trasporti pubblici dalla piazzola",
    title: "Trasporti pubblici",
    subtitle: "Fermate nei dintorni e le loro prossime partenze.",
    subtitleAtPlace: place =>
      `Fermate attorno a ${place} e le loro prossime partenze.`,
    loadingStations: "Ricerca delle fermate …",
    loadingBoard: "Caricamento delle partenze …",
    loadFailed:
      "L'orario non si è potuto caricare in questo momento. Riprova tra un attimo.",
    emptyStations:
      "Qui l'orario svizzero non trova nessuna fermata. Copre la Svizzera e il traffico transfrontaliero – per una piazzola più lontana all'estero CampMesser qui non sa nulla.",
    emptyBoard: "Da questa fermata non è prevista nessuna partenza a breve.",
    kind: {
      train: "Treno",
      bus: "Autobus",
      tram: "Tram",
      ship: "Battello",
      cableway: "Funivia",
      other: "Fermata",
    },
    stationAria: name => `Mostrare le partenze da ${name}`,
    distanceAway: value => `a ${value}`,
    delay: minutes => `+${minutes} min`,
    platform: value => `Binario ${value}`,
    refresh: "Aggiornare",
    refreshStations: "Cercare di nuovo le fermate",
    source:
      "Dati d'orario da transport.opendata.ch – interrogati solo su tuo clic. Vengono mostrate solo le partenze future; i ritardi compaiono dove l'orario li segnala.",
  },

  sharing: {
    validityLabel: "Valido",
    validityUnlimited: "illimitato",
    validityDays: n => `${n} giorni`,
    validityAria: "Validità del link di condivisione",
    expiresOn: date => `Scade il ${date}`,
    expiredOrInvalid: "Link scaduto o non valido",
  },
};
