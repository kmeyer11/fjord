export type Language = 'en' | 'da'

export const LOCALE: Record<Language, string> = { en: 'en-US', da: 'da-DK' }

const en = {
  nav: { projects: 'Projects', calendar: 'Calendar', settings: 'Settings' },

  dashboard: {
    title: 'Projects',
    newProject: 'New Project',
    loading: 'Loading…',
    empty: 'No projects yet — create your first one to start a backlog.',
    noTasksYet: 'No tasks yet',
    backlog: 'backlog',
    scheduled: 'scheduled',
    done: 'done',
  },

  newProjectModal: {
    title: 'New Project',
    cancel: 'Cancel',
    create: 'Create',
    name: 'Name',
    namePlaceholder: 'Homelab build',
    color: 'Color',
  },

  editProjectModal: {
    title: 'Edit Project',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete Project',
    deleteConfirm: (name: string) => `Delete "${name}" and all its tasks? This can't be undone.`,
  },

  board: {
    backlog: 'Backlog',
    scheduled: 'Scheduled',
    done: 'Done',
    addTask: 'Add task',
    taskTitlePlaceholder: 'Task title',
    loading: 'Loading…',
    loadError: "Couldn't load project",
  },

  taskModal: {
    title: 'Edit Task',
    cancel: 'Cancel',
    save: 'Save',
    fieldTitle: 'Title',
    fieldDescription: 'Description',
    descriptionPlaceholder: 'Add a description…',
    fieldCriticality: 'Criticality',
    delete: 'Delete Task',
    deleteOccurrence: 'Delete This Occurrence',
    deleteFuture: 'Delete This and Future Occurrences',
  },

  newTaskModal: {
    title: 'New Task',
    cancel: 'Cancel',
    create: 'Create',
  },

  calendar: {
    week: 'Week',
    month: 'Month',
    previous: 'Previous',
    next: 'Next',
    backlog: 'Backlog',
    scheduled: 'Scheduled',
    meetings: 'Meetings',
    newMeeting: 'New meeting',
    meetingTitlePlaceholder: 'Meeting title',
    meetingDateTime: 'Date & time',
    allDay: 'All day',
    repeatWeekly: 'Repeat weekly',
    nothingUnscheduled: 'Nothing unscheduled — drag a task here to unschedule it.',
    moreCount: (n: number) => `+${n} more`,
    loadError: 'Something went wrong loading the calendar',
  },

  externalEventModal: {
    close: 'Close',
    readOnly: 'Read-only',
    location: 'Location',
    description: 'Description',
    allDay: 'All day',
  },

  weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

  settings: {
    title: 'Settings',
    appleCalendar: 'Apple Calendar',
    connected: (email: string) => `Connected as ${email}`,
    notConnected: 'Not connected',
    connect: 'Connect',
    cancel: 'Cancel',
    disconnect: 'Disconnect',
    refreshNow: 'Refresh now',
    refreshing: 'Refreshing…',
    connecting: 'Connecting…',
    notSyncedYet: 'Not synced yet',
    lastSyncFailed: (err: string) => `Last sync failed: ${err}`,
    lastSynced: (when: string) => `Last synced ${when}`,
    connectHint: 'Read your existing calendars into Fjord, read-only.',
    emailPlaceholder: 'you@icloud.com',
    passwordPlaceholder: 'app-specific password',
    appSpecificHint: (link: string) => `Generate an app-specific password at ${link} — never your main Apple ID password.`,
    publishTitle: 'Publish to Apple Calendar',
    publishHint: "Subscribe to this feed once and Fjord's scheduled tasks show up as their own read-only calendar.",
    copyLink: 'Copy link',
    copied: 'Copied',
    subscribeSteps: 'Mac: File → New Calendar Subscription. iPhone: Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar.',
    passcode: 'Passcode',
    changePasscode: 'Change your passcode',
    passcodeUpdated: 'Passcode updated',
    change: 'Change',
    newPasscodePlaceholder: 'New 4–6 digit passcode',
    save: 'Save',
    logOut: 'Log Out',
    language: 'Language',
  },

  login: {
    enterPasscode: 'Enter Passcode',
    setPasscode: 'Set a Passcode',
    unlockHint: 'Unlock Fjord to continue',
    setHint: '4–6 digits, keeps out casual snoopers',
    incorrect: 'Incorrect passcode',
  },
}

const da: typeof en = {
  nav: { projects: 'Projekter', calendar: 'Kalender', settings: 'Indstillinger' },

  dashboard: {
    title: 'Projekter',
    newProject: 'Nyt projekt',
    loading: 'Indlæser…',
    empty: 'Ingen projekter endnu — opret dit første for at starte en backlog.',
    noTasksYet: 'Ingen opgaver endnu',
    backlog: 'backlog',
    scheduled: 'planlagt',
    done: 'færdig',
  },

  newProjectModal: {
    title: 'Nyt projekt',
    cancel: 'Annuller',
    create: 'Opret',
    name: 'Navn',
    namePlaceholder: 'Homelab-opbygning',
    color: 'Farve',
  },

  editProjectModal: {
    title: 'Rediger projekt',
    cancel: 'Annuller',
    save: 'Gem',
    delete: 'Slet projekt',
    deleteConfirm: (name: string) => `Slet "${name}" og alle dets opgaver? Dette kan ikke fortrydes.`,
  },

  board: {
    backlog: 'Backlog',
    scheduled: 'Planlagt',
    done: 'Færdig',
    addTask: 'Tilføj opgave',
    taskTitlePlaceholder: 'Opgavetitel',
    loading: 'Indlæser…',
    loadError: 'Projektet kunne ikke indlæses',
  },

  taskModal: {
    title: 'Rediger opgave',
    cancel: 'Annuller',
    save: 'Gem',
    fieldTitle: 'Titel',
    fieldDescription: 'Beskrivelse',
    descriptionPlaceholder: 'Tilføj en beskrivelse…',
    fieldCriticality: 'Kritikalitet',
    delete: 'Slet opgave',
    deleteOccurrence: 'Slet denne forekomst',
    deleteFuture: 'Slet denne og fremtidige forekomster',
  },

  newTaskModal: {
    title: 'Ny opgave',
    cancel: 'Annuller',
    create: 'Opret',
  },

  calendar: {
    week: 'Uge',
    month: 'Måned',
    previous: 'Forrige',
    next: 'Næste',
    backlog: 'Backlog',
    scheduled: 'Planlagt',
    meetings: 'Møder',
    newMeeting: 'Nyt møde',
    meetingTitlePlaceholder: 'Mødetitel',
    meetingDateTime: 'Dato og tid',
    allDay: 'Hele dagen',
    repeatWeekly: 'Gentag ugentligt',
    nothingUnscheduled: 'Intet uplanlagt — træk en opgave hertil for at fjerne den fra kalenderen.',
    moreCount: (n: number) => `+${n} mere`,
    loadError: 'Der gik noget galt under indlæsning af kalenderen',
  },

  externalEventModal: {
    close: 'Luk',
    readOnly: 'Skrivebeskyttet',
    location: 'Sted',
    description: 'Beskrivelse',
    allDay: 'Hele dagen',
  },

  weekdaysShort: ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'],

  settings: {
    title: 'Indstillinger',
    appleCalendar: 'Apple Kalender',
    connected: (email: string) => `Forbundet som ${email}`,
    notConnected: 'Ikke forbundet',
    connect: 'Forbind',
    cancel: 'Annuller',
    disconnect: 'Afbryd forbindelse',
    refreshNow: 'Opdater nu',
    refreshing: 'Opdaterer…',
    connecting: 'Forbinder…',
    notSyncedYet: 'Endnu ikke synkroniseret',
    lastSyncFailed: (err: string) => `Sidste synkronisering fejlede: ${err}`,
    lastSynced: (when: string) => `Sidst synkroniseret ${when}`,
    connectHint: 'Læs dine eksisterende kalendere ind i Fjord, skrivebeskyttet.',
    emailPlaceholder: 'du@icloud.com',
    passwordPlaceholder: 'app-specifik adgangskode',
    appSpecificHint: (link: string) => `Generer en app-specifik adgangskode på ${link} — aldrig dit primære Apple ID-kodeord.`,
    publishTitle: 'Udgiv til Apple Kalender',
    publishHint: 'Abonner på dette feed én gang, så vises Fjords planlagte opgaver som deres egen skrivebeskyttede kalender.',
    copyLink: 'Kopier link',
    copied: 'Kopieret',
    subscribeSteps: 'Mac: Arkiv → Nyt kalenderabonnement. iPhone: Indstillinger → Kalender → Konti → Tilføj konto → Andet → Tilføj abonnementskalender.',
    passcode: 'Adgangskode',
    changePasscode: 'Skift din adgangskode',
    passcodeUpdated: 'Adgangskode opdateret',
    change: 'Skift',
    newPasscodePlaceholder: 'Ny 4–6-cifret adgangskode',
    save: 'Gem',
    logOut: 'Log ud',
    language: 'Sprog',
  },

  login: {
    enterPasscode: 'Indtast adgangskode',
    setPasscode: 'Opret en adgangskode',
    unlockHint: 'Lås Fjord op for at fortsætte',
    setHint: '4–6 cifre, holder tilfældige nysgerrige ude',
    incorrect: 'Forkert adgangskode',
  },
}

export const translations: Record<Language, typeof en> = { en, da }
