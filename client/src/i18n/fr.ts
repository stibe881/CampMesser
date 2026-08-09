import type { Translation } from "./de";

/** Dictionnaire français. */
export const fr: Translation = {
  common: {
    loading: "Chargement",
    save: "Enregistrer",
    saving: "Enregistrement …",
    cancel: "Annuler",
    delete: "Supprimer",
    confirmLeave: "Quitter",
    confirmDiscard: "Abandonner",
    confirmEmpty: "Vider",
    confirmReset: "Réinitialiser",
    confirmStop: "Arrêter",
    edit: "Modifier",
    copy: "Copier",
    linkCopied: "Lien copié",
    copyFailed: "Copie impossible – sélectionne le texte manuellement",
    back: "Retour",
    today: "Aujourd'hui",
    tomorrow: "demain",
    optional: "facultatif",
    night: "nuit",
    nights: "nuits",
    deleteFailed: "Échec de la suppression",
    saveFailed: "Échec de l'enregistrement",
    actionFailed: "Échec de l'action",
    offlineBadge: "Hors ligne",
    distanceByRoad: (value: string) => `${value} par la route`,
    distanceOnPath: (value: string) => `${value} par le chemin`,
    screenAwake: "L'écran reste allumé",
  },
  password: {
    strengthLabel: "Force du mot de passe",
    weak: "faible",
    medium: "moyen",
    good: "bon",
    strong: "fort",
    strengthAria: (label: string) => `Force du mot de passe : ${label}`,
    hints: {
      tooShort: "Utilise au moins 8 caractères",
      addLength:
        "Fais-le plus long – dès 12 caractères, c'est nettement plus sûr",
      addCase: "Mélange majuscules et minuscules",
      addNumber: "Ajoute au moins un chiffre",
      addSpecial: "Ajoute un caractère spécial, p. ex. ! ? #",
      avoidCommon: "Évite les mots courants et les suites de chiffres",
      avoidRepeat: "Évite les répétitions comme « aaa »",
    },
  },
  shell: {
    toHome: "Vers la page d'accueil",
    skipToContent: "Aller au contenu",
    themeLight: "Activer le thème clair",
    themeDark: "Activer le thème sombre",
    themeAuto: "Activer le thème automatique (système)",
    notificationsMenu: "Afficher les notifications",
    notificationsUnread: (count: number) =>
      count === 1
        ? "Afficher les notifications – 1 nouvelle"
        : `Afficher les notifications – ${count} nouvelles`,
    notificationsTitle: "Notifications",
    accountMenu: "Ouvrir le menu du compte",
    loggedIn: "Connecté·e",
    profile: "Profil",
    logout: "Se déconnecter",
    login: "Se connecter",
    sosAria: "SOS – ouvrir le tableau de bord d'urgence",
    mainNav: "Navigation principale",
    nav: {
      start: "Accueil",
      pack: "Bagages",
      sun: "Soleil",
      weather: "Météo",
      firstAid: "Premiers secours",
      sos: "SOS",
    },
  },
  /** Offline-Hinweise: Band in der Kopfzeile und Stand der Daten. */
  /** Karten-App-Wahl beim Öffnen einer Route. */
  directions: {
    title: "Naviguer avec quoi ?",
    description:
      "L\u2019itinéraire peut s\u2019ouvrir dans Plans d\u2019Apple ou dans Google Maps.",
    apple: "Plans (Apple)",
    google: "Google Maps",
    remember: "Retenir le choix et ne plus demander",
    changeHint: "Tu peux le changer à tout moment dans le profil.",
    settingLabel: "Application de cartes pour les itinéraires",
    settingAsk: "Demander à chaque fois",
    settingHint:
      "Détermine avec quoi s\u2019ouvrent « Itinéraire » et « S\u2019y rendre ». « Demander à chaque fois » repose la question.",
  },
  /** Himmel-Seite: Mond, Sternschnuppen, ISS, Sternbilder, Rotlicht. */
  sky: {
    title: "Ciel",
    subtitle: "Lune, étoiles filantes, ISS et constellations pour cette nuit",
    fromNatureHint:
      "Lune, obscurité, étoiles filantes, ISS et constellations – désormais sur une page à part",
  },
  /** «Konnte nicht geladen werden» – der dritte Zustand neben Laden und Leer. */
  queryError: {
    title: "Chargement impossible",
    text: "Le serveur n\u2019a pas répondu comme prévu. Tes données ne sont pas perdues – réessaie tout de suite.",
    offlineTitle: "Impossible à charger hors ligne",
    offlineText:
      "Cette partie n\u2019a encore jamais été chargée et n\u2019est donc pas sur l\u2019appareil. Elle sera là dès que tu auras du réseau.",
    retry: "Réessayer",
  },
  offline: {
    banner: "Pas de connexion – tu vois des données enregistrées.",
    dataAge: (time: string) => `État du ${time}`,
    synced: (count: number) =>
      count === 1
        ? "1 modification envoyée."
        : `${count} modifications envoyées.`,
  },
  home: {
    recentSearches: "Recherches récentes :",
    recentSearchesClear: "effacer",
    heroImageAlt:
      "Tente avec panneaux solaires et feu de camp devant les Alpes suisses au coucher du soleil",
    heroKicker: "Ta boussole pour les vacances, le camping et les excursions",
    greeting: {
      morning: (name: string) => `Bonjour, ${name}`,
      day: (name: string) => `Bonjour, ${name}`,
      evening: (name: string) => `Bonsoir, ${name}`,
    },
    tripArrivalAt: (time: string) => `Arrivée ${time}`,
    heroTitle1: "Tout pour le camp.",
    heroTitle2: "Dans une seule app.",
    heroSubtitle:
      "Planification, sécurité, énergie et nature – plus de 40 outils malins pour ta prochaine aventure.",
    sunInfo: (sunrise, sunset) =>
      `Aujourd'hui : lever du soleil ${sunrise} · coucher du soleil ${sunset}`,
    nextTripFallback: "Prochain trip",
    nextTripAria: place => `Prochain séjour planifié : ${place}`,
    tripStartsToday: "C'est parti aujourd'hui !",
    tripStartsTomorrow: "Départ demain !",
    tripDaysLeft: n => `Encore ${n} jours`,
    tripPacked: (name, checked, total, pct) =>
      `${name} : ${checked} sur ${total} emballés (${pct} %)`,
    tripPlannedNote: "Séjour planifié dans «Mes voyages»",
    currentTripAria: place => `Séjour en cours à ${place}`,
    currentTripTitle: place => `Tu es à ${place}`,
    currentTripDay: (day, total) => `Jour ${day} sur ${total}`,
    currentTripMenuLink: "Plan des repas",
    currentTripMenuAria: place =>
      `Ouvrir le plan des repas du séjour à ${place}`,
    currentTripSpotLink: "Dossier de l'emplacement",
    currentTripSpotAria: place => `Ouvrir le dossier de l'emplacement ${place}`,
    currentTripShoppingLink: "Liste de courses",
    currentTripFoodLink: "Glacière",
    currentTripWeatherLink: "Météo du camp",
    currentTripChoresLink: "Plan des tâches",
    currentTripMealsSr: "Repas d'aujourd'hui :",
    anniversaryTitleOne: "Il y a un an",
    anniversaryTitleMany: years => `Il y a ${years} ans`,
    anniversaryNights: n => (n === 1 ? "1 nuit" : `${n} nuits`),
    anniversaryRatingAria: stars =>
      stars === 1 ? "1 étoile sur 5" : `${stars} étoiles sur 5`,
    anniversaryLink: "Voir dans le journal",
    anniversaryLinkAria: place =>
      `Voir l'entrée sur ${place} dans le journal de voyage`,
    anniversaryPhotoAlt: place => `Photo principale de ${place}`,
    anniversaryDismissAria: "Masquer ce rappel pour aujourd'hui",
    weatherAria: (temp, label) =>
      `Météo actuelle : ${temp} degrés, ${label} – vers le module météo`,
    weatherNoAlerts: "Aucune alerte d'intempéries à ton emplacement",
    weatherAlertAria: (temp, label, count, severity) =>
      `Météo actuelle : ${temp} degrés, ${label}. ${
        count === 1
          ? "1 alerte d'intempéries"
          : `${count} alertes d'intempéries`
      }, niveau le plus élevé : ${severity} – vers les alertes du module météo`,
    tipOfDayTitle: "Conseil du jour",
    tipOfDayAria: (text: string) => `Conseil du jour : ${text}`,
    gearDueText: (n: number) =>
      n === 1
        ? "1 tâche d'entretien de ton équipement est due"
        : `${n} tâches d'entretien de ton équipement sont dues`,
    gearDueAria: (n: number) =>
      n === 1
        ? "1 tâche d'entretien due – ouvrir l'inventaire"
        : `${n} tâches d'entretien dues – ouvrir l'inventaire`,
    tickDueText: (n: number) =>
      n === 1
        ? "1 piqûre de tique reste à surveiller"
        : `${n} piqûres de tique restent à surveiller`,
    tickDueAria: (n: number) =>
      n === 1
        ? "1 piqûre de tique sous surveillance – ouvrir les premiers secours"
        : `${n} piqûres de tique sous surveillance – ouvrir les premiers secours`,
    searchPlaceholder:
      "Rechercher : morsure de tique, nœud de cabestan, recettes …",
    searchAria: "Rechercher dans les modules de savoir",
    searchNoResults:
      "Rien trouvé – essaie un autre terme (p. ex. «brûlure» ou «nœud»).",
    searchPreparing: "Préparation des modules de savoir …",
    travelModeLabel: "Affichage :",
    travelModeOnSite: "Sur place",
    travelModePlanning: "Planifier",
    travelModeAuto: "automatique",
    travelModeAria: "Affichage de la page d'accueil",
    searchCategories: {
      module: "Module",
      firstAid: "Premiers secours",
      knots: "Nœuds",
      recipes: "Recettes",
      nature: "Nature",
      care: "Entretien",
      clouds: "Nuages",
      phrases: "Aide linguistique",
      own: "Mes contenus",
    },
    recentTitle: "Utilisés récemment",
    sortStart: "Trier",
    sortDone: "Terminé",
    sortStartAria: "Trier les tuiles",
    sortDoneAria: "Terminer le tri",
    sortHint:
      "Glisse les tuiles à leur nouvelle position (au sein du groupe) ou utilise les boutons fléchés. Avec le bouton œil, tu masques ou réaffiches des tuiles. Connecté·e, ta sélection est reprise sur tous tes appareils.",
    hiddenBadge: "Masqué",
    widgetsTitle: "Widgets",
    widgetsHint:
      "Choisis les zones qui apparaissent au-dessus des tuiles. Le message d'accueil, la recherche et les tuiles elles-mêmes restent toujours visibles. Une fois connecté·e, ton choix s'applique à tous tes appareils.",
    widgetNames: {
      onboarding: "Premiers pas",
      briefing: "Briefing du matin",
      trip: "Séjour en cours / prochain",
      anniversary: "Il y a un an",
      weather: "Météo",
      tip: "Astuce du jour",
      recent: "Utilisés récemment",
    },
    moveAria: title => `Déplacer ${title}`,
    moveUpAria: title => `Avancer ${title}`,
    moveDownAria: title => `Reculer ${title}`,
    showAria: title => `Réafficher ${title}`,
    hideAria: title => `Masquer ${title}`,
    openAria: title => `Ouvrir ${title}`,
    onboardingTitle: "Premiers pas",
    onboardingSubtitle:
      "Voilà comment préparer ReiseKompass pour ta prochaine aventure.",
    onboardingDismissAria: "Masquer la carte des premiers pas",
    onboardingSteps: {
      account: "Créer un compte ou se connecter",
      spot: "Enregistrer un premier emplacement",
      packList: "Créer une première liste de bagages",
      trip: "Planifier un premier voyage",
      push: "Activer les notifications push",
    },
    onboardingOptional: "facultatif",
    onboardingDoneAria: label => `${label} – terminé`,
    onboardingOpenAria: label => `${label} – ouvrir maintenant`,
    onboardingLockedAria: label =>
      `${label} – possible seulement après la connexion`,
  },
  login: {
    title: "Connexion",
    subtitle:
      "Avec ton compte ReiseKompass, tu enregistres listes de bagages, inventaire et emplacements et tu les utilises sur tous tes appareils.",
    resetTitle: "Réinitialiser le mot de passe",
    resetSubtitle:
      "Indique l'adresse e-mail de ton compte – nous t'envoyons un lien avec lequel tu peux définir un nouveau mot de passe.",
    newPasswordTitle: "Définir un nouveau mot de passe",
    newPasswordSubtitle: "Choisis un nouveau mot de passe pour ton compte.",
    welcome: "Bienvenue !",
    welcomeName: name => `Bienvenue, ${name} !`,
    linkSent:
      "Si un compte existe avec cette adresse e-mail, nous venons de t'envoyer un lien (valable 60 minutes). Vérifie aussi le dossier spam.",
    resetDone: "Mot de passe réinitialisé – tu es maintenant connecté·e.",
    resetUnavailable:
      "La réinitialisation du mot de passe par e-mail n'est pas disponible pour le moment. Contacte l'exploitant.",
    tooManyResets: "Trop de demandes. Réessaie dans une heure.",
    resetLinkInvalid:
      "Le lien est invalide ou a expiré. Demandes-en un nouveau.",
    passwordsMismatch: "Les mots de passe ne correspondent pas.",
    accountEmailLabel: "E-mail de ton compte",
    emailPlaceholder: "toi@exemple.ch",
    sendingLink: "Envoi du lien …",
    sendLink: "Demander le lien",
    newPasswordLabel: "Nouveau mot de passe",
    passwordHint: "(min. 8 caractères)",
    confirmNewPasswordLabel: "Confirmer le nouveau mot de passe",
    setPassword: "Définir le mot de passe",
    backToLogin: "Retour à la connexion",
    tabLogin: "Se connecter",
    tabRegister: "S'inscrire",
    emailLabel: "E-mail",
    passwordLabel: "Mot de passe",
    totpLabel: "Code de confirmation",
    totpHint:
      "La double authentification est active : saisis le code de ton app d'authentification – ou un code de récupération.",
    loggingIn: "Connexion …",
    loginButton: "Se connecter",
    forgotPassword: "Mot de passe oublié ?",
    nameLabel: "Nom",
    namePlaceholder: "p. ex. Alex",
    confirmPasswordLabel: "Confirmer le mot de passe",
    creatingAccount: "Création du compte …",
    createAccount: "Créer un compte",
    knowledgeNote:
      "Les modules de savoir (premiers secours, nœuds, nature, recettes) fonctionnent aussi sans compte – tu n'as besoin d'un compte que pour enregistrer tes propres données.",
    passkeyOr: "ou",
    passkeyButton: "Se connecter avec un passkey",
    passkeyWaiting: "En attente du passkey …",
    passkeyFailed:
      "La connexion par passkey n'a pas fonctionné. Réessaie ou connecte-toi avec ton mot de passe.",
    emailVerified: "Adresse e-mail confirmée – merci !",
    verifyLinkInvalid:
      "Le lien de confirmation est invalide ou expiré. Demandes-en un nouveau dans ton profil.",
  },
  profile: {
    prefHeat: "Soleil & chaleur",
    prefHeatDesc:
      "Le matin, un rappel de te protéger et de boire quand la journée annonce un UV élevé ou plus de 28 °C.",
    languageTitle: "Langue",
    languageIntro:
      "Dans quelle langue l'app doit-elle fonctionner ? Le choix vaut sur tous tes appareils – aussi pour les notifications que cet appareil reçoit.",
    calendarTitle: "Abonnement au calendrier",
    calendarIntro:
      "Tes voyages en continu dans le calendrier du téléphone ou de l'ordinateur – contrairement au fichier téléchargé, un abonnement se met à jour tout seul quand tu déplaces un voyage.",
    calendarSubscribe: "S'abonner au calendrier",
    calendarCopy: "Copier l'adresse",
    calendarCopied: "Adresse copiée.",
    calendarCopyFailed:
      "La copie n'a pas fonctionné – sélectionne l'adresse à la main.",
    calendarSecretHint:
      "Qui a cette adresse voit le lieu et les dates de tes voyages. Transmise par erreur ? Génère-en une nouvelle – l'ancienne devient aussitôt invalide.",
    calendarResetButton: "Régénérer",
    calendarResetConfirm:
      "Générer une nouvelle adresse ? Les abonnements avec l'ancienne cessent de se mettre à jour.",
    calendarReset: "Nouvelle adresse générée.",
    appBadgeTitle: "Nombre sur l'icône de l'app",
    appBadgeDesc:
      "Affiche sur l'icône combien d'articles de la glacière expirent aujourd'hui ou demain et combien de tâches d'entretien sont dues. Ce n'est pas une notification non lue – une tâche d'entretien ouverte reste affichée jusqu'à ce que tu la coches.",
    appBadgeAria: "Afficher le nombre sur l'icône de l'app",
    title: "Profil",
    manageSubtitle: "Gère ton compte et tes réglages.",
    loginFeature: "ton profil",
    loggedInAs: id => `Connecté·e en tant que ${id}`,
    nameUpdated: "Nom mis à jour",
    emailUpdated:
      "Adresse e-mail mise à jour – connecte-toi désormais avec celle-ci",
    passwordUpdated: "Mot de passe mis à jour",
    accountDeleted: "Compte supprimé. Bon voyage !",
    themeSavedDark: "Thème sombre enregistré comme standard",
    themeSavedLight: "Thème clair enregistré comme standard",
    themeSavedAuto: "Thème automatique enregistré – suit le réglage du système",
    themeTitle: "Thème",
    themeIntro: "Choisis le thème avec lequel l'app démarre par défaut.",
    themeGroupAria: "Choisir le thème par défaut",
    themeLight: "Clair",
    themeDark: "Sombre",
    themeAuto: "Automatique (système)",
    fontScaleTitle: "Taille du texte",
    fontScaleLabels: {
      normal: "Normale",
      large: "Grande",
      xlarge: "Très grande",
    },
    fontScaleHint:
      "Ne vaut que sur cet appareil – la tablette peut différer du téléphone.",
    nameTitle: "Changer le nom",
    nameAria: "Nom",
    namePlaceholder: "Ton nom",
    verifyHint:
      "Ton adresse e-mail n'est pas encore confirmée. Vérifie ta boîte de réception (aussi le dossier spam) ou fais-toi renvoyer le lien.",
    verifyResend: "Renvoyer l'e-mail de confirmation",
    verifySending: "Envoi en cours …",
    verifySent:
      "E-mail de confirmation envoyé – vérifie ta boîte de réception (valable 48 heures).",
    verifyTooMany: "Trop de demandes. Réessaie dans une heure.",
    verifyUnavailable: "L'envoi d'e-mails n'est pas disponible pour le moment.",
    emailTitle: "Changer l'adresse e-mail",
    emailCurrentPrefix: "Actuelle :",
    emailCurrentSuffix:
      ". Tu te connecteras désormais avec la nouvelle adresse.",
    newEmailLabel: "Nouvelle adresse e-mail",
    confirmWithPasswordLabel: "Mot de passe pour confirmer",
    changeEmail: "Changer l'e-mail",
    passwordTitle: "Mettre à jour le mot de passe",
    newPasswordsMismatch: "Les nouveaux mots de passe ne correspondent pas.",
    currentPasswordLabel: "Mot de passe actuel",
    newPasswordLabel: "Nouveau mot de passe (min. 8 caractères)",
    repeatPasswordLabel: "Répéter le nouveau mot de passe",
    changePassword: "Changer le mot de passe",
    deleteTitle: "Supprimer le compte",
    deleteIntro:
      "Supprime irrévocablement ton compte et toutes les données enregistrées (listes de bagages, inventaire, emplacements, consommateurs, glacière).",
    deleteButton: "Supprimer le compte …",
    deleteConfirmTitle: "Vraiment supprimer le compte ?",
    deleteConfirmDescription:
      "Toutes tes données seront supprimées irrévocablement. Confirme avec ton mot de passe.",
    passwordLabel: "Mot de passe",
    deleteFinal: "Supprimer définitivement",
    versionLine: version => `ReiseKompass version ${version}`,
    buildDate: date => ` · build du ${date}`,
    notificationsTitle: "Notifications",
    pushDeviceTitle: "Push sur cet appareil",
    pushDeviceDesc:
      "Notifications pour les intempéries, la DLC de la glacière, le compte à rebours du séjour, les nuits d'étoiles filantes et l'entretien de l'équipement.",
    pushDeviceAria: "Activer les notifications push sur cet appareil",
    pushUnsupported:
      "Ton navigateur ne prend pas en charge les notifications push.",
    pushNotConfigured: "Le push n'est pas configuré côté serveur.",
    pushOn: "Notifications push activées",
    pushOff: "Notifications push désactivées",
    prefsIntro: "Choisis quelles notifications cet appareil reçoit :",
    lastCheckAgo: (ago: string) => `Dernière vérification : ${ago}`,
    lastCheckNever: "La vérification n’a encore jamais eu lieu.",
    lastCheckStale: (hours: number) =>
      `Aucune vérification depuis plus de ${hours} heures – aucune notification n’arrive probablement en ce moment.`,
    prefWeather: "Alertes intempéries",
    prefWeatherDesc:
      "Tempête, orage ou fortes pluies sur tes emplacements enregistrés.",
    prefFood: "Rappels DLC",
    prefFoodDesc:
      "Quand des aliments de la glacière expirent aujourd'hui ou demain.",
    prefTrips: "Compte à rebours du séjour",
    prefTripsDesc:
      "3 jours avant l'arrivée, avec l'état de la liste de bagages.",
    prefAstro: "Nuits d'étoiles filantes",
    prefAstroDesc:
      "Quand une nuit claire coïncide avec un maximum d'étoiles filantes à ton lieu de domicile.",
    prefGear: "Rappels d'entretien",
    prefGearDesc:
      "Au plus une fois par mois, quand l'entretien de l'équipement est dû.",
    prefToggleAria: (label: string) => `Activer ou désactiver ${label}`,
    thresholdsTitle: "Tes propres seuils d'alerte",
    thresholdsIntro:
      "À partir de quelles valeurs la notification d'intempéries doit-elle te réveiller ? Laisse vide pour la valeur standard.",
    thresholdWind: "Rafales à partir de (km/h)",
    thresholdWindHint: (standard: number, min: number, max: number) =>
      `Standard ${standard} · possible ${min}–${max}`,
    thresholdRain: "Pluie à partir de (mm par heure)",
    thresholdRainHint: (standard: number, min: number, max: number) =>
      `Standard ${standard} · possible ${min}–${max}`,
    thresholdReset: "Standard",
    historyHint:
      "Les dernières notifications envoyées à ton compte – les plus récentes en premier.",
    historyEmpty:
      "Aucune notification envoyée pour l'instant. Dès qu'il y aura du nouveau, tu le trouveras ici.",
    historyOpenAria: (title: string) => `Ouvrir « ${title} »`,
    historyKind: {
      heat: "Soleil & chaleur",
      weather: "Intempéries",
      food: "Glacière",
      trip: "Voyage",
      drying: "Séchage de la tente",
      astro: "Étoiles filantes",
      gear: "Équipement",
      evepack: "Contrôle de la veille",
      board: "Tableau",
      join: "Compagnons de voyage",
    },
    homeTitle: "Lieu de domicile",
    homeIntro:
      "Enregistre ton domicile pour recevoir les alertes intempéries et les conseils étoiles filantes aussi pour chez toi – sans emplacement enregistré.",
    homeNotSet: "Aucun lieu de domicile défini pour l'instant.",
    homeNameLabel: "Nom",
    homeDefaultName: "Chez moi",
    homeUseLocation: "Utiliser la position actuelle",
    homeLocating: "Détermination de la position …",
    homeSearchLabel: "Chercher un lieu",
    homeSearchPlaceholder: "p. ex. Berne",
    homeSearchButton: "Chercher",
    homeSearchFailed:
      "La recherche de lieu n'a pas abouti. Réessaie plus tard.",
    homeSearchEmpty: "Aucun lieu trouvé.",
    homeSelectAria: (name: string) => `Définir ${name} comme lieu de domicile`,
    homeSaved: "Lieu de domicile enregistré",
    homeRemoved: "Lieu de domicile supprimé",
    homeRemoveAria: "Supprimer le lieu de domicile",
    passkeysTitle: "Sécurité : passkeys",
    passkeysIntro:
      "Avec un passkey, tu te connectes sans mot de passe – par empreinte digitale, visage ou code de l'appareil. Ton mot de passe reste valable en plus.",
    passkeysEmpty: "Aucun passkey enregistré pour l'instant.",
    passkeyAddedOn: (date: string) => `ajouté le ${date}`,
    passkeyNameLabel: "Nom du passkey",
    passkeyNamePlaceholder: "p. ex. téléphone d'Alex",
    passkeyDefaultName: "Passkey",
    passkeyAddButton: "Ajouter un passkey",
    passkeyAdding: "En attente de confirmation …",
    passkeyAdded: "Passkey enregistré",
    passkeyAddFailed: "Le passkey n'a pas pu être créé. Réessaie.",
    passkeyExists: "Un passkey est déjà enregistré sur cet appareil.",
    passkeyRemoveAria: (name: string) => `Supprimer le passkey «${name}»`,
    passkeyRemoveConfirm: (name: string) =>
      `Vraiment supprimer le passkey «${name}» ? La connexion avec celui-ci ne sera plus possible.`,
    passkeyRemoved: "Passkey supprimé",
    passkeysUnsupported: "Ton navigateur ne prend pas en charge les passkeys.",
  },
  packLists: {
    title: "Listes de bagages",
    subtitle:
      "Des check-lists par scénario, à cocher et à compléter comme tu veux.",
    loginFeature: "tes listes de bagages",
    newList: "Nouvelle liste de bagages",
    newListAria: "Créer une nouvelle liste de bagages",
    dialogDescription:
      "Choisis un scénario – l'équipement de base correspondant est ajouté automatiquement.",
    scenarioAria: label => `Choisir le scénario ${label}`,
    preparedItems: n => `Contient ${n} entrées préparées.`,
    nameLabel: "Nom de la liste",
    namePlaceholder: label => `p. ex. ${label} été`,
    namePlaceholderFallback: "Nom",
    personsLabel: "Personnes (facultatif)",
    personsPlaceholder: "Saisis un nom, Entrée l'ajoute",
    personsAddAria: "Ajouter une personne à la nouvelle liste",
    personsRemoveAria: name => `Retirer la personne ${name}`,
    personsHint:
      "Chaque personne reçoit sa propre section sur la liste – « Général » existe toujours.",
    createList: "Créer la liste",
    defaultName: "Ma liste de bagages",
    created: "Liste de bagages créée",
    createFailed: "La liste n'a pas pu être créée",
    duplicated: "Liste copiée – toutes les entrées sont décochées",
    duplicateFailed: "Échec de la copie",
    openAria: name => `Ouvrir la liste de bagages ${name}`,
    duplicateAria: name => `Dupliquer la liste de bagages ${name}`,
    renameAria: (name: string) => `Renommer la liste de bagages ${name}`,
    renameTitle: "Renommer la liste",
    renameSaved: "Nom enregistré.",
    saveTemplateAria: (name: string) =>
      `Enregistrer la liste ${name} comme modèle`,
    deleteAria: name => `Supprimer la liste de bagages ${name}`,
    deleteConfirm: name => `Vraiment supprimer la liste «${name}» ?`,
    emptyTitle: "Pas encore de liste de bagages",
    emptyText: "Crée ta première liste – choisis simplement un scénario.",
    familyTitle: "Checklists pour les familles",
    familySubtitle:
      "Des paquets prêts à l'emploi pour camper avec des enfants – reprends les entrées dans une de tes listes.",
    moreItems: (n: number) => `… et ${n} autres entrées`,
    addToPackList: "Ajouter à une liste de bagages",
    addToPackListAria: label =>
      `Ajouter le paquet ${label} à une liste de bagages`,
    chooseListTitle: "Choisir une liste de bagages",
    chooseListDescription: label =>
      `Dans quelle liste veux-tu reprendre les entrées de «${label}» ?`,
    addOnAdded: (label, list) => `«${label}» ajouté à «${list}»`,
    addOnAddFailed: "Impossible d'ajouter les entrées",
    noListsForAddOn:
      "Crée d'abord une liste de bagages – tu pourras ensuite reprendre le paquet.",
    myTemplatesTitle: "Mes modèles",
    templateAria: (name: string) => `Choisir le modèle ${name}`,
    templateItemCount: (n: number) => (n === 1 ? "1 entrée" : `${n} entrées`),
    templateDeleteAria: (name: string) => `Supprimer le modèle ${name}`,
    templateDeleteConfirm: (name: string) =>
      `Vraiment supprimer le modèle «${name}» ?`,
    templateDeleted: "Modèle supprimé",
    templateDeleteFailed: "Le modèle n'a pas pu être supprimé",
    budgetBadge: weight => `Budget ${weight}`,
    templateShareAria: name => `Partager le modèle ${name} par lien`,
    templateShareTitle: "Partager le modèle",
    templateShareDescription:
      "Toute personne avec le lien peut voir le modèle et, avec un compte, le reprendre comme modèle personnel.",
    templateShareCopied: "Lien de partage copié – transmets-le !",
    templateShareFailed: "Le partage a échoué",
    templateUnshare: "Arrêter le partage",
    templateUnshared: "Partage terminé – le lien n'est plus valable",
    templateUnshareFailed: "Le partage n'a pas pu être arrêté",
    templateQrAlt: name => `Code QR du lien de partage du modèle ${name}`,
    templateQrTitle: "Transmettre directement",
    templateQrText:
      "Fais scanner le code avec l'appareil photo du téléphone – le modèle s'ouvre immédiatement.",
    templateSharedBadge: "partagé",
    archiveAria: (name: string) => `Archiver la liste de bagages ${name}`,
    unarchiveAria: (name: string) => `Restaurer la liste de bagages ${name}`,
    archived: "Liste archivée",
    unarchived: "Liste restaurée",
    archiveFailed: "Échec de l'archivage",
    archiveSectionTitle: (n: number) => `Archives (${n})`,
    archiveSectionAria: "Ouvrir ou fermer les listes de bagages archivées",
    archiveHint:
      "Les listes archivées restent complètes avec toutes leurs entrées – elles n'apparaissent simplement plus dans les listes de sélection.",
    archivedBadge: "archivée",
  },
  packListDetail: {
    personWeightTitle: "Charge :",
    boxBadgeAria: "Se trouve dans la caisse",
    backLabel: "Listes de bagages",
    fallbackTitle: "Liste de bagages",
    loginFeature: "tes listes de bagages",
    notFound: "Liste de bagages introuvable",
    packedCount: (checked, total) =>
      `${checked} entrées sur ${total} emballées`,
    progressAria: pct => `Progression : ${pct} pour cent emballé`,
    weightTotal: "au total",
    weightPacked: "emballé",
    volumeLine: litres => `${litres} l de volume`,
    matchedInfo: (matched, total) =>
      `(${matched} entrées sur ${total} trouvées dans l'inventaire)`,
    shareCreating: "Création du lien …",
    shareButton: "Partager la liste par lien",
    shareCopied:
      "Lien de partage copié – envoie-le à tes compagnons de voyage !",
    shareCreated: "Lien de partage créé – copie-le ci-dessous.",
    shareFailed: "Échec du partage",
    qrAlt: name => `Code QR vers le lien de partage de la liste ${name}`,
    qrTitle: "À transmettre directement sur place",
    qrText:
      "Fais scanner le code avec l'appareil photo du téléphone – la liste s'ouvre immédiatement, sans saisie ni connexion.",
    shareHint:
      "Toute personne avec le lien peut voir la liste et cocher avec toi – sans aucune connexion.",
    toggleFailed: "Échec de la modification",
    addFailed: "L'entrée n'a pas pu être ajoutée",
    addOnAdded: label => `«${label}» ajouté`,
    addPlaceholder: "Ajouter une entrée …",
    addNameAria: "Nom de la nouvelle entrée",
    categoryAria: "Catégorie de la nouvelle entrée",
    newCategoryOption: "Nouvelle catégorie …",
    newCategoryPlaceholder: "Nouvelle catégorie",
    newCategoryAria: "Nom de la nouvelle catégorie",
    editCategoryAria: (name: string) => `Modifier la catégorie de ${name}`,
    editItemAria: (name: string) => `Modifier ${name}`,
    editNameAria: (name: string) => `Nouveau nom pour ${name}`,
    editQtyAria: (name: string) => `Quantité de ${name}`,
    editCategorySelectAria: (name: string) => `Nouvelle catégorie pour ${name}`,
    categorySave: "Enregistrer la catégorie",
    categoryUpdateFailed: "La catégorie n'a pas pu être modifiée",
    addAria: "Ajouter l'entrée",
    defaultCategory: "Personnel",
    generalCategory: "Général",
    inventoryTitle: "Reprendre depuis ton inventaire",
    inventoryAddAria: name => `Ajouter ${name} de l'inventaire à la liste`,
    inventoryHint:
      "Les entrées trouvées dans l'inventaire comptent automatiquement dans le bilan de poids ci-dessus.",
    addOnAria: label => `Ajouter le pack ${label} à la liste`,
    markPacked: name => `Marquer ${name} comme emballé`,
    markUnpacked: name => `Marquer ${name} comme non emballé`,
    deleteItemAria: name => `Supprimer ${name}`,
    reorderAria: name => `Déplacer ${name} – glisser pour trier`,
    reorderFailed: "Le nouvel ordre n'a pas pu être enregistré",
    emptyList:
      "Cette liste est encore vide – ajoute ta première entrée dans une section ci-dessous.",
    assignFailed: "Échec de l'attribution",
    assignButtonAria: name => `Attribuer ${name} à une personne`,
    assignInputAria: name => `Personne qui emballe ${name}`,
    assignPlaceholder: "Nom (p. ex. Maman)",
    assignSave: "Attribuer",
    assignRemove: "Retirer l'attribution",
    assignSuggestionAria: (person, item) => `Attribuer ${item} à ${person}`,
    sectionGeneral: "Général",
    sectionProgress: (checked, total) => `${checked} sur ${total} emballés`,
    sectionEmpty: "Aucune entrée dans cette section pour l'instant.",
    sectionAddNameAria: section => `Nouvelle entrée dans la section ${section}`,
    sectionAddAria: section => `Ajouter une entrée dans la section ${section}`,
    printPersonAria: name => `Imprimer uniquement les entrées de ${name}`,
    managePersonsButton: "Gérer les personnes",
    personTabsAria: "Sections de la liste de bagages",
    managePersonsTitle: "Gérer les personnes",
    managePersonsDescription:
      "Chaque personne reçoit sa propre section sur la liste. Les entrées sans personne se trouvent sous « Général ».",
    personsEmpty: "Pas encore de personnes – ajoute la première ci-dessous.",
    personNameAria: "Nom de la nouvelle personne",
    addPersonButton: "Ajouter",
    removePersonAria: name => `Retirer la personne ${name}`,
    removePersonConfirm: name =>
      `Vraiment retirer la personne « ${name} » ? Ses entrées retournent sous « Général ».`,
    personsSaveFailed: "Les personnes n'ont pas pu être enregistrées",
    personsMaxHint: "Au maximum 10 personnes par liste.",
    tripMembersTitle: "Ajouter des compagnons de voyage",
    tripMembersHint:
      "Cette liste est reliée à un séjour partagé – touche un nom pour lui créer une section.",
    addTripMemberAria: (name: string) =>
      `Ajouter ${name} comme personne à la liste`,
    ownPersonBadge: "Toi",
    printButton: "Imprimer",
    saveTemplateButton: "Enregistrer comme modèle",
    saveTemplateAria: (name: string) =>
      `Enregistrer la liste ${name} comme modèle`,
    saveTemplateTitle: "Enregistrer comme modèle",
    saveTemplateDescription:
      "Enregistre les entrées actuelles (noms, catégories, quantités) comme modèle réutilisable. Les coches et les attributions de personnes ne sont pas reprises.",
    templateNameLabel: "Nom du modèle",
    saveTemplateConfirm: "Enregistrer le modèle",
    templateSaved:
      "Modèle enregistré – disponible à la création de nouvelles listes",
    templateSaveFailed: "Le modèle n'a pas pu être enregistré",
    budgetSetButton: "Définir un budget de poids",
    budgetEdit: "Ajuster",
    budgetEditAria: "Ajuster le budget de poids",
    budgetLine: (total, budget) => `${total} sur ${budget} de budget`,
    budgetPercent: pct => `${pct} % du budget utilisé`,
    budgetOver: excess => `${excess} au-dessus du budget`,
    budgetProgressAria: pct => `Poids : ${pct} pour cent du budget`,
    budgetDialogTitle: "Définir un budget de poids",
    budgetDialogDescription:
      "Fixe le poids maximal de tes bagages. Le bilan compare le poids actuel issu de l'inventaire avec ton budget.",
    budgetLabel: "Budget en kg",
    budgetPlaceholder: "p. ex. 15,5",
    budgetSave: "Enregistrer le budget",
    budgetRemove: "Supprimer le budget",
    budgetSaved: "Budget de poids enregistré",
    budgetRemoved: "Budget de poids supprimé",
    budgetSaveFailed: "Le budget n'a pas pu être enregistré",
    budgetInvalid: "Indique un poids entre 0,1 et 500 kg",
    personBudgetLabel: "Limite par personne (kg)",
    personBudgetPlaceholder: "p. ex. 23",
    personBudgetHint:
      "Par exemple 23 kg de bagages en avion – la ligne de charge met en évidence les personnes au-dessus de la limite. Laisser vide pour aucune limite.",
    personBudgetInfo: (limit: string) => `Limite : ${limit} par personne`,
    copyTextButton: "Copier comme texte",
    copyTextDone: "Liste copiée – prête à coller",
    copyTextFailed: "Échec de la copie",
    uncheckAllButton: "Décocher tout",
    uncheckAllConfirm: (n: number) =>
      n === 1
        ? "Vraiment décocher la coche ? L'élément est conservé."
        : `Vraiment décocher les ${n} coches ? Les éléments sont conservés.`,
    uncheckAllDone:
      "Toutes les coches sont enlevées – prêt·e pour le prochain paquetage",
    uncheckAllFailed: "Impossible d'enlever les coches",
    editedByTitle: (name, date) =>
      `Dernière modification par ${name} le ${date}`,
    editedByBadgeAria: name => `Dernière modification par ${name}`,
  },
  packListPrint: {
    docTitle: name => `${name} – liste de bagages à imprimer`,
    docTitleFallback: "Liste de bagages",
    appTitle:
      "ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
    notFound: "Cette liste de bagages est introuvable.",
    printButton: "Imprimer / Enregistrer en PDF",
    printBrowserHint:
      "Dans l'app installée, le bouton ouvre la vue dans le navigateur – imprime ou enregistre en PDF depuis son menu.",
    headerKicker: "ReiseKompass · Liste de bagages",
    meta: (items, categories) =>
      `${items} ${items === 1 ? "entrée" : "entrées"} · ${categories} ${categories === 1 ? "catégorie" : "catégories"}`,
    printedOn: date => `État : ${date}`,
    personFilterInfo: name => `Seulement les entrées de ${name}`,
    emptyList: "Cette liste ne contient aucune entrée.",
    footer:
      "Rien d'oublié – bon voyage ! · ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
  },
  sharedPackList: {
    loadingShared: "Chargement de la liste partagée …",
    notFoundTitle: "Lien expiré ou invalide",
    backHome: "Page d'accueil",
    invalidLink:
      "Ce lien de partage a expiré, est invalide ou a été retiré par sa ou son propriétaire.",
    toggleFailed: "Échec du cochage",
    subtitle: (checked, total) =>
      `Liste de bagages partagée · ${checked} entrées sur ${total} emballées`,
    progressAria: pct => `Progression : ${pct} pour cent emballé`,
    sharedInfo:
      "Cochage en commun : toutes les personnes avec ce lien voient le même état – l'affichage se met à jour automatiquement.",
    emptyList: "Cette liste est encore vide.",
    checkAria: name => `Cocher ${name}`,
  },
  sharedTemplate: {
    loading: "Chargement du modèle partagé …",
    notFoundTitle: "Lien expiré ou invalide",
    backHome: "Accueil",
    invalidLink:
      "Ce lien de partage a expiré, est invalide ou a été retiré par sa propriétaire ou son propriétaire.",
    subtitle: n =>
      n === 1
        ? "Modèle de bagages partagé · 1 entrée"
        : `Modèle de bagages partagé · ${n} entrées`,
    sharedInfo:
      "Modèle de bagages partagé : regarde-le – avec un compte, tu peux le reprendre ou créer directement une liste de bagages à partir de lui.",
    importButton: "Reprendre comme modèle personnel",
    imported:
      "Modèle repris – disponible lors de la création de nouvelles listes",
    importFailed: "Le modèle n'a pas pu être repris",
    createListButton: "Créer une nouvelle liste à partir du modèle",
    listCreated: "Liste de bagages créée",
    createListFailed: "La liste n'a pas pu être créée",
    loginHint:
      "Connecte-toi pour reprendre le modèle ou créer une liste de bagages à partir de lui.",
    emptyTemplate: "Ce modèle n'a pas d'entrées.",
  },
  sharedQuiz: {
    loading: "Chargement du quiz partagé …",
    notFoundTitle: "Lien expiré ou invalide",
    backHome: "Accueil",
    invalidLink:
      "Ce lien de partage a expiré, est invalide ou a été retiré par sa propriétaire ou son propriétaire.",
    subtitle: "Quiz partagé",
    sharedInfo:
      "Quiz partagé : regarde-le – avec un compte, tu peux le reprendre comme quiz personnel dans ton mode famille.",
    importButton: "Reprendre comme quiz personnel",
    imported: "Quiz repris – tu le trouves dans le mode famille",
    importFailed: "Le quiz n'a pas pu être repris",
    loginHint: "Connecte-toi pour reprendre le quiz comme quiz personnel.",
    questionCount: n => (n === 1 ? "1 question" : `${n} questions`),
    sampleQuestionTitle: "Exemple de question",
    moreQuestions: n =>
      n === 1
        ? "… et 1 autre question t'attend après la reprise."
        : `… et ${n} autres questions t'attendent après la reprise.`,
    emptyQuiz: "Ce quiz n'a pas de questions.",
  },
  sharedRecipe: {
    loading: "Chargement de la recette partagée …",
    notFoundTitle: "Lien expiré ou invalide",
    backHome: "Accueil",
    invalidLink:
      "Ce lien de partage a expiré, n'est pas valable ou a été retiré par sa propriétaire ou son propriétaire.",
    subtitle: "Recette partagée",
    sharedInfo:
      "Recette partagée : cuisine-la – avec un compte, tu peux la reprendre comme recette perso dans ton livre de recettes.",
    importButton: "Reprendre comme recette perso",
    imported: "Recette reprise – tu la trouves dans le livre de recettes",
    importFailed: "La recette n'a pas pu être reprise",
    loginHint:
      "Connecte-toi pour reprendre la recette dans ton livre de recettes.",
    minutes: (n: number) => `${n} min`,
    servings: (n: number) => `${n} portions`,
    onePotBadge: "One-pot",
    kidsBadge: "Enfants",
    ingredientsTitle: "Ingrédients",
    stepsTitle: "Préparation",
    tipTitle: "Astuce",
    photoNote:
      "La photo de la recette reste privée et n'est pas transmise via le lien de partage.",
  },
  packOptimizer: {
    title: "Optimisation des bagages",
    subtitleLoggedOut:
      "Le poids et l'encombrement de ton équipement en un coup d'œil – adaptés à ton véhicule.",
    loginFeature: "ton analyse de bagages",
    subtitle:
      "Basé sur ton inventaire : poids et volume comparés à la capacité de ton moyen de transport.",
    transportTitle: "Moyen de transport",
    transportGroupAria: "Choisir le moyen de transport",
    weight: "Poids",
    weightPercentAria: pct => `Charge en poids ${pct} pour cent`,
    volume: "Volume",
    volumePercentAria: pct => `Charge en volume ${pct} pour cent`,
    hintsTitle: "Conseils d'optimisation",
    heaviestTitle: "Positions les plus lourdes",
    bulkiestTitle: "Positions les plus volumineuses",
    emptyPrefix: "Ton inventaire est encore vide.",
    emptyLink: "Saisis d'abord ton équipement",
    emptySuffix: "avec poids et volume.",
  },
  inventory: {
    boxButton: "Ranger",
    boxAria: (name: string) => `Ranger ${name} dans une caisse`,
    boxDialogTitle: "Ranger dans une caisse",
    boxDialogDescription:
      "Choisis la caisse où se trouve cet objet. Il apparaîtra alors dans son contenu – y compris après avoir scanné l'étiquette.",
    boxAssigned: "Rangement enregistré",
    boxRemove: "Sortir de la caisse",
    boxNoBoxes:
      "Aucune caisse pour l'instant. Crées-en une d'abord, puis tu pourras ranger ici.",
    boxManageLink: "Gérer les caisses",
    title: "Inventaire",
    subtitleLoggedOut: "Saisis ton matériel de camping avec poids et volume.",
    loginFeature: "ton inventaire",
    subtitle:
      "Saisis ton matériel de camping – le poids et le volume alimentent directement l'optimisation des bagages.",
    itemsCount: "Objets",
    totalWeight: "Poids total",
    totalVolume: "Volume total",
    addButton: "Saisir de l'équipement",
    addAria: "Saisir un nouvel équipement",
    dialogTitleEdit: "Modifier l'équipement",
    dialogTitleNew: "Nouvel équipement",
    dialogDescription:
      "Le poids et le volume aideront plus tard à l'optimisation des bagages.",
    nameLabel: "Nom",
    namePlaceholder: "p. ex. sac de couchage confort -5 °C",
    categoryLabel: "Catégorie",
    categoryAria: "Choisir la catégorie",
    weightLabel: "Poids (g)",
    volumeLabel: "Volume (l)",
    quantityLabel: "Quantité",
    submitNew: "Saisir",
    created: "Équipement saisi",
    updated: "Modifications enregistrées",
    nameRequired: "Merci d'indiquer un nom",
    tableName: "Nom",
    tableCategory: "Catégorie",
    tableWeight: "Poids",
    tableVolume: "Volume",
    actionsAria: "Actions",
    editAria: name => `Modifier ${name}`,
    deleteAria: name => `Supprimer ${name}`,
    deleteConfirm: name => `Vraiment supprimer «${name}» ?`,
    photoLabel: "Photo (facultatif)",
    photoChoose: "Choisir une photo",
    photoChange: "Changer la photo",
    photoRemove: "Supprimer la photo",
    photoPreviewAlt: "Aperçu de la photo de l'équipement",
    photoHint:
      "JPEG, PNG ou WebP – la photo est automatiquement réduite avant l'envoi.",
    photoUploading: "Envoi de la photo …",
    photoUploadFailed: "Enregistré, mais la photo n'a pas pu être téléversée.",
    photoTooLarge: "La photo est trop grande (max. 5 Mo).",
    photoHeic: "Le navigateur ne peut pas lire le HEIC/HEIF – exporte en JPEG.",
    photoReadFailed: "L'image n'a pas pu être lue.",
    photoRemoveFailed: "La photo n'a pas pu être supprimée.",
    photoThumbAria: (name: string) =>
      `Afficher la photo de ${name} en plein écran`,
    photoDialogAlt: (name: string) => `Photo de ${name}`,
    photoDialogDescription: "Photo de l'objet en grand.",
    emptyTitle: "Pas encore d'équipement saisi",
    emptyText:
      "Commence par les grandes pièces : tente, sac de couchage, matelas isolant.",
    searchPlaceholder: "Rechercher dans l'inventaire …",
    searchAria: "Rechercher dans l'inventaire par nom ou note",
    categoryFilterAria: "Filtrer par catégorie",
    filterAll: "Tout",
    filterCount: (shown: number, total: number) =>
      `${shown} objets sur ${total}`,
    filterEmptyTitle: "Aucun résultat",
    filterEmptyText: "Adapte ta recherche ou choisis une autre catégorie.",
    filterReset: "Réinitialiser les filtres",
    priceLabel: "Prix (CHF)",
    priceAria: "Prix d'achat en francs",
    purchaseDateLabel: "Date d'achat",
    warrantyLabel: "Garantie (mois)",
    warrantyAria: "Durée de garantie en mois à partir de la date d'achat",
    warrantyHelp:
      "À partir de la date d'achat – laisse vide si tu ne sais pas.",
    warrantyBadge: (date: string) => `Garantie jusqu'au ${date}`,
    warrantyExpiredBadge: (date: string) => `Garantie échue le ${date}`,
    warrantyDaysLeft: (n: number) =>
      n === 0
        ? "Expire aujourd'hui"
        : n === 1
          ? "Expire demain"
          : `Expire dans ${n} jours`,
    warrantySoonTitle: (n: number) =>
      n === 1
        ? "1 garantie arrive à échéance"
        : `${n} garanties arrivent à échéance`,
    warrantySoonText:
      "Dans les 60 prochains jours – cela vaut la peine de vérifier maintenant.",
    warrantySoonShow: "Afficher",
    warrantySoonShowAll: "Tout afficher",
    lentButton: "Prêté",
    lentAria: (name: string) => `Noter ${name} comme prêté`,
    lentDialogTitle: "Noter comme prêté",
    lentDialogDescription:
      "Note qui a l'objet et depuis quand – comme ça, tu n'oublies rien.",
    lentToLabel: "Prêté à",
    lentToPlaceholder: "p. ex. ma voisine Sarah",
    lentAtLabel: "Depuis le",
    lentSubmit: "Noter comme prêté",
    lentToRequired: "Merci d'indiquer un nom",
    lentSaved: "Noté comme prêté",
    lentBadge: (name: string, date: string) =>
      `prêté à ${name} depuis le ${date}`,
    lentReturnButton: "Rendu",
    lentReturnAria: (name: string) => `Noter ${name} comme rendu`,
    lentReturned: "De retour dans l'inventaire",
    lentFilterChip: (n: number) => `Prêtés (${n})`,
    priceBadge: (chf: string) => `CHF ${chf}`,
    totalValue: (chf: string) => `Valeur totale : CHF ${chf}`,
    totalValueHint: "Somme de tous les prix saisis × quantité",
    receiptLabel: "Justificatif (facultatif)",
    receiptChoose: "Choisir un justificatif",
    receiptChange: "Changer de justificatif",
    receiptRemove: "Supprimer le justificatif",
    receiptPreviewAlt: "Aperçu du justificatif",
    receiptHint:
      "Photo du reçu – JPEG, PNG ou WebP, réduite automatiquement avant l'envoi.",
    receiptUploading: "Envoi du justificatif …",
    receiptUploadFailed:
      "Enregistré, mais le justificatif n'a pas pu être envoyé.",
    receiptRemoveFailed: "Le justificatif n'a pas pu être supprimé.",
    receiptIconAria: (name: string) => `Afficher le justificatif de ${name}`,
    receiptDialogDescription: "Justificatif de l'objet en grand.",
    receiptDialogAlt: (name: string) => `Justificatif de ${name}`,
    receiptDialogTitle: (name: string) => `Justificatif : ${name}`,
    gearTitle: "Entretien & maintenance",
    gearIntro:
      "Tâches récurrentes comme imperméabiliser ou contrôler les piles – les tâches dues sont marquées et rappelées par push.",
    gearAddButton: "Ajouter une tâche",
    gearAddAria: "Ajouter une nouvelle tâche d'entretien",
    gearDialogTitle: "Ajouter une tâche d'entretien",
    gearDialogDescription:
      "Reprends une suggestion ou saisis ta propre tâche avec un intervalle.",
    gearSuggestionsLabel: "Suggestions",
    gearSuggestionAria: (title: string) => `Reprendre la suggestion «${title}»`,
    gearTitleLabel: "Tâche",
    gearTitlePlaceholder: "p. ex. imperméabiliser la tente",
    gearIntervalLabel: "Intervalle (mois)",
    gearIntervalText: (n: number) =>
      n === 1 ? "chaque mois" : `tous les ${n} mois`,
    gearSubmit: "Ajouter",
    gearCreated: "Tâche d'entretien ajoutée",
    gearTitleRequired: "Saisis un titre de tâche",
    gearEmpty:
      "Pas encore de tâches d'entretien – reprends une suggestion ou crées-en une.",
    gearDueBadge: "Due",
    gearSoonBadge: "Bientôt due",
    gearDueOn: (date: string) => `Due le ${date}`,
    gearLastDone: (date: string) => `dernière fois le ${date}`,
    gearNeverDone: "jamais encore faite",
    gearDoneButton: "Fait",
    gearDoneAria: (title: string) => `Marquer «${title}» comme faite`,
    gearMarkedDone: "Marquée comme faite",
    gearRemoveAria: (title: string) =>
      `Supprimer la tâche d'entretien «${title}»`,
    gearRemoveConfirm: (title: string) =>
      `Vraiment supprimer la tâche d'entretien «${title}» ?`,
    gearRemoved: "Tâche d'entretien supprimée",
  },
  fireBans: {
    title: "Interdictions de feu par canton",
    sectionAria: "Niveaux de danger d'incendie de forêt de tous les cantons",
    intro:
      "Niveau de danger officiel au chef-lieu de chaque canton, le plus élevé en premier. Un canton peut couvrir plusieurs régions d'alerte – en montagne, le niveau diffère souvent de celui de la vallée.",
    loading: "Chargement des niveaux …",
    loadFailed:
      "Les niveaux de danger ne sont pas disponibles pour le moment. Sans réseau ou si le service fédéral est en panne, la liste reste vide.",
    retry: "Réessayer",
    unknown: "sans indication",
    banLikely: "Interdiction probable",
    disclaimer:
      "Le niveau est une appréciation de la Confédération. L'interdiction de feu est décidée par le canton ou la commune – à vérifier avant d'allumer.",
    portalLink: "Aperçu officiel des cantons",
  },
  weather: {
    tripPlaceSuggest: (name: string) => `Retenir le lieu du voyage « ${name} »`,
    mosquitoTitle: "Moustiques ce soir",
    mosquitoAria: "Indice moustiques pour la soirée",
    mosquitoBarAria: (score: number) => `Indice moustiques ${score} sur 100`,
    mosquitoLimiting: {
      kalt: "Trop frais pour un vol actif.",
      trocken: "L'air sec les tient à distance.",
      wind: "Le vent les éloigne – la meilleure protection qui soit.",
    },
    mosquitoHint:
      "Estimé à partir de la chaleur, de l'humidité, du vent et de la pluie des derniers jours. Un étang à côté de la tente bat n'importe quelle formule.",
    cloudLexiconHint:
      "Le ciel en sait souvent plus que la prévision : cherche le type de nuage et vois ce qui arrive.",
    heatSunscreen: (minutes: number, burn: number) =>
      `Crème solaire, à renouveler toutes les ${minutes} min (peau nue rouge après ~${burn} min)`,
    heatDrink: (liters: string) => `Environ ${liters} l d'eau par adulte`,
    title: "Météo du camp",
    subtitle:
      "Prévisions hyperlocales et alertes d'intempéries pour ton emplacement.",
    locationGroupAria: "Choisir le lieu des prévisions météo",
    myLocation: "Ma position",
    loadingAria: "Chargement des données météo",
    retry: "Réessayer",
    offlineHint:
      "Remarque : le module météo a besoin d'une connexion Internet et de ta position. Les modules hors ligne (premiers secours, nœuds, nature) continuent de fonctionner sans réseau.",
    serviceError: status => `Le service météo ne répond pas (${status})`,
    loadFailed: "Impossible de charger les données météo.",
    geoUnsupported: "Ton appareil ne prend pas en charge la géolocalisation.",
    geoDenied:
      "Position indisponible. Autorise l'accès à la position dans le navigateur.",
    elevation: m => `${m} m d'altitude`,
    feelsLike: deg => `Ressenti ${deg}°`,
    refreshAria: "Actualiser la météo",
    alertsAria: "Alertes d'intempéries",
    noAlerts:
      "Aucune alerte d'intempéries pour les prochaines 48 heures – bonnes conditions pour le camp.",
    severity: {
      gefahr: "Danger",
      warnung: "Alerte",
      info: "Info",
    },
    fireAria: "Danger d'incendie de forêt",
    fireTitle: title => `Danger d'incendie de forêt : ${title}`,
    fireLevelBadge: level => `Degré ${level}/5`,
    fireValidFrom: date => `valable depuis le ${date}`,
    fireSourcePrefix:
      "Source : carte des dangers de l'OFEV. Seules les décisions cantonales font foi – détails sur ",
    uvAria: "Indice UV",
    uvTitle: "Indice UV",
    uvTodayMax: uv => `Maximum du jour : UV ${uv}`,
    pollenTitle: "Pollens",
    pollenAria: "Pollens",
    pollenListAria: "Charge pollinique par espèce",
    pollenLoadingAria: "Chargement des données polliniques",
    pollenUnavailable:
      "Les données polliniques sont momentanément indisponibles – les prévisions météo n'en sont pas affectées.",
    pollenNoData: "Aucune donnée pollinique pour ce lieu.",
    pollenSource:
      "Source : Open-Meteo Air Quality (CAMS Europe) – charge actuelle de l'heure en cours.",
    pollenProfileTitle: "Tes types de pollen",
    pollenProfileIntro:
      "Choisis les types qui te concernent – ils sont mis en évidence et affichés en premier.",
    pollenOnlyMine: "N'afficher que mes types",
    pollenMineSr: "(ton type)",
    next24: "Prochaines 24 heures",
    rain48: "Pluie : prochaines 48 heures",
    chartRain: "Pluie",
    chartProb: "Probabilité",
    chartTooltipHour: label => `${label}`,
    chartLegend:
      "Barres = quantité de pluie (mm/h, axe gauche) · Ligne = probabilité de pluie (%, axe droit).",
    forecast7: "Prévisions à 7 jours",
    week2Title: "Semaine 2",
    windowTitle: "Fenêtres météo",
    windowHint: "Quel week-end vaut la sortie ?",
    windowWeekend: (sa: string, so: string) => `sa ${sa} – di ${so}`,
    windowSummary: (temp: number, rain: number) =>
      rain > 0
        ? `jusqu'à ${temp} °C · ${rain} mm de pluie`
        : `jusqu'à ${temp} °C · sec`,
    windowVerdicts: { top: "Top", ok: "Correct", bad: "Plutôt non" },
    week2Hint: "Tendance – fiabilité réduite",
    week2Aria: "Tendance pour la semaine 2",
    dayToggleAria: (day: string) =>
      `Afficher ou masquer le détail horaire pour ${day}`,
    chartTemp: "Température",
    hourlyLegend:
      "Ligne = température (°C, axe gauche) · Barres = quantité de pluie (mm/h, axe droit).",
    windRowAria: "Vent au fil de la journée",
    windRowLegend:
      "Flèche = direction du vent (indique vers où il souffle) · Chiffre = pointe de rafales en km/h.",
    windSrHour: (time: string, dir: string, gusts: number) =>
      `${time} : vent de ${dir}, rafales jusqu'à ${gusts} km/h`,
    windSrHourNoDir: (time: string, gusts: number) =>
      `${time} : rafales jusqu'à ${gusts} km/h`,
    dayWindPeak: (n: number) => `Pointe de vent : rafales jusqu'à ${n} km/h`,
    dayFeelsLike: (deg: number) => `ressenti jusqu\u2019à ${deg}°`,
    dayHoursEmpty: "Pas de données horaires disponibles pour ce jour.",
    dataSource:
      "Source des données : Open-Meteo (meilleure résolution disponible pour ta position, en Suisse MétéoSuisse ICON-CH). Les alertes sont calculées à partir des prévisions et ne remplacent pas les alertes officielles de MétéoSuisse.",
    compareButton: "Comparer avec un autre lieu",
    compareTitle: "Comparer des lieux",
    compareAria: "Comparaison météo de deux lieux",
    compareCloseAria: "Fermer la comparaison",
    compareSearchLabel: "Chercher un deuxième lieu",
    compareSearchPlaceholder: "p. ex. Bellinzone ou Fiesch",
    compareSearchButton: "Chercher",
    compareSearchingAria: "Recherche de lieu en cours",
    compareSearchFailed: "La recherche de lieu a échoué – réessaie plus tard.",
    compareNoResults: "Aucun lieu trouvé – vérifie l'orthographe.",
    compareResultsAria: "Lieux trouvés",
    compareSpotsLabel: "Ou choisir un emplacement enregistré :",
    compareChange: "Changer de lieu",
    compareLoadingAria: "Chargement des prévisions de comparaison",
    compareLoadFailed:
      "Impossible de charger les prévisions du lieu de comparaison.",
    compareCaption: (a, b) => `Comparaison à 7 jours : ${a} et ${b}`,
    compareDayHeader: "Jour",
    compareSrRain: "Pluie",
    compareSrWind: "Rafales",
    radarTitle: "Radar de pluie",
    radarAria: "Radar de pluie",
    radarIntro:
      "Précipitations de la dernière heure et prévision à très court terme (nowcast) autour du lieu choisi – en animation.",
    radarLoadingAria: "Chargement du radar de pluie",
    radarFailed: "Impossible de charger le radar de pluie.",
    radarMapAria: "Carte du radar de pluie",
    radarPlayAria: "Lancer l'animation du radar",
    radarPauseAria: "Mettre l'animation du radar en pause",
    radarTimestamp: time => `Image radar de ${time}`,
    radarForecastBadge: "Prévision",
    radarSource:
      "Données radar : RainViewer · Carte : OpenStreetMap. Les images nowcast sont une extrapolation à très court terme.",
    rainSoonAria: "Info pluie à court terme",
    pressureAria: "Tendance de la pression atmosphérique",
    pressureFalling: hPa =>
      `La pression atmosphérique baisse (−${hPa} hPa en 3 heures) – un changement de temps est probable.`,
    pressureFallingStrong: hPa =>
      `La pression atmosphérique chute fortement (−${hPa} hPa en 3 heures) – attends-toi à un net changement de temps et sécurise ton camp.`,
    rainStartsAt: time => `La pluie commence vers ${time}`,
    rainEndsAt: time => `La pluie cesse vers ${time}`,
    placeAddButton: "Ajouter un lieu",
    placeSearchLabel: "Chercher un lieu et l'enregistrer comme favori météo",
    placeSearchPlaceholder: "p. ex. Locarno ou Scuol",
    placeSearchCloseAria: "Fermer la recherche de lieu",
    placeResultsHint: "Un clic enregistre le lieu et affiche sa météo.",
    placeRemoveAria: name => `Retirer ${name} des lieux météo`,
    placeLimitHint: max =>
      `${max} lieux enregistrés au maximum – retire d'abord un lieu.`,
    placesTitle: "Tes lieux",
    placesAria: "Aperçu des alertes pour tes lieux",
    placesIntro:
      "Vérifie les alertes d'intempéries des prochaines 48 heures pour tes emplacements enregistrés et ton lieu de domicile.",
    placesLoadingAria: "Vérification des alertes pour tes lieux",
    placesNoAlert: "Aucune alerte",
    placesCheckFailed: "Vérification échouée",
    placesEmpty:
      "Aucun lieu enregistré pour l'instant – ajoute des emplacements favoris ou définis ton lieu de domicile dans le profil.",
    placesSelectAria: name =>
      `Afficher la météo de ${name} dans la vue principale`,
  },
  water: {
    title: "Calculateur d'eau potable",
    subtitle:
      "Quelle quantité d'eau emporter quand l'emplacement n'a pas de raccordement en eau fraîche ?",
    liters: n => `${n} litres`,
    recommendedNote:
      "quantité totale recommandée, réserve de sécurité de 20 % incluse",
    canisterNote: n => `Cela correspond à environ ${n} bidons de 10 litres`,
    adults: "Adultes",
    children: "Enfants",
    dogs: "Chiens",
    daysWithoutWater: "Jours sans raccordement en eau",
    decreaseAria: label => `Diminuer ${label}`,
    increaseAria: label => `Augmenter ${label}`,
    tempLabel: "Température maximale journalière attendue",
    tempSliderAria:
      "Température maximale journalière attendue en degrés Celsius",
    tempAuto: (days, temp) =>
      `Repris automatiquement : maximum des ${days} prochains jours à ta position (${temp} °C).`,
    tempReapply: temp => `Reprendre la prévision (${temp} °C)`,
    tempHint:
      "À partir de 20 °C, nous comptons un supplément de 0.5 l par personne et par jour tous les 5 °C.",
    activityTitle: "Niveau d'activité",
    activityGroupAria: "Choisir le niveau d'activité",
    activityCalm: "Calme",
    activityCalmHint: "Camp & baignade",
    activityNormal: "Normal",
    activityNormalHint: "Promenades",
    activityActive: "Actif",
    activityActiveHint: "Randonnée & sport",
    cookingTitle: "Inclure cuisine & vaisselle",
    cookingHint: "+1.5 l par personne et par jour",
    cookingAria: "Inclure l'eau pour la cuisine et la vaisselle",
    comfortTitle: "Toilette confortable",
    comfortHint:
      "Toilette rapide ou douche solaire : +4 l par personne et par jour",
    comfortAria: "Inclure l'eau pour une toilette confortable",
    breakdownTitle: "Détail",
    rowAdults: (perDay, n, days) =>
      `Boisson adultes (${perDay} l/jour × ${n} × ${days} jours)`,
    rowChildren: (perDay, n, days) =>
      `Boisson enfants (${perDay} l/jour × ${n} × ${days} jours)`,
    rowDogs: (perDay, n, days) =>
      `Chiens (${perDay} l/jour × ${n} × ${days} jours)`,
    rowCooking: "Cuisine & vaisselle",
    rowComfort: "Toilette confortable",
    rowReserve: "Réserve de sécurité (20 %)",
    rowTotal: "Total recommandé",
    footnote:
      "Remarque : valeurs indicatives pour un climat tempéré. En cas de canicule, d'altitude ou de travail physique, prévois plus large. La valeur pour les chiens vaut pour un chien de taille moyenne (env. 20 kg). N'utilise l'eau des ruisseaux que filtrée ou bouillie.",
  },
  sunCompass: {
    title: "Boussole solaire",
    subtitle:
      "Où se trouve le soleil et quand ? Parfait pour choisir l'emplacement et orienter les panneaux solaires.",
    kinds: {
      baum: "Arbre / forêt",
      berg: "Montagne / colline",
      gebaeude: "Bâtiment",
    },
    diagramAria: (dir: string, alt: number) =>
      `Diagramme de la position du soleil : soleil actuellement au ${dir} à ${alt} degrés de hauteur`,
    horizonLabel: "Horizon (0°)",
    ring30: "30° de hauteur",
    ring60: "60° de hauteur",
    cardinalN: "N",
    cardinalE: "E",
    cardinalS: "S",
    cardinalW: "O",
    risePoint: "Lever",
    setPoint: "Coucher",
    hourMark: (h: number) => `${h} h`,
    youAreHere: "Tu es ici",
    inShadow: "à l'ombre",
    sunBelowHorizon: "Soleil sous l'horizon",
    spotBanner: "Position du soleil pour l'emplacement enregistré",
    useOwnLocation: "Utiliser ma position",
    locating: "Localisation en cours …",
    retry: "Réessayer",
    geoUnsupported: "Cet appareil ne prend pas en charge la géolocalisation.",
    geoDenied:
      "Accès à la position refusé. Autorise-le dans les réglages du navigateur.",
    geoFailed: "Impossible de déterminer la position.",
    atTime: (time: string) => `À ${time}`,
    sunIsIn: "le soleil est au",
    aboveHorizon: "au-dessus de l'horizon",
    summaryBlocked:
      " – mais un obstacle saisi le cache : ton emplacement est à l'ombre.",
    summaryHigh: " – presque à la verticale, très peu d'ombre.",
    summaryMid: " – arbres et tentes projettent des ombres moyennes.",
    summaryLow:
      " – position basse, ombres longues : les obstacles font maintenant beaucoup d'ombre.",
    belowHorizonNext: "le soleil est sous l'horizon. Prochain lever :",
    clock: (time: string) => time,
    inTheEast: "à l'est.",
    viewFromAbove:
      "Vue de dessus de ton emplacement : anneau extérieur = horizon, centre = à la verticale au-dessus de toi.",
    placeModeHint: (kind: string) =>
      `Touche maintenant l'endroit du diagramme où se trouve l'obstacle (${kind}) – la direction et la hauteur sont reprises automatiquement.`,
    liveCompassOn: "Activer la boussole live",
    liveCompassOff: "Désactiver la boussole live",
    compassDenied:
      "L'accès au capteur de mouvement a été refusé – autorise-le dans les réglages du navigateur pour utiliser la boussole live.",
    compassUnsupported:
      "Cet appareil n'a pas de capteur de direction – la boussole live ne fonctionne que sur smartphones et tablettes.",
    compassWaiting:
      "En attente des données du capteur … bouge légèrement l'appareil en formant un huit pour calibrer la boussole.",
    legendSunNow: "Soleil maintenant",
    legendPathFuture: "Trajectoire (à venir)",
    legendPathPast: "Trajectoire (passée)",
    legendYourLocation: "Ta position",
    legendObstacle: "Obstacle",
    dateLabel: "Date",
    dateAria: "Choisir la date pour l'affichage de la position du soleil",
    planningView: "Vue de planification",
    sliderLabel: "Fais glisser le curseur pour regarder dans le futur",
    nowButton: "Maintenant",
    nowAria: "Régler la date et le curseur sur maintenant",
    timeAria: "Choisir l'heure pour l'affichage de la position du soleil",
    sunriseTitle: "Lever du soleil",
    sunsetTitle: "Coucher du soleil",
    belowHorizonShort: "sous l'horizon",
    sunHeightAt: (time: string) => `Hauteur du soleil à ${time}`,
    directionAt: (time: string) => `Direction à ${time}`,
    obstaclesTitle: "Obstacles à l'horizon",
    obstaclesIntro:
      "Saisis les arbres, montagnes ou bâtiments autour de ton emplacement. La boussole les affiche dans le diagramme et calcule quand ils cachent le soleil – important pour la tente et les panneaux solaires.",
    /** Berge automatisch aus dem Höhenmodell (#372) */
    terrainButton: "Détecter les montagnes",
    terrainBusy: "Détection en cours …",
    terrainHint:
      "À partir du modèle d’élévation autour de ce point : 24 directions jusqu’à 30 km. Les arbres et les maisons ne figurent dans aucun modèle – ceux-là, tu les dessines toi-même.",
    terrainNoLocation: "Pas de position – sans coordonnée, rien à calculer.",
    terrainFailed: "Le modèle d’élévation ne répond pas.",
    terrainDone: (count: number) => `${count} directions reprises du terrain`,
    profileGroupAria: "Choisir le profil d'obstacles",
    profileGeneral: "Général",
    obstacleLine: (
      label: string,
      dir: string,
      az: number,
      h: number,
      w: number
    ) => `${label} au ${dir} (${az}°) · ${h}° de haut · ${w}° de large`,
    removeObstacleAria: (label: string) => `Supprimer ${label}`,
    kindLabel: "Type",
    azimuthLabel: "Direction (°)",
    azimuthPlaceholder: "180 = sud",
    heightLabel: "Hauteur (°)",
    widthLabel: "Largeur (°)",
    placeByTapActive: "Mode toucher actif …",
    placeByTap: "Placer en touchant le diagramme",
    addNumeric: "Saisir avec des chiffres",
    fistTip:
      "Astuce pour la hauteur : tends le bras – un poing correspond à environ 10°. Un arbre qui se termine à deux poings et demi au-dessus de l'horizon fait donc environ 25°.",
    horizonTitle: "Soleil au-dessus de la crête",
    horizonShaded: "À l'ombre toute la journée – ici, aucun soleil ne passe.",
    horizonNone: "Aujourd'hui, le soleil ne dépasse pas l'horizon.",
    horizonSunny: (duration: string) => `${duration} au soleil`,
    horizonDelay: (duration: string) =>
      `${duration} plus tard qu'à l'horizon dégagé`,
    horizonNote:
      "Calculé à partir du profil d'obstacles de cet emplacement. À l'horizon plat, le soleil se lèverait plus tôt – dans la vallée, il passe la crête, et c'est cette heure-là qui compte.",
    shadowTitle: "Heures d'ombre aujourd'hui",
    shadeBarAria: "Évolution de l'ombre sur la journée",
    shadeTotals: (sun: string, shadeTime: string) =>
      `${sun} de soleil · ${shadeTime} d'ombre`,
    shadowNone:
      "Tes obstacles ne cachent jamais le soleil aujourd'hui – vue dégagée toute la journée.",
    shadowRange: (from: string, to: string) => `${from}–${to}`,
    shadowSuffix: "– soleil derrière un obstacle, emplacement à l'ombre",
    locationLine: "Position :",
    refreshLocationAria: "Actualiser la position",
    tipsTitle: "Conseils pour l'emplacement",
    morningShadeTitle: "De l'ombre le matin :",
    morningShadeText: (sunrise: string) =>
      `Place la tente de sorte qu'à l'est (lever du soleil à ${sunrise}) se trouvent des arbres ou une pente – la tente reste ainsi fraîche plus longtemps.`,
    solarTitle: "Panneaux solaires :",
    solarText1: (alt: number) =>
      `Oriente les panneaux vers le sud. Vers midi, le soleil atteint son point le plus haut à ${alt}° – le`,
    solarLink: "calculateur de budget énergie",
    solarText2: "aide à planifier le rendement.",
    photoLightTitle: "Lumière photo",
    photoLightIntro:
      "Heure dorée (lumière douce et chaude) et heure bleue (ciel bleu profond) à la date choisie à cet endroit.",
    photoLightMorning: "Le matin",
    photoLightEvening: "Le soir",
    goldenHour: "Heure dorée",
    blueHour: "Heure bleue",
    photoLightRange: (from, to) => `${from}–${to}`,
  },
  level: {
    tireFront: (bar: string) => `Pression avant ${bar} bar`,
    tireRear: (bar: string) => `arrière ${bar} bar`,
    serviceDue: (date: string) => `Service prévu le ${date}`,
    title: "Niveau à bulle",
    subtitle:
      "Mettre à niveau caravane, réchaud ou table – pose le téléphone à plat, écran vers le haut.",
    unsupported:
      "Cet appareil n'a pas de capteur d'inclinaison. Ouvre le niveau à bulle sur ton smartphone – il fonctionne entièrement hors ligne.",
    needsSensor:
      "Pour le niveau à bulle, l'app a besoin d'accéder au capteur d'inclinaison.",
    activateSensor: "Activer le capteur",
    bubbleAria: (pitch: string, roll: string) =>
      `Inclinaison : avant/arrière ${pitch}, gauche/droite ${roll}`,
    waitingSensor: "En attente des données du capteur",
    pitchLabel: "Avant / arrière",
    rollLabel: "Gauche / droite",
    levelNow: "De niveau – position parfaite !",
    zeroHere: "Mettre à zéro ici",
    resetCalibration: "Réinitialiser le calibrage",
    profileLabel: "Profil de véhicule",
    profileNames: {
      tent: "Tente",
      bus: "Van",
      caravan: "Caravane",
    },
    profileTolerance: (deg: string) => `Tolérance ±${deg}°`,
    manageVehicles: "Véhicules & charge utile",
    soundLabel: "Signal sonore",
    soundHint:
      "Bref son et vibration dès que c'est de niveau – de nouveau seulement si tu quittes le niveau entre-temps.",
    calibrationHint:
      "« Mettre à zéro ici » compense une coque de téléphone ou une table de travers : pose le téléphone sur une surface dont tu sais qu'elle est plane et mets à zéro là. Pour la caravane : pose le téléphone sur le sol ou un plan de travail à l'intérieur et cale le côté bas avec des cales jusqu'à ce que la bulle soit au centre.",
  },
  payload: {
    tireFrontLabel: "Pression des pneus avant (bar)",
    tireRearLabel: "Pression des pneus arrière (bar)",
    serviceDueLabel: "Prochain service",
    title: "Calculateur de charge utile",
    subtitle:
      "Ton attelage est-il surchargé ? Limites, chargement et feu tricolore en un coup d'œil.",
    disclaimer:
      "Aide à l'orientation sans garantie : seuls le permis de circulation et la balance font foi. Pèse ton attelage chargé avant le départ sur un pont-bascule public – ce calcul ne le remplace pas.",
    rigTitle: "Attelage",
    towLabel: "Véhicule tracteur",
    trailerLabel: "Remorque",
    noneOption: "Aucun véhicule choisi",
    noTrailerOption: "Sans remorque",
    showVehicles: "Modifier les véhicules",
    hideVehicles: "Replier les véhicules",
    vehiclesHint: "Le niveau à bulle utilise les mêmes profils.",
    limitsHint:
      "Toutes les valeurs figurent dans le permis de circulation. Laisse vide ce que tu ne connais pas – le feu reste alors gris au lieu de vert.",
    nameLabel: "Nom",
    kindLabel: "Type",
    roleLabel: "Rôle",
    roleNames: {
      tow: "Véhicule tracteur",
      trailer: "Remorque",
      none: "Hébergement",
    },
    emptyKgLabel: "Poids à vide (kg)",
    grossKgLabel: "Poids total admissible (kg)",
    towKgLabel: "Charge tractable admissible (kg)",
    noseKgLabel: "Charge sur la boule admissible (kg)",
    axleKgLabel: "Charge par essieu admissible (kg)",
    addVehicle: "Ajouter un véhicule",
    newVehicleName: "Nouveau véhicule",
    deleteVehicleAria: (name: string) => `Supprimer ${name}`,
    deleteVehicleConfirm: (name: string) =>
      `Vraiment supprimer « ${name} » ? Le niveau à bulle perd aussi ce profil.`,
    loadTitle: "Chargement",
    personsLabel: "Personnes",
    personKgLabel: "kg par personne",
    personsHint: (kg: string) => `${kg} dans le véhicule tracteur`,
    personsDecreaseAria: "Une personne de moins",
    personsIncreaseAria: "Une personne de plus",
    packListLabel: "Liste de bagages comme chargement",
    packListNone: "Aucune liste de bagages",
    packListWeight: (kg: string) => `${kg} d'après l'inventaire`,
    packListMissing: (n: number) =>
      `${n} articles sans poids dans l'inventaire – ils manquent dans le total`,
    packListLoggedOut:
      "Connecte-toi pour reprendre une liste de bagages avec son poids comme chargement.",
    positionLabel: "Position",
    positionNames: {
      tow: "Véhicule tracteur",
      trailer: "Remorque",
    },
    itemsTitle: "Postes libres",
    itemsHint:
      "Pour tout ce qui n'est pas sur la liste : eau dans le réservoir, bouteille de gaz, vélos, auvent.",
    itemLabelPlaceholder: "Quoi ?",
    itemKgPlaceholder: "kg",
    addItem: "Ajouter",
    removeItemAria: (label: string) => `Retirer ${label}`,
    noseMeasuredLabel: "Charge sur la boule mesurée (kg)",
    noseMeasuredHint:
      "Laisse vide : nous comptons 5 % du poids de la remorque.",
    resultTitle: "Résultat",
    noVehicleHint:
      "Choisis un véhicule tracteur ou une remorque – et nous calculons.",
    checkNames: {
      towGross: "Poids total du véhicule tracteur",
      trailerGross: "Poids total de la remorque",
      towCapacity: "Charge tractable",
      noseWeight: "Charge sur la boule",
      towAxle: "Charge par essieu du tracteur",
      trailerAxle: "Charge par essieu de la remorque",
    },
    statusNames: {
      ok: "dans le vert",
      tight: "juste",
      over: "surchargé",
      unknown: "pas clair",
    },
    verdict: {
      ok: "Tout est dans le vert – bonne route !",
      tight:
        "Juste : au moins une limite est presque atteinte. Pèse l'attelage avant de partir.",
      over: "Surchargé : au moins une limite est dépassée. Tu ne peux pas partir comme ça.",
      unknown:
        "Pas encore de verdict : il manque des données. Reprends les valeurs du permis de circulation.",
    },
    checkLine: (actual: string, limit: string, rest: string) =>
      `${actual} sur ${limit} · ${rest}`,
    freeLeft: (kg: string) => `${kg} de libre`,
    overBy: (kg: string) => `${kg} de trop`,
    missingLimit: "Limite non saisie – complète-la sur le véhicule.",
    missingValue: "Poids à vide manquant – impossible de calculer sans lui.",
    notComputable:
      "Pas calculable sans balance : la répartition du poids sur les essieux dépend de l'empattement et de l'endroit où tu charges.",
    estimatedNote: "avec une charge sur la boule estimée",
    totalsLine: (tow: string, trailer: string, train: string) =>
      `Tracteur ${tow} · Remorque ${trailer} · Attelage ${train}`,
    noseRule: (min: string, max: string, rec: string) =>
      `Règle empirique pour la charge sur la boule : 4 à 7 % du poids réel de la remorque, donc ${min} à ${max} ici. Utilise au mieux la charge admissible (jusqu'à ${rec}) – trop peu de poids sur le timon fait louvoyer l'attelage.`,
    levelHint: "Le véhicule est-il déjà de niveau ? Mêmes profils dans le",
    levelLink: "niveau à bulle",
  },
  roadRules: {
    plugTitle: "Prises & adaptateurs",
    tippingTitle: "Pourboire",
    paymentTitle: "Espèces & cartes",
    title: "Péage, vignette & règles",
    subtitle:
      "Fiche pour le pays de destination : péage, vitesse avec remorque, équipement obligatoire, urgences.",
    disclaimer:
      "Les règles, les prix et les limites changent – cet aperçu est une orientation, pas un renseignement juridique. Vérifie avant le départ auprès de ton automobile-club ou des autorités du pays.",
    countryLabel: "Choisir le pays",
    tollTitle: "Vignette & péage",
    trailerTitle: "Remorque",
    speedTitle: "Vitesse avec remorque",
    roadNames: {
      motorway: "Autoroute",
      rural: "Route",
      urban: "En localité",
    },
    bacTitle: "Taux d'alcoolémie",
    permille: (value: string) => `${value} ‰`,
    equipmentTitle: "Obligatoire à bord",
    zonesTitle: "Zones environnementales",
    emergencyTitle: "Appel d'urgence",
    callAria: (number: string) => `Appeler le numéro d'urgence ${number}`,
    campingTitle: "Nuitées & camping",
    updatedLine: (country: string, date: string) =>
      `${country} : état au ${date}. Valeurs en km/h ; sans garantie.`,
  },
  sos: {
    tripCountryTitle: (country: string) =>
      `Urgences pour ton voyage : ${country}`,
    tripCountryHint:
      "Ton voyage en cours se trouve dans ce pays – ces numéros y sont valables.",
    title: "SOS & tableau de bord d'urgence",
    subtitle:
      "Ta position et tous les numéros d'urgence importants – au cas où.",
    geoUnsupported: "Cet appareil ne permet pas de déterminer la position.",
    geoDenied:
      "Accès à la position refusé. Autorise-le dans les réglages du navigateur.",
    geoFailed: "Impossible de déterminer la position. Réessaie.",
    coordsCopied: "Coordonnées copiées",
    phraseTitle: "Phrase à lire",
    phraseHint:
      "Pour l'appel d'urgence à l'étranger : lis la phrase dans la langue de la centrale – les coordonnées y figurent déjà.",
    phraseCopyAria: (language: string) =>
      `Copier la phrase d'urgence en ${language}`,
    copyFailed: "Copie impossible",
    locationTitle: "Ta position",
    refresh: "Actualiser",
    refreshAria: "Actualiser la position",
    locating: "Détermination de la position …",
    decimalLabel: "Degrés décimaux (WGS84) – pour les services de secours",
    copyDecimalAria: "Copier les coordonnées en degrés décimaux",
    dmsLabel: "Degrés / minutes / secondes",
    lv95Label: "Coordonnées suisses (LV95)",
    outsideSwitzerland: "Hors de Suisse",
    accuracy: (m: number) => `Précision : ±${m} m`,
    altitude: (m: number) => ` · Altitude : ${m} m`,
    asOf: (time: string) => ` · État : ${time}`,
    numbersTitle: "Numéros d'urgence",
    callAria: (label: string) => `Appeler ${label}`,
    regaTitle: "Alarme Rega avec transmission de la position",
    regaText:
      "L'application officielle de la Rega transmet automatiquement ta position à la centrale d'intervention lors de l'alarme – cela accélère considérablement le sauvetage en montagne. Nous recommandons de l'installer en plus. Sinon, tu peux communiquer les coordonnées affichées ci-dessus en appelant le 1414.",
    regaLinkAria:
      "Ouvrir la page officielle de l'application Rega (lien externe)",
    regaLink: "Vers l'application Rega officielle",
    guideTitle: "Comment bien passer l'appel d'urgence",
    abroadTitle: "Numéros d'urgence à l'étranger",
    abroadHint:
      "Le 112 fonctionne dans toute l'Europe. Pour le secours en montagne et l'ambulance, les numéros nationaux directs sont souvent plus rapides – les voici pour les pays de camping courants.",
  },
  energy: {
    title: "Calculateur de budget énergie",
    subtitleLoggedOut:
      "Combien de temps tient ta powerstation ? Saisis tes consommateurs et calcule ton autonomie.",
    loginFeature: "tes consommateurs d'énergie",
    subtitle:
      "Consommateurs, production solaire et capacité de batterie combinés : voilà combien de temps tu peux rester autonome.",
    saveFailed: "Impossible d'enregistrer le consommateur",
    sourceSpot: (name: string) => `emplacement «${name}»`,
    sourceLocation: "ta position",
    rangeSelfSufficient: "Illimitée – le solaire couvre la consommation",
    rangeOverMax: (d: number) => `> ${d} jours`,
    rangeDays: (d: number) => `${d} jours`,
    rangeHours: (h: number) => `${h} h`,
    rangeUnknown: "–",
    rangeLabel: "Autonomie",
    consumptionPerDay: "Consommation / jour",
    solarPerDay: "Production solaire / jour",
    balancePerDay: "Bilan / jour",
    availableLabel: "Utilisable maintenant",
    storageTitle: "Ton stockage",
    storageIntro:
      "Powerstation ou batterie auxiliaire : la capacité, le type et l'état de charge déterminent la durée de ton autonomie.",
    chemistryLabel: "Type",
    chemistryNames: {
      lifepo4: "LiFePO₄",
      liion: "Li-ion / powerstation",
      agm: "AGM",
      gel: "Gel",
      lead: "Plomb (ouvert)",
    },
    modeLabel: "Saisir la capacité",
    modeWh: "en Wh",
    modeAh: "en Ah + volts",
    capacityWhLabel: "Capacité (Wh)",
    capacityWhHint: "Indiquée sur la powerstation, p. ex. 1024 Wh.",
    capacityAhLabel: "Capacité (Ah)",
    voltageLabel: "Tension nominale (V)",
    voltageHint:
      "Les batteries auxiliaires font en général 12 V, les grandes installations 24 V ou 48 V.",
    voltageMissing:
      "Sans tension, des Ah ne sont pas de l'énergie – saisis la tension nominale et nous en ferons des Wh.",
    usableLabel: "Part utilisable",
    usableDefaultHint: (p: number) =>
      `Valeur par défaut pour ce type : ${p} %. Une batterie au plomb ne se vide qu'à moitié, le LiFePO₄ presque entièrement – décharger plus profondément coûte de la durée de vie.`,
    usableReset: "Valeur du type",
    usableAria: "Part utilisable du stockage en pour cent",
    chargeLabel: "État de charge actuel",
    chargeAria: "État de charge actuel en pour cent",
    capacitySummary: (nominal: string, usable: string, reserve: string) =>
      `${nominal} nominal · ${usable} utilisables · ${reserve} restent en réserve contre la décharge profonde.`,
    capacityUnknown: "Aucune capacité saisie – sans elle, pas d'autonomie.",
    deepDischargeTitle: "Décharge profonde imminente",
    deepDischargeText:
      "La réserve utilisable sera épuisée aujourd'hui même. Éteins des consommateurs, recharge – ou accepte sciemment une décharge plus profonde, en sachant qu'elle coûte de la durée de vie.",
    missingStorageHint:
      "Saisis ton stockage ci-dessus et nous calculons ton autonomie.",
    missingConsumersHint:
      "Saisis tes consommateurs ci-dessous et nous calculons ton autonomie.",
    consumerShare: (p: number) => `${p} % de la consommation journalière`,
    templatesHint:
      "Les modèles sont des ordres de grandeur tirés de la pratique – pour les appareils à compresseur, il s'agit du temps de fonctionnement, pas du temps de présence. Ce qui figure sur la plaque signalétique prime.",
    coolingBadge: (hours: number, temp: number) =>
      `Appareil frigorifique : env. ${hours} h de marche à ${temp} °C selon la prévision`,
    coolingBadgeNoWeather:
      "Appareil frigorifique – la durée de marche viendra de la météo dès qu’une prévision est chargée",
    inverterBadge: "230 V via onduleur (+18 % comptés)",
    formInverter: "Appareil 230 V (onduleur, +18 %)",
    formCooling: "Appareil frigorifique – durée selon la météo",
    coolingToggleAria: (name: string) =>
      `${name} : activer ou désactiver la durée selon la météo`,
    inverterToggleAria: (name: string) =>
      `${name} : activer ou désactiver le supplément onduleur`,
    solarLabel: "Panneaux solaires (W au total)",
    solarHint: "p. ex. 2 panneaux de 200 W = 400",
    mountLabel: "Installation",
    mountRoof: "Fixe sur le toit",
    mountPortable: "Mobile, posé au sol",
    mountRoofHint:
      "Monté à plat : nous calculons avec le rayonnement sur la surface horizontale.",
    mountPortableHint:
      "Posé librement et orienté vers le soleil : nous demandons le rayonnement directement pour l'inclinaison et l'orientation recommandées plus bas.",
    forecastTitle: "Prévision de production",
    forecastSubtitle: (d: number) =>
      `Production attendue de ton installation pour les ${d} prochains jours.`,
    forecastTilted: "La base est le rayonnement sur ton panneau orienté.",
    forecastHorizontal:
      "La base est le rayonnement sur la surface horizontale.",
    noPanelHint:
      "Saisis ci-dessus la puissance nominale de tes panneaux et nous calculons la production.",
    dayYield: (wh: string, kwh: number) => `${wh} · ${kwh} kWh/m²`,
    dayBattery: (p: number) => `${p} % de stockage`,
    balanceTotals: (y: string, c: string, d: number) =>
      `Sur ${d} jours : ${y} produits contre ${c} consommés.`,
    wastedHint: (wh: string) =>
      `Dont ${wh} n'entrent plus dans le stockage plein.`,
    balanceCovered: (d: number) =>
      `Le soleil te porte pendant les ${d} jours – le stockage reste au-dessus de la limite de décharge.`,
    balanceEmpty: (date: string, d: number) =>
      `Le ${date}, la réserve utilisable est épuisée – le soleil suffit pour ${d} jours.`,
    balanceNoStorage:
      "Sans capacité saisie, nous montrons seulement la production et la consommation, pas l'état du stockage.",
    efficiencyIntro: (p: number) =>
      `Calculé avec ${p} % de rendement système – voici sa composition :`,
    lossNames: {
      controller: "Régulateur de charge",
      cable: "Câbles & connecteurs",
      temperature: "Température",
      soiling: "Salissure & vieillissement",
    },
    yieldSourceForecast:
      "Production solaire issue de la prévision de rayonnement.",
    yieldSourceSunHours:
      "Production solaire issue de tes heures d'ensoleillement effectives.",
    sunHoursLabel: "Heures de soleil effectives par jour",
    sunAutoLabel: "Reprendre automatiquement depuis les prévisions météo",
    sunAutoAria:
      "Reprendre automatiquement les heures de soleil depuis les prévisions météo",
    sunSliderAria: "Heures de soleil effectives par jour",
    manualModeHint:
      "Mode manuel : ta valeur est conservée et ne sera pas écrasée par les prévisions.",
    forecastLoading: "Chargement des prévisions …",
    forecastRefresh: "Actualiser les prévisions",
    forecastApply: "Reprendre les heures de soleil des prévisions météo",
    forecastOk: (avg: number, days: number, source: string) =>
      `Repris : Ø ${avg} h d'ensoleillement par jour (prévisions pour les ${days} prochains jours – source : ${source}).`,
    forecastError:
      "Prévisions automatiques indisponibles – autorise l'accès à la position, enregistre un emplacement favori ou règle la valeur manuellement.",
    guidelinePrefix:
      "Valeurs indicatives pour la Suisse : été ensoleillé 5–6 h, variable 3–4 h, couvert 1–2 h. L'ombre des arbres ou des montagnes réduit nettement la valeur – vérifie la course du soleil dans la ",
    sunCompassLink: "boussole solaire",
    guidelineSuffix:
      ". En mode automatique, la production est calculée avec la prévision de rayonnement ; tes heures d'ensoleillement restent un repère.",
    alignmentTitle: "Orientation optimale des panneaux aujourd'hui",
    alignmentDirection: "Orientation",
    alignmentTilt: "Inclinaison",
    alignmentVsFlat: "vs posé à plat",
    directSun: (from: string, to: string, h: number) =>
      `Soleil direct aujourd'hui de ${from} à ${to} (${h} h).`,
    directSunNoTimes: (h: number) => `Soleil direct aujourd'hui (${h} h).`,
    shadedPrefix: (h: number) =>
      `${h} h sont à l'ombre selon ton profil d'obstacles de la `,
    shadedLink: "boussole solaire",
    shadedSuffix: " – la recommandation en tient déjà compte.",
    obstacleTipPrefix: "Astuce : saisis les arbres ou montagnes dans la ",
    obstacleTipSuffix:
      ", la recommandation tiendra alors aussi compte de l'ombrage.",
    consumersTitle: "Tes consommateurs",
    formError: "Indique un nom, les watts et les heures",
    consumerPlaceholder: "Consommateur",
    consumerNameAria: "Nom du consommateur",
    wattsPlaceholder: "Watts",
    wattsAria: "Puissance en watts",
    hoursPlaceholder: "h/jour",
    hoursAria: "Heures de fonctionnement par jour",
    addAria: "Ajouter le consommateur",
    presetAddAria: (name: string) => `Ajouter la suggestion ${name}`,
    consumerLine: (w: number, h: number, wh: number) =>
      `${w} W · ${h} h/jour = ${wh} Wh`,
    enableAria: (name: string) => `Activer ${name}`,
    disableAria: (name: string) => `Désactiver ${name}`,
    deleteAria: (name: string) => `Supprimer ${name}`,
    empty:
      "Aucun consommateur saisi pour l'instant – utilise les suggestions ci-dessus ou ajoute tes propres appareils.",
    presets: {
      fridge: "Réfrigérateur",
      coolbox: "Glacière à compression",
      laptop: "Ordinateur portable",
      drone: "Charger la batterie du drone",
      phone: "Charger le smartphone",
      led: "Éclairage LED",
      camera: "Batteries d'appareil photo",
      pump: "Pompe à eau",
      heater: "Soufflerie du chauffage",
      fan: "Ventilateur",
      tv: "Téléviseur",
      router: "Routeur Wi-Fi",
    },
  },
  drying: {
    title: "Temps de séchage",
    subtitle:
      "Le linge sur la corde sera-t-il sec avant le coucher du soleil ? Calculé à partir de la température, de l'humidité et du vent.",
    myLocation: "Ma position",
    conditionsTitle: "Conditions actuelles",
    tempLabel: "Temp. (°C)",
    humidityLabel: "Humidité (%)",
    windLabel: "Vent (km/h)",
    loadingWeather: "Chargement de la météo …",
    loadWeather: "Reprendre la météo actuelle de ta position",
    weatherOk: (time: string) =>
      `Météo reprise – coucher du soleil aujourd'hui à ${time}.`,
    forecastNote:
      "L'estimation utilise l'évolution horaire des prévisions (plus précis qu'un instantané).",
    weatherError:
      "Impossible de charger la météo – saisis les valeurs à la main (la recommandation liée au coucher du soleil nécessite l'accès à la position).",
    lineTitle: "Qu'y a-t-il sur la corde ?",
    reminderTitle: "Rappel lessive",
    reminderText:
      "Reçois une alerte avant que la pluie n'arrive ou que le soleil ne se couche – pour rentrer le linge à temps. Le rappel fonctionne tant que l'app est ouverte (aussi dans un onglet en arrière-plan).",
    leadLabel: "Délai d'avance :",
    leadGroupAria: "Choisir le délai d'avance",
    minutesShort: (n: number) => `${n} min`,
    reminderStop: "Arrêter le rappel",
    reminderStart: "Activer le rappel",
    reminderActive: (info: string) => `Actif : ${info}`,
    rainWarnTitle: "La pluie arrive !",
    rainWarnBody: (min: number) =>
      `Il commencera à pleuvoir dans env. ${min} minutes – rentre le linge.`,
    sunsetWarnTitle: "Le soleil se couche bientôt",
    sunsetWarnBody: (min: number) =>
      `Encore env. ${min} minutes avant le coucher du soleil – rentre le linge avant la rosée du soir.`,
    scheduledRain: (time: string) => `Alerte pluie à ${time}`,
    scheduledSunset: (time: string) => `Rappel coucher du soleil à ${time}`,
    noReminderTitle: "Aucun rappel nécessaire",
    noReminderBody: "Ni pluie ni coucher du soleil ne sont imminents.",
    over24: "> 24 h",
    removeAria: (label: string) => `Retirer ${label}`,
    dryAtPrefix: "Vraisemblablement sec à ",
    dryAtSuffix: "",
    tomorrowSuffix: " (demain)",
    rainFromPrefix: "Attention : dès ",
    rainFromSuffix: "",
    rainAnnounced: ", de la pluie est annoncée",
    rainProbability: (p: number) => ` (${p} %)`,
    rainAction: " – décroche avant ou suspends sous l'auvent !",
    ownMaterialTitle: "Ajouter ton propre matériel",
    labelLabel: "Désignation",
    labelPlaceholder: "p. ex. pull en laine",
    baseHoursLabel: "Base (h)",
    addButton: "Ajouter",
    ownMaterialNote: "Matériel personnel",
    ownMaterialHint:
      "Temps de séchage de base = durée nécessaire par temps d'été doux (20 °C, 60 % d'humidité, vent léger). Tes matériaux restent enregistrés sur cet appareil.",
    footnote:
      "Valeurs estimées pour des affaires bien essorées et suspendues librement. Le soleil direct accélère encore le séchage, l'ombre et l'absence de vent le ralentissent. En cas de pluie : tout sous l'auvent.",
  },
  quiet: {
    title: "Minuteur de silence du camp",
    subtitle:
      "Garde un œil sur le volume sonore quand le repos nocturne s'applique au camping – discret et entièrement hors ligne.",
    micError:
      "Accès au microphone impossible. Autorise l'accès dans les réglages du navigateur – la mesure reste entièrement sur ton appareil.",
    quietActive: (from: string, to: string) =>
      `Repos nocturne actif (${from}–${to}) – le minuteur te rappelle à l'ordre si ça devient trop bruyant.`,
    quietInactive: (from: string) =>
      `Pas de repos nocturne actuellement. Il commence à ${from}.`,
    shhTitle: "Chut – repos nocturne !",
    shhBody:
      "Les conversations dépassent en ce moment ton seuil réglé. Les voisins de tente apprécieront des tons un peu plus discrets.",
    vibrateNote:
      "Sur Android, le téléphone vibre en plus (les iPhone ne prennent malheureusement pas en charge la vibration web).",
    levelTitle: "Niveau sonore",
    currentLabel: "Actuel :",
    thresholdLabel: "Seuil :",
    peakLabel: "Pic :",
    stopMeasuring: "Arrêter la mesure",
    startMeasuring: "Démarrer la mesure",
    privacyNote:
      "Le son n'est analysé qu'en direct – rien n'est enregistré, sauvegardé ou envoyé. L'écran doit rester allumé.",
    protocolTitle: "Journal de nuit",
    clearAria: "Effacer le journal",
    clear: "Effacer",
    tooltipValue: (v: number) => `Niveau ${v}`,
    tooltipName: "Maximum",
    tooltipLabel: (label: string) => `${label}`,
    protocolNote: (n: number) =>
      `Niveau maximal par minute (${n} min enregistrées, max. 8 h). La ligne pointillée est ton seuil de rappel. Le journal est conservé jusqu'à ce que tu quittes la page – idéal pour le bilan du matin.`,
    settingsTitle: "Réglages du repos nocturne",
    fromLabel: "Repos nocturne dès",
    toLabel: "Repos nocturne jusqu'à",
    thresholdSetting: "Seuil de rappel",
    thresholdAria: "Seuil de rappel pour le volume sonore",
    tip: "Astuce : démarre la mesure à un volume de conversation normal et règle le seuil juste au-dessus. Repos nocturne habituel dans les campings suisses : 22h00–07h00.",
  },
  lawn: {
    title: "Protège-gazon",
    subtitle:
      "Combien de temps la tente peut-elle rester sur le gazon avant que l'herbe ne souffre ?",
    setupTitle: "Ton installation",
    loadingWeather: "Chargement de la météo …",
    loadWeather: "Reprendre température & humidité de la météo",
    weatherNoteSoil: (temp: number, soil: string, moisture: string) =>
      `Maximum du jour ${temp} °C, humidité du sol ${soil} % → sol ${moisture}`,
    weatherNoteRain: (temp: number, rain: string, moisture: string) =>
      `Maximum du jour ${temp} °C, précipitations des 2 derniers jours ${rain} mm → sol ${moisture} (déduit)`,
    moistureWet: "humide",
    moistureNormal: "normal",
    moistureDry: "sec",
    fromForecast: (note: string) =>
      `Repris des prévisions : ${note}. Ajustable manuellement.`,
    weatherError:
      "Météo indisponible – règle la température et l'humidité à la main.",
    floorLabel: "Sol de tente",
    floorMesh: "Mesh / sans sol",
    floorMeshHint: "la lumière et l'air passent",
    floorStandard: "Sol de tente standard",
    floorStandardHint: "tapis de sol habituel",
    floorFootprint: "Sol + footprint",
    floorFootprintHint: "étanchéifie complètement",
    grassLabel: "État du gazon",
    grassRobust: "Robuste",
    grassRobustHint: "prairie de sport/camping",
    grassNormal: "Normal",
    grassNormalHint: "prairie ordinaire",
    grassDelicate: "Délicat",
    grassDelicateHint: "gazon d'ornement, fraîchement semé",
    sunLabel: "Ensoleillement de l'emplacement",
    sunShade: "Ombragé",
    sunPartial: "Mi-ombre",
    sunFull: "Plein soleil",
    moistureLabel: "Humidité du sol",
    moistureOptDry: "Sec",
    moistureOptNormal: "Normal",
    moistureOptWet: "Humide",
    tempLabel: "Température diurne",
    tempAria: "Température diurne en degrés Celsius",
    plannedLabel: "Durée de séjour prévue",
    plannedAria: "Durée de séjour prévue en jours",
    days: (n: number) => `${n} jour${n > 1 ? "s" : ""}`,
    verdictSafe:
      "Sans danger – le gazon se remet de lui-même en quelques jours.",
    verdictCaution:
      "Prudence – l'herbe va jaunir. Elle se remet généralement en 1–2 semaines, prévois de déplacer la tente.",
    verdictDamage:
      "Dommages durables probables – avec cette durée, l'herbe en dessous meurt. Déplace impérativement la tente.",
    statYellowing: "avant le premier jaunissement",
    statDamage: "avant des dommages durables",
    statMove: "déplacer au plus tard",
    tipsTitle: "Conseils pour ménager le gazon",
    tip1Title: "Déplacer la tente régulièrement :",
    tip1Text:
      "Un simple décalage d'une largeur de tente redonne lumière et air à l'herbe.",
    tip2Title: "Aérer la tente en journée :",
    tip2Text:
      "Soulève le sol ou ouvre les absides pour laisser s'échapper chaleur et humidité.",
    tip3Title: "Herbe jaunie :",
    tip3Text:
      "se remet généralement d'elle-même en 1–2 semaines – l'herbe brune et détrempée nécessite souvent un réensemencement.",
    tip4Title: "Journées chaudes :",
    tip4Text:
      "Au-dessus de 30 °C en plein soleil, le gazon souffre sous le sol de tente dès le premier jour.",
  },
  spots: {
    title: "Campings",
    subtitle:
      "Enregistre tes emplacements prévus et consulte la météo et la position du soleil à l'avance.",
    loginFeature: "tes campings",
    addSpot: "Ajouter un emplacement",
    empty:
      "Pas encore de favoris. Enregistre ton premier emplacement prévu – par coordonnées ou directement avec ta position actuelle.",
    saved: "Emplacement enregistré",
    deleteAria: name => `Supprimer ${name}`,
    elevation: (value: string) => `${value} m d'altitude`,
    dossierLink: "Dossier →",
    sunLink: "Position du soleil →",
    loadForecast: "Charger l'aperçu météo",
    weatherFailed: "Impossible de charger la météo.",
    retry: "Réessayer",
    gusts: n => `Rafales ${n} km/h`,
    pushEnabled:
      "Alertes intempéries activées – tu seras averti·e en cas de tempête ou d'orage sur tes emplacements",
    pushDisabled: "Alertes intempéries désactivées",
    pushTitle: "Alertes intempéries pour tes emplacements",
    pushDesc:
      "Notification push en cas de tempête, d'orage ou de fortes pluies sur l'un de tes emplacements enregistrés. ReiseKompass te rappelle aussi quand des aliments de la glacière arrivent bientôt à expiration – et 3 jours avant un séjour prévu, avec l'avancement de ta liste de bagages.",
    pushSaveFirst: "Enregistre d'abord un emplacement.",
    pushProfileHint: "Réglages fins dans le profil →",
    pushAria:
      "Activer les alertes intempéries pour les emplacements enregistrés",
    geoUnsupported: "Ton appareil ne prend pas en charge la géolocalisation.",
    geoUnavailable: "Position non disponible.",
    nameRequired: "Indique un nom, s'il te plaît.",
    coordsInvalid:
      "Indique des coordonnées valides (p. ex. 46.8182 et 8.2275).",
    dialogTitle: "Enregistrer l'emplacement",
    dialogDesc:
      "Touche la carte, reprends ta position actuelle ou saisis les coordonnées à la main.",
    nameLabel: "Nom",
    namePlaceholder: "p. ex. Camping Grindelwald",
    mapLabel: "Choisir le lieu sur la carte",
    mapHide: "Masquer la carte",
    mapShow: "Afficher la carte",
    latLabel: "Latitude",
    lonLabel: "Longitude",
    locating: "Localisation en cours …",
    useLocation: "Utiliser la position actuelle",
    noteLabel: "Note (facultatif)",
    notePlaceholder: "p. ex. place au bord du ruisseau, ombragée le matin",
    attrFilterAria: "Filtrer par caractéristiques",
    sortByDistance: "Par distance",
    distanceFromHome: (km: string) => `${km} de la maison`,
    attrFilterShade: "Beaucoup d'ombre",
    attrFilterQuiet: "Calme",
    attrFilterWifi: "Wi-Fi",
    attrFilterPower: "Électricité sur l'emplacement",
    attrFilterDogs: "Chiens admis",
    attrFilterKids: "Adapté aux enfants",
    attrFilterEmpty:
      "Aucun emplacement enregistré ne remplit toutes les caractéristiques choisies.",
    routeLink: "Itinéraire →",
    routeAria: (name: string) =>
      `Ouvrir l'itinéraire vers l'emplacement ${name} dans l'app de cartes`,
  },
  mapView: {
    title: "Carte",
    subtitle:
      "Tous tes emplacements enregistrés en un coup d'œil – avec les nuitées de «Mes voyages». La carte nécessite une connexion Internet.",
    loginFeature: "ta carte des emplacements",
    mapAria: "Carte avec tes emplacements enregistrés",
    empty:
      "Aucun emplacement sur la carte pour l'instant. Enregistre d'abord un emplacement favori, il apparaîtra ici comme épingle.",
    emptyCta: "Vers les emplacements favoris",
    nightsHere: (n: number) =>
      n === 1
        ? "1 nuitée selon «Mes voyages»"
        : `${n} nuitées selon «Mes voyages»`,
    toDossier: "Vers le dossier →",
    legend: (n: number) =>
      n === 1
        ? "1 emplacement enregistré sur la carte"
        : `${n} emplacements enregistrés sur la carte`,
    targetKind: "Cible du Retrouve-tente",
    aimTarget: "Mettre le cap →",
    targetLegend: (n: number) =>
      n === 1
        ? "1 cible du Retrouve-tente sur la carte"
        : `${n} cibles du Retrouve-tente sur la carte`,
    routeLink: "Itinéraire →",
    locateButton: "Ma position",
    locateFailed: "Impossible de déterminer la position.",
    measureButton: "Mesurer",
    measureHint: "Touche deux points sur la carte",
    discoverSearchHere: "Chercher dans cette zone",
    discoverLoading: "Chargement des campings …",
    discoverZoomHint: "Zoome davantage pour chercher des campings.",
    discoverError: "Impossible de charger les campings – réessaie plus tard.",
    discoverCount: (n: number) =>
      n === 0
        ? "Aucun camping trouvé dans cette zone."
        : n === 1
          ? "1 camping trouvé"
          : `${n} campings trouvés`,
    discoverLegend: (n: number) =>
      n === 1
        ? "1 camping découvert (OpenStreetMap)"
        : `${n} campings découverts (OpenStreetMap)`,
    osmFallbackName: "Camping",
    osmWebsite: "Site web →",
    osmSource: "© OpenStreetMap",
    adoptFavorite: "Enregistrer comme favori",
    adopted: (name: string) => `«${name}» enregistré comme favori`,
    createTitle: "Créer un favori ici ?",
    createDesc: (lat: string, lon: string) =>
      `Position ${lat}, ${lon} – donne un nom au nouvel emplacement.`,
    createNameLabel: "Nom",
    createNamePlaceholder: "p. ex. Camping Seeblick",
    createNameRequired: "Saisis d'abord un nom.",
    createConfirm: "Créer le favori",
    createKindAria: "Que cr\u00e9er ici",
    createKindFavorite: "Camping favori",
    createKindSavedPlace: "Lieu \u00e0 retenir",
    createSavedPlaceConfirm: "Enregistrer le lieu",
    createNoteLabel: "Note (optionnelle)",
    createNotePlaceholder: "p. ex. recommand\u00e9 par le voisin",
    createColorLabel: "Couleur du rep\u00e8re",
    layerSavedPlaces: "Lieux retenus",
    savedPlaceKind: "Lieu retenu \u2013 destination de r\u00eave",
    savedPlaceLegend: (n: number) =>
      `${n} lieu${n === 1 ? "" : "x"} retenu${n === 1 ? "" : "s"}`,
    savedPlaceDelete: "Retirer le lieu",
    savedPlaceDeleted: "Lieu retir\u00e9",
    savedPlaceCreatedToast: (name: string) =>
      `Lieu \u00ab\u202f${name}\u202f\u00bb enregistr\u00e9`,
    createdToast: (name: string) => `«${name}» créé comme favori`,
    createdToastAction: "Vers le dossier",
    sightingKind: "Observation nature",
    sightingLegend: (n: number) =>
      n === 1
        ? "1 observation nature sur la carte"
        : `${n} observations nature sur la carte`,
    layerGroupAria: "Choisir l'affichage de la carte",
    layerMap: "Carte",
    layerSatellite: "Satellite",
    clusterAria: (n: number) => `Groupe de ${n} épingles – touche pour zoomer`,
    layerFilterAria: "Afficher ou masquer les couches d'épingles",
    layerFavorites: "Favoris",
    layerTargets: "Cibles",
    layerSightings: "Observations",
    layerCampsites: "Campings (OSM)",
    layerExcursions: "Excursions",
    excursionLegend: (n: number) =>
      n === 1 ? "1 but d'excursion" : `${n} buts d'excursion`,
    layerFirepits: "Foyers",
    firepitLoading: "Recherche des foyers …",
    firepitZoomHint: "Zoome davantage pour chercher des foyers.",
    firepitError:
      "Les foyers n'ont pas pu être chargés – réessaie plus tard s'il te plaît.",
    firepitCount: (n: number) =>
      n === 0
        ? "Aucun foyer trouvé dans cette zone."
        : n === 1
          ? "1 foyer trouvé"
          : `${n} foyers trouvés`,
    firepitLegend: (n: number) =>
      n === 1
        ? "1 foyer / gril (OpenStreetMap)"
        : `${n} foyers / grils (OpenStreetMap)`,
    firepitSearchHint: "Touche « Chercher dans cette zone ».",
    layerFamily: "Famille",
    familyLoading: "Recherche des places de jeux et lieux de baignade …",
    familyZoomHint:
      "Zoome davantage pour chercher des places de jeux et lieux de baignade.",
    familyError:
      "Les places de jeux et lieux de baignade n'ont pas pu être chargés – réessaie plus tard s'il te plaît.",
    familyCount: (n: number) =>
      n === 0
        ? "Aucune place de jeux ni lieu de baignade trouvé dans cette zone."
        : n === 1
          ? "1 place de jeux / lieu de baignade trouvé"
          : `${n} places de jeux et lieux de baignade trouvés`,
    familyLegend: (n: number) =>
      n === 1
        ? "1 place de jeux / lieu de baignade (OpenStreetMap)"
        : `${n} places de jeux et lieux de baignade (OpenStreetMap)`,
    familySearchHint: "Touche « Chercher dans cette zone ».",
  },
  spotDetail: {
    staysShowAll: (n: number) => `Afficher les ${n} séjours`,
    staysShowLess: "Afficher moins",
    tariffCurrencyAria: "Monnaie",
    tariffUnitPlaceholder: "p. ex. par jour",
    tariffPeriodAdd: "Ajouter une période",
    tariffPeriodFromAria: "Valable dès (JJ.MM.)",
    tariffPeriodToAria: "Valable jusqu'au (JJ.MM.)",
    tariffPeriodRemoveAria: "Supprimer la période",
    tariffActiveNow: "en vigueur",
    tariffCopySuffix: "(copie)",
    tariffDuplicateAria: (name: string) => `Dupliquer le tarif ${name}`,
    tariffRowLabelMissing: "Une ligne de tarif a un prix mais pas de libellé.",
    tariffRowPriceInvalid: (label: string) =>
      `Le prix pour «${label}» manque ou est illisible.`,
    fallbackTitle: "Emplacement",
    backLabel: "Emplacements",
    notFoundTitle: "Emplacement introuvable",
    elevation: (value: string) => `${value} m d'altitude`,
    sunTitle: "Soleil aujourd'hui à cet emplacement",
    sunrise: "Lever",
    noon: "Zénith",
    sunset: "Coucher",
    sunCompassLink: "Voir la course du soleil et les ombres dans la boussole",
    weatherTitle: "Aperçu météo",
    weatherFailed: "Impossible de charger la météo (hors ligne ?).",
    moreAlerts: n => ` (+${n} ${n === 1 ? "autre" : "autres"})`,
    noAlerts: "Aucune alerte intempéries dans les prochaines 48 heures.",
    obstacleTitle: "Profil d'obstacles",
    obstaclesRecorded: n =>
      `${n} obstacle${n === 1 ? "" : "s"} enregistré${n === 1 ? "" : "s"} – les heures d'ombre et l'orientation des panneaux tiennent automatiquement compte de ce profil.`,
    obstacleEmpty:
      "Aucun profil d'obstacles n'est encore enregistré pour cet emplacement. Ajoute des arbres, montagnes ou bâtiments dans la boussole solaire pour voir les heures d'ombre.",
    obstacleEdit: "Modifier le profil dans la boussole solaire",
    obstacleCreate: "Créer le profil dans la boussole solaire",
    staysTitle: "Tes séjours ici",
    nightsTotalLabel: n => `${n === 1 ? "nuit" : "nuits"} au total`,
    staysCountLabel: n => (n === 1 ? "séjour" : "séjours"),
    staysEmpty: "Encore aucun séjour à cet emplacement dans «Mes voyages».",
    toDiary: "Vers «Mes voyages»",
    shareTitle: "Partager l'emplacement",
    shareDesc:
      "Toute personne disposant du lien voit le nom, les coordonnées, la météo et les heures de soleil de cet emplacement – sans connexion et en lecture seule. Tes notes, obstacles et entrées de voyage restent privés.",
    stopShare: "Arrêter le partage",
    stopShared: "Partage terminé – le lien n'est plus valable",
    shareLinkCopied: "Lien de partage copié",
    shareLinkCreated: "Lien de partage créé – copie-le ci-dessus",
    shareFailed: "Échec du partage",
    shareButton: "Partager l'emplacement par lien",
    qrAlt: name => `Code QR vers le lien de partage de l'emplacement ${name}`,
    qrTitle: "À transmettre directement sur place",
    qrText:
      "Fais scanner le code avec l'appareil photo du téléphone – le dossier de l'emplacement s'ouvre immédiatement, sans saisie ni connexion.",
    climateTitle: "Meilleure période de voyage",
    climateIntro:
      "Valeurs mensuelles issues de cinq ans d'archives météo : maximales et minimales moyennes ainsi que jours de pluie par mois à cet emplacement.",
    climateLoadingAria: "Chargement des données climatiques",
    climateFailed: "Impossible de charger les données climatiques.",
    climateRetry: "Réessayer",
    climateBestTitle: "Meilleurs mois :",
    climateChartMax: "Max. journalier moyen",
    climateChartMin: "Min. journalier moyen",
    climateChartRain: "Jours de pluie",
    climateDaysUnit: "jours",
    climateLegend:
      "Lignes = maximum/minimum journalier moyen (°C, axe gauche) · Barres = jours de pluie par mois (plus de 1 mm, axe droit).",
    climateSource: (from, to) =>
      `Source : archives météo Open-Meteo, années ${from}–${to}. Meilleurs mois = les plus chauds avec le moins de jours de pluie.`,
    photosTitle: "Photos",
    photosHint:
      "Garde une trace de l'emplacement en images – parcelle, vue, panneau d'infos. Visible seulement par toi ; la vue partagée du dossier n'affiche aucune photo.",
    addPhotos: "Ajouter des photos",
    addPhotosAria: (name: string) =>
      `Ajouter des photos à l'emplacement ${name}`,
    photoCountHint: (n: number, max: number) => `${n} sur ${max} photos`,
    photoUploading: (n: number) =>
      n === 1 ? "1 photo en cours d'envoi …" : `${n} photos en cours d'envoi …`,
    photoUploaded: (n: number) =>
      n === 1 ? "Photo enregistrée" : `${n} photos enregistrées`,
    photoLimitReached: (max: number) =>
      `Maximum ${max} photos par emplacement – les photos en trop ont été ignorées`,
    photoTooLarge: (name: string) =>
      `${name} : l'image est trop grande (max. 5 Mo)`,
    photoUnsupportedType: (name: string) =>
      `${name} : format non pris en charge – JPEG, PNG et WebP sont autorisés`,
    photoHeic: (name: string) =>
      `${name} : HEIC/HEIF n'est pas pris en charge – exporte la photo en JPEG`,
    photoReadFailed: (name: string) => `${name} : impossible de lire l'image`,
    photoUploadFailed: (name: string) => `${name} : échec de l'envoi`,
    photosLoadFailed: "Impossible de charger les photos",
    photoDeleteConfirm: "Supprimer définitivement cette photo ?",
    photoDeleted: "Photo supprimée",
    photoDeleteAria: (n: number) => `Supprimer la photo ${n}`,
    photoAlt: (n: number, place: string) =>
      `Photo ${n} de l'emplacement ${place}`,
    photoOpenAria: (n: number, place: string) =>
      `Ouvrir la photo ${n} de ${place} en grand`,
    galleryTitle: (place: string) => `Photos – ${place}`,
    galleryCounter: (n: number, total: number) => `Photo ${n} sur ${total}`,
    galleryPrev: "Photo précédente",
    galleryNext: "Photo suivante",
    attributesTitle: "Caractéristiques",
    attributesEmpty:
      "Aucune caractéristique saisie pour l'instant – note ce qui fait cet emplacement : ombre, sanitaires, bruit et plus.",
    attributesEditButton: "Modifier les caractéristiques",
    attributesDialogTitle: "Modifier les caractéristiques",
    attributesDialogDesc:
      "Choisis la valeur qui convient pour chaque caractéristique – laisse vide ce que tu ne sais pas (encore).",
    attributeUnset: "Sans indication",
    attributeGroupAria: name => `Choisir la valeur pour ${name}`,
    attributesSaved: "Caractéristiques enregistrées",
    sectionPlace: "L'emplacement",
    sectionArrival: "Le trajet",
    sectionWeather: "Météo et ciel",
    sectionAround: "Aux alentours",
    sectionOwn: "Personnel",
    sectionNavAria: "Sections du dossier",
    routeButton: "Itinéraire",
    routeAria: "Ouvrir l'itinéraire vers cet emplacement dans l'app de cartes",
    contactTitle: "Contact & check-in",
    contactEmpty:
      "Pas encore de coordonnées – note le téléphone de la réception, les horaires de check-in et ton numéro de parcelle.",
    contactEditButton: "Modifier les coordonnées",
    contactDialogTitle: "Modifier contact & check-in",
    contactDialogDesc:
      "Tous les champs sont facultatifs – les champs vides ne s'affichent pas.",
    contactPhoneLabel: "Téléphone réception",
    contactPhonePlaceholder: "p. ex. +41 33 123 45 67",
    contactPhoneAria: (name: string) => `Appeler la réception de ${name}`,
    contactCheckinLabel: "Horaires de check-in",
    contactCheckinPlaceholder: "p. ex. check-in 14h–18h, check-out jusqu'à 11h",
    contactParcelLabel: "Numéro de parcelle",
    contactParcelPlaceholder: "p. ex. B12",
    contactSaved: "Coordonnées enregistrées",
    costTitle: "Coût par nuit",
    costEmpty:
      "Aucun prix saisi pour l'instant – note ce que coûte une nuit ici, tu pourras ensuite comparer les emplacements dans les statistiques.",
    costEditButton: "Modifier les coûts",
    tariffsTitle: "Autres tarifs",
    tariffsEmpty: "Aucun tarif saisi.",
    tariffRowsEmpty: "Aucune ligne.",
    tariffsHint:
      "Pour la comparaison des emplacements dans les statistiques, c’est toujours le prix par nuit ci-dessus qui compte – comparer plusieurs tarifs ne serait plus une comparaison.",
    tariffsEditButton: "Modifier les tarifs",
    tariffsSaved: "Tarifs enregistrés",
    tariffAdd: "Ajouter un tarif",
    tariffRowAdd: "Ajouter une ligne",
    tariffNamePlaceholder: "p. ex. haute saison",
    tariffRowLabelPlaceholder: "p. ex. adultes",
    tariffRowPriceAria: "Prix par nuit",
    tariffTotal: (amount: string) => `Ensemble ${amount}`,
    tariffRowOneOff: "forfait unique",
    tariffRowOneOffAria: (label: string) =>
      `${label} : forfait unique au lieu de par nuit`,
    tariffRemoveAria: (name: string) => `Supprimer le tarif ${name}`,
    tariffRowRemoveAria: (label: string) => `Supprimer la ligne ${label}`,
    costPriceLabel: "Emplacement par nuit",
    costExtraLabel: "Taxe de séjour et frais annexes",
    costNightlyLabel: "Total par nuit",
    costEstimate: (nights: number, amount: string) =>
      `Tes ${nights === 1 ? "1 nuit" : `${nights} nuits`} ici représentent environ ${amount} – estimation approximative.`,
    costHint:
      "Ce n'est qu'une estimation : ReiseKompass ne connaît ni les rabais, ni les enfants, ni le chien, ni les suppléments de saison. Ce que tu as vraiment payé figure dans la caisse du séjour concerné.",
    costDialogTitle: "Modifier le coût par nuit",
    costDialogDesc:
      "Les deux champs sont facultatifs – laisser vide signifie « non saisi ».",
    costPriceInputLabel: "Emplacement par nuit (CHF)",
    costPricePlaceholder: "p. ex. 42.00",
    costExtraInputLabel: "Taxe de séjour et frais annexes par nuit (CHF)",
    costExtraPlaceholder: "p. ex. 3.50",
    costExtraHelp:
      "Tout ce qui s'ajoute par nuit : taxe de séjour, électricité, jetons de douche, chien.",
    costSaved: "Coûts enregistrés",
    offlineMapTitle: "Carte hors ligne",
    offlineMapDesc:
      "Télécharge à l'avance les tuiles de carte autour de cet emplacement – la carte et le radar de tente s'y retrouveront même sans réseau.",
    offlineMapRadiusLabel: "Rayon",
    offlineMapRadiusGroupAria: "Choisir le rayon de la carte hors ligne",
    offlineMapRadiusOption: km => `${km} km`,
    offlineMapDetailLabel: "Niveau de détail",
    offlineMapDetailGroupAria:
      "Choisir le niveau de détail de la carte hors ligne",
    offlineMapDetailOption: zoom => `jusqu'au zoom ${zoom}`,
    offlineMapTileCount: n => (n === 1 ? "1 tuile" : `${n} tuiles`),
    offlineMapLayerNote: layer => `Vue : ${layer}`,
    offlineMapCapped: max =>
      `Limite de ${max} tuiles atteinte – le téléchargement part du centre vers l'extérieur.`,
    offlineMapDownload: "Télécharger",
    offlineMapDownloadAria: name =>
      `Télécharger la carte hors ligne pour ${name}`,
    offlineMapCancel: "Annuler",
    offlineMapProgress: (done, total) => `${done} tuiles sur ${total}`,
    offlineMapSaved: (tiles, size) =>
      `Enregistré : ${tiles} tuiles, env. ${size} Mo`,
    offlineMapSavedAt: date => `Téléchargé le ${date}`,
    offlineMapDelete: "Supprimer",
    offlineMapDeleteAria: name => `Supprimer la carte hors ligne de ${name}`,
    offlineMapDeleted: "Carte hors ligne supprimée",
    offlineMapDone: n =>
      `${n} tuiles enregistrées – ici, la carte fonctionne désormais aussi hors ligne.`,
    offlineMapNothing: "Aucune tuile n'a pu être chargée (hors ligne ?).",
    offlineMapCancelled:
      "Téléchargement annulé – les tuiles déjà chargées restent enregistrées.",
    offlineMapUnsupported:
      "Ce navigateur ne peut pas enregistrer de cartes hors ligne.",
    offlineMapFairUse:
      "Les tuiles proviennent d'OpenStreetMap et d'Esri et sont mises à disposition gratuitement. Ne télécharge donc que ce dont tu as vraiment besoin – d'où la limite par emplacement.",
  },
  tentFinder: {
    title: "Retrouve-tente",
    subtitle:
      "Cap boussole et distance pour retrouver ta tente – même de nuit ou sur les grands campings.",
    targetTitle: "Cible",
    ownTargetsTitle: "Tes cibles",
    empty:
      "Aucune cible enregistrée pour l'instant. Place-toi là où tu voudras revenir plus tard – par exemple juste à côté de la tente – donne un nom à l'endroit et enregistre ta position.",
    addTitle: "Enregistrer la position actuelle sous …",
    nameAria: "Nom de la cible",
    namePlaceholder: "p. ex. Tente ou Douches",
    suggestionsAria: "Suggestions de noms",
    suggestionTent: "Tente",
    suggestionShowers: "Douches",
    suggestionWc: "WC",
    suggestionDishes: "Coin vaisselle",
    suggestionPlayground: "Place de jeux",
    suggestionReception: "Réception",
    iconLabel: "Symbole",
    iconNames: {
      tent: "Tente",
      shower: "Douches",
      wc: "WC",
      water: "Eau",
      playground: "Place de jeux",
      reception: "Réception",
      car: "Voiture",
      waste: "Déchets",
      other: "Divers",
    },
    saveButton: "Enregistrer la position",
    nameMissing: "Donne d'abord un nom à la cible",
    tooMany: "Trop de cibles – supprimes-en d'abord une",
    savedToast: name =>
      `«${name}» enregistré – tu retrouveras ton chemin jusqu'ici`,
    deleteAria: name => `Supprimer la cible «${name}»`,
    deleteConfirm: name => `Vraiment supprimer la cible «${name}» ?`,
    deletedToast: name => `«${name}» supprimé`,
    renameAria: (name: string) => `Renommer la cible «${name}»`,
    renameInputAria: "Nouveau nom de la cible",
    renamedToast: (name: string) => `Renommé en «${name}»`,
    remembering: "Recherche de la position …",
    rememberFailed: "Impossible de déterminer la position",
    noTarget:
      "Aucune cible choisie. Touche une cible ci-dessus – ou enregistre ta position actuelle sous un nom.",
    geoUnsupported: "Ton appareil ne permet pas la géolocalisation.",
    geoDenied:
      "Accès à la position refusé – autorise-le dans les réglages du navigateur.",
    geoFailed: "Position indisponible.",
    geoWaiting: "Recherche de la position GPS …",
    accuracyInfo: m => `Précision GPS ±${m} m`,
    directionText: (dir, dist) =>
      `La cible est en direction ${dir}, à ${dist}.`,
    arrowAria: (dir, dist) =>
      `Flèche de direction : cible en direction ${dir}, à ${dist}`,
    arrived: "Tu y es presque – regarde autour de toi !",
    compassActivate: "Activer la boussole",
    compassActivateHint:
      "Pour que la flèche puisse tourner, ReiseKompass a besoin d'accéder à la boussole de ton appareil.",
    movementHint:
      "Direction reprise de ton déplacement – la flèche n'est correcte que tant que tu avances.",
    noCompassHint:
      "Pas de boussole disponible : la flèche ne peut pas tourner. Oriente-toi avec le point cardinal – ou fais quelques pas, ReiseKompass reprendra alors la direction de ton déplacement.",
    mapTitle: "Mini-carte",
    mapAria: "Carte avec ta position et tes cibles enregistrées",
    mapHint: "Point bleu : ta position. Touche un repère pour viser la cible.",
    mapNoTargets:
      "Point bleu : ta position. Les cibles enregistrées apparaissent comme repères.",
    mapOffline:
      "Hors ligne – la carte ne peut pas charger les tuiles. La boussole continue de fonctionner.",
    mapLoadFailed: "Impossible de charger la carte.",
    mapRetry: "Réessayer",
  },
  hike: {
    pauseLine: (total: string, pause: string) =>
      `Temps total ${total} – dont ${pause} de pauses`,
    title: "Enregistrer une randonnée",
    subtitle:
      "Enregistre tes randonnées et tes balades depuis l'emplacement – avec distance, durée, allure et dénivelé. La trace reste sur ton appareil jusqu'à ce que tu l'enregistres.",
    loginFeature: "les randonnées enregistrées",
    recorderTitle: "Enregistrement",
    recorderIntro:
      "Au démarrage, ReiseKompass passe le GPS en haute précision. Les mesures imprécises et les sauts sont filtrés pour que la distance et le dénivelé soient justes. L'enregistrement continue si tu changes de page.",
    start: "Démarrer l'enregistrement",
    pause: "Pause",
    resume: "Reprendre",
    stop: "Arrêter",
    discard: "Abandonner",
    discardConfirm:
      "Abandonner vraiment l'enregistrement ? Les points enregistrés seront perdus.",
    statusRecording: "Enregistrement en cours",
    statusPaused: "En pause",
    startedAt: (time: string) => `Départ ${time}`,
    pointCount: (n: number) => (n === 1 ? "1 point" : `${n} points`),
    statDistance: "Distance",
    statDuration: "Durée",
    statSpeed: "Allure moy.",
    statElevation: "Dénivelé",
    statAscent: "Montée",
    statDescent: "Descente",
    waitingFix: "En attente d'un signal GPS précis …",
    accuracy: (m: number) => `Précision ±${m} m`,
    pausedHint:
      "En pause – la pause ne compte ni dans la durée ni dans la distance.",
    geoUnsupported: "Cet appareil ne fournit pas de données de localisation.",
    geoDenied:
      "Accès à la position refusé – autorise-le dans les réglages de ton navigateur.",
    geoFailed: "Impossible de déterminer la position.",
    keepAwakeLabel: "Garder l'écran allumé",
    tooFewPoints:
      "Trop peu de points exploitables – l'enregistrement a été abandonné.",
    saveTitle: "Enregistrer la randonnée",
    saveDesc: "Donne un nom à la randonnée et rattache-la à un voyage.",
    saveNeedsLogin:
      "Il te faut un compte pour l'enregistrer – l'export GPX fonctionne aussi sans.",
    nameLabel: "Nom",
    activityLabel: "Activité",
    activityHike: "Randonnée",
    activityBike: "Vélo",
    namePlaceholder: "p. ex. Tour du lac",
    nameRequired: "Merci d'indiquer un nom",
    defaultName: (date: string) => `Randonnée du ${date}`,
    saved: "Randonnée enregistrée",
    tripLabel: "Voyage (facultatif)",
    tripNone: "Sans voyage",
    tripBadge: (name: string) => `Voyage : ${name}`,
    listTitle: "Mes randonnées",
    listEmpty: "Aucune randonnée enregistrée pour l'instant",
    listEmptyHint:
      "Lance l'enregistrement ci-dessus – après l'arrêt, la randonnée apparaît ici.",
    showMap: "Afficher la carte",
    hideMap: "Masquer la carte",
    mapAria: "Carte de la randonnée enregistrée",
    mapFailed: "La carte n'a pas pu être chargée.",
    mapEmpty: "Aucun point enregistré pour cette randonnée.",
    gpxExport: "Télécharger le GPX",
    gpxDone: "Fichier GPX créé",
    gpxImport: "Importer un GPX",
    gpxImporting: "Importation …",
    gpxImported: "Randonnée importée.",
    gpxImportedEstimated:
      "Randonnée importée. Le fichier ne contenait pas d'horodatage – durée et allure sont déduites de 4 km/h.",
    gpxImportFailed: "Le fichier n'a pas pu être lu comme GPX.",
    gpxFailed: "Export GPX impossible",
    gpxFallbackName: "Randonnée",
    gpxAria: (name: string) => `Télécharger ${name} en GPX`,
    shareAria: (name: string) => `Partager ${name} par lien`,
    shareTitle: "Partager la randonnée",
    shareDesc:
      "Qui connaît le lien voit la carte, les données clés et le profil altimétrique de cette randonnée – sans compte. Ton nom n'y figure pas.",
    shareCopied: "Lien copié.",
    shareFailed: "Le lien n'a pas pu être créé.",
    unshare: "Arrêter le partage",
    unshared: "Le lien n'est plus valable.",
    unshareFailed: "Le partage n'a pas pu être arrêté.",
    editTitle: "Modifier la randonnée",
    editDesc: "Change le nom et le voyage associé.",
    editAria: (name: string) => `Modifier ${name}`,
    deleteAria: (name: string) => `Supprimer ${name}`,
    deleteConfirm: "Supprimer vraiment cette randonnée ?",
    deleted: "Randonnée supprimée",
  },
  locationShare: {
    title: "Je suis ici",
    desc: "Envoie à tes compagnons de voyage un lien avec ta position actuelle. Le lien expire automatiquement et peut être désactivé à tout moment.",
    loginHint: "Il te faut un compte ReiseKompass pour partager ta position.",
    validityLabel: "Valable",
    validityAria: "Durée de validité du lien de position",
    validityHours: (h: number) => (h === 1 ? "1 heure" : `${h} heures`),
    createButton: "Partager ma position",
    locating: "Position en cours de localisation …",
    created: "Lien de position créé",
    createdCopied: "Lien de position créé et copié",
    failed: "Le lien de position n'a pas pu être créé",
    refresh: "Actualiser la position",
    refreshed: "Position actualisée",
    stop: "Désactiver le lien",
    stopConfirm:
      "Désactiver vraiment le lien ? Celles et ceux qui l'ont ne verront plus ta position.",
    stopped: "Lien désactivé",
    share: "Partager",
    shareTitle: "Ma position",
    updatedAgo: (ago: string) => `Position actualisée ${ago}`,
    accuracy: (m: number) => `Précision ±${m} m`,
    expiresAt: (date: string) => `Expire le ${date}`,
    qrTitle: "Code QR",
    qrText: "À scanner directement sur l'écran – sans envoyer le lien.",
    qrAlt: "Code QR vers le lien de position",
  },
  sharedLocation: {
    badge: "Position partagée",
    title: "Position",
    titleNamed: (name: string) => `Position de ${name}`,
    capturedAgo: (ago: string) => `Actualisée ${ago}`,
    capturedAt: (time: string) => `mesurée à ${time}`,
    accuracy: (m: number) => `Précision ±${m} m`,
    coordsLabel: "Coordonnées",
    coordsCopied: "Coordonnées copiées",
    copyAria: "Copier les coordonnées",
    navigate: "Itinéraire",
    mapAria: "Carte avec la position partagée",
    mapFailed: "La carte n'a pas pu être chargée.",
    invalidHint:
      "Les liens de position expirent après un court moment ou sont désactivés à la main. Demande un nouveau lien.",
    expiresNote: (date: string) => `Ce lien est valable jusqu'au ${date}.`,
    footer: "Partagé avec ReiseKompass",
  },
  sharedSpot: {
    tariffsTitle: "Tarifs",
    tariffRowOneOff: "forfait unique",
    invalid: "Ce lien de partage a expiré ou n'est plus valable.",
    invalidHint: "Il a expiré ou la ou le propriétaire a mis fin au partage.",
    badge: "Emplacement partagé",
    sunTitle: "Soleil aujourd'hui",
    sunrise: "Lever",
    noon: "Zénith",
    sunset: "Coucher",
    weatherTitle: "Aperçu météo",
    weatherFailed: "Impossible de charger la météo.",
    moreAlerts: n => ` (+${n} ${n === 1 ? "autre" : "autres"})`,
    noAlerts: "Aucune alerte intempéries dans les prochaines 48 heures.",
    contactTitle: "Contact & check-in",
    contactPhone: "Téléphone réception",
    contactCheckin: "Check-in",
    contactParcel: "Parcelle",
    footer:
      "Partagé avec ReiseKompass – ta boussole pour les vacances, le camping et les excursions.",
  },
  trips: {
    hotelSectionTitle: "Chambre & hébergement",
    hotelSectionHint:
      "Pour ce séjour – numéro de chambre, Wi-Fi et notes (p. ex. horaires du petit-déjeuner).",
    hotelRoomLabel: "Chambre / étage",
    hotelRoomPlaceholder: "p. ex. chambre 204, 2e étage",
    templateSuggest: (name: string) =>
      `Reprendre le modèle « ${name} » comme liste de bagages`,
    templateListCreated: "Liste créée à partir du modèle et liée.",
    readinessAbroadHint: (country: string) =>
      `Ce voyage mène en ${country} – pense à la vignette, aux péages et aux équipements obligatoires.`,
    readinessAbroadLink: "Ouvrir la fiche pays",
    readinessHolidaysTitle: "Jour férié au pays de destination :",
    readinessHolidaysHint: "– les magasins sont souvent fermés ce jour-là.",
    whoAlongTitle: "Qui vient ?",
    whoAlongHint:
      "Touché = présent. Les tampons du passeport en découlent – le tampon familial seulement si tout le monde est là.",
    whoAlongPersonAria: (name: string) => `${name} participe à ce voyage`,
    detailSubtitle: "Un séjour en détail",
    backToList: "Tous les séjours",
    openDetailAria: (name: string) => `Ouvrir le séjour ${name}`,
    openTrip: "Ouvrir le voyage",
    foodButton: "Glacière & provisions",
    foodAria: (name: string) =>
      `Ouvrir la glacière et les provisions pour ${name}`,
    detailNotFound: "Ce séjour n'existe plus – il a peut-être été supprimé.",
    title: "Mes voyages",
    subtitle:
      "Garde une trace de tes séjours en camping : lieux, nuits et souvenirs.",
    loginFeature: "tes voyages",
    packProgress: (name, checked, total) =>
      `${name} : ${checked} sur ${total} emballés`,
    entrySaved: "Entrée enregistrée",
    entrySaveFailed: "Impossible d'enregistrer l'entrée",
    editEntryTitle: "Modifier le voyage",
    editEntryAria: (name: string) => `Modifier l'entrée ${name}`,
    saveChanges: "Enregistrer les modifications",
    entryUpdated: "Entrée mise à jour",
    entryUpdateFailed: "Impossible de mettre à jour l'entrée",
    unknownPlace: "Lieu inconnu",
    nightsInYear: year => `Nuits ${year}`,
    nightsTotal: "Nuits au total",
    staysLabel: "Séjours",
    favoriteLabel: "Emplacement préféré",
    yearReviewTitle: "Rétrospective de l'année",
    yearReviewYearAria: "Choisir l'année de la rétrospective",
    yearReviewPlaces: "Lieux différents",
    yearReviewTopPlace: "Top emplacement",
    yearReviewLongest: "Plus long séjour",
    yearReviewShare: "Partager en image",
    yearReviewShareAria: (year: number) =>
      `Partager la rétrospective ${year} en image`,
    yearReviewImageSaved: "Image téléchargée",
    yearReviewShareFailed: "L'image n'a pas pu être créée",

    // Collage photo par voyage (#226)
    collageButton: "Collage photo",
    collageTitle: "Collage photo",
    collageDescription:
      "Choisis les photos et la disposition – ReiseKompass en fait une image à partager, avec le nom du voyage et la période.",
    collageLayoutLabel: "Disposition",
    collageLayoutNames: {
      grid2: "Grille 2×2",
      grid3: "Grille 3×3",
      hero: "Une grande image",
    },
    collageSelected: (used: number, capacity: number) =>
      `Photos : ${used} places occupées sur ${capacity}`,
    collageSelectAria: (name: string) => `Photo de ${name} pour le collage`,
    collageTooMany: (capacity: number) =>
      `Cette disposition accueille ${capacity} photos – les autres sont laissées de côté.`,
    collageNone: "Choisis au moins une photo.",
    collageShare: "Partager",
    collageDownload: "Télécharger",
    collageBusy: "Création de l'image …",
    collageSaved: "Collage téléchargé",
    collageFailed: "Le collage n'a pas pu être créé",
    newTripButton: "Nouveau voyage",
    tripFormDialogDesc:
      "Note le lieu, les dates et les souvenirs de ton séjour.",
    choosePlaceError: "Choisis un emplacement ou saisis un lieu",
    placeLabel: "Lieu",
    freeLocationOption: "Saisir un lieu librement …",
    locationNameLabel: "Nom du lieu",
    locationPlaceholder: "p. ex. Camping Aareschlucht",
    packListLabel: "Liste de bagages (facultatif)",
    noPackList: "Sans liste de bagages",
    pitchSectionTitle: "Détails de l'emplacement",
    pitchSectionHint:
      "Ce qui ne vaut que pour ce séjour – le numéro changera la prochaine fois.",
    pitchNumberLabel: "Numéro d'emplacement",
    pitchNumberPlaceholder: "p. ex. B14",
    wifiNameLabel: "Nom du wifi",
    wifiNamePlaceholder: "p. ex. Camping-Invite",
    wifiPasswordLabel: "Mot de passe wifi",
    wifiPasswordPlaceholder: "donné à la réception",
    wifiPasswordShow: "Afficher le mot de passe",
    wifiPasswordHide: "Masquer le mot de passe",
    wifiPasswordCopy: "Copier le mot de passe",
    pitchNotesLabel: "Notes sur l'emplacement",
    pitchNotesPlaceholder:
      "p. ex. coffret électrique derrière la haie, robinet 20 pas à droite",
    arrivalTimeLabel: "Heure d'arrivée (facultatif)",
    departureTimeLabel: "Heure de départ (facultatif)",
    timesLine: (a: string | null, d: string | null) =>
      [a ? `Arrivée ${a}` : null, d ? `Départ ${d}` : null]
        .filter(Boolean)
        .join(" · "),
    yearCompareTitle: "Nuitées par année",
    kindFilterAll: "Tous les types",
    kindFilterAria: "Filtrer les voyages par type",
    kindLabel: "Type de voyage",
    kindHint:
      "Détermine ce que la vue Aujourd’hui met en avant pendant le voyage – tous les modules restent accessibles.",
    locationSearchButton: "Chercher le lieu",
    locationSearchFailed: "Recherche de lieu indisponible",
    locationSearchNoResults: "Aucun lieu trouvé – autre orthographe ?",
    savedPlacesSuggestTitle: "Lieux retenus",
    locationCoordsSet: "Coordonnées reprises",
    locationCoordsClearAria: "Supprimer les coordonnées",
    dayLabel: "Date",
    arrivalLabel: "Arrivée",
    departureLabel: "Départ",
    titleLabel: "Titre (facultatif)",
    titlePlaceholder: "p. ex. Vacances en famille au lac",
    notesLabel: "Notes (facultatif)",
    notesPlaceholder:
      "Le plus bel emplacement, la meilleure recette, quoi changer la prochaine fois …",
    submit: "Enregistrer l'entrée",
    moreSections: "Plus sur le voyage",
    statsLink: "Voir les statistiques et jalons",
    plannedTitle: "Séjours prévus",
    holidaySectionLabel: "Vacances scolaires & jours fériés",
    holidayCantonAria:
      "Choisir le canton pour les indications de vacances et jours fériés",
    holidayCantonNone: "Aucun canton – pas d'indications",
    holidaySchoolBadge: name => `Pendant les vacances scolaires (${name})`,
    holidayPublicBadge: (date, name) => `Jour férié le ${date} : ${name}`,
    holidayDestinationBadge: (country: string, date: string, name: string) =>
      `Jour férié en ${country} le ${date} : ${name}`,
    holidaySource:
      "Données de vacances et jours fériés : OpenHolidays API, sans garantie.",
    countdown: days =>
      days === 0
        ? "C'est parti aujourd'hui !"
        : days === 1
          ? "Départ demain !"
          : `Encore ${days} jours`,
    nightsCount: n => (n === 1 ? "1 nuit" : `${n} nuits`),
    menuPlanButton: "Plan des repas",
    roadRulesButton: "Péage & règles",
    roadRulesAria: (name: string) =>
      `Péage et règles pour la destination de ${name}`,
    menuPlanAria: (name: string) => `Ouvrir le plan des repas de ${name}`,
    deletePlannedAria: name => `Supprimer le séjour prévu ${name}`,
    deleteEntryAria: name => `Supprimer l'entrée ${name}`,
    dossierAria: (name: string) => `Ouvrir le dossier de ${name}`,
    entriesTitle: "Tes séjours",
    empty:
      "Pas encore d'entrées – note ton premier séjour en camping avec «Nouveau voyage».",
    addPhotos: "Ajouter des photos",
    addPhotosAria: name => `Ajouter des photos au séjour ${name}`,
    photoCountHint: (n, max) => `${n} sur ${max} photos`,
    photoUploading: n =>
      n === 1 ? "1 photo en cours d'envoi …" : `${n} photos en cours d'envoi …`,
    photoUploaded: n =>
      n === 1 ? "Photo enregistrée" : `${n} photos enregistrées`,
    photoLimitReached: max =>
      `Maximum ${max} photos par séjour – les photos en trop ont été ignorées`,
    photoTooLarge: name => `${name} : l'image est trop grande (max. 5 Mo)`,
    photoUnsupportedType: name =>
      `${name} : format non pris en charge – JPEG, PNG et WebP sont autorisés`,
    photoHeic: name =>
      `${name} : HEIC/HEIF n'est pas pris en charge – exporte la photo en JPEG`,
    photoReadFailed: name => `${name} : impossible de lire l'image`,
    photoUploadFailed: name => `${name} : échec de l'envoi`,
    photosLoadFailed: "Impossible de charger les photos",
    photoDeleteConfirm: "Supprimer définitivement cette photo ?",
    photoDeleted: "Photo supprimée",
    photoDeleteAria: n => `Supprimer la photo ${n}`,
    photoAlt: (n, place) => `Photo ${n} du séjour ${place}`,
    photoOpenAria: (n, place) => `Ouvrir la photo ${n} de ${place} en grand`,
    galleryTitle: place => `Photos – ${place}`,
    galleryCounter: (n, total) => `Photo ${n} sur ${total}`,
    galleryPrev: "Photo précédente",
    galleryNext: "Photo suivante",
    coverSetButton: "En photo de couverture",
    coverRemoveButton: "Retirer la photo de couverture",
    coverBadge: "Couverture",
    coverSet: "Photo de couverture définie",
    coverRemoved: "Photo de couverture retirée",
    coverSaveFailed: "La photo de couverture n'a pas pu être enregistrée",
    coverAlt: place => `Photo de couverture du séjour ${place}`,
    ratingLabel: "Évaluation (optionnelle)",
    ratingFormAria: "Choisir une évaluation en étoiles",
    ratingGroupAria: (name: string) => `Évaluation pour ${name}`,
    rateStarAria: (n: number) =>
      n === 1 ? "Évaluer avec 1 étoile" : `Évaluer avec ${n} étoiles`,
    removeRatingAria: "Retirer l'évaluation",
    ratingSaveFailed: "L'évaluation n'a pas pu être enregistrée",
    avgRatingLabel: "Note moyenne",
    bestRatedLabel: "Emplacement le mieux noté",
    starsAvg: (value: string) => `Ø ${value} étoiles`,
    packSuggestionsTitle: "Suggestions de bagages selon la météo",
    packSuggestionsBadge: n => (n === 1 ? "1 suggestion" : `${n} suggestions`),
    packSuggestionsHint:
      "Basé sur les prévisions Open-Meteo pour ta période de voyage – pas encore sur ta liste :",
    packSuggestionsAdd: "Ajouter",
    packSuggestionsAddAria: name => `Ajouter ${name} à la liste de bagages`,
    packSuggestionsAddAll: "Tout ajouter",
    packSuggestionsAdded: name => `«${name}» ajouté`,
    packSuggestionsAddedAll: n => `${n} entrées ajoutées`,
    packSuggestionsAddFailed: "Impossible d'ajouter l'entrée",
    readinessTitle: "Préparation",
    readinessToggleAria: (name: string) =>
      `Afficher/masquer la préparation de ${name}`,
    readinessLoading: "Vérification en cours …",
    readinessAllDone: "Tout est prêt",
    readinessOpenCount: (n: number) =>
      n === 1 ? "1 point ouvert" : `${n} points ouverts`,
    readinessStatusOk: "fait",
    readinessStatusOpen: "ouvert",
    readinessOpenLink: "Ouvrir",
    readinessOpenAria: (label: string) => `Ouvrir ${label}`,
    readinessEditLink: "Compléter",
    readinessEditAria: (name: string) => `Compléter les données de ${name}`,
    readinessPackListLabel: "Liste de bagages",
    readinessPackListDone: "tout est emballé",
    readinessPackListOpen: (pct: number) => `emballée à ${pct} % seulement`,
    readinessPackListMissing: "aucune liste reliée",
    readinessMenuLabel: "Menu",
    readinessMenuDone: "tous les repas principaux sont planifiés",
    readinessMenuOpen: (n: number) =>
      n === 1 ? "1 repas sans plan" : `${n} repas sans plan`,
    readinessShoppingLabel: "Courses du séjour",
    readinessShoppingDone: "plus rien en attente",
    readinessShoppingOpen: (n: number) =>
      n === 1 ? "1 article en attente" : `${n} articles en attente`,
    readinessSpotLabel: "Emplacement",
    readinessSpotDone: "emplacement relié",
    readinessSpotMissing: "aucun emplacement relié",
    readinessArrivalLabel: "Heure d'arrivée",
    readinessArrivalDone: "saisie",
    readinessArrivalMissing: "pas encore saisie",
    weatherTitle: "Météo pendant le séjour",
    weatherSummary: (max, min) => `${max}° / ${min}°`,
    weatherRainDays: n => (n === 1 ? "1 jour de pluie" : `${n} jours de pluie`),
    weatherLuckTitle: "Chance météo",
    weatherLuckDry: pct => `${pct} % de tes jours de camping ont été secs`,
    weatherLuckAvgMax: temp => `max. journalier moyen ${temp}°`,
    weatherLuckWarmest: (place, temp) =>
      `lieu le plus chaud : ${place} (${temp}°)`,
    weatherLuckHint: n =>
      n === 1
        ? "D'après l'archive météo de 1 séjour"
        : `D'après l'archive météo de ${n} séjours`,
    weatherLuckYear: (pct, temp) =>
      `Chance météo : ${pct} % de jours secs · max. journalier moyen ${temp}°`,
    sharedBadge: "Partagé",
    runningBadge: (day: number, total: number) =>
      `En cours · jour ${day} sur ${total}`,
    sharedWith: name => `Voyage de ${name}`,
    membersButton: "Compagnons de voyage",
    membersAria: name => `Gérer les compagnons de voyage de ${name}`,
    membersDialogDesc:
      "Invite d'autres comptes ReiseKompass – les compagnons de voyage peuvent voir et modifier le voyage (seul toi peux le supprimer).",
    membersListTitle: "Compagnons de voyage",
    membersOwnerBadge: "Propriétaire",
    memberRemoveAria: name => `Retirer ${name} du voyage`,
    memberRemoveConfirm: name => `Retirer ${name} du voyage ?`,
    memberRemoved: "Compagnon·ne de voyage retiré·e",
    memberRemoveFailed: "Échec du retrait",
    inviteSectionTitle: "Lien d'invitation",
    inviteHint:
      "Quiconque ouvre le lien et est connecté peut rejoindre le voyage.",
    inviteCreate: "Créer un lien d'invitation",
    inviteCreateFailed: "Impossible de créer le lien",
    inviteQrAlt: name => `Code QR du lien d'invitation pour ${name}`,
    inviteQrHint: "Il suffit de le scanner pour rejoindre.",
    inviteRevoke: "Révoquer le lien",
    inviteRevoked: "Lien d'invitation révoqué",
    inviteRevokeFailed: "Échec de la révocation",
    leaveTrip: "Quitter le voyage",
    leaveTripAria: name => `Quitter le voyage ${name}`,
    leaveConfirm: name => `Vraiment quitter le voyage « ${name} » ?`,
    leftTrip: "Tu as quitté le voyage",
    leaveFailed: "Impossible de quitter le voyage",
    hubShareAria: (name: string) => `Partager le hub du voyage ${name}`,
    hubDialogTitle: "Partager le hub du voyage",
    hubDialogDesc:
      "Un lien public regroupe infos du voyage, emplacement, plan des menus et liste de bagages (lecture seule, sans photos). La liste de bagages peut être cochée via le lien.",
    hubCreate: "Créer le lien du hub",
    hubCreateFailed: "Le lien n'a pas pu être créé",
    hubLinkCreated: "Lien du hub créé",
    hubStopShare: "Arrêter le partage",
    hubStopped: "Partage arrêté – le lien n'est plus valable",
    hubStopFailed: "Échec de l'arrêt",
    hubQrAlt: (name: string) => `Code QR du lien du hub pour ${name}`,
    hubQrHint: "Il suffit de le scanner pour l'ouvrir.",
    printEntryAria: (name: string) =>
      `Imprimer le rapport de voyage de ${name}`,
    icsButton: "Calendrier",
    icsAria: (name: string) =>
      `Télécharger ${name} comme entrée d'agenda (.ics)`,
    icsAllButton: "Tout dans l'agenda",
    icsAllAria:
      "Télécharger tous les séjours à venir dans un seul fichier d'agenda (.ics)",
    icsDone: (n: number) =>
      n === 1
        ? "Fichier d'agenda créé – ouvre-le pour ajouter le séjour"
        : `Fichier d'agenda avec ${n} séjours créé – ouvre-le pour les ajouter`,
    icsFailed: "Impossible de créer le fichier d'agenda",
    milestonesTitle: "Jalons",
    milestonesNextTitle: "Prochains objectifs",
    milestonesProgress: (current, target) => `${current} sur ${target}`,
    viewToggleAria: "Choisir l'affichage des séjours",
    viewList: "Liste",
    viewCalendar: "Calendrier",
    calPrevMonth: "Mois précédent",
    calNextMonth: "Mois suivant",
    calGridAria: month => `Calendrier ${month}`,
    calTripAria: name => `Modifier le séjour ${name}`,
    calDayTrips: n => (n === 1 ? "1 séjour" : `${n} séjours`),
    calSchoolHolidayTitle: names => `Vacances scolaires : ${names}`,
    calPublicHolidayTitle: names => `Jour férié : ${names}`,
    calLegendOwn: "Ton voyage",
    calLegendShared: "Voyage partagé",
    calLegendSchool: "Vacances scolaires",
    calLegendPublic: "Jour férié",
    duplicateAria: (name: string) => `Dupliquer le voyage ${name}`,
    duplicateDialogTitle: "Dupliquer le voyage",
    duplicateDialogDesc:
      "Le lieu, l'emplacement, la liste de bagages et le plan des menus sont repris – pas les notes, l'évaluation, les photos ni la météo. Choisis les nouvelles dates de voyage.",
    duplicateSubmit: "Dupliquer",
    duplicated: "Voyage dupliqué – il figure dans les séjours planifiés",
    duplicateFailed: "Échec de la duplication",
    journalTitle: "Journal de voyage",
    journalToggleAria: (name: string) =>
      `Ouvrir ou fermer le journal de voyage de ${name}`,
    journalHint:
      "Note ce qui s'est passé chaque jour du séjour – seuls toi et tes compagnons de voyage le voyez.",
    journalCount: (n: number) => (n === 1 ? "1 entrée" : `${n} entrées`),
    journalEmptyDay: "Rien de noté pour l'instant",
    journalPlaceholder: "Qu'est-ce qui s'est passé aujourd'hui ?",
    journalEditAria: (day: string) => `Modifier l'entrée du ${day}`,
    journalSave: "Enregistrer",
    journalSaved: "Entrée du journal enregistrée",
    journalDeleted: "Entrée du journal supprimée",
    journalSaveFailed: "Impossible d'enregistrer l'entrée du journal",
    journalBy: (name: string) => `par ${name}`,
  },
  clientErrors: {
    title: "Rapports de plantage",
    toggleAria: "Déplier ou replier les rapports de plantage",
    hint: "Ce que le navigateur a signalé lorsque l’interface a planté – les plus récents d’abord. Visible seulement pour toi en tant qu’exploitant.",
    empty:
      "Aucun plantage signalé pour l’instant. C’est ainsi que ça doit être.",
    loadFailed: "Le journal n’a pas pu être lu.",
    count: (n: number) => (n === 1 ? "1 rapport" : `${n} rapports`),
  },
  tripBoard: {
    title: "Panneau d'affichage",
    toggleAria: (name: string) =>
      `Ouvrir ou fermer le panneau d'affichage de ${name}`,
    hint: "Petits messages et tâches pour tous les compagnons de voyage – le panneau se met à jour tout seul.",
    hintSolo:
      "Notes et tâches pour ce séjour – ce qui reste en attente apparaît aussi dans la vue Aujourd’hui.",
    kindAria: "Choisir le type de note",
    textAria: "Texte de la note",
    messagePlaceholder: "p. ex. rendez-vous à 18 h à la place de jeux",
    taskPlaceholder: "p. ex. aller chercher du pain",
    addButton: "Épingler",
    added: "Épinglé au panneau",
    addFailed: "La note n'a pas pu être épinglée",
    textRequired: "Écris d'abord quelque chose.",
    empty: "Rien d'épinglé pour l'instant – lance le premier message.",
    openTasks: (n: number) =>
      n === 1 ? "1 tâche ouverte" : `${n} tâches ouvertes`,
    byLine: (name: string, ago: string) => `de ${name} · ${ago}`,
    doneLine: (name: string, ago: string) => `fait par ${name} · ${ago}`,
    doneAria: (text: string) => `Cocher la tâche « ${text} »`,
    doneFailed: "La tâche n'a pas pu être cochée",
    unknownPerson: "quelqu'un",
    removeAria: (text: string) => `Retirer la note « ${text} »`,
    removeConfirm: "Retirer vraiment cette note ?",
    removed: "Note retirée",
    removeFailed: "La note n'a pas pu être retirée",
  },
  tripExpenses: {
    budgetTightNote: "Le budget devient serré.",
    fuelTitle: "Calculer les frais de route",
    fuelHint:
      "Kilomètres × consommation × prix du carburant. Le calcul utilise la consommation moyenne – pour plus de précision, saisis le montant à la main.",
    fuelKmLabel: "Distance (km)",
    fuelConsumptionLabel: "Consommation (l/100 km)",
    fuelPriceLabel: "Prix (CHF/l)",
    fuelRoundTrip: "Aller et retour",
    fuelResult: (km: number, liters: string, amount: string) =>
      `${km} km · ${liters} l · ${amount}`,
    fuelApply: "Reprendre dans la caisse",
    fuelInvalid: "Merci d'indiquer distance, consommation et prix.",
    fuelDescription: (km: number) => `Trajet ${km} km`,
    fuelFromLog: (l100: string) =>
      `Reprendre la moyenne du carnet : ${l100} l/100 km`,
    powerTitle: "Compteur électrique de l'emplacement",
    powerHint:
      "Relevé à l'arrivée et au départ, le prix par kWh est affiché sur la borne. Les saisies restent mémorisées par voyage.",
    powerStartLabel: "Relevé arrivée (kWh)",
    powerEndLabel: "Relevé départ (kWh)",
    powerPriceLabel: "Prix par kWh (CHF)",
    powerResult: (kwh: string, amount: string) => `${kwh} kWh ≈ ${amount}`,
    powerApply: "Reprendre dans la caisse",
    powerInvalid: "Merci d'indiquer les deux relevés et le prix.",
    powerDescription: (kwh: number) => `Électricité ${kwh} kWh`,
    csvButton: "Exporter en CSV",
    csvAria: (trip: string) => `Télécharger la caisse de ${trip} au format CSV`,
    csvHeaders: [
      "Date",
      "Catégorie",
      "Description",
      "Payé par",
      "Monnaie",
      "Montant",
    ],
    currencyAria: "Monnaie du montant",
    eurRateSaved: "Taux de l'euro enregistré",
    eurRateInvalid: "Taux invalide – autorisé : 0.5 à 2.0 CHF par euro.",
    eurRateLine: (rate: string) => `Taux : 1 € = ${rate} CHF`,
    eurRateMissing: "Dépenses en euros saisies, mais aucun taux défini.",
    eurRateSet: "Définir le taux",
    eurRateEdit: "Modifier le taux",
    eurRateRemove: "Supprimer le taux",
    eurRateHint:
      "S'applique au total, au budget et à « qui doit à qui » de ce voyage. Les justificatifs restent enregistrés en euros.",
    ecbRateLine: (rate: string, date: string) =>
      `Cours de référence BCE du ${date} : 1 € = ${rate} CHF`,
    ecbRateApply: "Reprendre",
    eurConvertedNote: (eur: string, rate: string) =>
      `dont ${eur}, convertis au taux ${rate}`,
    eurUnconvertedNote: (eur: string) =>
      `${eur} sans taux – non compris dans le total, le budget et l'équilibrage`,
    budgetTitle: "Budget",
    budgetLabel: "Budget (CHF)",
    budgetSet: "Définir un budget",
    budgetEdit: "Modifier le budget",
    budgetRemove: "Supprimer le budget",
    budgetSaved: "Budget enregistré",
    budgetSaveFailed: "Impossible d'enregistrer le budget",
    budgetInvalid: "Merci d'indiquer un montant supérieur à zéro.",
    budgetBarAria: (percent: number) => `${percent} % du budget utilisé`,
    budgetLeft: (amount: string, percent: number) =>
      `Il reste ${amount} (${percent} % utilisé).`,
    budgetOver: (amount: string, percent: number) =>
      `${amount} au-dessus du budget (${percent} % utilisé).`,
    forecastLine: (amount: string, day: number, total: number) =>
      `À ce rythme, environ ${amount} d’ici la fin (jour ${day} sur ${total}).`,
    forecastOver: "Cela dépasse la limite.",
    forecastNote:
      "Le camping et le carburant comptent une fois dans la projection, pas chaque jour.",
    title: "Caisse du voyage",
    toggleAria: (name: string) =>
      `Ouvrir ou fermer la caisse du voyage ${name}`,
    hint: "Note ce que coûte le voyage – à la fin, tu vois qui doit quoi à qui.",
    currency: "CHF",
    total: "Total",
    empty: "Rien de saisi pour l'instant – ajoute la première dépense.",
    categoryTitle: "Par catégorie",
    categoryShare: (percent: number) => `${percent} %`,
    settleTitle: "Qui doit quoi à qui",
    settleNone: "Tout est équilibré – personne ne doit rien.",
    settleHint:
      "Calculé avec des parts égales pour toutes les personnes qui ont payé.",
    settleLine: (from: string, to: string, amount: string) =>
      `${from} verse ${amount} à ${to}`,
    addButton: "Saisir une dépense",
    newTitle: "Nouvelle dépense",
    editTitle: "Modifier la dépense",
    amountLabel: "Montant (CHF)",
    amountPlaceholder: "p. ex. 24.50",
    amountInvalid: "Indique un montant en francs (p. ex. 24.50).",
    dayLabel: "Date",
    categoryLabel: "Catégorie",
    categoryAria: "Choisir la catégorie",
    descriptionLabel: "Description (facultatif)",
    descriptionPlaceholder: "p. ex. souper à l'épicerie du village",
    paidByLabel: "Qui a payé ?",
    paidByPlaceholder: "Nom",
    paidByRequired: "Indique qui a payé.",
    paidBySuggestionsAria: "Personnes déjà saisies",
    meFallback: "Moi",
    save: "Enregistrer",
    saved: "Dépense saisie",
    updated: "Dépense mise à jour",
    saveFailed: "La dépense n'a pas pu être enregistrée",
    deleted: "Dépense supprimée",
    deleteFailed: "La dépense n'a pas pu être supprimée",
    deleteConfirm: (label: string) =>
      `Supprimer vraiment la dépense « ${label} » ?`,
    editAria: (label: string) => `Modifier la dépense ${label}`,
    deleteAria: (label: string) => `Supprimer la dépense ${label}`,
    paidByLine: (name: string) => `payé par ${name}`,
    byLine: (name: string) => `saisi par ${name}`,
    untitled: "Sans description",
    photoLabel: "Photo du justificatif (optionnel)",
    photoAdd: "Photographier le justificatif",
    photoChange: "Remplacer le justificatif",
    photoRemove: "Retirer le justificatif",
    photoHint:
      "Une photo du ticket pour cette d\u00e9pense \u2013 pratique pour les comptes de retour.",
    photoViewAria: (label: string) => `Voir le justificatif de ${label}`,
    photoTooLarge: "La photo est trop volumineuse.",
    photoUploadFailed:
      "Le justificatif n\u2019a pas pu \u00eatre t\u00e9l\u00e9vers\u00e9",
    photoRemoveFailed: "Le justificatif n\u2019a pas pu \u00eatre retir\u00e9",
    photoReadFailed: "La photo n\u2019a pas pu \u00eatre lue",
    photoHeic:
      "Les photos HEIC ne sont pas prises en charge \u2013 choisis un JPG.",
  },
  tripInvite: {
    badge: "Invitation au voyage",
    title: "Invitation à un voyage",
    invalid: "Cette invitation n'est pas valable",
    invalidHint:
      "Le lien a été révoqué ou n'existe pas. Demande qu'on t'en envoie un nouveau.",
    ownerLine: name => `${name} t'invite à voyager ensemble.`,
    ownerFallback: "Quelqu'un",
    unknownPlace: "Lieu inconnu",
    editNote:
      "En tant que compagnon·ne de voyage, tu vois le voyage dans « Mes voyages » et tu peux contribuer aux photos, au menu et à la liste de bagages.",
    accept: "Accepter l'invitation",
    accepting: "Acceptation en cours …",
    accepted: "Tu fais maintenant partie du voyage !",
    acceptedOwn: "C'est ton propre voyage.",
    acceptFailed: "Impossible d'accepter l'invitation",
    loginHint: "Connecte-toi ou crée un compte pour accepter l'invitation.",
    loginCta: "Se connecter et rejoindre",
  },
  sharedTrip: {
    badge: "Voyage partagé",
    invalid: "Ce lien de partage a expiré ou n'est plus valable.",
    invalidHint: "Il a expiré ou la ou le propriétaire a arrêté le partage.",
    notesTitle: "Notes",
    ratingAria: (n: number) => `Évaluation : ${n} étoiles sur 5`,
    spotTitle: "Emplacement",
    menuTitle: "Plan des menus",
    dayHeader: "Jour",
    packListTitle: "Liste de bagages",
    contactPhone: "Téléphone réception",
    contactCheckin: "Check-in",
    contactParcel: "Parcelle",
    packListNotShared:
      "Cette liste de bagages n'est pas partagée séparément pour le moment – consultation seule, impossible de cocher.",
    footer:
      "Partagé avec ReiseKompass – ta boussole pour les vacances, le camping et les excursions.",
  },
  tripPrint: {
    docTitle: name => `${name} – Rapport de voyage à imprimer`,
    docTitleFallback: "Rapport de voyage",
    appTitle:
      "ReiseKompass – Ta boussole pour les vacances, le camping et les excursions",
    notFound: "Ce séjour est introuvable.",
    printButton: "Imprimer / Enregistrer en PDF",
    printBrowserHint:
      "Dans l'app installée, ce bouton ouvre la vue dans le navigateur – imprime ou enregistre en PDF via le menu.",
    headerKicker: "ReiseKompass · Rapport de voyage",
    printedOn: date => `État : ${date}`,
    ratingAria: n => `Évaluation : ${n} étoiles sur 5`,
    notesTitle: "Notes",
    menuTitle: "Plan des menus",
    dayHeader: "Jour",
    photosTitle: "Photos",
    photoAlt: (n, name) => `Photo ${n} du séjour ${name}`,
    footer:
      "De beaux souvenirs ! · ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
  },
  firstAid: {
    title: "Guide de premiers secours",
    subtitle:
      "Guide compact pour les blessures typiques en plein air – entièrement disponible hors ligne.",
    offlineNote:
      "Tous les contenus sont enregistrés dans l'app et utilisables sans connexion Internet.",
    filterAria: "Filtrer par gravité",
    filterAll: "Tous les sujets",
    severity: {
      leicht: "léger",
      mittel: "moyen",
      ernst: "grave",
    },
    recognizeTitle: "Reconnaître",
    helpTitle: "Comment aider",
    disclaimer:
      "Remarque : ce guide ne remplace ni un avis médical ni un cours de premiers secours. En cas de doute, toujours appeler le 112 ou la Rega au 1414.",
    tickTitle: "Mémo piqûres de tique",
    tickSubtitle:
      "Note une piqûre de tique et garde le point de piqûre à l'œil pendant deux semaines.",
    tickGuestHint:
      "Connecte-toi pour noter tes piqûres de tique et être rappelé·e de les surveiller.",
    tickMedicalNote:
      "Important : si une rougeur s'étend autour du point de piqûre, ou si de la fièvre, des maux de tête ou des douleurs musculaires apparaissent, fais-toi examiner par un médecin. Cela vaut aussi plusieurs semaines après la piqûre.",
    tickDateLabel: "Date de la piqûre",
    tickBodyPartLabel: "Endroit du corps (facultatif)",
    tickBodyPartPlaceholder: "p. ex. creux du genou gauche",
    tickNoteLabel: "Note (facultatif)",
    tickNotePlaceholder: "p. ex. tique entièrement retirée",
    tickAddButton: "Noter la piqûre",
    tickAdded: "Piqûre de tique notée",
    tickAddFailed: "Impossible de noter la piqûre de tique",
    tickOpenTitle: "Sous surveillance",
    tickOpenEmpty:
      "Aucune piqûre de tique n'est actuellement sous surveillance.",
    tickDaysLeft: (n: number) =>
      n === 1 ? "encore 1 jour à surveiller" : `encore ${n} jours à surveiller`,
    tickBitAt: (date: string) => `Piqûre le ${date}`,
    tickResolveButton: "terminé",
    tickResolveAria: (date: string) =>
      `Terminer la surveillance de la piqûre du ${date}`,
    tickResolved: "Surveillance terminée",
    tickResolveFailed: "Impossible de terminer la surveillance",
    tickReopenAria: (date: string) =>
      `Remettre la piqûre du ${date} sous surveillance`,
    tickDeleteAria: (date: string) => `Supprimer la piqûre du ${date}`,
    tickDeleteConfirm: "Vraiment supprimer cette piqûre de tique ?",
    tickDeleted: "Entrée supprimée",
    tickDoneTitle: (n: number) => `Terminées (${n})`,
    tickDoneToggleAria: "Ouvrir ou fermer les piqûres de tique terminées",
  },
  knots: {
    title: "Bibliothèque de nœuds",
    subtitle:
      "Les nœuds outdoor les plus importants avec des instructions pas à pas – disponibles hors ligne.",
    offlineNote:
      "Toutes les instructions sont enregistrées dans l'app et utilisables sans connexion Internet.",
    quizTitle: "Quiz des nœuds",
    quizStartAria: "Démarrer le quiz des nœuds",
    quizTeaser: "8 situations, 4 réponses – quel est le bon nœud ?",
    quizDescription:
      "Quel nœud convient à la situation ? Entraîne-toi jusqu'à ce que les gestes soient acquis.",
    quizProgressAria: "Progression du quiz",
    questionOf: (current, total) => `Question ${current} sur ${total}`,
    points: n => `${n} points`,
    answerAria: option => `Réponse : ${option}`,
    resultLine: (score, total) => `${score} sur ${total} justes !`,
    resultPerfect:
      "Pro des nœuds ! Il ne manque plus que l'entraînement avec une vraie corde.",
    resultGood:
      "Solide ! Revois les nœuds manqués dans la bibliothèque ci-dessous.",
    resultTryAgain:
      "Pas de souci – la bibliothèque ci-dessous explique chaque nœud pas à pas.",
    newRound: "Nouvelle partie",
    finish: "Terminer",
    showResult: "Afficher le résultat",
    nextQuestion: "Question suivante",
    filterAria: "Filtrer par catégorie",
    filterAll: "Tous",
    difficultyAria: level => `Difficulté ${level} sur 3`,
    openAria: name => `Ouvrir les instructions pour ${name}`,
    cardImageAlt: name => `Instructions pas à pas : ${name}`,
    detailImageAlt: name => `Image pas à pas : faire le ${name}`,
    alsoKnownAs: name => `aussi : ${name}`,
    campingTitle: "En camping",
    stepsTitle: "Pas à pas",
    proTipTitle: "Astuce de pro",
    masterySecure: "Acquis",
    masteryPractice: "À réviser",
    openAriaLevel: (name, level) =>
      `Ouvrir les instructions pour ${name} – niveau : ${level}`,
    practiceFilter: "Seulement à réviser",
    practiceFilterAria: "Afficher uniquement les nœuds à réviser",
    practiceEmpty:
      "Aucun nœud à réviser dans cette sélection – lance le quiz pour construire ton niveau.",
    reviewTitle: "Ces nœuds demandent encore de l'exercice :",
    reviewAllSecure:
      "Tous les nœuds interrogés sont acquis – continue avec une vraie corde !",
  },
  phrasebook: {
    title: "Aide linguistique",
    subtitle:
      "Les phrases de camping essentielles en allemand, français, italien et anglais – disponibles hors ligne.",
    offlineNote:
      "Toutes les phrases sont enregistrées dans l'app et fonctionnent sans connexion Internet.",
    targetLabel: "Langue cible",
    targetAria: "Choisir la langue cible",
    sameLanguageHint:
      "La langue cible et la langue de l'app sont identiques – choisis une autre langue ci-dessus pour voir la traduction.",
    searchPlaceholder: "Chercher une phrase …",
    searchAria: "Rechercher dans l'aide linguistique",
    searchEmpty: "Aucune phrase trouvée – essaie un autre mot-clé.",
    customTitle: "Tes propres phrases",
    customHint:
      "Ce qui compte pour TOI sur ce voyage – enregistré sur ton compte, disponible hors ligne. Les phrases appartiennent à la langue cible choisie.",
    customMeaningPlaceholder: "Dans ta langue",
    customTranslationPlaceholder: (langName: string) =>
      `Traduction (${langName})`,
    customAdd: "Enregistrer",
    customFull:
      "Pas plus de 100 phrases personnelles – supprime d'abord les anciennes.",
    customDeleteAria: (text: string) => `Supprimer la phrase « ${text} »`,
    copyAria: (text: string) => `Copier « ${text} »`,
    copied: "Phrase copiée.",
    copyFailed: "La copie n'a pas fonctionné.",
    speakAria: (text: string) => `Lire « ${text} » à voix haute`,
    stopAria: "Arrêter la lecture",
    countLine: (n: number) => `${n} phrases`,
  },
  clouds: {
    title: "Lexique des nuages",
    subtitle:
      "Reconnais le type de nuage et sais quel temps arrive – disponible hors ligne.",
    offlineNote:
      "Tous les nuages sont enregistrés dans l'app et fonctionnent sans connexion Internet.",
    howToTitle: "Comment lire le ciel",
    howToText:
      "Regarde d'abord à quel étage se trouve le nuage : haut et fibreux, moyen avec des faces ombrées ou bas et gris. Compare ensuite l'aspect – et lis enfin ce qui en découle.",
    filterAria: "Filtrer par étage",
    filterAll: "Tous",
    urgencyGood: "Bon signe",
    urgencyWatch: "À surveiller",
    urgencyWarning: "Alerte",
    appearanceTitle: "Comment le reconnaître",
    meaningTitle: "Ce qui en découle",
    campTipTitle: "Sur place",
    leadNone: "N'annonce rien",
    leadNow: (to: number) => `Maintenant à ${to} h`,
    leadRange: (from: number, to: number) => `Dans ${from}–${to} h`,
    leadDisclaimer:
      "L'indication de temps est une règle empirique pour les fronts d'Europe centrale, pas un compte à rebours. En cas de risque d'orage, l'alerte actuelle du module météo prime toujours.",
    openAria: (name: string) => `Ouvrir le nuage ${name}`,
    countLine: (n: number) => `${n} types de nuages dans le lexique`,
  },
  care: {
    offlineNote:
      "Toutes les instructions sont enregistrées dans l'app et fonctionnent sans connexion Internet.",
    openAria: (name: string) => `Ouvrir les instructions « ${name} »`,
    whenTitle: "Quand c'est nécessaire",
    materialsTitle: "Ce qu'il te faut",
    stepsTitle: "Pas à pas",
    mistakeTitle: "Erreur la plus fréquente",
    minutes: (n: number) => `${n} min de travail`,
    intervalMonths: (n: number) =>
      n === 12
        ? "chaque année"
        : n % 12 === 0
          ? `tous les ${n / 12} ans`
          : `tous les ${n} mois`,
    intervalNone: "au besoin",
    reminderHint:
      "Tu peux inscrire les travaux récurrents dans l'inventaire comme rappel d'entretien – l'app se manifeste alors avant qu'il ne soit trop tard.",
  },
  thunder: {
    title: "Distance de l'orage",
    subtitle:
      "Touche à l'éclair, touche au tonnerre – l'app calcule la distance et dit si l'orage approche.",
    tapLightning: "Éclair vu",
    tapThunder: "Tonnerre entendu",
    tapLightningAria: "Démarrer le comptage à l'éclair",
    tapThunderAria: "Arrêter le comptage au tonnerre",
    tapLightningHint: "Touche dès que tu vois l'éclair.",
    tapThunderHint: "Touche dès que tu entends le tonnerre.",
    lastStrike: "Dernier éclair",
    distanceKm: (km: string) => `à ${km} km`,
    secondsCounted: (seconds: string) => `${seconds} secondes comptées`,
    trendCloser: "L'orage se rapproche.",
    trendFurther: "L'orage s'éloigne.",
    trendSame: "La distance reste à peu près la même.",
    advice: {
      gefahr:
        "Juste au-dessus de toi. Va tout de suite dans la voiture ou un bâtiment en dur – une tente ne protège pas de la foudre.",
      warnung:
        "Assez proche : mets-toi à l'abri maintenant, pas au prochain éclair. Loin des arbres isolés, des mâts et de l'eau.",
      beobachten:
        "Encore loin, mais garde un œil – rentre la voile d'ombrage et sécurise ce qui traîne.",
    },
    allClearIn: (minutes: number) =>
      `Fin d'alerte dans ${minutes} min s'il n'y a plus de tonnerre.`,
    allClearReached: (minutes: number) =>
      `Plus de tonnerre depuis ${minutes} minutes – tu peux ressortir.`,
    historyTitle: "Éclairs comptés",
    reset: "Réinitialiser",
    ruleTitle: "La règle des 30-30",
    ruleText:
      "S'il y a moins de 30 secondes entre l'éclair et le tonnerre (environ 10 km), mets-toi à l'abri. Et ne ressors que 30 minutes après le dernier coup de tonnerre – les derniers éclairs d'un orage tombent souvent déjà sous un ciel bleu.",
    methodNote: (max: number) =>
      `Le calcul utilise la vitesse du son, environ trois secondes par kilomètre. Au-delà de ${max} secondes, plus rien n'est compté – à cette distance, on n'entend de toute façon plus le tonnerre.`,
  },
  chores: {
    title: "Plan des tâches",
    subtitle:
      "Répartir les tâches à tour de rôle, cocher et gagner des points – sans dispute sur qui fait encore la vaisselle.",
    loginFeature: "le plan des tâches",
    noChildren:
      "Aucun enfant enregistré. Ajoute-les dans le mode famille – la répartition sera alors possible.",
    dayLabel: "Jour",
    distribute: "Répartir à tour de rôle",
    dayPlanTitle: "Tâches du jour",
    progressLine: (done: number, total: number) =>
      `${done} sur ${total} faites`,
    progressAria: "Progression du jour",
    toggleAria: (title: string) => `Cocher ${title}`,
    assignAria: (title: string) => `Attribuer ${title}`,
    unassigned: "À attribuer",
    pointsLine: (points: number) =>
      points === 1 ? "1 point" : `${points} points`,
    scoreTitle: "Classement",
    scoreLine: (points: number, done: number) => `${points} pts · ${done}×`,
    scoreHint:
      "Les points ne comptent qu'une fois la tâche cochée – être désigné n'est pas encore un mérite.",
    historyTitle: "Points par semaine",
    historyBarAria: (week: string, points: number) =>
      `Semaine du ${week} : ${points} points`,
    choresTitle: "Tâches",
    newChore: "Nouvelle tâche",
    newChorePlaceholder: "p. ex. faire la vaisselle",
    pointsLabel: "Points",
    addChore: "Ajouter",
    removeAria: (title: string) => `Supprimer ${title}`,
    personsTitle: "Personnes",
    personsHint:
      "Les tâches sont réparties entre toutes les personnes. Seules celles dont l’interrupteur est activé marquent des points – les adultes participent sans fausser le classement des enfants.",
    addPersonPlaceholder: "Nom",
    addPerson: "Ajouter une personne",
    earnsPointsLabel: "Points",
    earnsPointsAria: (name: string) => `${name} marque-t-elle des points ?`,
    removePersonAria: (name: string) => `Retirer ${name}`,
    removePersonConfirm: (name: string) =>
      `Retirer ${name} ? Ses badges, points et entrées de passeport disparaissent avec.`,
    personAdded: "Personne ajoutée",
    weekdaysAria: (title: string) => `Jours de la semaine pour ${title}`,
    weekdaysHint:
      "Touche les jours où la tâche a lieu – « sortir les poubelles », c'est le mardi seulement. Tous les jours ou aucun sélectionné = tous les jours. La répartition et le plan imprimé en tiennent compte.",
    rotationHint:
      "La répartition se fait à tour de rôle et non au hasard : qui fait la vaisselle aujourd'hui ira chercher le bois demain. Le jour décale l'ordre d'un cran – chaque enfant peut ainsi vérifier que c'est équitable.",
  },
  songbook: {
    title: "Chansonnier du feu de camp",
    subtitle:
      "Textes avec accords – transposables, avec mode lumière rouge et utilisables sans réseau.",
    offlineNote:
      "Toutes les chansons sont enregistrées dans l'app et fonctionnent sans connexion Internet.",
    redLight: "Lumière rouge",
    transposeAria: "Changer de tonalité",
    transposeLabel: (value: string) => `Capo ${value}`,
    transposeUpAria: "Un demi-ton plus haut",
    transposeDownAria: "Un demi-ton plus bas",
    copyrightNote:
      "Seules des chansons du domaine public figurent ici – chansons populaires et œuvres dont les auteurs sont décédés depuis plus de 70 ans. L'origine est indiquée pour chaque titre. Les classiques modernes du feu de camp manquent donc : ils ne pourraient pas être reproduits.",
  },
  storyDice: {
    title: "Dés à histoires",
    subtitle:
      "Lance les symboles et inventez ensemble une histoire – sans réseau, sans préparation.",
    howToTitle: "Comment jouer",
    howToText:
      "Lancez, puis la première personne dit une phrase contenant un symbole. On continue à tour de rôle jusqu'à ce que tous les symboles soient utilisés – et qui veut ajoute une fin.",
    countLabel: "Dés :",
    countAria: "Choisir le nombre de dés",
    rollButton: "Lancer",
    rerollAria: (word: string) => `Relancer ${word}`,
    rerollHint:
      "Un symbole ne colle vraiment pas ? Touche-le – seul ce dé est relancé.",
    starterTitle: "Phrase de départ",
  },
  treasure: {
    title: "Chasse au trésor GPS",
    subtitle:
      "Cache des trésors sur place – les enfants cherchent au « chaud-froid » avec une flèche.",
    loginFeature: "la chasse au trésor GPS",
    openSection: "Ouvrir la chasse au trésor",
    openSectionHint:
      "La localisation et la boussole ne démarrent qu'à l'ouverture de la chasse au trésor – sinon elles consommeraient inutilement de la batterie.",
    defaultName: "Chasse au trésor",
    newHunt: "Nouvelle chasse",
    removeHunt: "Supprimer cette chasse",
    empty:
      "Pas encore de chasse au trésor. Crées-en une, puis pose les caches sur place.",
    modeAria: "Choisir le mode",
    modeHide: "Cacher",
    modeSeek: "Chercher",
    hideAria: "Poser les caches",
    seekAria: "Chasse en cours",
    progressLine: (found: number, total: number) =>
      `${found} sur ${total} trouvés`,
    progressAria: "Progression de la chasse au trésor",
    addPointHere: "Poser une cache ici",
    addPointTitle: "Poser une cache",
    addPointDescription:
      "Le point est enregistré à ta position actuelle. Cache d'abord l'objet, puis enregistre.",
    pointName: "Nom de la station",
    pointNamePlaceholder: "p. ex. Station 1",
    pointHint: "Indice (facultatif)",
    pointHintPlaceholder: "p. ex. « Là où l'eau clapote »",
    savePoint: "Enregistrer la cache",
    accuracyLine: (meters: number) =>
      `Précision de localisation : ±${meters} m`,
    maxPoints: (max: number) =>
      `Plus de ${max} caches par chasse ne sont pas prévues.`,
    hideTip:
      "Cache bien en vue au sol ou dans une fourche – ne pas enterrer. Le téléphone situe le point à 10-15 mètres près, les yeux font le reste.",
    noPoints: "Cette chasse n'a encore aucune cache.",
    waitingForFix: "Recherche de la position …",
    geoError:
      "Aucune position disponible. Sans localisation, impossible de cacher ou de chercher – autorise l'accès.",
    weakSignal:
      "Le signal est faible en ce moment – la distance peut être fausse de quelques mètres.",
    stationLine: (index: number, total: number) =>
      `Station ${index} sur ${total}`,
    arrowAria: "Flèche vers la prochaine cache",
    markFound: "Trouvé !",
    tooFarAway: "Encore trop loin",
    hiddenName: "Prochaine cache",
    allFound: "Toutes les caches trouvées !",
    reset: "Rejouer",
    hideAgainAria: (name: string) => `Cacher à nouveau ${name}`,
    removePointAria: (name: string) => `Supprimer ${name}`,
  },
  gearRepair: {
    title: "Guide de réparation",
    subtitle:
      "Sept réparations qui sauvent un voyage – du matelas à la boucle du sac à dos.",
  },
  tentCare: {
    title: "Entretien de la tente",
    subtitle:
      "Sept gestes qui gardent une tente étanche pendant des années – de l'imperméabilisation à la moisissure.",
  },
  nature: {
    title: "Explorateur nature",
    subtitle:
      "Traces d'animaux, constellations, arbres, champignons et baies sauvages – expliqués pour les enfants et disponibles hors ligne.",
    offlineNote:
      "Tout le lexique est enregistré dans l'app et utilisable sans connexion Internet.",
    moonSectionAria: "Calendrier des phases de la lune",
    moonTitle: "La lune cette nuit",
    illuminated: pct => `Éclairée à ${pct} %`,
    stargazing: label => `Observation des étoiles : ${label}`,
    quality: {
      hervorragend: "excellente",
      gut: "bonne",
      mittel: "moyenne",
      schlecht: "mauvaise",
    },
    fullMoonsTitle: "🌕 Prochaines pleines lunes",
    fullMoonsNote:
      "Idéal pour les randonnées nocturnes – la lune éclaire le chemin.",
    newMoonsTitle: "🌑 Prochaines nouvelles lunes",
    newMoonsNote:
      "Ciel le plus sombre – les meilleures nuits pour les constellations et la Voie lactée.",
    moonCalcNote:
      "Le calcul se fait directement sur l'appareil (précision ±1 jour) – fonctionne aussi hors ligne.",
    moonMonthToggleShow: "Ouvrir la vue mensuelle",
    moonMonthToggleHide: "Fermer la vue mensuelle",
    moonMonthTableAria: (month: string) => `Calendrier lunaire ${month}`,
    moonMonthPrev: "Mois précédent",
    moonMonthNext: "Mois suivant",
    moonMonthToday: "Revenir à aujourd'hui",
    moonMonthNewShort: "NL",
    moonMonthFullShort: "PL",
    moonMonthDayAria: (date: string, phase: string) => `${date} : ${phase}`,
    moonMonthMeteorAria: (names: string) => `Étoiles filantes : ${names}`,
    moonMonthTodayAria: "aujourd'hui",
    moonMonthLegendNew: "Nouvelle lune – ciel le plus sombre",
    moonMonthLegendFull: "Pleine lune – nuit claire",
    moonMonthLegendMeteor: (days: number) =>
      `Nuit d'étoiles filantes (maximum ±${days} jours)`,
    moonMonthLegendToday: "Aujourd'hui",
    moonMonthNote:
      "Les symboles montrent la part éclairée vers midi – précision ±1 jour.",
    meteorSectionAria: "Calendrier des étoiles filantes",
    meteorTitle: "Prochaines nuits d'étoiles filantes",
    activeNow: "Actif maintenant",
    peakToday: "Maximum cette nuit !",
    peakTomorrow: "Maximum demain",
    peakInDays: n => `Maximum dans ${n} jours`,
    meteorRate: n => `jusqu'à ${n} météores/h`,
    radiantDirection: r => `direction ${r}`,
    moonInterferes: pct =>
      `La lune gêne : éclairée à ${pct} % au maximum – les météores brillants restent tout de même visibles.`,
    moonOk: pct => `Bonne position de la lune : éclairée à ${pct} % seulement.`,
    meteorFootnote:
      "Les taux valent pour un ciel sombre sans pollution lumineuse. Les dates sont à peu près les mêmes chaque année, calcul hors ligne sur l'appareil.",
    redLightSectionAria: "Mode lumière rouge pour l'observation des étoiles",
    redLightTitle: "Mode lumière rouge",
    redLightHint:
      "Une lumière rouge tamisée préserve l'adaptation de tes yeux à l'obscurité : après un coup d'œil au téléphone, tu revois beaucoup plus vite les étoiles faibles. Le filtre couvre toute l'app, que tu peux continuer à utiliser – il se désactive automatiquement au rechargement.",
    redLightOn: "Activer la lumière rouge",
    redLightOff: "Éteindre la lumière rouge",
    redLightOffAria: "Quitter le mode lumière rouge",
    categoryAria: "Choisir une catégorie",
    imageAlt: name => `Illustration : ${name}`,
    featuresTitle: "Signes distinctifs",
    funFactTitle: "Le savais-tu ?",
    kidsTitle: "Pour les enfants :",
    seasonLine: (from: string, to: string) => `Saison : ${from}–${to}`,
    nowFilter: "Visible en ce moment",
    nowFilterAria: "N'afficher que les entrées actuellement de saison",
    nowFilterEmpty:
      "Rien n'est de saison dans cette catégorie en ce moment – désactive le filtre pour voir toutes les entrées.",
    safetyTitle: "D'abord identifier, ensuite manger",
    rulesTitle: "La cueillette est réglée par les cantons",
    habitatTitle: "Où tu le trouves :",
    useTitle: "Utilisation :",
    lookalikeTitle: "Risque de confusion",
    lookalikeIntro:
      "Ces espèces se ressemblent – lis-les avant d'emporter quoi que ce soit.",
    lookalikeCheck:
      "En cas de doute : ne pas manger, mais montrer toute la récolte au contrôle officiel des champignons. Suspicion d'intoxication : Tox Info Suisse 145.",
    collection: {
      title: "Album des espèces",
      progress: (seen: number, total: number) =>
        `${seen} espèces observées sur ${total}`,
      progressAria: "Progression de la collection",
      notSeen: "encore à trouver",
      seenAria: (name: string, date: string) =>
        `${name} – observé pour la première fois le ${date}. Ouvrir la fiche du lexique.`,
      openAria: (name: string) =>
        `${name} – pas encore observé. Ouvrir la fiche du lexique.`,
      hint: "Relie une observation à une espèce du lexique pour qu'elle apparaisse en couleur ici.",
    },
    sightings: {
      title: "Mes observations",
      sectionAria: "Mes observations nature",
      intro:
        "Note ce que tu as découvert dehors – avec date, position, note et photo. Les observations avec position apparaissent aussi comme épingles sur la carte.",
      loginFeature: "ton journal d'observations",
      loadFailed: "Les observations n'ont pas pu être chargées.",
      empty:
        "Pas encore d'observations – note ta première rencontre, par exemple un chevreuil en lisière de forêt.",
      count: (n: number) => (n === 1 ? "1 observation" : `${n} observations`),
      addButton: "Ajouter une observation",
      addAria: "Ajouter une nouvelle observation",
      dialogTitleNew: "Nouvelle observation",
      dialogTitleEdit: "Modifier l'observation",
      dialogDescription:
        "Choisis une entrée du lexique comme suggestion ou saisis ton propre titre.",
      entryLabel: "Espèce du lexique (facultatif)",
      entryNone: "Aucune entrée du lexique",
      titleLabel: "Titre",
      titlePlaceholder: "p. ex. Chevreuil en lisière de forêt",
      titleRequired: "Saisis un titre ou choisis une entrée du lexique.",
      dateLabel: "Date",
      locationLegend: "Position (facultatif)",
      useLocation: "Utiliser la position actuelle",
      locating: "Recherche de la position …",
      locationSet: (lat: string, lon: string) => `Position : ${lat}, ${lon}`,
      removeLocation: "Supprimer la position",
      locationFailed:
        "La position n'a pas pu être déterminée – vérifie l'autorisation.",
      locationUnsupported: "Cet appareil ne fournit pas de position.",
      onMapHint: "Apparaît comme épingle sur la carte.",
      noteLabel: "Note (facultatif)",
      notePlaceholder: "p. ex. traces dans la boue, deux petits",
      photoLabel: "Photo (facultatif)",
      photoChoose: "Choisir une photo",
      photoChange: "Changer la photo",
      photoRemove: "Supprimer la photo",
      photoPreviewAlt: "Aperçu de la photo de l'observation",
      photoHint: "JPEG, PNG ou WebP – réduite automatiquement avant l'envoi.",
      photoUploading: "Envoi de la photo …",
      photoUploadFailed: "Enregistré, mais la photo n'a pas pu être envoyée.",
      photoTooLarge: "La photo est trop grande (max. 5 Mo).",
      photoHeic:
        "Le navigateur ne peut pas lire le HEIC/HEIF – exporte en JPEG.",
      photoReadFailed: "L'image n'a pas pu être lue.",
      photoRemoveFailed: "La photo n'a pas pu être supprimée.",
      photoAlt: (title: string) => `Photo de l'observation ${title}`,
      created: "Observation enregistrée",
      updated: "Modifications enregistrées",
      deleted: "Observation supprimée",
      editAria: (title: string) => `Modifier l'observation «${title}»`,
      deleteAria: (title: string) => `Supprimer l'observation «${title}»`,
      deleteConfirm: (title: string) =>
        `Vraiment supprimer l'observation «${title}» ?`,
    },
  },
  /** Risque de tiques selon la région (#224). */
  fishing: {
    title: "Carnet de pêche",
    sectionAria: "Carnet de pêche – mes prises",
    intro:
      "Note chaque prise : espèce, longueur, poids, plan d'eau, appât et photo. L'app en tire tes records et le nombre de prises par année.",
    loginFeature: "ton carnet de pêche",
    loadFailed: "Impossible de charger les prises.",
    empty:
      "Aucune prise pour l'instant – saisis la première, par exemple une truite de rivière de la Sihl.",
    count: (n: number) => (n === 1 ? "1 prise" : `${n} prises`),
    addButton: "Saisir une prise",
    addAria: "Saisir une nouvelle prise",
    legalTitle: "Le canton a le dernier mot",
    legalText:
      "En Suisse, la pêche est réglée par les cantons : périodes de protection, tailles minimales de capture et limites de prises diffèrent d'un canton à l'autre, et même d'un plan d'eau à l'autre. Ici figurent les prescriptions minimales de la Confédération – ton canton peut être plus strict, et il l'est presque toujours. Font foi l'ordonnance cantonale sur la pêche et ton permis.",
    legalSource: (version: string, date: string) =>
      `Base : ordonnance relative à la loi fédérale sur la pêche (${version}). État des données : ${date}.`,
    filterSpeciesLabel: "Espèce",
    filterWaterLabel: "Plan d'eau",
    filterAll: "Toutes",
    filterEmpty: "Aucune prise pour cette sélection.",
    released: "remise à l'eau",
    kept: "conservée",
    lengthShort: (value: string) => `${value} cm`,
    weightShort: (value: string) => `${value} kg`,
    photoAlt: (name: string) => `Photo de la prise : ${name}`,
    editAria: (name: string) => `Modifier la prise « ${name} »`,
    deleteAria: (name: string) => `Supprimer la prise « ${name} »`,
    deleteConfirm: (name: string) =>
      `Supprimer vraiment la prise « ${name} » ?`,
    statsTitle: "Statistiques",
    statsSummary: (total: number, released: number, kept: number) =>
      `${total} prises · ${released} remises à l'eau · ${kept} conservées`,
    recordsTitle: "Plus grosse prise par espèce",
    recordNoLength: "jamais mesurée",
    recordCount: (n: number) => (n === 1 ? "1 prise" : `${n} prises`),
    yearsTitle: "Prises par année",
    yearLine: (total: number, released: number) =>
      `${total} prises, dont ${released} remises à l'eau`,
    dialogTitleNew: "Nouvelle prise",
    dialogTitleEdit: "Modifier la prise",
    dialogDescription:
      "Choisis une espèce dans le jeu de données – l'app vérifie aussitôt la période de protection et la taille minimale fédérale.",
    speciesLabel: "Espèce de poisson",
    speciesOwn: "Saisir une espèce libre",
    nameLabel: "Nom de l'espèce",
    namePlaceholder: "p. ex. truite de rivière",
    nameRequired: "Saisis un nom d'espèce ou choisis une espèce.",
    dateLabel: "Date",
    timeLabel: "Heure",
    lengthLabel: "Longueur (cm)",
    weightLabel: "Poids (kg)",
    waterLabel: "Plan d'eau",
    waterPlaceholder: "p. ex. lac de Zurich ou la Sihl près de Langnau",
    waterRequired: "Indique le plan d'eau.",
    methodLabel: "Appât / méthode",
    methodPlaceholder: "p. ex. nymphe, leurre souple 10 cm",
    releasedLabel: "Remise à l'eau avec ménagement",
    noteLabel: "Note (facultatif)",
    notePlaceholder: "p. ex. tôt le matin, pluie fine",
    photoLabel: "Photo (facultatif)",
    photoChoose: "Choisir une photo",
    photoChange: "Changer la photo",
    photoRemove: "Supprimer la photo",
    photoPreviewAlt: "Aperçu de la photo de la prise",
    photoHint:
      "JPEG, PNG ou WebP – l'image est réduite automatiquement avant l'envoi.",
    photoUploading: "Envoi de la photo …",
    photoUploadFailed: "Enregistré, mais la photo n'a pas pu être envoyée.",
    photoTooLarge: "La photo est trop grande (max. 5 Mo).",
    photoHeic:
      "Le navigateur ne peut pas lire le HEIC/HEIF – exporte en JPEG s'il te plaît.",
    photoReadFailed: "L'image n'a pas pu être lue.",
    photoRemoveFailed: "La photo n'a pas pu être supprimée.",
    created: "Prise enregistrée",
    updated: "Modifications enregistrées",
    deleted: "Prise supprimée",
    hints: {
      ban: "Interdiction fédérale de capture : cette espèce est en danger d'extinction et ne doit pas être capturée. Décroche l'hameçon dans l'eau et relâche le poisson immédiatement.",
      report:
        "Obligation d'annonce : annonce ce poisson sans délai au service cantonal de la pêche.",
      closedSeason:
        "À cette date, la période de protection indicative de cette espèce s'applique – dans la plupart des cantons, tu ne peux pas la prélever maintenant. Consulte ton ordonnance cantonale sur la pêche.",
      underMinLength: (cm: number) =>
        `En dessous de la taille minimale fédérale de ${cm} cm – à remettre à l'eau. Le canton exige souvent davantage.`,
      nearMinLength: (cm: number) =>
        `Juste au-dessus de la taille fédérale de ${cm} cm : de nombreux cantons exigent nettement plus – vérifie avant de prélever.`,
      cantonal: "Font foi l'ordonnance cantonale sur la pêche et ton permis.",
    },
    speciesTitle: "Espèces, périodes de protection et tailles minimales",
    speciesIntro:
      "Les principales espèces de la pêche à la ligne en Suisse, avec les prescriptions minimales de la Confédération et ce que les cantons règlent plus strictement en pratique.",
    federalMin: (cm: number) => `Confédération : au moins ${cm} cm`,
    federalMinNone: "Confédération : pas de taille minimale",
    federalWeeks: (weeks: number) =>
      `période de protection d'au moins ${weeks} semaines`,
    federalWeeksNone:
      "aucune période de protection prescrite par la Confédération",
    guideSeason: (from: string, to: string) =>
      `Période de protection indicative : du ${from} au ${to}`,
    guideSeasonNone: "Aucune période de protection courante enregistrée",
    guideSeasonHint:
      "Valeur indicative, non contraignante : la Confédération ne fixe que la durée en semaines, le canton fixe le début et la fin.",
    cantonTitle: "Souvent plus strict dans le canton :",
    habitatTitle: "Où elle se tient :",
    methodTitle: "Appât et méthode :",
    bannedBadge: "Capture interdite",
    waters: {
      fliessend: "Eaux courantes",
      stehend: "Eaux stagnantes",
      beide: "Eaux courantes et stagnantes",
    },
    measureHint:
      "La mesure va de la pointe de la tête à l'extrémité de la nageoire caudale naturellement déployée (art. 2 al. 2 OLFP).",
  },
  tickRisk: {
    sectionAria: "Risque de tiques à cet endroit",
    title: "Risque de tiques",
    activity: {
      none: "à peine actives",
      low: "peu actives",
      moderate: "moyennement actives",
      high: "très actives",
    },
    activityLine: (month: string) =>
      `Voilà à quel point les tiques sont actives en ${month}.`,
    aboveTickLine: (limitM: number) =>
      `L'emplacement est au-dessus de ${limitM} m – à cette altitude, les tiques sont rares.`,
    inRiskArea:
      "Cet endroit se trouve dans une zone que l'OFSP classe comme région à risque de FSME. Si tu passes beaucoup de temps dehors, parles-en à ton médecin de famille pour la vaccination.",
    outsideRiskArea: (region: string) =>
      `Le canton de ${region} ne fait pas partie des régions à risque de FSME selon l'OFSP. Il y a tout de même des tiques ici – la borréliose se transmet indépendamment de ce classement.`,
    outsideSwitzerland:
      "Hors de Suisse, ReiseKompass ne fournit pas de classement FSME. Renseigne-toi sur ton pays de destination avant le départ.",
    switzerlandGeneral:
      "En Suisse, tout le pays est considéré comme région à risque de FSME – à l'exception des cantons de Genève et du Tessin.",
    tipsTitle: "Comment te protéger",
    tips: [
      "Reste sur les chemins et évite les hautes herbes, les broussailles et les lisières de forêt.",
      "Pantalon long, chaussures fermées, chaussettes par-dessus le pantalon – des vêtements clairs, tu verras la tique plus tôt.",
      "Applique un répulsif sur la peau et les habits, et renouvelle-le après quelques heures.",
      "Le soir, inspecte tout le corps ; chez les enfants surtout la lisière des cheveux, les oreilles, les aisselles, l'aine et le creux des genoux.",
      "Retire une tique le plus vite possible et note l'endroit dans le carnet des piqûres de tiques.",
    ],
    sourceNote:
      "Classement : OFSP, état février 2019. Activité estimée grossièrement selon le mois et l'altitude – une aide à l'orientation, pas un avis médical.",
  },

  /** Info baignade dans le dossier de l'emplacement (#223). */
  bathingWater: {
    title: "Eau & baignade",
    stationLine: (waterBody: string, station: string, distance: string) =>
      `${waterBody} · station de mesure ${station}, à ${distance}`,
    marineLine: "Température de l'eau de mer à ton emplacement",
    tideTitle: "Marées :",
    tideHigh: (time: string) => `marée haute ${time}`,
    tideLow: (time: string) => `marée basse ${time}`,
    waveHeight: (m: string) => `Vagues ${m} m`,
    waveFrom: (dir: string) => `venant du ${dir}`,
    waveLevels: {
      calm: "calme",
      moderate: "modérée",
      rough: "forte – prudence à la baignade",
    },
    noTemperature:
      "Cette station ne mesure pas la température de l'eau – il n'y a que le niveau et le débit.",
    comfort: {
      cold: "froide",
      brisk: "fraîche",
      pleasant: "agréable",
      warm: "chaude",
    },
    trend: {
      rising: "en hausse",
      steady: "stable",
      falling: "en baisse",
    },
    flowLabel: "Débit",
    flowValue: (value: string) => `${value} m³/s`,
    levelLabel: "Niveau",
    levelValue: (value: string) => `${value} m d'altitude`,
    measuredAt: (when: string) => `Mesuré le ${when}`,
    sourceStation:
      "Source : données hydrologiques ouvertes de l'OFEV via api.existenz.ch",
    sourceMarine: "Source : Open-Meteo Marine",
    safetyNote:
      "Ce sont les mesures de la station la plus proche, pas de ton lieu de baignade. Elles ne disent rien du courant, de la qualité de l'eau ni des règles de baignade – fie-toi à la signalisation sur place.",
    rulesLink: "Règles de baignade & drapeaux",
  },

  /** Passages de l'ISS dans la partie astro (#222). */
  iss: {
    sectionAria: "Passages visibles de la station spatiale ISS",
    title: "Passages de l'ISS",
    subtitle:
      "Les prochains passages visibles de la station spatiale depuis ta position.",
    subtitleAtPlace: (place: string) =>
      `Les prochains passages visibles de la station spatiale près de ${place}.`,
    loading: "Calcul des passages …",
    noLocation:
      "Pour les passages, ReiseKompass a besoin de ta position – autorise la localisation ou enregistre un emplacement.",
    loadFailed:
      "Les passages n'ont pas pu être chargés pour l'instant. Réessaie plus tard.",
    noneVisible:
      "Aucun passage visible d'ici dans les quatre prochains jours. Cela change toutes les quelques semaines – repasse plus tard.",
    duration: (minutes: number) =>
      minutes === 1 ? "1 minute" : `${minutes} minutes`,
    path: (path: string) => `Trajet dans le ciel : ${path}`,
    maxElevation: (degrees: number) =>
      `jusqu'à ${degrees}° au-dessus de l'horizon`,
    brightness: (magnitude: string) => `Éclat env. ${magnitude} mag`,
    footnote:
      "L'ISS n'est visible qu'au crépuscule et en première partie de nuit : il doit faire sombre au sol pendant que le soleil éclaire encore la station. Elle traverse le ciel comme un point brillant et régulier – sans clignoter. Les heures et l'éclat sont des valeurs approchées, sors quelques minutes à l'avance.",
  },

  /** Détecteur de constellations : lever le téléphone vers le ciel (#225). */
  skyFinder: {
    sectionAria: "Détecteur de constellations avec boussole et inclinaison",
    title: "Détecteur de constellations",
    subtitle:
      "Lève ton téléphone vers le ciel – ReiseKompass te dit ce qui se trouve dans cette direction.",
    subtitleAtPlace: (place: string) =>
      `Lève ton téléphone vers le ciel – voici l'état du ciel à ${place}.`,
    locating: "Localisation en cours …",
    noLocation:
      "Pour le détecteur de constellations, ReiseKompass a besoin de ta position – autorise la localisation ou enregistre un emplacement.",
    viewTitle: "Dans ta direction",
    viewDirection: (direction: string, degrees: number) =>
      `${direction}, ${degrees}° au-dessus de l'horizon`,
    viewNothing:
      "Rien du répertoire ne se trouve dans cette direction pour l'instant. Balaie lentement le ciel avec ton téléphone.",
    viewGround:
      "Tu vises sous l'horizon – lève davantage le téléphone vers le ciel.",
    separation: (degrees: number) => `à environ ${degrees}° du centre`,
    lexiconLink: "Lire dans le lexique",
    compassStart: "Démarrer la boussole",
    compassHint:
      "Pour la direction du regard, ReiseKompass a besoin de la boussole de ton appareil – touche « Démarrer la boussole » et autorise l'accès.",
    compassDenied:
      "Sans accès à la boussole, impossible de déterminer la direction du regard. Tu peux réessayer – la liste ci-dessous reste valable.",
    noCompass:
      "Ton appareil n'a pas de boussole. La liste ci-dessous t'indique quand même ce qui brille cette nuit – avec direction et hauteur au-dessus de l'horizon.",
    daylightHint:
      "Il fait encore trop clair pour les étoiles. La liste montre l'état du ciel pour la nuit qui vient.",
    tonightTitle: (time: string) => `Visible cette nuit (à ${time})`,
    tonightEmpty:
      "À cette heure, rien du répertoire n'est assez haut dans le ciel.",
    position: (direction: string, degrees: number) =>
      `${direction} · ${degrees}° de hauteur`,
    footnote:
      "Tout est calculé hors ligne à partir du lieu et de l'heure ; les indications valent pour un horizon dégagé. Les boussoles de téléphone sont précises à 10 à 15 degrés près – tiens l'appareil à plat dans la main, loin du métal et des aimants.",
  },

  /** Sentiers de randonnée à proximité (#238). */
  nearbyBikes: {
    sectionAria: "Itinéraires cyclables balisés à proximité",
    title: "Itinéraires cyclables à proximité",
    subtitle: "Itinéraires cyclables balisés autour de ta position.",
    subtitleAtPlace: (place: string) =>
      `Itinéraires cyclables balisés autour de ${place}.`,
    searchButton: "Chercher des itinéraires",
    loading: "Recherche d'itinéraires cyclables …",
    loadFailed:
      "Les itinéraires cyclables n'ont pas pu être chargés. Overpass est un service gratuit qui freine en cas de forte demande – réessaie dans quelques minutes.",
    empty: (km: number) =>
      `Aucun itinéraire cyclable balisé n'est cartographié dans OpenStreetMap dans un rayon de ${km} km. Essaie un rayon plus grand.`,
    resultCount: (n: number) =>
      n === 1
        ? "1 itinéraire cyclable trouvé"
        : `${n} itinéraires cyclables trouvés`,
    durationLabel: "Temps de parcours",
    durationFlatOnly:
      "Pas de données d'altitude dans OpenStreetMap – le temps vaut pour un terrain plat.",
    durationNote:
      "Temps de parcours en règle générale : 15 km/h en rythme de randonnée plus 6 minutes par 100 m de montée. Les pauses ne sont pas comprises.",
    network: {
      icn: "Itinéraire cyclable international",
      ncn: "Itinéraire cyclable national",
      rcn: "Itinéraire cyclable régional",
      lcn: "Itinéraire cyclable local",
    },
  },
  nearbyHikes: {
    lengthFilterAria: "Filtrer par longueur d'itinéraire",
    lengthAll: "Toutes les longueurs",
    lengthShort: "jusqu'à 5 km",
    lengthMedium: "5–15 km",
    lengthLong: "plus de 15 km",
    sectionAria: "Sentiers de randonnée balisés aux alentours",
    title: "Randonner aux alentours",
    subtitle: "Sentiers de randonnée balisés autour de ta position.",
    subtitleAtPlace: (place: string) =>
      `Sentiers de randonnée balisés autour de ${place}.`,
    radiusLabel: "Rayon",
    radiusGroupAria: "Choisir le rayon de recherche",
    radiusOption: (km: number) => `${km} km`,
    searchButton: "Chercher des sentiers",
    searchAgain: "Chercher à nouveau",
    locating: "Position en cours de détermination …",
    loading: "Recherche des sentiers …",
    noLocation:
      "Pour la recherche, ReiseKompass a besoin de ta position – autorise la localisation ou ouvre la section dans le dossier d'un emplacement enregistré.",
    loadFailed:
      "Les sentiers n'ont pas pu être chargés. Overpass est un service gratuit qui freine en cas de trop nombreuses requêtes – réessaie dans quelques minutes.",
    empty: (km: number) =>
      `Dans un rayon de ${km} km, aucun itinéraire de randonnée balisé n'est enregistré dans OpenStreetMap. Essaie avec un rayon plus grand.`,
    resultCount: (n: number) =>
      n === 1 ? "1 sentier trouvé" : `${n} sentiers trouvés`,
    unnamed: "Itinéraire sans nom",
    routeWithRef: (ref: string) => `Itinéraire ${ref}`,
    distanceLabel: "À vol d'oiseau",
    lengthLabel: "Longueur",
    durationLabel: "Temps de marche",
    ascentLabel: "Montée",
    unknown: "–",
    network: {
      iwn: "Itinéraire international de grande randonnée",
      nwn: "Itinéraire national",
      rwn: "Itinéraire régional",
      lwn: "Itinéraire local",
    },
    showMap: "Afficher sur la carte",
    hideMap: "Fermer la carte",
    mapAria: (name: string) => `Carte de l'itinéraire ${name}`,
    mapFailed: "La carte n'a pas pu être chargée.",
    sectionLength: (value: string, km: number) =>
      `Dans un rayon de ${km} km, l'itinéraire s'étend sur ${value} – la carte ne montre que ce tronçon.`,
    navButton: "Naviguer vers le départ",
    navAria: (name: string) =>
      `Navigation vers le point le plus proche de l'itinéraire ${name}`,
    websiteLink: "Site web de l'itinéraire",
    durationFlatOnly:
      "Pas de données d'altitude dans OpenStreetMap – le temps de marche vaut pour un terrain plat.",
    durationNote:
      "Temps de marche selon la règle du CAS : 4 km/h à plat, plus 400 mètres de dénivelé par heure à la montée et 800 à la descente ; on compte la plus grande part plus la moitié de la plus petite. Les pauses ne sont pas comprises.",
    footnote:
      "Données d'OpenStreetMap via l'API Overpass – interrogée uniquement sur ton clic. Longueur, dénivelé et difficulté n'apparaissent que là où ils sont renseignés dans OSM, sinon « – ». Le balisage sur le terrain et l'état du chemin peuvent différer : emporte carte et bulletin météo.",
  },

  /** Foyers et grils depuis OpenStreetMap (#247). */
  tentWind: {
    sectionAria: "Orienter la tente ou le tarp selon le vent",
    title: "Orientation face au vent",
    subtitle:
      "Comment placer ta tente ou ton tarp pour que le vent ne pousse pas dessus.",
    refreshAria: "Recharger les valeurs de vent",
    shapeGroupAria: "Choisir le type",
    shape: {
      tunnel: "Tente tunnel ou canadienne",
      dome: "Tente dôme",
      tarp: "Tarp",
    },
    shapeHint: {
      tunnel:
        "Le côté étroit face au vent – il glisse ainsi le long du grand côté.",
      dome: "L'entrée à l'abri du vent, sinon la tente se gonfle à l'ouverture.",
      tarp: "Le bord bas face au vent, le côté ouvert à l'opposé.",
    },
    loading: "Chargement des valeurs de vent …",
    loadFailed:
      "Les valeurs de vent n'étaient pas disponibles. Réessaie dans un instant.",
    roseAria: (from: string, point: string) =>
      `Vent de ${from}, orienter la pointe vers ${point}`,
    windFromLabel: "Vent de",
    speedLabel: "Force",
    speedValue: (speed: number, gust: number) =>
      `${speed} km/h, rafales ${gust} km/h`,
    pointLabel: "Pointe vers",
    levelHint: {
      calm: "Peu de vent – l'orientation est un détail de confort.",
      breezy: "Vent sensible : tends bien les haubans et enfonce les sardines.",
      windy:
        "Fortes rafales : tous les haubans en place, range ce qui traîne, replie l'auvent.",
      storm:
        "Rafales de tempête : cherche si possible un emplacement abrité. Une tente y résiste rarement.",
    },
    startCompass: "Activer la boussole",
    noCompass:
      "Sans boussole, cet appareil n'indique que la direction – la recommandation reste valable.",
    compassDenied:
      "L'accès à la boussole est refusé. La recommandation par direction reste valable.",
    alignedNow: "C'est bon – la tente est bien placée face au vent.",
    turnLeft: (deg: number) => `Tourne encore de ${deg}° vers la gauche.`,
    turnRight: (deg: number) => `Tourne encore de ${deg}° vers la droite.`,
    source: "Valeurs de vent d'Open-Meteo, règles empiriques de montage.",
  },
  briefing: {
    title: "Briefing du matin",
    sectionAria: "Briefing du matin pour le séjour en cours",
    pollenLine: (parts: string) => `Pollens : ${parts}`,
    waterLine: (temp: string, comfort: string) => `Eau ${temp} °C – ${comfort}`,
    waterTide: (time: string) => `prochaine marée haute à ${time}`,
    astroLine: (phase: string, percent: number) =>
      `${phase} – la lune est éclairée à ${percent} %.`,
    moreTasks: (count: number) =>
      count === 1 ? "et 1 autre tâche" : `et ${count} autres tâches`,
    openToday: "Vers la vue Aujourd’hui",
  },
  guestbook: {
    title: "Livre d'or",
    toggleAria: (trip: string) => `Ouvrir le livre d'or de ${trip}`,
    hint: "Messages et souvenirs du voyage – des participants et de tous ceux qui ont le lien partagé.",
    empty: "Aucun message pour l'instant. Écris le premier.",
    count: (total: number) => (total === 1 ? "1 message" : `${total} messages`),
    messagePlaceholder: "Ton message …",
    messageAria: "Message du livre d'or",
    messageRequired: "Pas de message sans texte.",
    addButton: "Publier",
    added: "Message enregistré",
    addFailed: "Impossible d'enregistrer le message",
    removed: "Message supprimé",
    removeFailed: "Impossible de supprimer le message",
    removeAria: (author: string) => `Supprimer le message de ${author}`,
    guestFallback: "Invité·e",
    viaLink: "via le lien partagé",
    noPhoto: "Sans image",
    photoOption: (index: number) => `Photo ${index}`,
    photoSelectAria: "Joindre une photo de la galerie du voyage",
    photoAlt: (author: string) => `Photo du message de ${author}`,
    photoGone: "La photo jointe a été supprimée.",
    nameLabel: "Ton nom",
    namePlaceholder: "p. ex. Mamie Vreni",
    guestHint:
      "Tu n'es pas connecté·e – ton message apparaîtra comme invité·e. Impossible de joindre une image ici.",
    guestAdded: "Merci pour ton message !",
  },
  datePoll: {
    title: "Trouve-date",
    toggleAria: (trip: string) => `Ouvrir le trouve-date pour ${trip}`,
    hint: "Propose des périodes et répondez pour chacune par Oui, Peut-être ou Non. Une période sans refus l'emporte – même avec moins de Oui.",
    empty:
      "Aucune proposition pour l'instant. Saisis une période, puis tout le monde peut répondre.",
    startLabel: "Arrivée",
    endLabel: "Départ",
    notePlaceholder: "Note, p. ex. « pont »",
    noteAria: "Note sur la proposition",
    addButton: "Proposer",
    added: "Proposition ajoutée",
    addFailed: "Impossible d'enregistrer la proposition",
    rangeInvalid: "Le départ doit suivre l'arrivée.",
    removed: "Proposition supprimée",
    removeFailed: "Impossible de supprimer la proposition",
    removeAria: (range: string) => `Supprimer la proposition ${range}`,
    voteFailed: "Impossible d'enregistrer la réponse",
    voteGroupAria: "Ta réponse pour cette période",
    voteLabel: { yes: "Oui", maybe: "Peut-être", no: "Non" },
    nights: (count: number) => (count === 1 ? "1 nuit" : `${count} nuits`),
    unanimous: "Tous d'accord",
    leadingAria: "En tête actuellement",
    missing: (names: string) => `Manque encore : ${names}`,
    progress: (answered: number, expected: number) =>
      `${answered} réponses sur ${expected}`,
    decided: (range: string) =>
      `Tout le monde a répondu – ${range} est en tête et serait la date.`,
    applyButton: "Reprendre comme date du voyage",
    applied: "Date du voyage reprise",
    applyFailed: "Impossible de reprendre la date",
    currentDate: "Date actuelle du voyage",
    maxReached: (max: number) =>
      `Au-delà de ${max} propositions, plus personne ne répond – supprimes-en une pour faire de la place.`,
  },
  boxes: {
    saveImageButton: "Enregistrer comme image",
    saveImageDone: "Étiquette enregistrée comme image",
    saveImageFailed: "Impossible de créer l'image",
    printFallbackHint:
      "Sur iPhone, une app installée n'imprime pas directement – choisis « Enregistrer comme image » puis imprime ou partage depuis Photos.",
    title: "Caisses",
    subtitle:
      "Quel équipement se trouve dans quelle caisse – avec étiquette et QR-code à imprimer.",
    loginFeature: "la gestion des caisses",
    addBox: "Nouvelle caisse",
    editBox: "Modifier la caisse",
    dialogHint:
      "Le code figure en grand sur l'étiquette et dans le QR-code. Reste court – « K3 » se lit à deux mètres.",
    codeLabel: "Code",
    nameLabel: "Nom",
    namePlaceholder: "p. ex. Cuisine",
    locationLabel: "Rangement à la maison",
    locationPlaceholder: "p. ex. cave, étagère de gauche",
    notesLabel: "Notes",
    saved: "Caisse enregistrée",
    removed: "Caisse supprimée – l'équipement est conservé",
    removeConfirm: (name: string) =>
      `Supprimer vraiment la caisse « ${name} » ? L'équipement qu'elle contient est conservé et ne sera plus attribué à aucune caisse.`,
    empty:
      "Aucune caisse pour l'instant. Crée-en une, imprime l'étiquette et colle-la sur la boîte.",
    boxEmpty: "Cette caisse est encore vide.",
    summary: (count: number, weight: string) =>
      count === 1 ? `1 pièce · ${weight}` : `${count} pièces · ${weight}`,
    removeFromBox: "Sortir",
    looseTitle: "Dans aucune caisse",
    looseHint:
      "Équipement de ton inventaire qui n'est attribué à aucune caisse.",
    assignPlaceholder: "Ranger dans …",
    assignAria: (name: string) => `Attribuer ${name} à une caisse`,
    labelButton: "Étiquette",
    labelTitle: "Imprimer l'étiquette",
    labelHint:
      "Quatre étiquettes identiques par feuille – colle-les, et un scan montrera le contenu.",
    printButton: "Imprimer",
    qrAlt: (code: string) => `QR-code de la caisse ${code}`,
    unknownCode: (code: string) =>
      `Aucune caisse ne correspond au code « ${code} ». Elle a peut-être été supprimée ou appartient à un autre compte.`,
  },
  picnicStops: {
    sectionAria: "Aires de pause le long du trajet",
    title: "Pause en route",
    subtitle: "Aires de pique-nique et tables sur le chemin de l'emplacement.",
    subtitleAtPlace: (place: string) =>
      `Aires de pique-nique et tables sur le chemin de ${place}.`,
    startLabel: "Départ",
    startGroupAria: "Choisir le point de départ",
    startHome: "Domicile",
    startCurrent: "Position actuelle",
    radiusLabel: "Couloir",
    radiusGroupAria: "Choisir la largeur du couloir",
    radiusOption: (km: number) => `${km} km`,
    searchButton: "Chercher une pause",
    lineHint:
      "La recherche suit l'itinéraire routier calculé ; les repères kilométriques comptent depuis le départ, par la route.",
    lineHintEstimate:
      "Sans réseau, pas de calcul d'itinéraire : la recherche suit la ligne droite – en montagne, le trajet réel peut s'écarter nettement.",
    locating: "Localisation en cours …",
    loading: "Recherche des aires de pause …",
    noHome:
      "Il te faut un domicile enregistré dans ton profil – ou choisis « Position actuelle ».",
    noPosition:
      "Ta position n'a pas pu être déterminée. Autorise l'accès ou choisis le domicile comme départ.",
    loadFailed:
      "Les aires de pause n'ont pas pu être chargées. Overpass est un service gratuit qui limite les requêtes – réessaie dans quelques minutes.",
    empty: (km: number) =>
      `Dans un couloir de ${km} km le long du trajet, aucune aire n'est enregistrée dans OpenStreetMap. Essaie avec un couloir plus large.`,
    resultCount: (n: number, km: number) =>
      n === 1 ? `1 aire sur ${km} km` : `${n} aires sur ${km} km`,
    kmMark: (along: number, total: number) => `km ${along} sur ${total}`,
    offsetHint: (value: string) => `${value} à l'écart du trajet`,
    kind: {
      site: "Aire de pique-nique",
      table: "Table de pique-nique",
    },
    kindHint: {
      site: "aire aménagée",
      table: "table isolée au bord du chemin",
    },
    covered: "couvert",
    fireplace: "foyer",
    drinkingWater: "eau potable",
    navButton: "Y aller",
    navAria: (name: string) => `Navigation vers ${name}`,
    source: "Données OpenStreetMap, tenues à jour par des bénévoles.",
  },
  firepits: {
    sectionAria: "Foyers et grils officiels à proximité",
    title: "Foyers à proximité",
    subtitle: "Foyers et grils officiels autour de ta position.",
    subtitleAtPlace: (place: string) =>
      `Foyers et grils officiels autour de ${place}.`,
    radiusLabel: "Rayon",
    radiusGroupAria: "Choisir le rayon de recherche",
    radiusOption: (km: number) => `${km} km`,
    loading: "Recherche des foyers …",
    loadFailed:
      "Les foyers n'ont pas pu être chargés pour l'instant. Overpass est un service gratuit qui freine en cas de trop nombreuses requêtes – réessaie dans quelques minutes.",
    empty: (km: number) =>
      `Dans un rayon de ${km} km, aucun foyer ni gril n'est enregistré dans OpenStreetMap. Essaie avec un rayon plus grand.`,
    resultCount: (n: number) =>
      n === 1 ? "1 endroit trouvé" : `${n} endroits trouvés`,
    kind: {
      firepit: "Foyer",
      bbq: "Gril",
    },
    kindHint: {
      firepit: "foyer ouvert",
      bbq: "gril fixe",
    },
    covered: "couvert",
    firewood: "bois sur place",
    drinkingWater: "eau potable",
    distanceAway: (value: string) => `à ${value}`,
    navButton: "S'y rendre",
    navAria: (name: string) => `Navigation vers ${name}`,
    fireDangerLink: "Voir le danger d'incendie de forêt et les interdictions",
    fireDangerShort: "Vérifier le danger d'incendie",
    source:
      "Données d'OpenStreetMap via l'API Overpass – interrogée uniquement sur ton clic. Les caractéristiques ne figurent que là où elles sont renseignées dans OSM.",
  },

  /** Places de jeux et lieux de baignade depuis OpenStreetMap (#248). */
  routeWeather: {
    sectionAria: "Intempéries sur le trajet",
    title: "Météo et trafic sur le trajet",
    subtitle: "Ce qui t'attend en route – pas seulement à l'arrivée.",
    subtitleAtPlace: (place: string) =>
      `Ce qui t'attend sur la route vers ${place} – pas seulement à l'arrivée.`,
    /** Hin- oder Rückfahrt (#368) */
    directionGroupAria: "Choisir aller ou retour",
    directionThere: "Aller",
    directionBack: "Retour",
    directionBackHint: "Retour à la maison – départ de l’emplacement.",
    startGroupAria: "Choisir le point de départ",
    startHome: "Depuis le domicile",
    startCurrent: "Depuis ma position",
    departureLabel: "Départ",
    loading: "Récupération de la météo le long du trajet …",
    loadFailed:
      "La météo le long du trajet n'a pas pu être chargée – réessaie plus tard.",
    noStart:
      "Pas de point de départ : enregistre un domicile dans le profil ou autorise la localisation.",
    tooShort: (km: number) =>
      `En dessous de ${km} km, l'analyse du trajet n'apporte rien – l'alerte à l'arrivée suffit.`,
    summary: (distance: string, minutes: number, estimated: boolean) =>
      estimated
        ? `${distance} à vol d'oiseau, environ ${Math.floor(minutes / 60)} h ${minutes % 60} min de route.`
        : `${distance} par la route, ${Math.floor(minutes / 60)} h ${minutes % 60} min de trajet.`,
    allClear: "Rien de particulier sur tout le trajet aux heures estimées.",
    worstLine: {
      info: "Broutilles en route – rien qui concerne la conduite.",
      warnung:
        "Du mauvais temps est à prévoir en chemin. Décale le départ ou prévois une pause.",
      gefahr:
        "Des intempéries menacent sur le trajet. Pars plus tard si possible – personne n'a rien à gagner sous l'orage avec une remorque ou une caravane.",
    },
    risk: {
      gewitter: "Orage",
      sturm: "Rafales tempétueuses",
      regen: "Fortes pluies",
      schnee: "Neige",
    },
    traffic: {
      normal: "Fluide",
      slow: "Ralenti",
      jam: "Bouchon",
    },
    allClearButJam: (count: number) =>
      count === 1
        ? "Rien côté météo – mais un bouchon sur le parcours."
        : `Rien côté météo – mais des bouchons à ${count} endroits.`,
    riskNone: "Calme",
    kmMark: (km: number) => `km ${km}`,
    gusts: (kmh: number) => `${kmh} km/h`,
    methodNote:
      "Jusqu'à huit points le long de l'itinéraire routier calculé sont vérifiés, chacun pour l'heure d'arrivée à ce point. Distance et durée proviennent du calcul d'itinéraire (OpenStreetMap) ; bouchons et chantiers s'y ajoutent.",
    methodNoteEstimate: (speed: number) =>
      `Sans réseau, pas de calcul d'itinéraire : huit points le long de la ligne droite sont vérifiés à ${speed} km/h – une estimation grossière qui peut être très fausse en montagne.`,
    methodNoteTraffic:
      "Distance et durée proviennent du calcul d'itinéraire de Google – avec la prévision de trafic pour ton heure de départ. Les points de contrôle sont, comme avant, placés sur l'itinéraire d'OpenStreetMap. Comme le trafic décale l'heure d'arrivée à chaque point, il décale aussi l'heure de prévision qui compte.",
    source: "Données : Open-Meteo",
  },
  packHistory: {
    sectionAria: "Suggestions d'après les voyages passés",
    title: "Emporté la dernière fois",
    subtitle: (trips: number) =>
      trips === 1
        ? "D'après ton dernier séjour à cet endroit – pas encore sur cette liste."
        : `D'après tes ${trips} derniers séjours à cet endroit – pas encore sur cette liste.`,
    everyTime: "à chaque fois",
    tripCount: (n: number, of: number) => `${n} sur ${of}`,
    addAria: (name: string) => `Ajouter ${name} à la liste`,
    addAll: (n: number) => `Tout reprendre (${n})`,
    note: "Ne sont proposés que des objets qui figuraient réellement sur des listes précédentes de cet endroit – pas une liste type, mais ta propre expérience.",
  },
  spotRating: {
    sectionAria: "Ton évaluation de cet emplacement",
    title: "Ton évaluation",
    subtitle:
      "Quatre critères séparés – tu sauras la prochaine fois pourquoi l'endroit t'a plu.",
    overall: (value: string, rated: number, total: number) =>
      `moy. ${value} (${rated} sur ${total} évalués)`,
    notRated: "Pas encore évalué – retoucher annule.",
    starAria: (stars: number, criterion: string) =>
      `${criterion} : ${stars} étoiles sur 5`,
    saveFailed: "L'évaluation n'a pas pu être enregistrée.",
    note: "Un critère peut rester vide. Qui n'est jamais resté dehors sous la pluie ne peut pas juger l'ombre – un trois inventé vaut moins qu'un vide honnête.",
    compareTitle: "Comparer par critère",
    compareAll: "Global",
    unrated: "–",
  },
  documents: {
    title: "Cartes & documents",
    subtitle:
      "Carte ACSI, sociétariat TCS, Camping Key – en photo dans l'app plutôt qu'en carte restée à la maison.",
    loginFeature: "tes cartes et documents",
    addLabel: "Nouvelle carte",
    addPlaceholder: "p. ex. Carte ACSI 2026",
    addButton: "Créer",
    expiryLabel: "Date d'expiration (facultatif)",
    expiryAria: (title: string) => `Date d'expiration de ${title}`,
    validUntil: (date: string) => `Valable jusqu'au ${date}`,
    expiresSoon: (date: string) => `Expire le ${date}`,
    expiredOn: (date: string) => `Expiré depuis le ${date}`,
    hint: "Crée la carte, puis téléverse sa photo. Les photos sont privées et visibles uniquement dans ton compte.",
    added: "Carte créée",
    empty:
      "Aucune carte pour l'instant. Crée la première ci-dessus – par exemple la carte ACSI ou celle du TCS.",
    deleteConfirm: "Supprimer la carte et sa photo ?",
    deleteAria: (title: string) => `Supprimer ${title}`,
    photoAdd: "Ajouter une photo ou un PDF",
    photoReplace: "Remplacer le fichier",
    photoUploading: "Téléversement …",
    photoSaved: "Photo enregistrée",
    photoFailed: "La photo n'a pas pu être téléversée.",
    photoTooLarge: "La photo est trop grande.",
    viewAria: (title: string) => `Afficher ${title} en grand`,
    viewerHint: "À montrer à la réception.",
  },
  twoFactor: {
    title: "Connexion à deux facteurs (TOTP)",
    intro:
      "Un deuxième facteur pour la connexion par mot de passe : une app d'authentification (Google Authenticator, Aegis, 1Password …) génère un code à usage unique toutes les 30 secondes. Les passkeys sont liées à l'appareil et n'ont pas besoin de code supplémentaire.",
    statusOn: "La double authentification est activée.",
    enableButton: "Configurer la double authentification",
    scanHint:
      "Scanne le code QR avec ton app d'authentification et confirme avec le premier code.",
    qrAlt: "Code QR pour l'app d'authentification",
    secretLine: "Ou à saisir à la main :",
    codeLabel: "Code de l'app",
    confirmButton: "Confirmer",
    enabled: "La double authentification est maintenant active.",
    recoveryTitle: "Codes de récupération",
    recoveryHint:
      "Conserve ces codes en lieu sûr (pas sur le téléphone). Chacun vaut une seule fois – c'est la seule porte d'entrée si tu perds le téléphone. Ils ne s'affichent que MAINTENANT.",
    recoveryCopy: "Copier les codes",
    recoveryCopied: "Codes copiés",
    disableLabel: "Pour désactiver : code de l'app (ou code de récupération)",
    disableButton: "Désactiver",
    disableHint: "Après désactivation, le mot de passe suffit à nouveau.",
    disabled: "La double authentification est désactivée.",
  },
  spotCompare: {
    title: "Comparer deux emplacements",
    hint: "L'aide à la décision avant de réserver – prix, distance, altitude, caractéristiques et ta note côte à côte. La comparaison des coûts de tous les emplacements se trouve dans les statistiques.",
    spotA: "Emplacement A",
    spotB: "Emplacement B",
    choose: "Choisir …",
    pickBoth:
      "Choisis un emplacement à gauche et un à droite, la comparaison apparaîtra.",
    rowHeader: "Critère",
    price: "Prix par nuit",
    distance: "Distance depuis chez toi",
    elevation: "Altitude",
    rating: "Ta note",
    ratingValue: (value: string, rated: number) =>
      rated === 1 ? `${value} ★ (1 critère)` : `${value} ★ (${rated} critères)`,
    none: "–",
  },
  sharedTrack: {
    loading: "Chargement de la randonnée …",
    notFoundTitle: "Randonnée introuvable",
    invalidLink:
      "Ce lien est invalide ou expiré. Demande-en un nouveau à la personne qui te l'a envoyé.",
    backHome: "Vers l'accueil",
    distance: "Distance",
    duration: "Durée",
    ascent: "Montée",
    descent: "Descente",
    download: "Télécharger en GPX",
    note: "Vue partagée – la carte et le profil proviennent de l'enregistrement. La série de points a été allégée pour l'aperçu.",
  },
  parking: {
    title: "Voiture",
    targetName: "Voiture",
    empty:
      "Aucun emplacement mémorisé. Une pression en descendant de voiture suffit.",
    park: "Garée ici",
    reparked: "Garée ailleurs",
    parkedToast: "Emplacement de la voiture mémorisé.",
    parkedSince: (time: string, duration: string) =>
      `Ici depuis ${time} – ${duration}.`,
    durationHours: (h: number, m: number) => `${h} h ${m} min`,
    durationMinutes: (m: number) => `${m} min`,
    limit: "Durée de stationnement :",
    limitNone: "sans",
    limitLabel: (minutes: number) =>
      minutes < 60 ? `${minutes} min` : `${minutes / 60} h`,
    remaining: (duration: string) => `Encore ${duration} de stationnement.`,
    expired: "Durée de stationnement dépassée.",
    noteLabel: "Note sur l'emplacement",
    notePlaceholder: "p. ex. niveau 3, rangée C",
    navigate: "Retour à la voiture",
    forgetAria: "Supprimer l'emplacement de la voiture",
    forgotten: "Emplacement de la voiture supprimé.",
  },
  tripTemplates: {
    button: "Depuis un modèle",
    title: "Voyage depuis un modèle",
    description:
      "Durée, liste de bagages et menu en une étape. Tout reste modifiable ensuite.",
    nights: (n: number) => (n === 1 ? "1 nuit" : `${n} nuits`),
    startLabel: "Arrivée",
    endLine: (end: string) => `Départ : ${end}`,
    spotLabel: "Emplacement",
    spotFree: "Saisir le lieu librement",
    locationLabel: "Lieu",
    locationPlaceholder: "p. ex. Camping Waldheim",
    placeMissing: "Choisis un emplacement ou saisis un lieu.",
    withPackList: "Créer la liste de bagages",
    withMenu: "Préremplir le menu",
    menuNote:
      "Sont préremplis les repas du soir de chaque nuit et le petit-déjeuner dès le deuxième jour. Les repas de midi restent libres – en voyage, on mange à midi ce que la journée offre.",
    create: "Créer le voyage",
    created: (end: string, meals: number, list: boolean) =>
      `Voyage créé jusqu'au ${end}${list ? ", liste de bagages créée" : ""}${
        meals > 0 ? `, ${meals} repas ajoutés` : ""
      }.`,
    createFailed: "Le voyage n'a pas pu être créé.",
  },
  departure: {
    title: "Meilleure heure de départ",
    intro: "Quand partir pour être là à l'heure d'arrivée – pauses comprises.",
    openButton: "Calculer le départ",
    loginNote: "Il faut être connecté pour cela.",
    noHome: "Ton domicile manque pour le calcul.",
    noHomeLink: "Le définir dans le profil",
    arrivalLabel: "Arrivée / check-in",
    directionAria: "Choisir le sens",
    directionOut: "Aller",
    directionBack: "Retour",
    homeArrivalLabel: "Être à la maison à",
    checkoutLabel: "Check-out sur place",
    departureAtCheckout: "Départ – impossible plus tard",
    checkoutNote: (checkout: string, arrival: string, daysLater: number) =>
      `Le camping veut la place à ${checkout}. Si tu pars à ce moment-là, tu seras à la maison à ${arrival}${
        daysLater > 0 ? " le lendemain" : ""
      } – plus tôt que prévu.`,
    profileLabel: "Qui voyage ?",
    profiles: {
      keine: "Sans pauses",
      erwachsene: "Adultes (toutes les 3 h)",
      kinder: "Avec enfants (toutes les 2 h)",
      kleinkinder: "Avec tout-petits (toutes les 1,5 h)",
    },
    departureLabel: "Départ",
    departureDayBefore: (days: number) =>
      days === 1 ? "Départ – la veille" : `Départ – ${days} jours avant`,
    driveLine: (distance: string, estimated: boolean) =>
      estimated
        ? `Trajet (${distance} à vol d'oiseau, estimé)`
        : `Trajet (${distance} par la route)`,
    breaksLine: (count: number, each: number) =>
      count === 0
        ? "Aucune pause nécessaire"
        : count === 1
          ? `1 pause de ${each} min`
          : `${count} pauses de ${each} min`,
    bufferLine: "Marge pour la barrière et l'enregistrement",
    totalLine: "Total en route",
    stopsLine: (times: string) => `Pauses vers ${times}.`,
    routing: "Calcul de l'itinéraire …",
    note: "La distance et la durée proviennent du calcul d'itinéraire par la route (OpenStreetMap). Bouchons, chantiers et attentes à la frontière s'y ajoutent.",
    noteEstimate:
      "Sans réseau, pas de calcul d'itinéraire : ces chiffres sont estimés à vol d'oiseau (avec un facteur de détour) et peuvent être nettement à côté – surtout en montagne.",
    noteTraffic:
      "Distance et durée proviennent du calcul d'itinéraire de Google – avec la prévision de trafic pour cette heure de la journée. Chantiers et attentes à la frontière s'y ajoutent toujours.",
  },
  officialWarnings: {
    sectionAria: "Alertes météo officielles",
    badge: "Officiel",
    issuedFor: (issuer: string, area: string) =>
      `${issuer} émet une alerte pour ${area}.`,
    until: (time: string) => `Valable jusqu'à ${time}`,
    source: (issuer: string, source: string) =>
      `Alertes officielles : ${issuer}, via ${source}.`,
  },
  passport: {
    personSection: "Réglages de la personne",
    familyMemberToggle: (name: string) =>
      `${name} compte pour le passeport familial`,
    familyMemberHint:
      "Sans coche, cette personne n’empêche pas le tampon familial quand elle manque – elle garde son propre passeport.",
    familyStrictHint:
      "Le passeport familial ne tamponne que les voyages où toute la famille était là. Qui était là se règle en modifiant le voyage (« Qui vient ? »).",
    editAtTripHint:
      "Qui était là se règle en modifiant le voyage – section « Qui vient ? ».",
    familyEmpty:
      "Pas encore de voyage avec toute la famille – le passeport familial ne tamponne que ceux-là. Les passeports individuels comptent quand même.",
    personEmpty: (person: string) =>
      `${person} n’a encore participé à aucun voyage. Qui était là se règle en modifiant le voyage.`,
    title: "Passeport de voyage",
    intro:
      "Un tampon pour chaque camping visité. Les tampons viennent de tes voyages – ce qui est saisi est saisi.",
    noRank: "Pas encore de tampon",
    summary: (places: number, nights: number) =>
      `${places === 1 ? "1 camping" : `${places} campings`} · ${nights === 1 ? "1 nuit" : `${nights} nuits`}`,
    toNext: (missing: number, title: string) =>
      missing === 1
        ? `Encore 1 camping jusqu'à « ${title} »`
        : `Encore ${missing} campings jusqu'à « ${title} »`,
    nights: (count: number) => (count === 1 ? "1 nuit" : `${count} nuits`),
    stampAria: (place: string, visits: number) =>
      `Tampon ${place}, visité ${visits} fois`,
    empty:
      "Pas encore de tampon. Saisis un voyage avec le nom du camping – il apparaîtra ici.",
    family: "Famille",
    personLabel: "Passeport de",
    personGroupAria: "Choisir la personne",
    addPerson: "Ajouter une personne",
    addPersonPlaceholder: "Prénom",
    addPersonSave: "Créer",
    addPersonHint:
      "Ce sont les mêmes personnes que dans le mode famille – celles qui y figurent apparaissent ici.",
    noPlaceEmpty:
      "Les voyages comptent, mais il leur manque le nom du lieu – un tampon a besoin d’un lieu. Ajoute un camping ou un lieu au voyage et le tampon apparaîtra.",
    print: "Imprimer le passeport",
    note: "Les tampons proviennent des voyages du carnet ; rien n'est saisi deux fois. Chaque camping reçoit, à partir de son nom, la même forme, la même couleur et la même inclinaison – identiques sur chaque appareil.",
  },
  drill: {
    title: "Exercice d'urgence",
    intro:
      "En cas réel, on se rappelle ce qu'on a déjà fait – pas ce qu'on a entendu une fois.",
    ageLabel: "Âge de l'enfant",
    ageYears: (years: number) => `${years} ans`,
    stepsTitle: "Voilà comment faire, dans l'ordre",
    mistakesTitle: "À ne pas faire",
    practiceTitle: "Comment s'exercer sur place",
    questionTitle: "Question de contrôle",
    right: "Juste.",
    wrong: "Pas tout à fait.",
    markDone: "Exercé",
    answerFirst: "Réponds d'abord correctement à la question.",
    lastPracticed: (date: string) => `dernier exercice le ${date}`,
    neverPracticed: "jamais exercé",
    openCount: (count: number) =>
      count === 1 ? "1 exercice à refaire" : `${count} exercices à refaire`,
    allDone: "Tout est exercé – à refaire dans six mois.",
    note: "Seule la date de chaque exercice est enregistrée, sur cet appareil. Ni noms ni numéros : ce qu'un enfant doit savoir par cœur, on l'exerce avec lui plutôt que de le stocker dans une app. Après six mois, un exercice est à refaire – les enfants grandissent et le camping sera un autre.",
  },
  quickBar: {
    title: "Barre d'accès rapide",
    intro:
      "Les quatre emplacements au centre de la barre du bas, c'est toi qui les choisis.",
    slotAria: (slot: number) => `Module pour l'emplacement ${slot}`,
    fixed:
      "« Accueil » et « SOS » restent aux extrémités : l'accueil est le chemin de retour vers tout le reste, et le bouton SOS, on le cherche justement quand on ne peut plus réfléchir.",
    reset: "Rétablir la valeur par défaut",
  },
  today: {
    title: "Aujourd'hui",
    noTrip:
      "Aucun voyage en cours. Dès qu'un voyage commence, ta journée s'affiche ici.",
    toModules: "Tous les modules",
    dayOf: (day: number, total: number) => `Jour ${day} sur ${total}`,
    nightsLeft: (nights: number) =>
      nights === 1 ? "encore 1 nuit" : `encore ${nights} nuits`,
    departureToday: "Départ aujourd'hui",
    weather: "Météo",
    menu: "Menu",
    shopping: "Liste de courses",
    mealsTitle: "Au menu aujourd'hui",
    mealsEmpty: "Rien de prévu pour aujourd'hui.",
    mealsLink: "Ouvrir le menu",
    mealUnknown: "Prévu",
    tasksTitle: "Encore à faire",
    tasksEmpty: "Rien en attente. Profite de la journée.",
    tasksLink: "Vers le tableau",
    weatherLine: (min: number, max: number, label: string) =>
      label ? `${min}–${max} °C · ${label}` : `${min}–${max} °C`,
    snowDepthLine: (cm: number) => `Hauteur de neige : environ ${cm} cm`,
    snowfallLine: (cm: number) => `Neige fraîche aujourd’hui : env. ${cm} cm`,
    expenseButton: "Saisir une dépense",
    expenseHint: "Ajoutée à la caisse de ce voyage avec la date du jour.",
    expenseAmountLabel: "Montant",
    expenseNotePlaceholder: "Pour quoi ? (facultatif)",
    expenseSave: "Enregistrer",
    expenseSaved: "Enregistrée dans la caisse du voyage",
    expenseInvalid: "Indique un montant valable",
    choresTitle: "Tâches du jour",
    choresEmpty: "Rien n’est réparti pour aujourd’hui.",
    choresToggleAria: (title: string) => `Cocher ${title}`,
    choresAll: "Toutes les tâches",
    expiryTitle: "Bientôt périmé",
    expiryLink: "Vers la glacière",
    journal: "Écrire dans le journal",
    startSetting: "Démarrer sur « Aujourd'hui » pendant un voyage",
    note: "Le saut se fait une fois à l'ouverture de l'app – si tu touches ensuite « Accueil », tu obtiens les tuiles sans être renvoyé ici.",
  },
  tripHistory: {
    title: "Historique des modifications",
    toggleAria: (trip: string) => `Afficher l'historique de ${trip}`,
    count: (count: number) => (count === 1 ? "1 entrée" : `${count} entrées`),
    empty: "Il ne s'est encore rien passé ici.",
    someone: "Quelqu'un",
    line: (who: string, area: string, action: string, count: number) =>
      count > 1
        ? `${who} a ${action} ${count}× quelque chose dans «${area}»`
        : `${who} a ${action} «${area}»`,
    andMore: (count: number) => `et ${count} de plus`,
    note: "On note QUI a modifié QUOI et QUAND, dans quel domaine – pas l'ancienne et la nouvelle valeur. Ce que quelqu'un fait coup sur coup tient sur une ligne avec le nombre : douze articles sur la liste de courses ne doivent pas enterrer tout le reste.",
  },
  packExperience: {
    title: "D'après les voyages précédents",
    missingHint: "Cela a déjà manqué une fois :",
    unusedHint: "Cela est parti plusieurs fois sans servir :",
    unusedCount: (times: number) => `${times}× pas utilisé`,
    addAria: (name: string) => `Ajouter « ${name} » à la liste`,
    added: (name: string) => `« ${name} » ajouté.`,
  },
  sitePlan: {
    title: "Plan du camping",
    empty:
      "Pas encore de plan. Photographie le plan à la réception – la prochaine fois, tu sauras où tout se trouve.",
    add: "Téléverser le plan",
    replace: "Remplacer le plan",
    remove: "Supprimer",
    uploading: "Envoi en cours …",
    uploaded: "Plan enregistré.",
    uploadFailed: "Échec de l’envoi. Réessaie.",
    readFailed: "Impossible de lire l’image.",
    deleteConfirm: "Vraiment supprimer le plan ?",
    deleted: "Plan supprimé.",
    alt: (name: string) => `Plan du camping ${name}`,
    openAria: (name: string) => `Afficher le plan du camping ${name} en grand`,
  },
  legal: {
    imprintTitle: "Mentions légales",
    privacyTitle: "Déclaration de confidentialité",
    cookieText:
      "ReiseKompass n’utilise que des cookies techniquement nécessaires et le stockage local – pas de traçage, pas de publicité. Détails :",
    cookieOk: "Compris",
    cookieAria: "Information sur les cookies",
  },
  rewards: {
    title: "Objectifs de récompense",
    hint: "Échanger les points de corvées : fixe le prix d’un objectif – la barre montre le chemin restant.",
    availableLine: (name: string, points: number) =>
      `${name} a ${points} point${points === 1 ? "" : "s"} à échanger.`,
    empty:
      "Pas encore d’objectifs. Crée le premier – par exemple « glace au kiosque ».",
    pointsLine: (points: number) => `${points} pts`,
    redeem: "Échanger",
    redeemed: "Échangé !",
    removeAria: (title: string) => `Supprimer l’objectif « ${title} »`,
    progressAria: (name: string, title: string, percent: number) =>
      `${name} est à ${percent} % de « ${title} »`,
    titlePlaceholder: "p. ex. glace au kiosque",
    pointsPlaceholder: "Points",
    addAria: "Ajouter un objectif",
    formError: "Indique un titre et des points supérieurs à zéro.",
    historyTitle: "Échangé",
    historyLine: (name: string, title: string, points: number, date: string) =>
      `${name} : « ${title} » pour ${points} pts le ${date}`,
    reachedToast: (name: string, title: string) =>
      `${name} a maintenant assez de points pour « ${title} » !`,
  },
  nextTime: {
    title: "La prochaine fois",
    empty:
      "Rien de noté pour l’instant. Que faut-il changer à la prochaine visite ?",
    placeholder: "p. ex. rallonge 25 m",
    add: "Noter",
    removeAria: (note: string) => `Supprimer la note «${note}»`,
    hint: "La note réapparaît d’elle-même dès que tu planifies le prochain voyage vers ce camping. Ce qui est réglé, tu le supprimes.",
    reminderTitle: (place: string) =>
      `La prochaine fois à ${place} – tes notes de la dernière visite :`,
    reminderLink: "Vers le dossier du camping",
  },
  condensation: {
    title: "Rosée pendant la nuit",
    high: (time: string) =>
      `Nuit claire et calme : vers ${time}, l’air atteint le point de rosée – la tente sera probablement mouillée.`,
    possible: (time: string) =>
      `L’air s’approche du point de rosée (vers ${time}) – de la rosée sur la tente est possible.`,
    advice:
      "Avant de plier le matin, laisse d’abord sécher – la fenêtre sèche ci-dessous aide à planifier.",
    note: "Estimation à partir de la température, de l’humidité, des nuages et du vent. Les creux, prairies et abords de ruisseaux sont plus humides que ne le sait la prévision.",
  },
  spotPrint: {
    kicker: "Dossier du camping",
    docTitle: (name: string) => `Dossier : ${name}`,
    openButton: "Imprimer le dossier",
    notFound: "Ce camping est introuvable.",
    coords: (lat: string, lon: string) => `${lat}, ${lon}`,
    elevation: (m: number) => `${m} m d'altitude`,
    contactTitle: "Contact et arrivée",
    phoneLabel: "Réception",
    checkinLabel: "Check-in/-out",
    parcelLabel: "Parcelle",
    tariffsTitle: "Prix",
    basePrice: (amount: string) => `Prix de base par nuit : ${amount}`,
    attributesTitle: "Équipements",
    nextTimeTitle: "La prochaine fois",
    noteTitle: "Notes",
    planTitle: "Plan du camping",
  },
  choresPrint: {
    kicker: "Mode famille",
    title: "Plan des corvées de la semaine",
    docTitle: "Plan des corvées",
    openButton: "Imprimer le plan",
    choreColumn: "Corvée",
    empty: "Aucune corvée ou personne enregistrée.",
    note: "La répartition suit la même rotation que dans l'app – prévisible, sans hasard. On coche sur papier.",
  },
  avalanche: {
    line: (level: number, label: string) =>
      `Danger d'avalanche : degré ${level} (${label})`,
    note: "Source : bulletin d'avalanches du SLF – Suisse uniquement, sans garantie.",
    noteEuregio:
      "Source : bulletin d'avalanches Euregio (avalanche.report) – valable pour le Tyrol, le Haut-Adige et le Trentin, sans garantie.",
  },
  winterKnowledge: {
    title: "Pistes & avalanches",
    subtitle:
      "Les 10 règles de conduite FIS et les bases du danger d'avalanche – à consulter, aussi hors ligne.",
    offlineNote:
      "Tout le contenu est disponible hors ligne – même sans réseau en montagne.",
    fisTitle: "Les 10 règles de conduite FIS",
    fisIntro:
      "Résumées dans leur esprit – elles valent sur chaque piste, à ski comme en snowboard.",
    avalancheTitle: "Bases sur les avalanches",
    avalancheIntro:
      "Met de l'ordre dans les notions pour le terrain à côté des pistes – et ne remplace volontairement aucun cours d'avalanche.",
    sourceNote:
      "Règles FIS reformulées d'après fis-ski.com ; connaissances avalanches selon les bases du SLF (whiterisk.ch). Qui sort régulièrement des pistes a sa place dans un cours d'avalanche – aucune app ne le remplace.",
  },
  grilling: {
    title: "Grillades & cuissons",
    subtitle:
      "Températures à cœur, test de braise et les règles de base qui font la différence – à consulter au gril.",
    offlineNote:
      "Tout le contenu est disponible hors ligne – même au gril sans réseau.",
    tempsTitle: "Températures à cœur",
    tempsIntro:
      "Valeurs indicatives à cœur – un thermomètre bat toute règle empirique. Volaille et viande hachée toujours bien cuites.",
    tipsTitle: "Règles de base au gril",
    tipsIntro: "Ce qui sépare le carbonisé du parfait.",
    sourceNote:
      "Valeurs selon la pratique culinaire courante et les recommandations de l'OSAV en hygiène alimentaire – sans garantie.",
  },
  fireGuide: {
    title: "Guide du feu",
    subtitle:
      "Monter, allumer, entretenir et bien éteindre un feu de camp – pas à pas.",
    offlineNote:
      "Tout le contenu est disponible hors ligne – même au foyer sans réseau.",
    listTitle: "De l'amadou à l'extinction",
    listIntro: "Les étapes dans l'ordre où elles se posent au foyer.",
    linkBans: "Interdictions de feu (module météo)",
    linkWood: "Calculateur de bois",
    sourceNote:
      "Recommandations selon la pratique des services forestiers et des pompiers – les interdictions locales et le règlement du camping priment toujours.",
  },
  etiquette: {
    title: "Savoir-vivre au camping",
    subtitle:
      "Heures de repos, eaux grises, chiens, limites d'emplacement – les règles du vivre-ensemble au camping.",
    offlineNote: "Tout le contenu est disponible hors ligne.",
    listTitle: "Les dix règles du vivre-ensemble",
    listIntro:
      "La plupart ne figurent dans aucun règlement – et font pourtant la différence entre bons et mauvais voisins.",
    sourceNote:
      "Compilé à partir de règlements de camping courants et des usages – le règlement du camping concerné prime.",
  },
  waterSafety: {
    title: "Règles de baignade & drapeaux",
    subtitle:
      "Les six règles de baignade SLRG et la signification des drapeaux de plage – à consulter, aussi hors ligne.",
    offlineNote:
      "Tout le contenu est disponible hors ligne – même sur une plage sans réseau.",
    rulesTitle: "Les 6 règles de baignade",
    rulesIntro:
      "Reformulées d'après les règles de baignade de la Société Suisse de Sauvetage SSS.",
    flagsTitle: "Drapeaux de plage",
    flagsIntro:
      "Comment les services de sauvetage signalent en bord de mer – certains pays diffèrent ; dans le doute, l'affichage sur place fait foi.",
    sourceNote:
      "Règles de baignade reformulées d'après la SSS (slrg.ch) ; drapeaux selon la pratique internationale de sauvetage (ILS). La signalisation sur la plage prime toujours.",
  },
  feedback: {
    title: "Feedback & signaler une erreur",
    intro:
      "Qu'est-ce qui coince, manque ou agace ? Le message va directement à la boîte de l'exploitant – avec ton adresse e-mail pour les questions.",
    placeholder: "Décris brièvement ce que tu as vécu ou souhaité …",
    send: "Envoyer",
    sent: "Merci ! Le message est en route.",
    mailNotConfigured: "L'envoi d'e-mails n'est pas configuré sur le serveur.",
    rateLimited: "Assez pour cette heure – réessaie plus tard.",
    note: "Au moins 10 caractères. Sont transmis le message, le nom et l'adresse e-mail.",
  },
  connections: {
    title: "TP pour le trajet",
    subtitle:
      "Les prochaines correspondances depuis chez toi jusqu'ici – de l'horaire suisse ouvert.",
    subtitleAtPlace: (place: string) =>
      `Les prochaines correspondances depuis chez toi vers ${place} – de l'horaire suisse ouvert.`,
    noHome: "Il manque ton domicile pour la recherche.",
    noHomeLink: "Le définir dans le profil",
    empty:
      "Aucune correspondance trouvée – l'horaire couvre la Suisse et le trafic frontalier.",
    durationLine: (min: number) =>
      min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`,
    transfersLine: (n: number) =>
      n === 0 ? "direct" : n === 1 ? "1 changement" : `${n} changements`,
    source: "Source : transport.opendata.ch – sans garantie.",
  },
  poi: {
    pharmacies: {
      title: "Pharmacies à proximité",
      subtitle: "Depuis OpenStreetMap – horaires si renseignés, sans garantie.",
      unnamed: "Pharmacie",
      empty: (radius: string) =>
        `Aucune pharmacie répertoriée dans un rayon de ${radius}.`,
    },
    laundry: {
      title: "Laveries à proximité",
      subtitle:
        "Laveries et pressings d’OpenStreetMap – pour le jour de lessive en voyage.",
      unnamed: "Laverie",
      empty: (radius: string) =>
        `Aucune laverie répertoriée dans un rayon de ${radius}.`,
    },
    bikeShops: {
      title: "Magasins & ateliers vélo",
      subtitle:
        "Depuis OpenStreetMap – « Service » signifie que la réparation est renseignée.",
      unnamed: "Magasin de vélos",
      empty: (radius: string) =>
        `Aucun magasin de vélos répertorié dans un rayon de ${radius}.`,
    },
    indoor: {
      title: "Jour de pluie : musées & piscines à proximité",
      subtitle:
        "Il va pleuvoir aujourd'hui – ceci reste possible. D'OpenStreetMap, sans garantie.",
      unnamed: "Lieu couvert",
      empty: (radius: string) =>
        `Rien de convenable n'est répertorié dans un rayon de ${radius}.`,
    },
    winterSpots: {
      title: "Remontées & pistes de fond à proximité",
      subtitle:
        "Remontées mécaniques et pistes de fond nommées d’OpenStreetMap – le départ de la journée de neige.",
      unnamed: "Remontée",
      empty: (radius: string) =>
        `Aucune remontée ni piste de fond répertoriée dans un rayon de ${radius}.`,
    },
    radiusLabel: "Rayon :",
    radiusGroupAria: "Choisir le rayon de recherche",
    loading: "Recherche en cours …",
    loadFailed: "La recherche a échoué. Réessaie plus tard.",
    navButton: "Itinéraire",
    navAria: (title: string) => `Itinéraire vers ${title}`,
    source: "Source : OpenStreetMap – exhaustivité sans garantie.",
    beaches: {
      title: "Plages à proximité",
      subtitle:
        "Plages naturelles et plages aménagées d'OpenStreetMap – pour aller à l'eau aujourd'hui.",
      unnamed: "Plage",
      empty: (radius: string) =>
        `Aucune plage enregistrée dans un rayon de ${radius}.`,
    },
    water: {
      title: "Eau potable à proximité",
      subtitle:
        "Fontaines et robinets d'eau potable pour remplir la gourde – d'OpenStreetMap.",
      unnamed: "Fontaine",
      empty: (radius: string) =>
        `Aucun point d'eau potable enregistré dans un rayon de ${radius}.`,
    },
    chargers: {
      title: "Bornes de recharge à proximité",
      subtitle:
        "Points de recharge pour voitures électriques d'OpenStreetMap – exploitant et places, si renseignés.",
      unnamed: "Borne de recharge",
      empty: (radius: string) =>
        `Aucune borne de recharge enregistrée dans un rayon de ${radius}.`,
    },
    defis: {
      title: "Défibrillateurs à proximité",
      subtitle:
        "Défibrillateurs publics d'OpenStreetMap – l'indication de lieu dit où se trouve l'appareil. En cas d'urgence, appelle d'abord le 144.",
      unnamed: "Défibrillateur",
      empty: (radius: string) =>
        `Aucun défibrillateur enregistré dans un rayon de ${radius}.`,
    },
  },
  winter: {
    title: "Gel et neige",
    frostLine: (nights: string) => `Gel en vue : ${nights}.`,
    frostAdvice:
      "Vider le réservoir d'eau, les tuyaux et les bidons ou les stocker hors gel.",
    snowLine: (m: number) =>
      `La limite pluie-neige descend vers ${m} m d'altitude.`,
    snowDepth: (cm: number) => `Hauteur de neige au sol : environ ${cm} cm.`,
    note: "D'après la prévision pour ce lieu – les cuvettes sont souvent plus froides.",
  },
  weatherTurn: {
    title: "Le temps bascule demain",
    windLine: (kmh: number) =>
      `Demain, rafales jusqu'à ${kmh} km/h – nettement plus qu'aujourd'hui.`,
    rainLine: (mm: number) =>
      `Demain, environ ${mm} mm de pluie – nettement plus qu'aujourd'hui.`,
    coldLine: (drop: number) =>
      `Demain, environ ${drop} °C de moins qu'aujourd'hui.`,
    windAdvice:
      "Retendre les haubans ce soir, vérifier les sardines, ranger le store et tout ce qui traîne.",
    rainAdvice:
      "Vérifier haubans et écoulement, mettre à l'abri ce qui craint l'eau.",
    coldAdvice: "Préparer couches chaudes et sacs de couchage.",
    note: "Comparaison des prévisions du jour et du lendemain – un basculement, pas une alerte tempête.",
  },
  homecoming: {
    title: (trip: string) => `De retour de « ${trip} » ?`,
    intro: "Trois gestes tant que tu t'en souviens :",
    stepTent: "Faire sécher la tente et les bâches",
    stepTentAria: "Cocher le séchage de la tente",
    dryingDay: (day: string) =>
      `Meilleur temps de séchage à la maison : ${day}.`,
    stepReview:
      "Remplir le bilan : qu'est-ce qui a manqué, qu'est-ce qui était en trop ?",
    stepNextTime: "Noter « la prochaine fois » sur le camping",
    notePlaceholder: "p. ex. rallonge de 25 m",
    noteSave: "Noter",
    dismissAria: "Masquer le rappel de retour pour ce séjour",
  },
  campfire: {
    stateOk: "Feu de camp : rien ne s'y oppose.",
    stateCaution: "Feu de camp : seulement avec prudence.",
    stateNo: "Feu de camp : mieux vaut pas aujourd'hui.",
    reasonBan: (title: string) =>
      `Niveau officiel « ${title} » – une interdiction de feu est probable.`,
    reasonDanger: (title: string) => `Niveau officiel « ${title} ».`,
    reasonStrongWind: (kmh: number) =>
      `Rafales jusqu'à ${kmh} km/h – un feu ouvert n'est pas une bonne idée.`,
    reasonSparkWind: (kmh: number) =>
      `Rafales jusqu'à ${kmh} km/h – les étincelles volent dans le sec d'à côté.`,
    reasonNoDanger:
      "Hors de Suisse, il n'y a pas de niveau de danger officiel – ce verdict ne connaît que le vent.",
    note: "Le règlement du camping a le dernier mot. Fait foi :",
    portal: "waldbrandgefahr.ch",
  },
  tripOffline: {
    title: "Préparer pour la route",
    intro:
      "Charge tout pour ce séjour sur cet appareil : emplacement, liste de bagages, menus avec recettes et cartes autour du camping.",
    start: "Préparer maintenant",
    again: "Recharger",
    running: "Chargement …",
    lastRun: (when: string) => `Données au ${when}.`,
    autoNote:
      "Peu avant le voyage, l’app actualise elle-même les données à l’ouverture – les cartes restent telles quelles.",
    stepTrip: "Séjour, emplacement et compagnons",
    stepPacking: "Liste de bagages",
    stepMenu: "Menus et recettes",
    stepMap: "Cartes autour de l'emplacement",
    stepFailed: "Échec – sans réseau, cette partie manquera.",
    noList: "Aucune liste de bagages liée.",
    noSpot: "Aucun emplacement lié.",
    noTileCache: "Cet appareil ne peut pas stocker de cartes.",
    tileProgress: (done: number, total: number) =>
      `${done} sur ${total} tuiles`,
    tilesStored: (count: number) => `${count} tuiles enregistrées`,
    note: "Ce qui est écrit ici est honnête : une étape rouge manquera vraiment hors ligne. Et le navigateur décide seul de ce qu'il jette quand la place manque – avant un long voyage, un second passage vaut la peine.",
  },
  pitchCost: {
    title: "Estimer le coût de l'emplacement",
    hint: (nights: number) =>
      nights === 1
        ? "1 nuit. Indique combien vous êtes."
        : `${nights} nuits. Indique combien vous êtes.`,
    tariffGroupAria: "Choisir le tarif",
    countAria: (label: string) => `Nombre de ${label}`,
    nightlyOnly:
      "Aucun tarif saisi pour cet emplacement – le calcul utilise le prix par nuit.",
    breakdown: (perNight: string, nights: number) =>
      `${perNight} par nuit × ${nights}`,
    sourceNightly: "d'après le prix par nuit",
    nothingYet: "Rien à calculer encore : indique le nombre.",
    oneOffPart: (amount: string) => `plus forfait unique ${amount}`,
    seasonPart: (name: string, nights: number, perNight: string) =>
      `${name} : ${nights} nuit${nights === 1 ? "" : "s"} × ${perNight}`,
    seasonSplitNote:
      "Le séjour s'étend sur plusieurs périodes tarifaires – chaque nuit est comptée au tarif valable ce jour-là.",
    addToExpenses: "Dans la caisse",
    foreignCurrency: (currency: string) =>
      `La caisse de voyage est tenue en CHF – merci de saisir les montants en ${currency} à la main.`,
    added: "Coût de l'emplacement enregistré.",
    expenseLabel: (nights: number) =>
      nights === 1 ? "Emplacement, 1 nuit" : `Emplacement, ${nights} nuits`,
    meFallback: "Moi",
    note: "Une estimation, pas une facture : la réception compte souvent la taxe de séjour, le chien et l'électricité autrement. Rien n'est enregistré sans que tu appuies.",
  },
  altitudeCooking: {
    headline: (m: number, boiling: number) =>
      `À ${m} m, l'eau bout à ${boiling} °C.`,
    estimate: (base: number, adjusted: number) =>
      `Compte environ ${adjusted} minutes au lieu de ${base} – valeur indicative, pas mesurée.`,
    pressureCooker:
      "À cette altitude, l'autocuiseur vaut la peine pour tout ce qui mijote longtemps.",
    source: (spot: string) => `Altitude de ${spot}, ton séjour en cours.`,
    guide:
      "Vaut pour tout ce qui cuit dans l'eau – pas pour la poêle ni le four.",
  },
  dryWindow: {
    title: "Créneau au sec",
    lengthGroupAria: "Combien de temps te faut-il pour monter ou démonter ?",
    hours: (count: number) => (count === 1 ? "1 heure" : `${count} heures`),
    tooShort: "Les prévisions ne suffisent pas encore pour ce créneau.",
    verdictGood: "Ça va : assez sec et calme pour monter et démonter.",
    verdictUsable: "Possible – mais compte avec un peu d'humidité ou de vent.",
    verdictPoor:
      "Pas de bon créneau. Le meilleur parmi des mauvais reste mauvais.",
    rainLabel: "Pluie dans le créneau",
    rainNone: "aucune pluie annoncée",
    rainAmount: (mm: number) => `${mm} mm`,
    gustsLabel: "Rafale la plus forte",
    gusts: (kmh: number) => `${kmh} km/h`,
    gustWarning:
      "Avec de telles rafales, on ne monte pas une tente seul – attends ou cherche un abri du vent.",
    note: "On cherche le meilleur créneau continu dans les 48 prochaines heures ; à égalité, le plus tôt l'emporte. Le vent compte par les RAFALES, pas par la moyenne – une tente s'envole dans la rafale.",
  },
  weekendPicker: {
    title: "Où aller ce week-end ?",
    show: "Comparer",
    range: (from: string, to: string) => `Samedi ${from} à dimanche ${to}`,
    sortWeather: "Par météo",
    sortTravel: "Par temps de trajet",
    dry: (score: number) => `sec ${score}`,
    warmth: (score: number) => `chaud ${score}`,
    wind: (score: number) => `calme ${score}`,
    noForecast: "Aucune prévision disponible.",
    failed: "Le service météo ne répond pas pour le moment.",
    capped: (shown: number, total: number) =>
      `Comparaison des ${shown} premiers emplacements sur ${total}.`,
    note: "La note pondère la pluie à 55 %, la température à 30 % et le vent à 15 % – la pluie décide si l'on part. Le temps de trajet n'est PAS inclus ; il figure à côté, car toi seul sais ce que vaut une heure de route. Et tout ceci est une prévision, pas une promesse.",
  },
  pitchSketch: {
    title: "Croquis de l'emplacement",
    empty:
      "Pas encore de croquis. À la deuxième visite, on sait de nouveau comment ça tenait.",
    create: "Créer un croquis",
    edit: "Modifier",
    hint: "Choisis un objet, puis touche l'endroit voulu. Tout s'aligne sur le demi-mètre.",
    addTitle: "Ajouter",
    full: (max: number) => `Plus de ${max} objets, ce n'est plus un croquis.`,
    itemWidth: "Largeur (m)",
    itemDepth: "Profondeur (m)",
    pitchWidth: "Largeur de l'emplacement (m)",
    pitchDepth: "Profondeur de l'emplacement (m)",
    rotate: "Pivoter",
    remove: "Retirer",
    moveLeft: "← gauche",
    moveRight: "droite →",
    moveUp: "↑ devant",
    moveDown: "derrière ↓",
    edgeLeft: "Distance à gauche",
    edgeRight: "Distance à droite",
    edgeTop: "Distance devant",
    edgeBottom: "Distance derrière",
    nearest: "Objet le plus proche",
    alone: "seul",
    overlap: (a: string, b: string) => `${a} et ${b} se chevauchent.`,
    areaLine: (width: string, depth: string, used: number, total: number) =>
      `Emplacement ${width} × ${depth} – ${used} de ${total} m² occupés.`,
    sketchAria: (width: string, depth: string, count: number) =>
      `Croquis de l'emplacement, ${width} sur ${depth}, ${count} objets`,
    itemAria: (name: string, width: string, depth: string) =>
      `${name}, ${width} sur ${depth}`,
    saved: "Croquis enregistré.",
  },
  tripReview: {
    noCategory: "Sans catégorie",
    missingCategoryAria: "Catégorie de l’objet manquant",
    title: "Bilan",
    toggleAria: (trip: string) => `Ouvrir le bilan de ${trip}`,
    intro:
      "Deux questions qui améliorent la prochaine liste. Rien n'est supprimé ni ajouté automatiquement – l'app montrera simplement ce qui s'est remarqué.",
    unusedTitle: "Pas utilisé",
    noList: "Aucune liste de bagages n'est liée à ce voyage.",
    emptyList: "La liste est vide.",
    missingTitle: "A manqué",
    missingPlaceholder: "p. ex. pinces à linge",
    missingAdd: "Ajouter",
    missingRemove: (name: string) => `Retirer « ${name} »`,
    save: "Enregistrer le bilan",
    saved: "Bilan enregistré.",
    note: "Une fois inutilisé ne veut rien dire – la crème solaire d'un juillet pluvieux repart l'an prochain. Ce n'est qu'à partir de la deuxième fois que cela devient un indice. Ce qui a manqué est proposé tout de suite.",
  },
  turnaround: {
    stormForecast: (clock: string) => `Orage annoncé dès ${clock}.`,
    stormPropensity: (clock: string) =>
      `Air instable dès ${clock} – orages locaux possibles.`,
    stormBeatsSunset:
      "Alors la limite, c'est le nuage, pas le soleil – prévois le retour avant.",
    title: "Heure de demi-tour",
    shapeLabel: "Forme du parcours",
    outAndBack: "Aller-retour",
    loop: "Boucle",
    turnaroundLabel: "Faire demi-tour au plus tard",
    latestStartLabel: "Départ au plus tard",
    left: (duration: string) => `encore ${duration}`,
    overdue: "Fais demi-tour",
    tooLong: (duration: string) =>
      `La journée ne suffit plus pour tout le parcours (${duration}).`,
    bufferLabel: "Marge avant le coucher du soleil (minutes)",
    sunsetAt: (time: string) => `Coucher du soleil ${time}`,
    note: "Calculé depuis le coucher du soleil au point de départ. En forêt et dans la vallée, il fait nuit bien plus tôt – c'est à cela que sert la marge.",
  },
  trash: {
    title: "Corbeille",
    intro: (days: number) =>
      `Ce que tu supprimes reste ${days} jours. D'ici là, un clic suffit pour le récupérer.`,
    empty: "Rien de supprimé. C'est très bien ainsi.",
    restore: "Restaurer",
    restored: "Restauré",
    restoreFailed: "Cela n'a pas fonctionné. Recharge la page.",
    itemCount: (count: number) =>
      count === 1 ? "1 élément lié" : `${count} éléments liés`,
    deletedOn: (date: string) => `supprimé le ${date}`,
    daysLeft: (days: number) =>
      days === 1 ? "encore 1 jour" : `encore ${days} jours`,
    removeAria: (label: string) => `Supprimer définitivement ${label}`,
    removeConfirm: (label: string) =>
      `Supprimer «${label}» définitivement ? Après, c'est perdu.`,
    emptyAll: "Vider la corbeille",
    emptyConfirm: (count: number) =>
      count === 1
        ? "Supprimer définitivement cet élément ?"
        : `Supprimer définitivement les ${count} éléments ?`,
    note: (days: number) =>
      `La restauration réutilise le même numéro qu'avant – les liens partagés et les QR codes refonctionnent ensuite. Les photos restent sur le serveur aussi longtemps que l'élément lui-même ; restaurer un voyage sans ses images ne serait pas une restauration. Après ${days} jours, tout est effacé définitivement, fichiers compris.`,
    profileLink: "Ouvrir la corbeille",
  },
  meteorLog: {
    title: "Carnet d'étoiles filantes",
    intro:
      "Compter une nuit : à chaque étoile filante, touche la direction d'où elle venait – l'heure et la direction sont notées.",
    startHint:
      "Allonge-toi, laisse tes yeux s'habituer au noir pendant vingt minutes, puis lance le comptage.",
    start: "Démarrer la nuit",
    tonight: (names: string) => `Actifs cette nuit : ${names}`,
    observed: (duration: string) => `${duration} d'observation`,
    rate: (perHour: number) => `${perHour} par heure`,
    rateTooEarly: "Trop tôt pour un taux horaire",
    mostlyFrom: (direction: string) =>
      `Beaucoup venaient nettement du ${direction}`,
    tapHint: "Vue ? Touche la direction d'où elle venait.",
    directionUnknown: "incertain",
    pause: "Pause",
    resume: "Reprendre",
    undo: "Annuler",
    showerLabel: "Quel essaim ?",
    showerUnknown: "Indéterminé",
    distribution: "De quelle direction",
    redLight: "Lumière rouge",
    finish: "Terminer la nuit",
    pastNights: "Tes nuits",
    nightOf: (date: string) => `Nuit du ${date}`,
    clear: "Effacer le carnet",
    clearConfirm: "Effacer toutes les nuits enregistrées ?",
    note: "Seul le temps où tu regardes vraiment est compté – d'où le bouton pause. En dessous d'un quart d'heure, pas de taux horaire : transformer une étoile filante en deux minutes en trente par heure serait un jeu de chiffres. Et ton chiffre reste toujours en dessous du taux du calendrier : celui-ci vaut pour un ciel parfaitement noir avec le point d'origine juste au-dessus de toi. Les nuits restent sur cet appareil et ne passent pas sur un second.",
  },
  treeKey: {
    title: "Identifier un arbre",
    intro:
      "Tu es devant un arbre sans savoir lequel ? Réponds à ce que tu vois – en trois ou quatre questions, l'espèce est trouvée.",
    step: (number: number) => `Question ${number}`,
    resultLabel: "C'est probablement lui",
    markLabel: "Ce qui le trahit",
    checkLabel: "Contre-épreuve",
    confusionLabel: "À ne pas confondre avec",
    toLexicon: "Lire dans le lexique nature",
    back: "Question précédente",
    restart: "Recommencer",
    note: "La clé mène aux neuf arbres les plus fréquents de nos forêts – pas à toutes les espèces. Si la contre-épreuve ne colle pas, c'est un autre arbre : mieux vaut chercher encore que trancher.",
  },
  rainyDay: {
    title: "Idées pour jour de pluie",
    intro:
      "Il pleut depuis le petit-déjeuner ? Indique l'âge, la durée et la place – le reste s'affiche ci-dessous.",
    spaceLabel: "Combien de place",
    ageLabel: "Âge",
    ageAny: "peu importe",
    ageYears: (years: number) => `${years} ans`,
    ageIgnore: "Ne pas tenir compte de l'âge",
    ageUse: "Tenir compte de l'âge",
    ageRange: (from: number, to: number) =>
      to >= 99 ? `dès ${from} ans` : `${from}–${to} ans`,
    minutesLabel: "Temps à occuper",
    minutesValue: (minutes: number) => `${minutes} min`,
    quietLabel: "Seulement du calme (quelqu'un dort)",
    quietBadge: "calme",
    togetherLabel: "Plusieurs personnes présentes",
    needsLabel: "Nécessaire",
    resultCount: (count: number) =>
      count === 1 ? "1 idée convient" : `${count} idées conviennent`,
    empty:
      "Rien trouvé. Prends plus de temps, plus de place – ou laisse tomber l'âge.",
    materialsTitle: "Ce qu'il te faut",
    note: "La place est un filtre strict : ce qui exige une table ne sert à rien dans la tente intérieure. Pour la durée, il y a une marge – on peut toujours s'arrêter.",
  },
  lunchbox: {
    title: "Goûter & pique-nique",
    intro:
      "Ce qu'il faut mettre dans le sac pour la sortie – et combien emporter à boire.",
    adultsLabel: "Adultes",
    childrenLabel: "Enfants",
    lengthLabel: "Durée de la sortie",
    length: {
      halbtag: "Demi-journée",
      ganztag: "Journée entière",
      langertag: "Jusqu'au soir",
    },
    effortLabel: "Intensité",
    effort: {
      gemuetlich: "Tranquille",
      wandern: "Randonnée",
      anstrengend: "Exigeant",
    },
    temperatureLabel: "Température maximale (°C)",
    coolPackLabel: "Pain de glace emporté",
    bottles: (count: number) => (count === 1 ? "1 gourde" : `${count} gourdes`),
    waterHint: (liters: number, bottleMl: number) =>
      `${liters} l pour tout le monde, arrondi à des gourdes de ${bottleMl} ml.`,
    znueniTitle: "Pour le goûter",
    mittagTitle: "Pour le repas de midi",
    remindersTitle: "Ne pas oublier",
    portions: (count: number) =>
      count === 1 ? "1 portion" : `${count} portions`,
    addToList: "Vers la liste de courses",
    addedToList: "Ajouté à la liste de courses",
    nothingToAdd: "Aucune proposition – saisis d'abord les personnes.",
    fromPlanner: "du planificateur de pique-nique",
    note: "Des suggestions, pas des règles : valeurs indicatives par personne et par repas. Sans pain de glace, tout ce qui doit être réfrigéré disparaît – ce n'est pas une question de goût. Et le chocolat reste à la maison les jours de chaleur.",
  },
  firewood: {
    title: "Besoin en bois de feu",
    intro:
      "Combien de filets dans la voiture – mieux vaut acheter le bois avant d'arriver.",
    eveningsLabel: "Soirées avec feu",
    hoursLabel: "Heures par soirée",
    kindLabel: "Type de feu",
    kinds: {
      kochfeuer: "Feu de cuisson (petit)",
      feuerschale: "Brasero",
      lagerfeuer: "Feu de camp",
      waermefeuer: "Feu de chauffe (grand)",
    },
    woodLabel: "Type de bois",
    woods: {
      hart: "Bois dur (hêtre, chêne)",
      gemischt: "Mélangé",
      weich: "Bois tendre (épicéa, sapin)",
    },
    netsLabel: "Filets de 10 kg",
    totalLabel: "Total",
    perEveningLabel: "par soirée",
    kindlingLine: (kg: number) =>
      `Y compris ${kg} kg de petit bois – sans copeaux ni bûchettes, tu restes avec du hêtre sec et sans braises.`,
    stockLabel: "Vérifier le stock (kg)",
    stockPlaceholder: "p. ex. 20",
    stockLine: (evenings: number) =>
      evenings === 0
        ? "Cela ne suffit plus pour une soirée entière."
        : evenings === 1
          ? "Cela suffit encore pour une soirée."
          : `Cela suffit encore pour ${evenings} soirées.`,
    note: "Valeurs empiriques : le vent, le bois humide et la personne qui surveille le feu font facilement varier du simple au double. On arrondit toujours vers le haut – un filet en trop sera encore là la prochaine fois.",
  },
  routePlan: {
    sectionAria: "Tracer un itinéraire à l'avance",
    title: "Tracer un itinéraire",
    intro:
      "Touche la carte pour poser des points de passage. L'app en calcule la longueur, le dénivelé et le temps de marche.",
    mapAria: "Carte pour poser des points de passage",
    mapFailed: "La carte n'a pas pu être chargée.",
    hint: "Pose au moins deux points de passage.",
    undo: "Annuler le dernier point",
    clear: "Tout effacer",
    loadElevation: "Charger les altitudes",
    elevationFailed: "Les altitudes n'ont pas pu être chargées.",
    noElevationYet:
      "Sans altitudes, le temps de marche ne tient compte que de la distance – charge-les, sinon le chiffre est trop optimiste.",
    length: "Longueur",
    elevation: "Dénivelé",
    walkingTime: "Temps de marche",
    pace: "Allure :",
    paceLabels: { slow: "Tranquille", normal: "Normale", fast: "Soutenue" },
    snapping: "Calcul du tracé …",
    notRouted:
      "Aucun tracé disponible (pas de réseau ou pas de chemin trouvé) : le calcul utilise les segments droits entre tes points – nettement trop court en montagne.",
    note: "Estimation selon la méthode habituelle (4 km/h, 300 m de montée, 500 m de descente par heure), sans les pauses. Le calcul suit les segments droits entre tes points, pas le chemin.",
    nameLabel: "Nom",
    namePlaceholder: "p. ex. tour du lac",
    tripLabel: "Rattacher à un voyage",
    tripNone: "Sans voyage",
    save: "Enregistrer l'itinéraire",
    update: "Mettre à jour l'itinéraire",
    saved: "Itinéraire enregistré.",
    saveFailed: "L'itinéraire n'a pas pu être enregistré.",
    nameMissing: "Donne un nom à l'itinéraire.",
    removeFailed: "L'itinéraire n'a pas pu être supprimé.",
    savedTitle: "Itinéraires enregistrés",
    summary: (distance: string, ascent: number, time: string) =>
      `${distance} · ↑${ascent} m · ${time}`,
    removeAria: (name: string) => `Supprimer l'itinéraire ${name}`,
    offlineDownload: "Charger la carte hors ligne",
    offlineDownloadAria: (name: string) =>
      `Charger la carte hors ligne pour l\u2019itin\u00e9raire ${name}`,
    offlineDelete: "Supprimer la carte hors ligne",
    offlineDeleteAria: (name: string) =>
      `Supprimer la carte hors ligne de l\u2019itin\u00e9raire ${name}`,
    offlineSaved: (tiles: number, mb: string) =>
      `${tiles} tuiles \u00b7 ${mb} Mo`,
    offlineHint:
      "\u00ab\u202fCharger la carte hors ligne\u202f\u00bb enregistre les tuiles de carte dans un corridor de 1 km le long de l\u2019itin\u00e9raire \u2013 pour la route sans r\u00e9seau.",
  },
  trackProfile: {
    sectionAria: "Profil altimétrique et temps intermédiaires",
    title: "Profil altimétrique",
    rangeLine: (min: number, max: number) => `${min}–${max} m d'altitude`,
    chartAria: "Profil d'altitude le long du parcours",
    noElevation:
      "Cet appareil n'a pas fourni d'altitudes pendant l'enregistrement – le graphique manque donc.",
    tooltipElevation: "Altitude",
    tooltipDistance: (km: string) => `à ${km} km`,
    splitsTitle: "Temps intermédiaires",
    kmLabel: (km: number) => `km ${km}`,
    kmPartial: "Reste",
    climbLine: (up: number, down: number) => `↑${up} m ↓${down} m`,
    note: "L'altitude est portée sur la distance et non sur le temps – sinon, chaque pause ressemblerait à un plat. Le dernier kilomètre entamé est marqué « Reste ».",
  },
  reservation: {
    title: "Réservation",
    empty: "Aucune confirmation de réservation enregistrée.",
    add: "Ajouter la confirmation",
    replace: "Remplacer",
    openImage: "Voir la confirmation",
    openPdf: "Ouvrir le PDF",
    viewerTitle: "Confirmation de réservation",
    viewerClose: "Fermer",
    viewerDownload: "Télécharger",
    viewerNewWindow: "Ouvrir dans une nouvelle fenêtre",
    viewerPdfFallback:
      "Cet appareil n'affiche pas les PDF directement dans l'app. Télécharge le fichier ou ouvre-le dans une nouvelle fenêtre.",
    removeAria: "Supprimer la confirmation de réservation",
    uploaded: "Confirmation enregistrée.",
    uploadFailed: "La confirmation n'a pas pu être enregistrée.",
    removeFailed: "La confirmation n'a pas pu être supprimée.",
    tooLarge: "Le fichier est trop volumineux (10 Mo max.).",
    offlineNote:
      "Photo ou PDF. Une fois ouverte, la confirmation reste consultable sans réseau – pratique à la barrière à 22 h.",
  },
  sights: {
    sectionAria: "Curiosités à proximité",
    title: "Curiosités à proximité",
    subtitle: "Musées, points de vue, châteaux et plus autour de ta position.",
    subtitleAtPlace: (place: string) =>
      `Musées, points de vue, châteaux et plus autour de ${place}.`,
    radiusLabel: "Rayon",
    radiusGroupAria: "Choisir le rayon de recherche",
    radiusOption: (km: number) => `${km} km`,
    loading: "Recherche de curiosités …",
    loadFailed:
      "Les curiosités n'ont pas pu être chargées. Overpass est un service gratuit qui freine en cas de forte demande – réessaie dans quelques minutes.",
    empty: (km: number) =>
      `Rien n'est cartographié dans OpenStreetMap dans un rayon de ${km} km. Essaie un rayon plus grand.`,
    resultCount: (n: number) =>
      n === 1 ? "1 lieu trouvé" : `${n} lieux trouvés`,
    kind: {
      museum: "Musée",
      viewpoint: "Point de vue",
      castle: "Château",
      zoo: "Zoo",
      themePark: "Parc d'attractions",
      monument: "Monument",
      attraction: "Attraction",
    },
    navButton: "Itinéraire",
    navAria: (name: string) => `Itinéraire vers ${name}`,
    website: "Site web",
    source:
      "Données d'OpenStreetMap via l'API Overpass – brutes et sans garantie. Les excursions sélectionnées avec description se trouvent dans la section « Excursions à proximité ».",
  },
  shops: {
    sectionAria: "Faire les courses à proximité",
    title: "Faire les courses à proximité",
    subtitle: "Supermarché, boulangerie et vente à la ferme autour de toi.",
    subtitleAtPlace: (place: string) =>
      `Supermarché, boulangerie et vente à la ferme autour de ${place}.`,
    radiusLabel: "Rayon",
    radiusGroupAria: "Choisir le rayon de recherche",
    radiusOption: (km: number) => `${km} km`,
    loading: "Recherche des commerces …",
    loadFailed: "Les commerces n'ont pas pu être chargés – réessaie plus tard.",
    empty: (km: number) =>
      `Dans un rayon de ${km} km, aucun commerce n'est répertorié dans OpenStreetMap.`,
    resultCount: (n: number) =>
      n === 1 ? "1 commerce trouvé" : `${n} commerces trouvés`,
    distanceAway: (distance: string) => `${distance} à vol d'oiseau`,
    kind: {
      supermarket: "Supermarché",
      convenience: "Épicerie",
      bakery: "Boulangerie",
      farm: "Vente à la ferme",
      butcher: "Boucherie",
    },
    openNow: "Ouvert",
    closedNow: "Fermé",
    checkHours: "Vérifier les horaires",
    todayHours: (hours: string) => `Aujourd'hui ${hours}`,
    noHours: "Horaires non renseignés",
    navButton: "Itinéraire",
    navAria: (name: string) => `Itinéraire vers ${name}`,
    website: "Site web",
    hoursNote:
      "Les horaires proviennent d'OpenStreetMap et peuvent être obsolètes. Quand l'indication est trop complexe (jours fériés, saison, pause de midi avec commentaire), on affiche « Vérifier les horaires » plutôt qu'une supposition – l'indication brute figure alors à côté.",
    source: "Données : contributeurs OpenStreetMap (ODbL)",
  },
  familyPlaces: {
    sectionAria: "Places de jeux et lieux de baignade à proximité",
    title: "Pour les familles à proximité",
    subtitle: "Places de jeux et lieux de baignade autour de ta position.",
    subtitleAtPlace: (place: string) =>
      `Places de jeux et lieux de baignade autour de ${place}.`,
    radiusLabel: "Rayon",
    radiusGroupAria: "Choisir le rayon de recherche",
    radiusOption: (km: number) => `${km} km`,
    loading: "Recherche des places de jeux et lieux de baignade …",
    loadFailed:
      "Les places de jeux et lieux de baignade n'ont pas pu être chargés pour l'instant. Overpass est un service gratuit qui freine en cas de trop nombreuses requêtes – réessaie dans quelques minutes.",
    empty: (km: number) =>
      `Dans un rayon de ${km} km, aucune place de jeux ni lieu de baignade n'est enregistré dans OpenStreetMap. Essaie avec un rayon plus grand.`,
    resultCount: (n: number) =>
      n === 1 ? "1 endroit trouvé" : `${n} endroits trouvés`,
    kind: {
      playground: "Place de jeux",
      bathing: "Lieu de baignade",
    },
    minAge: (years: number) => `dès ${years} ans`,
    maxAge: (years: number) => `jusqu'à ${years} ans`,
    ageRange: (min: number, max: number) => `${min}–${max} ans`,
    fenced: "clôturé",
    covered: "couvert",
    supervised: "surveillé",
    feePaid: "payant",
    feeFree: "gratuit",
    distanceAway: (value: string) => `à ${value}`,
    navButton: "S'y rendre",
    navAria: (name: string) => `Navigation vers ${name}`,
    bathingNote: (section: string) =>
      `La température de l'eau à ton emplacement figure dans la section « ${section} ». La baignade reste sous ta propre responsabilité – observe l'endroit avant de plonger.`,
    bathingNoteShort: "Baignade à tes propres risques",
    source:
      "Données d'OpenStreetMap via l'API Overpass – interrogée uniquement sur ton clic. Âge, clôture, surveillance et entrée ne figurent que là où ces indications sont renseignées dans OSM.",
  },

  /** Carte de l'obscurité par emplacement (#239). */
  darkSky: {
    sectionAria: "Obscurité estimée du ciel à cet endroit",
    title: "Ciel sombre",
    badge: (bortle: number) => `Bortle ${bortle}`,
    subtitle: "Quelle est l'obscurité du ciel à ta position ?",
    subtitleAtPlace: (place: string) =>
      `Quelle est l'obscurité du ciel à ${place} ?`,
    outsideCoverage:
      "Aucune donnée de sources lumineuses pour ce lieu – le jeu de données couvre la Suisse et les régions frontalières. Un classement serait deviné ici, ReiseKompass préfère donc n'en afficher aucun.",
    scaleAria: (bortle: number) =>
      `Échelle de Bortle de 1 (très sombre) à 9 (centre-ville), niveau estimé ${bortle}`,
    scaleDark: "sombre",
    scaleBright: "clair",
    classLine: (bortle: number, label: string) => `Bortle ${bortle} · ${label}`,
    locating: "Position en cours de détermination …",
    noLocation:
      "Pour le classement, ReiseKompass a besoin de ta position – autorise la localisation ou enregistre un emplacement.",
    tonightTitle: "Cette nuit",
    tonightLoading: "Chargement de la nébulosité …",
    tonightWorthIt:
      "Cette nuit en vaut particulièrement la peine : ciel sombre, nuit claire et peu de clair de lune se rejoignent. Accorde-toi 20 minutes pour que tes yeux s'habituent.",
    tonightClouds: (percent: number) =>
      `Environ ${percent} % de nébulosité sont annoncés cette nuit – attends plutôt une nuit plus claire.`,
    tonightMoon: (percent: number) =>
      `La Lune est éclairée à ${percent} % et noie les étoiles faibles. Pour la Voie lactée, les nuits autour de la nouvelle lune sont meilleures.`,
    tonightBrightSky:
      "La nuit est claire et la Lune ne gêne guère – mais le ciel est ici trop lumineux pour les étoiles faibles. La Lune, les planètes et les passages de l'ISS valent tout de même la peine.",
    tonightUnknown:
      "Aucune prévision de nébulosité n'est disponible pour cette nuit.",
    cloudLine: (percent: number) =>
      `Nébulosité dès 21 h : environ ${percent} %`,
    moonLine: (percent: number) => `Lune : éclairée à ${percent} %`,
    astroLink: "Vers le ciel étoilé dans le module nature",
    nearestTitle: "Sources lumineuses les plus proches :",
    nearestItem: (name: string, distance: string) => `${name} ${distance}`,
    estimateNote:
      "Estimation, pas mesure : il n'existe pas de mesure librement accessible de la luminosité du ciel. ReiseKompass calcule le classement à partir de la distance aux plus grandes villes et agglomérations. La formule ignore les montagnes qui masquent un halo, un éclairage puissant juste à côté ou l'air humide – sur place, il peut faire plus sombre ou plus clair.",
  },

  excursions: {
    sectionAria: "Buts d'excursion à proximité de cet emplacement",
    title: "Excursions à proximité",
    subtitle: "Que peux-tu entreprendre dans les environs ?",
    subtitleAtPlace: (place: string) =>
      `Que peux-tu entreprendre autour de ${place} ?`,
    loading: "Chargement des excursions …",
    loadFailed:
      "Les excursions n'ont pas pu être chargées. Réessaie plus tard.",
    empty:
      "Aucun but avec coordonnées n'est encore enregistré dans ton app Ausflugfinder.",
    resultCount: (n: number) =>
      n === 1 ? "1 but à proximité" : `${n} buts à proximité`,
    kind: "But d'excursion",
    distanceAway: (value: string) => `${value} à vol d'oiseau`,
    costFree: "gratuit",
    costLabel: "Coût",
    costAria: (level: number) => `Niveau de coût ${level} sur 4`,
    detailsShow: "Détails",
    detailsHide: "Fermer les détails",
    navButton: "Navigation",
    navAria: (name: string) => `Navigation vers ${name}`,
    websiteLink: "Site web",
    mapLink: "Afficher sur la carte",
    photoAlt: (name: string) => `Photo de ${name}`,
    addressLabel: "Adresse",
    niceToKnowLabel: "Bon à savoir",
    openingHoursLabel: "Heures d'ouverture",
    parkingLabel: "Parking",
    parkingFree: "gratuit",
    parkingPaid: "payant",
    ageLabel: "Recommandé",
    babiesOk: "Faisable avec un bébé",
    lengthLabel: "Longueur",
    lengthKm: (km: string) => `${km} km`,
    tourLoop: "Boucle",
    tourAToB: "D'un point à un autre",
    seasonsLabel: "Saison",
    season: {
      spring: "Printemps",
      summer: "Été",
      autumn: "Automne",
      winter: "Hiver",
    },
    source: "Depuis ton app Ausflugfinder",
  },

  recipes: {
    title: "Livre de recettes Campfire",
    subtitle:
      "Des recettes simples pour réchaud à gaz et feu ouvert – filtrables par ingrédients et par temps.",
    offlineNote:
      "Toutes les recettes sont enregistrées dans l'app et utilisables sans connexion Internet.",
    searchPlaceholder:
      "Chercher une recette ou un ingrédient (p. ex. « haricots ») …",
    searchAria: "Chercher une recette ou un ingrédient",
    methodFilterAria: "Filtrer par méthode de cuisson",
    timeFilterAria: "Filtrer par temps de préparation",
    filterAll: "Toutes",
    timeAny: "Peu importe",
    timeMax: (n: number) => `≤ ${n} min`,
    minutes: (n: number) => `${n} min`,
    servings: (n: number) => `${n} portions`,
    createOwn: "Créer ma propre recette",
    openRecipeAria: (name: string) => `Ouvrir la recette ${name}`,
    photoAlt: (name: string) => `Photo : ${name}`,
    ownBadge: "Perso",
    onePotBadge: "One-pot",
    kidsBadge: "Enfants",
    emptyState:
      "Aucune recette trouvée – essaie d'autres filtres ou termes de recherche.",
    ingredientsTitle: "Ingrédients",
    stepsTitle: "Préparation",
    tipTitle: "Astuce",
    deleteConfirm: (name: string) =>
      `Supprimer vraiment la recette « ${name} » ?`,
    favoritesFilter: "Favoris",
    favoriteAria: (name: string) => `Enregistrer ${name} comme favori`,
    unfavoriteAria: (name: string) => `Retirer ${name} des favoris`,
    favoriteSave: "Enregistrer comme favori",
    favoriteSaved: "Favori",
    favoritesEmpty:
      "Pas encore de favoris – touche le cœur d'une recette pour la retrouver ici.",
    randomButton: "Au hasard",
    randomAria: "Ouvrir une recette au hasard dans la sélection filtrée",
    randomAgain: "Relancer le dé",
    cookingMode: "Mode cuisine",
    cookingModeAria: (name: string) => `Démarrer le mode cuisine pour ${name}`,
    cookingStepProgress: (current: number, total: number) =>
      `Étape ${current} sur ${total}`,
    cookingPrev: "Retour",
    cookingNext: "Suivant",
    cookingDone: "Terminé",
    cookingIngredientsShow: "Afficher les ingrédients",
    cookingIngredientsHide: "Masquer les ingrédients",
    shareButton: "Partager",
    shareAria: (name: string) => `Partager la recette ${name} par lien`,
    shareTitle: "Partager la recette",
    shareDescription:
      "Toute personne qui a le lien voit la recette et peut la reprendre. Ta photo de recette reste privée.",
    shareCopied: "Lien de partage copié",
    shareFailed: "Le lien de partage n'a pas pu être créé",
    shareQrTitle: "Code QR",
    shareQrText: "À scanner autour du feu – plus rapide que de taper.",
    shareQrAlt: (name: string) => `Code QR vers la recette partagée ${name}`,
    unshareButton: "Arrêter le partage",
    unshared: "Lien de partage retiré",
    unshareFailed: "Le lien de partage n'a pas pu être retiré",
    destockButton: "Retirer les ingrédients de la glacière",
    destockAria: (name: string) =>
      `Retirer les ingrédients de ${name} de la glacière`,
    destockTitle: "Retirer de la glacière",
    destockDescription:
      "Ces provisions correspondent aux ingrédients de la recette. Choisis ce que tu as utilisé.",
    destockMatchedBy: (ingredient: string) => `correspond à « ${ingredient} »`,
    destockNoMatches:
      "Aucune entrée correspondante dans ta glacière – il n'y a rien à retirer.",
    destockConfirm: (n: number) =>
      n === 1 ? "Retirer 1 entrée" : `Retirer ${n} entrées`,
    destockDone: (n: number) =>
      n === 1
        ? "1 entrée retirée de la glacière"
        : `${n} entrées retirées de la glacière`,
    destockFailed: "Les entrées n'ont pas pu être retirées",
    editor: {
      titleEdit: "Modifier la recette",
      titleNew: "Créer ma propre recette",
      description:
        "Ta recette apparaît dans le livre de recettes et est prise en compte dans les suggestions de la glacière.",
      nameLabel: "Nom",
      namePlaceholder: "p. ex. Les Älplermagronen de grand-maman",
      importButton: "Reprendre depuis un texte",
      importUrlLabel: "Importer depuis un lien web",
      importUrlButton: "Récupérer",
      importUrlFailed:
        "Cette page ne contient pas de recette lisible – copie le texte et utilise le champ ci-dessous.",
      importHint:
        "Colle le texte de la recette (copié d'un site ou d'un message). ReiseKompass devine le nom, les ingrédients et les étapes – tout reste modifiable avant d'enregistrer.",
      importPlaceholder:
        "Älplermagronen\n\nIngrédients :\n250 g de macaronis\n…\n\nPréparation :\n1. …",
      importApply: "Remplir les champs",
      importNothing:
        "Aucune recette reconnaissable dans ce texte. Vérifie que les ingrédients ou les étapes sont ligne par ligne.",
      importApplied: (ing: number, steps: number) =>
        `Repris : ${ing} ingrédients, ${steps} étapes – vérifie rapidement.`,
      methodLabel: "Cuisson",
      difficultyLabel: "Difficulté",
      timeLabel: "Temps (minutes)",
      servingsLabel: "Portions",
      onePot: "One-pot",
      kidFriendly: "Adapté aux enfants",
      ingredientsLabel: "Ingrédients (un par ligne)",
      ingredientsPlaceholder:
        "400 g de macaronis\n200 g de fromage de montagne\n2 oignons",
      stepsLabel: "Préparation (une étape par ligne)",
      stepsPlaceholder:
        "Porter l'eau à ébullition et cuire les macaronis.\nFaire dorer les oignons.\nSuperposer le tout et laisser fondre le fromage.",
      tipLabel: "Astuce (facultatif)",
      tipPlaceholder: "p. ex. Servir avec de la compote de pommes",
      saved: "Recette enregistrée",
      updated: "Recette mise à jour",
      photoLabel: "Photo (facultatif)",
      photoChoose: "Choisir une photo",
      photoChange: "Changer la photo",
      photoRemove: "Supprimer la photo",
      photoPreviewAlt: "Aperçu de la photo de la recette",
      photoHint:
        "JPEG, PNG ou WebP – la photo est automatiquement réduite avant l'envoi.",
      photoUploading: "Envoi de la photo …",
      photoUploadFailed:
        "Recette enregistrée, mais la photo n'a pas pu être envoyée.",
      photoTooLarge: "La photo est trop lourde (max. 5 Mo).",
      photoHeic:
        "Le navigateur ne peut pas lire le HEIC/HEIF – exporte la photo en JPEG.",
      photoReadFailed: "L'image n'a pas pu être lue.",
      photoRemoveFailed: "La photo n'a pas pu être supprimée.",
    },
  },
  cookTimer: {
    title: "Minuteur de cuisine",
    hint: "Le minuteur continue même si tu changes de page – le temps restant s'affiche en bas de l'app.",
    quickAria: "Choisir la durée du minuteur",
    quickMinutes: (n: number) => `${n} min`,
    customLabel: "Durée personnalisée en minutes",
    customPlaceholder: "Minutes",
    startButton: "Démarrer",
    invalidMinutes: (max: number) => `Indique entre 1 et ${max} minutes.`,
    tooMany: (max: number) =>
      `${max} minuteurs tournent déjà – annules-en un d'abord.`,
    started: (minutes: number) => `Minuteur de ${minutes} min démarré`,
    stepTimerAria: (label: string) => `Démarrer un minuteur de ${label}`,
    runningLabel: "en cours",
    pausedLabel: "en pause",
    expired: "C'est prêt – le temps est écoulé !",
    dismiss: "C'est noté",
    dismissAria: (name: string) => `Acquitter le minuteur ${name}`,
    pauseAria: (name: string) => `Mettre le minuteur ${name} en pause`,
    resumeAria: (name: string) => `Reprendre le minuteur ${name}`,
    cancelAria: (name: string) => `Annuler le minuteur ${name}`,
    expiredShort: "Prêt",
    pausedShort: "Pause",
    moreCount: (n: number) => `+${n}`,
    barOpenAria: (name: string, time: string) =>
      `Minuteur ${name} : encore ${time} – retour à la recette`,
    barExpiredAria: (name: string) =>
      `Le minuteur ${name} est écoulé – retour à la recette`,
  },
  servings: {
    question: "Pour combien de personnes ?",
    personCount: (n: number) => (n === 1 ? "1 personne" : `${n} personnes`),
    decreaseAria: "Une personne de moins",
    increaseAria: "Une personne de plus",
    baseHint: (n: number) =>
      `Recette de base pour ${n === 1 ? "1 personne" : `${n} personnes`}`,
    scaledNote:
      "Les quantités sont converties. Les lignes sans quantité («Sel selon le goût») restent telles quelles.",
    reset: "Réinitialiser",
    resetAria: "Revenir au nombre de portions de la recette",
    menuTitle: "Convertir les quantités",
    menuToggleAria:
      "Convertir les quantités du menu pour un nombre de personnes",
    menuOff: "comme dans la recette",
    menuHint:
      "Vaut pour l'aperçu des ingrédients et pour la reprise dans la liste de courses.",
    menuScaledTo: (n: number) =>
      `converti pour ${n === 1 ? "1 personne" : `${n} personnes`}`,
  },
  converter: {
    openButton: "Convertisseur",
    openAria: "Ouvrir le convertisseur de mesures et de températures",
    title: "Mesures & températures",
    description:
      "Convertir en cuisinant sur place : tasses, cuillères, grammes et degrés.",
    amountLabel: "Quantité",
    unitLabel: "Mesure",
    volumeTitle: "Tasses & cuillères",
    weightTitle: "Grammes ↔ millilitres",
    ingredientLabel: "Ingrédient",
    directionAria: "Choisir le sens de la conversion",
    gramsToMl: "g → ml",
    mlToGrams: "ml → g",
    weightHint:
      "Calculé avec une masse volumique de cuisine – valeurs pour ingrédients non tassés, pas une balance de laboratoire. 1 tasse = 2 dl, 1 cs = 15 ml, 1 cc = 5 ml.",
    tempTitle: "Température",
    tempLabel: "Température",
    tempUnitAria: "Choisir l'unité de la température saisie",
    gasMark: (n: number) => `Thermostat ${n}`,
    noGasMark: "hors plage du four",
    ovenTitle: "Four & thermostat",
    ovenHint:
      "Vaut pour la chaleur voûte/sole. En chaleur tournante, régler environ 20 °C de moins.",
  },
  food: {
    title: "Glacière & provisions sèches",
    subtitleLoggedOut:
      "Qu'est-ce qu'il reste ? Saisis tes provisions et reçois des suggestions de recettes adaptées.",
    subtitleCooled:
      "Qu'est-ce qu'il reste ? Saisis tes provisions réfrigérées et reçois des suggestions de recettes one-pot adaptées.",
    subtitleDry:
      "Conserves, pâtes, café, épices : tout ce qui n'est pas réfrigéré dans le deuxième garde-manger – rangé par catégories.",
    loginFeature: "tes provisions",
    storageAria: "Choisir le rangement",
    noUnit: "sans unité",
    unitAria: "Unité de la quantité (facultatif)",
    noCategory: "Sans catégorie",
    categoryAria: "Catégorie dans les provisions sèches (facultatif)",
    addPlaceholderCooled: "p. ex. tomates, fromage, haricots …",
    addPlaceholderDry: "p. ex. boîte de raviolis, spaghettis, café …",
    addNameAria: "Ajouter un aliment",
    expiryAria: "Date limite de consommation (facultatif)",
    submitAria: "Enregistrer l'aliment",
    addFailed: "L'entrée n'a pas pu être enregistrée",
    dateHint:
      "Date = durée de conservation minimale (facultatif). Les provisions qui expirent bientôt passent en tête et sont marquées.",
    dateHintDry:
      "Date = durée de conservation minimale (facultatif). Dans les provisions sèches aussi, ce qui expire bientôt passe en tête et est marqué.",
    urgentOne: "Une provision devrait être consommée bientôt",
    urgentMany: (n: number) =>
      `${n} provisions devraient être consommées bientôt`,
    urgentSuffix: " – les suggestions de recettes ci-dessous t'y aident.",
    removeAria: (name: string) => `Retirer ${name}`,
    addToShoppingAria: (name: string) =>
      `Mettre ${name} sur la liste de courses`,
    addedToShopping: (name: string) => `${name} mis sur la liste de courses`,
    alreadyOnShopping: (name: string) =>
      `${name} est déjà sur la liste de courses`,
    addToShoppingFailed: "Impossible de l'ajouter à la liste de courses",
    deleteOnly: "Supprimer seulement",
    deleteAndShop: "Supprimer et mettre sur la liste de courses",
    emptyTitle: "Glacière encore vide",
    emptyText:
      "Saisis ce que tu as avec toi – nous te proposons des recettes adaptées.",
    emptyTitleDry: "Provisions sèches encore vides",
    emptyTextDry:
      "Conserves, pâtes, riz, café, épices : saisis ce qui se trouve dans le garde-manger.",
    suggestionsTitle: "Cuisiner les restes",
    suggestionsSubtitle:
      "Ce que tu peux cuisiner avec ce qu'il reste – de la glacière et des provisions sèches, les recettes avec des provisions bientôt périmées d'abord.",
    haveCount: (have: number, total: number) =>
      `tu as ${have} ingrédients sur ${total}`,
    urgentInRecipe: (n: number) =>
      n === 1
        ? "1 provision périme bientôt"
        : `${n} provisions périment bientôt`,
    havePrefix: "Tu as :",
    missingPrefix: "Il manque :",
    missingNone: "Tout y est – tu peux commencer tout de suite.",
    addMissing: "Ce qui manque dans la liste de courses",
    addMissingAria: (name: string) =>
      `Mettre les ingrédients manquants de ${name} dans la liste de courses`,
    openRecipe: "Ouvrir la recette",
    minutes: (n: number) => `${n} min`,
    servings: (n: number) => `${n} portions`,
    onePotSuffix: " · one-pot",
    bookPrefix: "Tu trouves toutes les instructions dans le ",
    bookLink: "livre de recettes Campfire",
    bookSuffix: ".",
    templateSaveButton: "Enregistrer comme modèle",
    templateLoadButton: "Charger un modèle",
    templateSaveTitle: "Enregistrer le contenu actuel comme modèle",
    templateSaveDesc: (n: number) =>
      `${n === 1 ? "1 entrée sera enregistrée" : `${n} entrées seront enregistrées`} – pour les provisions avec DLC, nous retenons la durée restante en jours.`,
    templateNameLabel: "Nom du modèle",
    templateNamePlaceholder: "p. ex. remplissage type week-end",
    templateSaveConfirm: "Enregistrer le modèle",
    templateSaved: "Modèle enregistré – disponible via « Charger un modèle »",
    templateSaveFailed: "Le modèle n'a pas pu être enregistré",
    templateLoadTitle: "Charger un modèle",
    templateLoadDesc:
      "Les entrées sont ajoutées à la glacière. Les durées restantes enregistrées sont converties en DLC à partir d'aujourd'hui ; les entrées du même nom déjà présentes sont ignorées.",
    templateEmpty: "Aucun modèle enregistré pour l'instant.",
    templateItemCount: (n: number) => (n === 1 ? "1 entrée" : `${n} entrées`),
    templateApply: "Charger",
    templateApplied: (added: number, skipped: number) =>
      `${added === 1 ? "1 entrée ajoutée" : `${added} entrées ajoutées`}${
        skipped > 0 ? `, ${skipped} déjà présente(s) – ignorée(s)` : ""
      }`,
    templateApplyFailed: "Le modèle n'a pas pu être chargé",
    templateDeleted: "Modèle supprimé",
    templateDeleteFailed: "Le modèle n'a pas pu être supprimé",
    templateDeleteAria: (name: string) => `Supprimer le modèle ${name}`,
    templateDeleteConfirm: (name: string) =>
      `Vraiment supprimer le modèle « ${name} » ?`,
    quantityPlaceholder: "Quantité",
    addQuantityAria: "Quantité pour la nouvelle entrée (facultatif)",
    editAria: (name: string) =>
      `Modifier ${name} – adapter la quantité, le rangement et la DLC`,
    editDesc:
      "Adapter la quantité, l'unité, le rangement, la catégorie et la date limite de consommation – les champs vides suppriment la valeur.",
    editQuantityLabel: "Quantité",
    editQuantityPlaceholder: "p. ex. 2× ou 500 g",
    editUnitLabel: "Unité",
    editStorageLabel: "Rangement",
    editCategoryLabel: "Catégorie",
    editExpiryLabel: "Date limite de consommation",
    editSave: "Enregistrer",
    editFailed: "La modification n'a pas pu être enregistrée",
    sortAria: "Trier les provisions",
    sortByExpiry: "Par expiration",
    sortByName: "Par nom",
  },
  shopping: {
    fromRecipe: (name: string) => `de : ${name}`,
    title: "Liste de courses",
    subtitle:
      "Tout acheter pour le camp : coche les articles, reprends les ingrédients directement du livre de recettes.",
    subtitleLoggedOut:
      "Ta liste de courses pour le camp – remplie à la main ou directement depuis le livre de recettes.",
    loginFeature: "ta liste de courses",
    addPlaceholder: "p. ex. spaghettis …",
    addNameAria: "Ajouter un article à la liste de courses",
    addButton: "Ajouter",
    addFailed: "L'article n'a pas pu être enregistré",
    quantityPlaceholder: "Quantité",
    addQuantityAria: "Quantité pour le nouvel article (facultatif)",
    alreadyOnList: (name: string) =>
      `${name} est déjà sur la liste – adapte la quantité et la note directement sur l'article`,
    detailsAria: (name: string) => `Modifier la quantité et la note de ${name}`,
    detailsTitle: "Quantité & note",
    detailsQuantityLabel: "Quantité",
    detailsQuantityPlaceholder: "p. ex. 2× ou 500 g",
    detailsNoteLabel: "Note",
    detailsNotePlaceholder: "p. ex. en action, sans lactose …",
    detailsPriceLabel: "Prix (CHF)",
    detailsPricePlaceholder: "p. ex. 3.50",
    detailsPriceHint:
      "Laisse vide si tu ne veux pas saisir de prix. Le total figure en haut de la liste.",
    lastPriceSuggestion: (amount: string) =>
      `La dernière fois : ${amount} – reprendre`,
    detailsPriceBooked:
      "Déjà repris dans la caisse de voyage – le prix reste tel qu'il a été comptabilisé.",
    totalLabel: "Total :",
    totalBreakdown: (open: string, checked: string) =>
      `en attente ${open} · cochés ${checked}`,
    totalBooked: (booked: string) => `comptabilisé ${booked}`,
    bookedBadge: "comptabilisé",
    bookButton: (sum: string) => `Vers la caisse de voyage (${sum})`,
    bookTitle: "Reprendre dans la caisse de voyage",
    bookDesc:
      "Les courses cochées avec un prix sont comptabilisées comme une seule dépense dans la caisse de voyage. Les entrées comptabilisées ne comptent plus une deuxième fois.",
    bookNothing:
      "Rien à reprendre : aucune entrée cochée avec un prix n'est en attente.",
    bookItemAria: (name: string) => `Comptabiliser ${name}`,
    bookSumLabel: (n: number) =>
      n === 1 ? "1 entrée – total" : `${n} entrées – total`,
    bookTripLabel: "Voyage",
    bookNoTrips:
      "Tu n'as encore aucun voyage dans le journal – crées-en un d'abord, la caisse de voyage suivra.",
    bookCategoryLabel: "Catégorie",
    bookDayLabel: "Date",
    bookDescriptionLabel: "Description",
    bookDescriptionPlaceholder: "p. ex. grandes courses Migros",
    bookPaidByLabel: "Payé par",
    bookPaidByPlaceholder: "Nom",
    bookConfirm: (sum: string) => `Comptabiliser ${sum}`,
    bookDone: (n: number, sum: string) =>
      `${n === 1 ? "1 entrée comptabilisée" : `${n} entrées comptabilisées`} pour ${sum} dans la caisse de voyage`,
    bookFailed: "La reprise dans la caisse de voyage a échoué",
    detailsFailed: "La quantité/note n'a pas pu être enregistrée",
    openTitle: "Encore à acheter",
    doneTitle: "Fait",
    moveOpenLabel: "Déplacer les entrées ouvertes vers :",
    moveOpenAria: (name: string) =>
      `Déplacer toutes les entrées ouvertes vers la liste ${name}`,
    movedToList: (n: number, name: string) =>
      n === 1
        ? `1 entrée déplacée vers « ${name} »`
        : `${n} entrées déplacées vers « ${name} »`,
    itemCheckAria: (name: string) => `Cocher ${name}`,
    itemUncheckAria: (name: string) => `Rouvrir ${name}`,
    removeAria: (name: string) => `Retirer ${name} de la liste`,
    removeChecked: "Supprimer les articles cochés",
    clearAll: "Vider la liste",
    clearConfirm: "Vraiment supprimer toute la liste de courses ?",
    emptyTitle: "La liste de courses est vide",
    emptyText:
      "Ajoute des articles ci-dessus – ou reprends les ingrédients directement d'une recette du livre de recettes.",
    openCount: (n: number) =>
      n === 1 ? "1 article ouvert" : `${n} articles ouverts`,
    addedFromRecipe: (n: number) =>
      n === 1
        ? "1 ingrédient ajouté à la liste de courses"
        : `${n} ingrédients ajoutés à la liste de courses`,
    openList: "Vers la liste de courses",
    addIngredients: "Ingrédients sur la liste de courses",
    noCategory: "Sans catégorie",
    addCategoryAria: "Choisir la catégorie du nouvel article",
    itemCategoryAria: (name: string) => `Changer la catégorie de ${name}`,
    categoryChangeFailed: "La catégorie n'a pas pu être enregistrée",
    newCategoryOption: "Nouvelle catégorie …",
    newCategoryPlaceholder: "Nouvelle catégorie",
    newCategoryAria: "Nom de la nouvelle catégorie",
    newCategorySave: "Enregistrer la catégorie",
    reorderAria: (name: string) => `Déplacer ${name}`,
    reorderFailed: "Le nouvel ordre n'a pas pu être enregistré",
    printButton: "Imprimer",
    shareButton: "Partager",
    shareAria: "Partager la liste de courses par lien",
    copyTextButton: "Copier comme texte",
    copyTextDone: "Liste copiée – prête à coller",
    copyTextFailed: "Échec de la copie",
    shareTitle: "Partager la liste de courses",
    shareDescription:
      "Toutes les personnes disposant de ce lien voient ta liste de courses et peuvent cocher sans se connecter.",
    shareCopied:
      "Lien de partage copié – envoie-le simplement à tes compagnons de voyage",
    shareFailed: "Le lien de partage n'a pas pu être créé",
    unshareButton: "Arrêter le partage",
    unshared: "Partage terminé – le lien n'est plus valable",
    unshareFailed: "Le partage n'a pas pu être arrêté",
    shareQrAlt: "Code QR du lien de partage de la liste de courses",
    shareQrTitle: "Scanner le code QR",
    shareQrText:
      "Tes compagnons scannent le code avec l'appareil photo du téléphone et arrivent directement sur la liste.",
    suggestionsAria: "Suggestions de l'historique et de la liste",
    putAwayButton: "Ranger les courses",
    putAwayTitle: "Ranger les courses",
    putAwayDesc:
      "Choisis le rangement et les courses cochées, et indique en option une date limite de consommation. Les articles repris passent dans tes provisions et sont retirés de la liste de courses.",
    putAwayStorageLabel: "Rangement",
    putAwayItemAria: (name: string) => `Ranger ${name} dans les provisions`,
    putAwayExpiryAria: (name: string) =>
      `Date limite de consommation pour ${name} (facultatif)`,
    putAwayAlreadyInFood: "déjà dans les provisions",
    putAwayConfirm: (n: number) =>
      n === 1 ? "Ranger 1 article" : `Ranger ${n} articles`,
    putAwayDone: (n: number) =>
      n === 1
        ? "1 achat rangé dans les provisions"
        : `${n} achats rangés dans les provisions`,
    putAwayOpenFood: "Vers les provisions",
    putAwayFailed:
      "Le rangement a échoué – les articles pas encore repris restent sur la liste",
    listsAria: "Choisir la liste de courses",
    tripListsLabel: "Listes de voyage :",
    tripListsAria: "Listes de courses des voyages",
    listCounts: (open: number, done: number) =>
      `${open} à acheter · ${done} faits`,
    manageListsButton: "Listes",
    manageListsAria: "Gérer les listes de courses",
    manageListsTitle: "Gérer les listes de courses",
    manageListsDescription:
      "Crée d'autres listes (p. ex. « Courses de la semaine » et « Camping »), renomme-les, réordonne-les – ou supprime une liste avec toutes ses entrées.",
    newListPlaceholder: "Nom de la nouvelle liste",
    newListButton: "Créer",
    listCreated: (name: string) => `Liste « ${name} » créée`,
    listCreateFailed: "Impossible de créer la liste",
    listNameAria: (name: string) => `Nom de ${name}`,
    listSaveNameAria: (name: string) => `Enregistrer le nouveau nom de ${name}`,
    listRenamed: "Liste renommée",
    listRenameFailed: "Impossible de renommer la liste",
    listDeleteAria: (name: string) => `Supprimer la liste ${name}`,
    listDeleteConfirm: (name: string) =>
      `Supprimer la liste « ${name} » avec toutes ses entrées ?`,
    listDeleted: "Liste supprimée",
    listDeleteFailed: "Impossible de supprimer la liste",
    listDeleteLastHint: "La dernière liste est conservée.",
    listMoveUpAria: (name: string) => `Déplacer ${name} vers le haut`,
    listMoveDownAria: (name: string) => `Déplacer ${name} vers le bas`,
    listOrderFailed: "Impossible d'enregistrer l'ordre des listes",
    targetListLabel: "Liste de destination",
    targetListAria: "Choisir la liste de destination",
    addedToNamedList: (name: string, list: string) =>
      `${name} ajouté à « ${list} »`,
    addedFromRecipeToList: (n: number, list: string) =>
      n === 1
        ? `1 ingrédient ajouté à « ${list} »`
        : `${n} ingrédients ajoutés à « ${list} »`,
  },
  sharedShopping: {
    loading: "Chargement de la liste de courses partagée …",
    notFoundTitle: "Lien expiré ou invalide",
    backHome: "Page d'accueil",
    invalidLink:
      "Ce lien de partage a expiré, est invalide ou a été retiré par sa propriétaire ou son propriétaire.",
    subtitle: (open: number, total: number) =>
      `Liste de courses partagée · ${open} article${open === 1 ? "" : "s"} sur ${total} encore ouvert${open === 1 ? "" : "s"}`,
    sharedInfo:
      "Courses en commun : toutes les personnes avec ce lien voient le même état – l'affichage se met à jour automatiquement.",
    emptyList: "Cette liste de courses est encore vide.",
    allDone: "Tout est acheté – aucun article ouvert.",
    checkAria: (name: string) => `Cocher ${name}`,
    uncheckAria: (name: string) => `Rouvrir ${name}`,
    toggleFailed: "Échec du cochage",
  },
  shoppingPrint: {
    docTitle: "Liste de courses à imprimer",
    appTitle:
      "ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
    printButton: "Imprimer / Enregistrer en PDF",
    printBrowserHint:
      "Dans l'app installée, le bouton ouvre la vue dans le navigateur – imprime ou enregistre en PDF depuis son menu.",
    headerKicker: "ReiseKompass · Liste de courses",
    title: "Liste de courses",
    meta: (items: number, categories: number) =>
      `${items} ${items === 1 ? "article ouvert" : "articles ouverts"} · ${categories} ${categories === 1 ? "catégorie" : "catégories"}`,
    printedOn: (date: string) => `État : ${date}`,
    emptyList: "Aucun article ouvert – tout est acheté.",
    footer:
      "Bonnes courses ! · ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
  },
  menuPlan: {
    title: "Plan des repas",
    subtitle:
      "Planifie pour chaque jour de ton séjour ce qui arrive sur la table de camping.",
    loginFeature: "ton plan des repas",
    notFoundTitle: "Séjour introuvable",
    notFoundText: "Ce séjour n'existe pas ou n'appartient pas à ton compte.",
    backToTrips: "Vers «Mes voyages»",
    daysCount: (n: number) => (n === 1 ? "1 jour" : `${n} jours`),
    slotEmpty: "Rien de prévu pour l'instant",
    planSlotAria: (meal: string, day: string) => `Planifier ${meal} le ${day}`,
    clearSlotAria: (meal: string, day: string) => `Vider ${meal} le ${day}`,
    dialogTitle: (meal: string) => `Planifier : ${meal}`,
    dialogDescription:
      "Choisis une recette du livre de recettes ou saisis un texte libre.",
    searchPlaceholder: "Chercher une recette …",
    searchAria: "Chercher une recette",
    chooseRecipeAria: (name: string) => `Choisir la recette ${name}`,
    minutes: (n: number) => `${n} min`,
    ownBadge: "Personnelle",
    noRecipesFound:
      "Aucune recette trouvée – utilise le texte libre ci-dessous.",
    freeTextLabel: "Ou texte libre",
    freeTextPlaceholder: "p. ex. restes de la veille, pizzeria du village …",
    freeTextSave: "Utiliser le texte libre",
    saved: "Plan des repas mis à jour",
    addIngredients: "Ingrédients des recettes prévues sur la liste de courses",
    noPlannedRecipes:
      "Aucune recette attribuée pour l'instant – choisis d'abord des recettes dans les créneaux de repas.",
    summedFrom: (count: number) => `total de ${count} lignes d'ingrédients`,
    printButton: "Imprimer",
    autofillButton: "Remplir automatiquement",
    autofillNothing: "Aucun créneau de repas vide à remplir.",
    autofillWeatherNote:
      "Météo prise en compte : pas de recette au feu les jours de pluie, le gril d’abord les soirs secs.",
    autofillDone: (n: number) =>
      n === 1
        ? "1 repas planifié automatiquement"
        : `${n} repas planifiés automatiquement`,
    autofillUndo: "Annuler",
    autofillUndone: "Planification automatique retirée",
    autofillFailed: "Le remplissage automatique a échoué",
    editedBy: name => `par ${name}`,
    editedByTitle: (name, date) =>
      `Dernière modification par ${name} le ${date}`,
    dayNoteAria: (day: string) => `Modifier la note du jour pour ${day}`,
    dayNoteTitle: "Note du jour",
    dayNoteDescription:
      "Une courte note pour la journée – tous les compagnons de voyage la voient dans le plan des menus.",
    dayNoteLabel: "Note",
    dayNotePlaceholder: "p. ex. Soirée pizzeria",
    dayNoteRemove: "Supprimer la note",
    dayNoteSaved: "Note enregistrée",
    dayNoteRemoved: "Note supprimée",
    previewAria: (name: string) => `Voir la recette ${name}`,
    previewServings: (n: number) => `${n} portions`,
    previewIngredients: "Ingrédients",
    stockAllCovered:
      "Tous les ingrédients sont dans la glacière ou la réserve.",
    stockMissing: (list: string) => `Manque dans la réserve : ${list}`,
    previewSteps: "Préparation",
    previewTip: "Astuce",
    previewOpenInBook: "Ouvrir dans le livre de recettes",
  },
  tripShopping: {
    title: "Liste de courses du séjour",
    subtitle:
      "La liste de courses commune de ce séjour – toutes les personnes du voyage voient et modifient le même état.",
    loginFeature: "la liste de courses du séjour",
    openButton: "Liste de courses du séjour",
    openAria: (name: string) => `Ouvrir la liste de courses du séjour ${name}`,
    backToMenuPlan: "Vers le plan des repas",
    toPersonalLists: "Mes listes",
    emptyTitle: "Pas encore d'entrées",
    emptyText:
      "Ajoute des entrées ci-dessus – ou reprends les ingrédients des recettes prévues depuis le plan des repas.",
    byUser: (name: string) => `par ${name}`,
    chooseTitle: "Sur quelle liste de courses ?",
    chooseDescription:
      "Ce séjour est partagé : les ingrédients peuvent aller sur la liste commune du séjour ou sur ta liste de courses personnelle.",
    chooseTripList: "Liste du séjour",
    chooseTripListHint: "En commun avec toutes les personnes du voyage",
    choosePersonalList: "Liste personnelle",
    choosePersonalListHint: "Visible uniquement par toi",
    addedFromMenu: (n: number) =>
      n === 1
        ? "1 ingrédient ajouté à la liste de courses du séjour"
        : `${n} ingrédients ajoutés à la liste de courses du séjour`,
    openList: "Vers la liste du séjour",
  },
  menuPlanPrint: {
    docTitle: (name: string) => `${name} – plan des repas à imprimer`,
    docTitleFallback: "Plan des repas",
    appTitle:
      "ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
    notFound: "Ce séjour est introuvable.",
    printButton: "Imprimer / Enregistrer en PDF",
    printBrowserHint:
      "Dans l'app installée, le bouton ouvre la vue dans le navigateur – imprime ou enregistre en PDF depuis son menu.",
    headerKicker: "ReiseKompass · Plan des repas",
    printedOn: (date: string) => `État : ${date}`,
    dayHeader: "Jour",
    footer:
      "Bon appétit ! · ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
  },
  family: {
    title: "Mode famille",
    subtitle:
      "Listes de bagages adaptées aux enfants, occupations pendant le montage de la tente et savoir nature ludique.",
    offlineNote:
      "Les chasses au trésor et les quiz fonctionnent entièrement hors ligne – idéal pour les campings isolés.",
    huntsTitle: "Chasses au trésor",
    huntsSubtitle:
      "De quoi occuper les enfants pendant que la tente se monte – la progression est enregistrée sur l'appareil.",
    startHuntAria: (title: string) => `Démarrer la chasse au trésor ${title}`,
    durationShort: (n: number) => `env. ${n} min`,
    durationLong: (n: number) => `env. ${n} minutes`,
    stationsCount: (n: number) => `${n} ${n === 1 ? "étape" : "étapes"}`,
    playOnPhone: "Jouer sur le téléphone",
    printPdf: "À imprimer (PDF)",
    ownHuntsTitle: "Tes chasses au trésor",
    ownHuntsSubtitle:
      "Invente tes propres aventures – parfaitement adaptées à votre camping et à l'âge de tes enfants.",
    play: "Jouer",
    print: "Imprimer",
    deleteConfirm: (title: string) =>
      `Vraiment supprimer la chasse au trésor « ${title} » ?`,
    newHunt: "Créer une nouvelle chasse",
    newHuntAria: "Créer une nouvelle chasse au trésor",
    quizzesTitle: "Quiz nature",
    quizzesSubtitlePrefix: "Apprendre en jouant – en complément du ",
    quizzesSubtitleLink: "lexique Explorateur nature",
    quizzesSubtitleSuffix: ".",
    lexiconQuizTitle: "Quiz nature",
    lexiconQuizAgeHint: "dès 7 ans env.",
    lexiconQuizBadge: "issu du lexique",
    lexiconQuizHint:
      "Recomposé à partir du lexique nature à chaque démarrage – jouable aussi en duel.",
    startQuizAria: (title: string) => `Démarrer le quiz ${title}`,
    questionCount: (n: number) => `${n} questions`,
    progressAria: (done: number, total: number) =>
      `${done} étapes sur ${total} réussies`,
    collectedLetters: "Lettres récoltées :",
    stationDoneAria: (title: string) => `Étape réussie : ${title}`,
    letterBadge: (letter: string) => `Lettre : ${letter}`,
    showHint: "Afficher l'indice",
    readAloudAria: (title: string) => `Lire l'étape ${title} à voix haute`,
    readAloudStopAria: (title: string) =>
      `Arrêter la lecture de l'étape ${title}`,
    secretStations: (n: number) =>
      n === 1
        ? "Encore 1 étape secrète – coche l'étape actuelle pour continuer !"
        : `Encore ${n} étapes secrètes – coche l'étape actuelle pour continuer !`,
    solutionWordLine: (word: string) => `Mot-code : ${word}`,
    allDone: "Toutes les étapes sont réussies !",
    resetAria: "Réinitialiser la progression",
    restart: "Recommencer",
    done: "Terminé",
    scoreLine: (score: number, total: number) =>
      `${score} bonnes réponses sur ${total} !`,
    verdictPerfect: "Parfait – tu es prêt·e pour la nature sauvage !",
    verdictGood: "Bravo ! La prochaine fois, tu les auras toutes.",
    verdictTryAgain:
      "C'est en s'exerçant qu'on progresse – réessaie tout de suite !",
    again: "Encore une fois",
    questionProgress: (current: number, total: number) =>
      `Question ${current} sur ${total}`,
    points: (n: number) => `${n} ${n === 1 ? "point" : "points"}`,
    quizProgressAria: "Progression du quiz",
    answerAria: (option: string) => `Réponse : ${option}`,
    showResult: "Afficher le résultat",
    nextQuestion: "Question suivante",
    ownBadge: "Personnel",
    newQuiz: "Créer un nouveau quiz",
    newQuizAria: "Créer un nouveau quiz",
    quizDeleteConfirm: (title: string) =>
      `Vraiment supprimer le quiz « ${title} » ?`,
    quizShareButton: "Partager",
    quizShareAria: (title: string) => `Partager le quiz ${title} par lien`,
    quizShareTitle: "Partager le quiz",
    quizShareDescription:
      "Qui a le lien peut voir le quiz et, avec un compte, le reprendre comme quiz personnel.",
    quizShareCopied: "Lien de partage copié – transmets-le !",
    quizShareFailed: "Le partage a échoué",
    quizSharedBadge: "partagé",
    quizUnshare: "Arrêter le partage",
    quizUnshared: "Partage terminé – le lien n'est plus valable",
    quizUnshareFailed: "Le partage n'a pas pu être arrêté",
    quizQrAlt: (title: string) => `Code QR du lien de partage du quiz ${title}`,
    quizQrTitle: "Transmettre directement",
    quizQrText:
      "Laisse les autres scanner le code avec l'appareil photo du téléphone – le quiz s'ouvre aussitôt.",
    stopwatchAria: "Temps écoulé du chronomètre",
    bestTimeBadge: (time: string) => `Record : ${time}`,
    newBestTimeLine: (time: string) => `${time} – Nouveau record !`,
    finishTimeLine: (time: string, best: string) =>
      `Ton temps : ${time} · Record : ${best}`,
    childrenTitle: "Enfants & badges",
    childrenSubtitle:
      "Ajoute tes enfants – ils collectionnent des badges lors des chasses au trésor et des quiz.",
    childrenEmpty:
      "Aucun enfant pour l'instant – ajoute un prénom ci-dessous pour pouvoir collectionner des badges.",
    childNamePlaceholder: "Prénom de l'enfant",
    addChild: "Ajouter un enfant",
    renameChildAria: (name: string) => `Renommer ${name}`,
    renameSaveAria: (name: string) =>
      `Enregistrer le nouveau prénom de ${name}`,
    deleteChildConfirm: (name: string) =>
      `Vraiment supprimer ${name} avec tous ses badges ?`,
    deleteChildAria: (name: string) => `Supprimer ${name}`,
    badgeCount: (n: number, total: number) => `${n} badge(s) sur ${total}`,
    badgeEarnedOn: (date: string) => `Obtenu le ${date}`,
    badgeEarnedToast: (child: string, badge: string) =>
      `${child} a gagné un nouveau badge : ${badge}`,
    whoPlaysTitle: "Qui joue ?",
    whoPlaysDescription:
      "Choisis qui joue – l'enfant collectionne des badges pour les chasses et quiz terminés.",
    whoPlaysNobody: "Jouer sans badges",
    duelMode: "Duel : deux enfants s'affrontent",
    duelSetupTitle: "Duel de quiz",
    duelSetupDescription:
      "Deux enfants répondent à tour de rôle aux mêmes questions – passez l'appareil après chaque tour.",
    duelPickFirst: "Qui commence ?",
    duelPickSecond: "Qui joue contre ?",
    duelFirstChosen: (name: string) => `${name} commence.`,
    duelVs: (a: string, b: string) => `${a} contre ${b}`,
    duelNowPlaying: (name: string) => `À ${name} de jouer !`,
    duelHandoverHint: (name: string) => `Passe l'appareil à ${name}.`,
    duelGo: "C'est parti !",
    duelPassTo: (name: string) => `Continuer – au tour de ${name}`,
    duelScore: (name: string, points: number) => `${name} : ${points}`,
    duelTie: "Égalité !",
    duelWinner: (name: string) => `${name} gagne !`,
    quizEditor: {
      titleEdit: "Modifier le quiz",
      titleNew: "Créer son propre quiz",
      description:
        "Tes propres questions avec réponses et explication – enregistré dans ton compte, jouable comme les quiz intégrés.",
      updated: "Quiz mis à jour",
      created: "Quiz créé",
      titleLabel: "Titre",
      titlePlaceholder: "p. ex. Le quiz de notre camping",
      questionsTitle: (n: number) => `Questions (${n})`,
      questionPlaceholder: "Question, p. ex. « Quel oiseau chante la nuit ? »",
      questionAria: (n: number) => `Question ${n}`,
      removeQuestionAria: (n: number) => `Supprimer la question ${n}`,
      correctHint: "Marque la bonne réponse avec le point à gauche.",
      optionPlaceholder: (n: number) => `Réponse ${n}`,
      optionAria: (q: number, o: number) => `Réponse ${o} de la question ${q}`,
      correctAria: (q: number, o: number) =>
        `Marquer la réponse ${o} de la question ${q} comme correcte`,
      explanationPlaceholder: "Explication après la réponse (facultatif)",
      explanationAria: (n: number) => `Explication de la question ${n}`,
      addQuestion: "Ajouter une question",
    },
    editor: {
      titleEdit: "Modifier la chasse au trésor",
      titleNew: "Créer sa propre chasse au trésor",
      description:
        "Histoire, étapes et final au trésor – enregistrée dans ton compte, jouable et imprimable comme les chasses intégrées.",
      updated: "Chasse au trésor mise à jour",
      created: "Chasse au trésor créée",
      titleLabel: "Titre",
      titlePlaceholder: "p. ex. Le secret de la rive du lac",
      ageLabel: "Âge (facultatif)",
      agePlaceholder: "p. ex. dès 6 ans",
      durationLabel: "Durée (minutes)",
      introLabel: "La mission (histoire cadre)",
      introPlaceholder:
        "Qui a besoin d'aide ? Que s'est-il passé ? Quel est le but ?",
      prepLabel: "Pour les adultes (facultatif)",
      prepPlaceholder: "Que faut-il cacher ou préparer à l'avance ?",
      stationsTitle: (n: number) => `Étapes (${n})`,
      defaultStationTitle: (n: number) => `Étape ${n}`,
      stationTitleAria: (n: number) => `Titre de l'étape ${n}`,
      removeStationAria: (n: number) => `Supprimer l'étape ${n}`,
      storyPlaceholder:
        "Récit (facultatif) : comment l'histoire continue-t-elle ici ?",
      storyAria: (n: number) => `Histoire de l'étape ${n}`,
      taskPlaceholder:
        "Tâche ou énigme, p. ex. « Trouvez trois feuilles différentes »",
      taskAria: (n: number) => `Tâche de l'étape ${n}`,
      hintPlaceholder: "Indice si les enfants bloquent (facultatif)",
      hintAria: (n: number) => `Indice de l'étape ${n}`,
      letterPlaceholder: "Let.",
      letterAria: (n: number) => `Lettre de l'étape ${n} pour le mot-code`,
      addStation: "Ajouter une étape",
      solutionPreviewLabel: "Mot-code formé par les lettres :",
      finaleLabel: "Le final (trésor/récompense)",
      finalePlaceholder:
        "Que se passe-t-il quand toutes les étapes sont réussies ?",
    },
  },
  travelBingo: {
    title: "Bingo de voyage",
    subtitle:
      "Qu'est-ce que vous découvrez en route ? Touche ce qui passe – une ligne, une colonne ou une diagonale complète, c'est bingo.",
    empty:
      "Pas encore de carte – crée-en une ci-dessous. Deux enfants reçoivent deux cartes différentes.",
    howTo:
      "Chaque carte est mélangée à neuf, aucune ne ressemble à l'autre. La progression reste sur l'appareil – même sans réseau.",
    namePlaceholder: "Nom",
    nameAria: (name: string) => `Nom de la carte de ${name}`,
    newNameAria: "Nom de la nouvelle carte",
    sizeBadge: (size: number) => `${size} × ${size} cases`,
    sizeOption: (size: number) => `${size} × ${size}`,
    switchSize: (size: number) => `Passer en ${size} × ${size}`,
    switchSizeAria: (name: string, size: number) =>
      `Passer la carte de ${name} en ${size} × ${size}`,
    cardFallbackName: (n: number) => `Carte ${n}`,
    cellAria: (label: string) => `${label} – marquer comme trouvé`,
    cellFoundAria: (label: string) => `${label} – trouvé, touche pour annuler`,
    progressAria: (name: string) => `Progression du bingo de ${name}`,
    foundCount: (done: number, total: number) => `${done} sur ${total} trouvés`,
    bingoBanner: (lines: number) =>
      lines === 1
        ? "Bingo ! Une ligne est complète."
        : `Bingo ! Déjà ${lines} lignes complètes.`,
    fullCardBanner: "Carte entièrement remplie – vous avez tout découvert !",
    bingoToast: (name: string) => `Bingo pour ${name} !`,
    fullCardToast: (name: string) => `${name} a rempli toute la carte !`,
    newCard: "Nouvelle carte",
    newCardAria: (name: string) => `Mélanger une nouvelle carte pour ${name}`,
    reset: "Réinitialiser",
    resetAria: (name: string) => `Réinitialiser la progression de ${name}`,
    removeConfirm: (name: string) => `Supprimer vraiment la carte de ${name} ?`,
    removeAria: (name: string) => `Supprimer la carte de ${name}`,
    addCard: "Ajouter une carte",
    maxCardsReached: (n: number) =>
      `Pas plus de ${n} cartes à la fois – supprime-en une d'abord.`,
  },
  bedtimeStories: {
    title: "Histoires du soir",
    subtitle:
      "De courtes histoires à lire à voix haute – forêt, montagne et camping, trois à cinq minutes, et puis au lit.",
    empty:
      "Aucune histoire ne correspond à cette sélection – choisis une autre saison ou un autre âge.",
    seasonFilterLabel: "Saison :",
    seasonAll: "Toutes",
    seasonAllYear: "toute l'année",
    season: {
      spring: "Printemps",
      summer: "Été",
      autumn: "Automne",
      winter: "Hiver",
    },
    ageFilterLabel: "Âge :",
    ageAll: "Tous",
    ageOption: (age: number) => `${age} ans`,
    ageBadge: (age: number) => `dès ${age} ans`,
    minutesBadge: (minutes: number) => `${minutes} min de lecture`,
    readBadge: "déjà lue",
    openAria: (title: string) => `Ouvrir l'histoire ${title}`,
    readAloud: "Écouter l'histoire",
    readAloudStop: "Arrêter la lecture",
    readAloudAria: (title: string) => `Lire l'histoire ${title} à voix haute`,
    readAloudStopAria: (title: string) => `Arrêter la lecture de ${title}`,
    markRead: "Marquer comme lue",
    markUnread: "Enlever le marqueur",
  },
  arrival: {
    title: "On arrive quand ?",
    subtitle:
      "La barre de progression pour la banquette arrière : quelle part du trajet jusqu'au camping avez-vous déjà faite ?",
    loginHint:
      "Connecte-toi pour que ReiseKompass puisse te proposer tes emplacements enregistrés comme destination.",
    noSpots:
      "Aucun emplacement enregistré pour l'instant – crée d'abord un emplacement, tu pourras ensuite le choisir comme destination.",
    suggestedFromTrip:
      "L'emplacement de ton séjour en cours ou du prochain est proposé – tu peux aussi en choisir un autre.",
    suggestedWithoutTrip:
      "Choisis l'emplacement vers lequel vous êtes en route.",
    targetSelectAria: "Choisir la destination du trajet",
    targetPlaceholder: "Choisir la destination",
    start: "C'est parti",
    startNote:
      "En touchant ce bouton, ta position actuelle devient le point de départ. Ensuite, ReiseKompass mesure grossièrement une fois par minute – cela ménage la batterie.",
    locationFailed:
      "Impossible de déterminer la position – sans point de départ, cela ne marche malheureusement pas.",
    straightLineBadge: "à vol d'oiseau",
    straightLineNote:
      "Le calcul se fait à vol d'oiseau. La route est plus longue – nettement plus longue par un col.",
    stop: "Terminer le trajet",
    progressAria: (name: string) => `Progression du trajet vers ${name}`,
    startLabel: "Départ",
    targetLabel: "But",
    percent: (value: number) => `${value} %`,
    remaining: (distance: string) => `encore ${distance} à vol d'oiseau`,
    ofTotal: (distance: string) => `sur ${distance} au total`,
    arrived: (name: string) => `Arrivés – bienvenue à ${name} !`,
    encouragement: (next: number) =>
      next >= 100
        ? "Le dernier bout – vous y êtes presque !"
        : `Continuez comme ça – la barre des ${next} pour cent n'est plus loin.`,
    milestoneToast: (percent: number) => `${percent} % de fait !`,
    refresh: "Mesurer maintenant",
    lastFix: (time: string) => `dernière mesure à ${time}`,
    noFixYet: "pas encore de mesure",
    geoDenied:
      "La localisation est bloquée – autorise-la dans les réglages du navigateur, sinon la barre reste immobile.",
    geoUnsupported: "Ce navigateur ne connaît pas la localisation.",
    geoFailed:
      "La position n'a pas pu être déterminée – ReiseKompass réessaie dans une minute.",
  },
  huntPrint: {
    docTitle: (title: string) => `${title} – chasse au trésor à imprimer`,
    docTitleFallback: "Chasse au trésor",
    appTitle:
      "ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
    notFound: "Cette chasse au trésor est introuvable.",
    printButton: "Imprimer / Enregistrer en PDF",
    printBrowserHint:
      "Dans l'app installée, le bouton ouvre la vue dans le navigateur – imprime ou enregistre en PDF depuis son menu.",
    headerKicker: "ReiseKompass · Chasse au trésor",
    meta: (age: string, minutes: number, stations: number) =>
      `${age} · env. ${minutes} minutes · ${stations} ${stations === 1 ? "étape" : "étapes"}`,
    missionTitle: "La mission",
    adultsTitle: "Pour les adultes (à lire avant)",
    taskLabel: "Tâche :",
    hintLabel: "Indice (seulement si vous bloquez) :",
    doneLabel: "Réussi ? Cochez :",
    letterLabel: "Votre lettre :",
    solutionTitle: "Le mot-code",
    solutionText: (n: number) =>
      `Inscrivez les lettres récoltées dans l'ordre (${n} lettres) :`,
    finaleTitle: "Le final",
    footer:
      "Bonne découverte ! · ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
  },
  badgeCertificate: {
    docTitle: (name: string) => `Diplôme pour ${name}`,
    docTitleFallback: "Diplôme",
    appTitle:
      "ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
    loginFeature: "le diplôme des badges",
    notFound: "Cet enfant n'a pas été trouvé.",
    galleryLink: "Imprimer le diplôme",
    printButton: "Imprimer le diplôme",
    printBrowserHint:
      "Dans l'app installée, le bouton ouvre la vue dans le navigateur – imprime ou enregistre en PDF depuis le menu.",
    kicker: "ReiseKompass · Mode famille",
    heading: "Diplôme",
    awardedTo: "décerné à",
    badgesIntro: (n: number) =>
      n === 1 ? "pour ce badge mérité" : `pour ces ${n} badges mérités`,
    earnedOn: (date: string) => `obtenu le ${date}`,
    noBadges:
      "Aucun badge mérité pour l'instant – joue à une chasse au trésor ou à un quiz, et le diplôme se remplira.",
    issuedOn: (date: string) => `Établi le ${date}`,
    footer:
      "ReiseKompass – ta boussole pour les vacances, le camping et les excursions",
  },
  notFound: {
    heading: "Page introuvable",
    text1: "Cette page n'existe malheureusement pas.",
    text2: "Elle a peut-être été déplacée ou supprimée.",
    goHome: "Vers la page d'accueil",
  },
  loginPrompt: {
    required: "Connexion requise",
    body: feature =>
      `Connecte-toi pour enregistrer ${feature} et synchroniser sur tous tes appareils.`,
    cta: "Se connecter maintenant",
  },
  pageHeader: {
    overview: "Vue d'ensemble",
    backAria: label => `Retour : ${label}`,
  },
  quickActions: {
    fabAria: "Ouvrir les actions rapides",
    title: "Actions rapides",
    subtitle: "Va droit au but – sans passer par la page d'accueil.",
    searchPlaceholder: "Chercher une action …",
    noResults: "Aucune action trouvée.",
    newTrip: "Nouvelle entrée de voyage",
    newPackList: "Nouvelle liste de bagages",
    recipeSearch: "Chercher une recette",
    sos: "SOS & urgence",
    shoppingAdd: "Ajouter à la liste de courses",
    shoppingPlaceholder: "p. ex. lait …",
    shoppingSubmit: "Ajouter",
    shoppingAdded: (name: string) => `${name} ajouté à la liste de courses`,
    shoppingExists: (name: string) =>
      `${name} est déjà sur la liste de courses`,
    shoppingFailed: "L'entrée n'a pas pu être enregistrée",
    backToActions: "Retour aux actions",
  },
  install: {
    title: "Installer ReiseKompass",
    description:
      "Comme app sur ton appareil – démarre plus vite et fonctionne hors ligne.",
    installButton: "Installer",
    iosStep1: "Touche l'icône de partage",
    iosStep2: "puis choisis «Sur l'écran d'accueil» pour installer l'app.",
    shareIcon: "Icône de partage",
    dismiss: "Fermer l'invite d'installation",
  },
  update: {
    title: "Nouvelle version disponible",
    description:
      "Une version à jour de ReiseKompass est prête. L'actualisation recharge la page une fois.",
    reloadButton: "Actualiser",
    dismiss: "Fermer l'avis de mise à jour",
  },
  whatsNew: {
    title: "Quoi de neuf",
    startIntro: "Voici ce qui a changé depuis ta dernière visite :",
    allIntro: "Les dernières nouveautés en un coup d'œil :",
    showOlder: "Afficher les plus anciennes",
    confirm: "Compris",
  },
  shareTarget: {
    title: "Photos partagées",
    subtitle:
      "Ajoute directement à un voyage les photos partagées depuis ton appareil.",
    loginFeature: "l'ajout de photos partagées",
    emptyTitle: "Aucune photo partagée trouvée",
    emptyText:
      "Ouvre cette page via la fonction de partage de ton appareil : choisir une photo → Partager → ReiseKompass. L'entrée apparaît dans le menu de partage après (ré)installation ou mise à jour de l'app.",
    photosCount: (n: number) =>
      n === 1 ? "1 photo prête" : `${n} photos prêtes`,
    photoAlt: (n: number) => `Photo partagée ${n}`,
    removePhotoAria: (n: number) => `Supprimer la photo partagée ${n}`,
    tripLabel: "Vers quel voyage ?",
    tripAria: "Choisir un voyage",
    noTrips:
      "Pas encore de voyage – crée d'abord une entrée dans «Mes voyages».",
    toTrips: "Vers «Mes voyages»",
    upload: "Envoyer les photos au voyage",
    uploading: (done: number, total: number) =>
      `Envoi de la photo ${done} sur ${total} …`,
    uploadFailed: (n: number) =>
      n === 1
        ? "1 photo n'a pas pu être envoyée."
        : `${n} photos n'ont pas pu être envoyées.`,
    limitReached:
      "Limite de photos du voyage atteinte – toutes les photos n'ont pas été enregistrées.",
    successTitle: "Photos enregistrées",
    successText: (n: number) =>
      n === 1
        ? "1 photo a été ajoutée au voyage."
        : `${n} photos ont été ajoutées au voyage.`,
    toTrip: "Vers le voyage",
  },

  notes: {
    title: "Notes",
    subtitle:
      "Notes libres avec mots-clés – pour tout ce qui n'a sa place dans aucun autre module.",
    loginFeature: "tes notes",
    addButton: "Nouvelle note",
    searchPlaceholder: "Rechercher dans les notes …",
    searchAria: "Rechercher dans les titres, les textes et les mots-clés",
    tagFilterAria: "Filtrer par mots-clés",
    tagFilterClear: "Enlever le filtre",
    emptyTitle: "Aucune note pour l'instant",
    emptyBody:
      "Note ce qui ne trouve place nulle part ailleurs – le numéro du gardien, l'astuce de l'arrache-piquet, une idée pour l'été prochain.",
    noMatches: "Aucune note ne correspond à ta recherche.",
    untitled: "Sans titre",
    updatedAt: (date: string) => `modifiée le ${date}`,
    newTitle: "Nouvelle note",
    editTitle: "Modifier la note",
    dialogDesc:
      "Le titre est facultatif. Les mots-clés t'aident à retrouver tes notes – ils apparaissent comme filtres au-dessus de la liste.",
    titleLabel: "Titre (facultatif)",
    titlePlaceholder: "p. ex. idées pour le Tessin",
    textLabel: "Note",
    textPlaceholder: "Écris simplement …",
    checkboxHint:
      "Astuce : une ligne comme « - [ ] échanger la bouteille de gaz » devient une case à cocher.",
    tagsLabel: "Mots-clés",
    tagsPlaceholder: "p. ex. Tessin, été, tente",
    tagsHint: (max: number) =>
      `Sépare-les par des virgules, ${max} mots-clés au maximum. Les majuscules n'ont pas d'importance.`,
    textRequired: "Écris d'abord quelque chose.",
    save: "Enregistrer",
    saved: "Note enregistrée",
    updated: "Note mise à jour",
    saveFailed: "La note n'a pas pu être enregistrée",
    deleted: "Note supprimée",
    deleteFailed: "La note n'a pas pu être supprimée",
    deleteConfirm: "Supprimer vraiment cette note ?",
    editAria: (title: string) => `Modifier la note ${title}`,
    deleteAria: (title: string) => `Supprimer la note ${title}`,
    pinAria: (title: string) => `Épingler ${title}`,
    unpinAria: (title: string) => `Détacher ${title}`,
    photoLabel: "Photo (facultatif)",
    photoChoose: "Choisir une photo",
    photoChange: "Changer la photo",
    photoRemove: "Retirer la photo",
    photoPreviewAlt: "Aperçu de la photo de la note",
    photoHint: "JPEG, PNG ou WebP – réduite automatiquement avant l'envoi.",
    photoUploading: "Envoi de la photo …",
    photoUploadFailed: "Enregistré, mais la photo n'a pas pu être envoyée.",
    photoTooLarge: "La photo est trop grande (max. 5 Mo).",
    photoHeic: "Le navigateur ne peut pas lire HEIC/HEIF – exportez en JPEG.",
    photoReadFailed: "L'image n'a pas pu être lue.",
    photoRemoveFailed: "La photo n'a pas pu être retirée.",
    photoAlt: (title: string) => `Photo de la note ${title}`,
  },
  shareLinks: {
    title: "Liens de partage actifs",
    intro:
      "Tout ce que tu partages actuellement par lien, au même endroit. La désactivation est immédiate – le lien ne mène ensuite nulle part.",
    empty: "Rien n'est partagé par lien pour le moment.",
    unnamed: "Sans nom",
    expires: (date: string) => `expire le ${date}`,
    copyAria: (label: string) => `Copier le lien vers ${label}`,
    revokeButton: "Désactiver",
    revokeConfirm: (label: string) =>
      `Désactiver le lien de partage vers « ${label} » ?`,
    revoked: "Lien de partage désactivé",
    kinds: {
      spot: "Dossier d'emplacement",
      packList: "Liste de bagages",
      packTemplate: "Modèle de liste",
      trip: "Voyage",
      recipe: "Recette",
      quiz: "Quiz",
      shopping: "Liste de courses",
      track: "Randonnée",
      location: "Position",
    },
  },
  devices: {
    title: "Appareils connectés",
    intro:
      "Chaque connexion à ce compte, avec la dernière activité. Un appareil déconnecté est exclu immédiatement – même si c'est le téléphone oublié dans le train.",
    empty: "Aucune connexion enregistrée.",
    unknownDevice: "Appareil inconnu",
    currentBadge: "Cet appareil",
    lastSeen: (date: string) => `Dernière activité : ${date}`,
    signedInAt: (date: string) => `Connecté : ${date}`,
    revokeButton: "Déconnecter",
    revokeConfirm: "Déconnecter cet appareil ?",
    revoked: "Appareil déconnecté",
    revokeOthersButton: "Déconnecter tous les autres appareils",
    revokeOthersConfirm:
      "Déconnecter tous les autres appareils ? Cet appareil reste connecté.",
    othersRevoked: (n: number) =>
      n === 1 ? "1 appareil déconnecté" : `${n} appareils déconnectés`,
    legacyHint:
      "Les connexions antérieures à cet aperçu n'apparaissent qu'après la prochaine connexion de l'appareil concerné.",
  },
  fuelLog: {
    vehicleLabel: "Véhicule",
    vehicleNone: "Sans véhicule",
    vehicleAll: "Tous les véhicules",
    chartTitle: "Évolution de la consommation",
    chartHint:
      "Consommation par tronçon entre deux pleins, selon le kilométrage – uniquement les tronçons plausibles.",
    csvButton: "Exporter en CSV",
    csvHeaders: [
      "Date",
      "Kilométrage",
      "Litres",
      "Montant CHF",
      "Consommation l/100 km",
      "Véhicule",
    ],
    title: "Carnet de carburant",
    subtitle: "Les pleins avec kilométrage – pour la consommation réelle.",
    loginFeature: "le carnet de carburant",
    averageTitle: "Consommation moyenne",
    averageHint:
      "Pondérée sur tous les tronçons plausibles. Le calculateur de frais de route de la caisse peut reprendre cette valeur.",
    addTitle: "Saisir un plein",
    addHint:
      "Toujours faire le plein complet – le calcul entre deux pleins n'est juste qu'ainsi. Le prix est facultatif.",
    dayLabel: "Date",
    odometerLabel: "Kilométrage",
    litersLabel: "Litres",
    priceLabel: "Payé (CHF, facultatif)",
    addButton: "Saisir",
    saved: "Plein enregistré",
    odometerInvalid: "Merci d'indiquer un kilométrage valide.",
    litersInvalid: "Merci d'indiquer les litres (max. 200).",
    priceInvalid: "Le montant est invalide.",
    empty:
      "Pas encore de pleins. Dès le deuxième, le carnet calcule la consommation.",
    segmentLine: (km: number, l100: string) =>
      `${km} km depuis le dernier plein · ${l100} l/100 km`,
    segmentImplausible: "(non plausible, exclu de la moyenne)",
    deleteConfirm: "Supprimer ce plein ?",
    deleteAria: (km: number) => `Supprimer le plein à ${km} km`,
  },
  stats: {
    countriesTitle: "Pays visités",
    countriesUnassigned: (n: number) =>
      n === 1
        ? "1 voyage sans pays reconnaissable (le lieu n'en nomme aucun)."
        : `${n} voyages sans pays reconnaissable (le lieu n'en nomme aucun).`,
    inventoryValueTitle: "Valeur de l'inventaire",
    inventoryLink: "Vers l'inventaire",
    inventoryValueHint: (n: number) =>
      n === 1
        ? "Limite basse – 1 objet sans prix saisi."
        : `Limite basse – ${n} objets sans prix saisi.`,
    expensesTitle: "Dépenses de tous les voyages",
    expensesLink: "Vers les voyages",
    expensesTotal: "Total",
    expensesPerNight: "Ø par nuit",
    expensesTopCategory: "Catégorie la plus chère",
    expensesYearDetail: (trips: number, nights: number, perNight: string) =>
      `${trips === 1 ? "1 voyage" : `${trips} voyages`} · ${nights === 1 ? "1 nuit" : `${nights} nuits`} · ${perNight}/nuit`,
    expensesHint:
      "Sont comptées les caisses de tes propres voyages. Une dépense compte pour l'année du voyage – un voyage à cheval sur le Nouvel An figure entièrement dans l'année de son départ.",
    title: "Statistiques",
    subtitle:
      "Toutes tes analyses en un coup d'œil – voyages, chance météo, jalons, nœuds, espèces et famille.",
    loginFeature: "les statistiques",
    tripsTitle: "Statistiques des voyages",
    tripsLink: "Mes voyages",
    kindStatsTitle: "Voyages par type",
    kindStatsLine: (trips: number, nights: number) =>
      `${trips === 1 ? "1 voyage" : `${trips} voyages`} · ${nights === 1 ? "1 nuit" : `${nights} nuits`}`,
    tripsEmpty: "Aucun séjour enregistré pour l'instant.",
    nightsInYear: year => `Nuits ${year}`,
    nightsTotal: "Nuits au total",
    staysLabel: "Séjours",
    favoriteLabel: "Emplacement préféré",
    avgRatingLabel: "Note moyenne",
    hikeYearsTitle: "Bilan annuel des randonnées",
    hikeYearsLink: "Vers les randonnées",
    hikeYearsLine: (tours: number, km: string, ascent: string) =>
      tours === 1
        ? `1 sortie · ${km} km · ${ascent} m D+`
        : `${tours} sorties · ${km} km · ${ascent} m D+`,
    hikeYearsBike: (n: number) =>
      n === 1 ? "dont 1 sortie à vélo" : `dont ${n} sorties à vélo`,
    weatherLuckTitle: "Chance météo",
    weatherLuckDry: pct => `${pct} % de tes jours de camping ont été secs`,
    weatherLuckAvgMax: temp => `max. journalier moyen ${temp}°`,
    weatherLuckWarmest: (place, temp) =>
      `lieu le plus chaud : ${place} (${temp}°)`,
    weatherLuckHint: n =>
      n === 1
        ? "D'après l'archive météo de 1 séjour"
        : `D'après l'archive météo de ${n} séjours`,
    spotCostsTitle: "Comparatif des emplacements : prix par nuit",
    spotCostsLink: "Emplacements",
    spotCostsPerNight: (amount: string) => `${amount} / nuit`,
    spotCostsEstimate: (nights: number, amount: string) =>
      `≈ ${amount} pour ${nights === 1 ? "1 nuit" : `${nights} nuits`}`,
    spotCostsTotal: (amount: string) =>
      `Toutes tes nuits sur ces emplacements réunies : environ ${amount}.`,
    spotCostsHint:
      "Prix par nuit taxe de séjour et frais annexes compris, le moins cher en haut. Les totaux sont le produit nuits × prix et donc de simples estimations – ce que tu as vraiment payé figure dans la caisse du séjour concerné.",
    yearCompareTitle: "Nuitées par année",
    goalTitle: "Objectif annuel de nuitées",
    goalHint:
      "Fixe-toi un objectif – par exemple 30 nuits dehors – et regarde la barre grandir au fil de l'année.",
    goalLine: (nights: number, goal: number, year: number) =>
      `${nights} nuitées sur ${goal} en ${year}`,
    goalAria: (pct: number) => `Objectif annuel : ${pct} pour cent atteints`,
    goalReached: "Objectif atteint – belle année !",
    goalRemaining: (n: number) =>
      n === 1
        ? "Encore 1 nuit jusqu'à l'objectif"
        : `Encore ${n} nuits jusqu'à l'objectif`,
    goalSet: "Définir l'objectif",
    goalRemove: "Retirer l'objectif",
    nightsCount: n => (n === 1 ? "1 nuit" : `${n} nuits`),
    milestonesTitle: "Jalons",
    milestonesAchieved: (achieved, total) =>
      `${achieved} jalons atteints sur ${total}`,
    milestonesNextTitle: "Prochains objectifs",
    milestonesProgress: (current, target) => `${current} sur ${target}`,
    knotsTitle: "Progression des nœuds",
    knotsLink: "S'entraîner",
    knotsSummary: (secure, total) => `${secure} nœuds sur ${total} sont acquis`,
    knotsProgressAria: "Part des nœuds maîtrisés",
    knotsSecure: "acquis",
    knotsPractice: "à réviser",
    knotsFresh: "nouveaux",
    natureTitle: "Album des espèces",
    natureLink: "Ouvrir Nature",
    natureCollection: (seen, total) => `${seen} espèces observées sur ${total}`,
    natureSightings: n => (n === 1 ? "1 observation" : `${n} observations`),
    natureProgressAria: "Progression de l'album des espèces",
    familyTitle: "Badges des enfants",
    familyLink: "Mode famille",
    familyBadges: (earned, total) => `${earned} badges sur ${total}`,
    familyEmpty: "Aucun profil d'enfant créé pour l'instant.",
    footnote:
      "Tous ces chiffres viennent de tes propres saisies – cette page ne fait que les afficher, tu les modifies dans le module concerné.",
  },

  transit: {
    sectionAria: "Transports publics depuis l'emplacement",
    title: "Transports publics",
    subtitle: "Arrêts à proximité et leurs prochains départs.",
    subtitleAtPlace: place =>
      `Arrêts autour de ${place} et leurs prochains départs.`,
    loadingStations: "Recherche des arrêts …",
    loadingBoard: "Chargement des départs …",
    loadFailed:
      "L'horaire n'a pas pu être chargé pour l'instant. Réessaie dans un moment.",
    emptyStations:
      "L'horaire suisse ne trouve aucun arrêt ici. Il couvre la Suisse et le trafic frontalier – pour un emplacement plus loin à l'étranger, ReiseKompass ne sait rien ici.",
    emptyBoard: "Aucun départ n'est prévu prochainement depuis cet arrêt.",
    kind: {
      train: "Train",
      bus: "Bus",
      tram: "Tram",
      ship: "Bateau",
      cableway: "Téléphérique",
      other: "Arrêt",
    },
    stationAria: name => `Afficher les départs depuis ${name}`,
    distanceAway: value => `à ${value}`,
    delay: minutes => `+${minutes} min`,
    platform: value => `Quai ${value}`,
    refresh: "Actualiser",
    refreshStations: "Rechercher à nouveau les arrêts",
    source:
      "Données horaires de transport.opendata.ch – interrogées uniquement sur ton clic. Seuls les départs à venir sont affichés ; les retards figurent là où l'horaire les annonce.",
  },

  sharing: {
    validityLabel: "Valable",
    validityUnlimited: "illimité",
    validityDays: n => `${n} jours`,
    validityAria: "Validité du lien de partage",
    expiresOn: date => `Expire le ${date}`,
    expiredOrInvalid: "Lien expiré ou invalide",
  },
};
