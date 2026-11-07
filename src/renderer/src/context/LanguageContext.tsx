import React, { createContext, useContext, useState, useEffect } from 'react'

export type AppLanguage = 'en' | 'id'

export interface Translations {
  common: {
    close: string
    cancel: string
    done: string
    save: string
    browse: string
    refresh: string
    loading: string
    delete: string
    search: string
  }
  nav: {
    account: string
    appearance: string
    features: string
    terminal: string
    shortcuts: string
    about: string
    accountDesc: string
    appearanceDesc: string
    featuresDesc: string
    terminalDesc: string
    shortcutsDesc: string
    aboutDesc: string
  }
  profile: {
    liveBadge: string
    realtimePreview: string
    avatarCustomization: string
    avatarDesc: string
    uploadLocal: string
    orEnterUrl: string
    credentials: string
    displayName: string
    handleTag: string
    roleSpecialization: string
    languagePreference: string
    languageDesc: string
    english: string
    indonesian: string
  }
  settings: {
    title: string
    searchPlaceholder: string
    unsavedPending: string
    clickDoneApply: string
    inSync: string
    version: string
  }
  sidebar: {
    workspaces: string
    addProject: string
    noProjects: string
    noProjectsDesc: string
    activePanes: string
    splitPresets: string
    split2Col: string
    split2Row: string
    noProjectActive: string
    addProjectBegin: string
    openProjectDirectory: string
    settings: string
  }
  rightPanel: {
    gitChanges: string
    filesFolders: string
    branch: string
    modified: string
    inspectAllDiffs: string
    workingTreeClean: string
    noProjectActive: string
    openProjectSidebar: string
    noFilesToDisplay: string
    addProjectToBrowse: string
    loadingFiles: string
    noFilesFound: string
  }
  welcome: {
    noActiveProject: string
    noProjectDesc: string
    projectActiveDesc: string
    welcomeBackTitle: string
    welcomeBackDesc: string
    continueBtn: string
    skipBtn: string
    openTerminalIn: string
    newProjectAi: string
  }
  newProject: {
    title: string
    nameLabel: string
    namePlaceholder: string
    folderLabel: string
    folderPlaceholder: string
    folderDesc: string
    githubLabel: string
    githubPlaceholder: string
    githubDesc: string
    aiAgentLabel: string
    aiAgentDesc: string
    colorLabel: string
    iconLabel: string
    iconDesc: string
    createAndOpen: string
  }
  statusBar: {
    sidebar: string
    browser: string
    panes: string
    commandHint: string
  }
  closeModal: {
    title: string
    warning: string
    message: string
    confirm: string
    cancel: string
  }
}

export const DICTIONARY: Record<AppLanguage, Translations> = {
  en: {
    common: {
      close: 'Close',
      cancel: 'Cancel',
      done: 'Done',
      save: 'Save Changes',
      browse: 'Browse',
      refresh: 'Refresh',
      loading: 'Loading...',
      delete: 'Delete',
      search: 'Search',
    },
    nav: {
      account: 'Account & Profile',
      appearance: 'Appearance & Themes',
      features: 'Features & Modules',
      terminal: 'Terminal Engine',
      shortcuts: 'Keyboard Shortcuts',
      about: 'About & System',
      accountDesc: 'Local profile, display name, and preferences',
      appearanceDesc: '20 themes, live simulation, and typography scale',
      featuresDesc: 'Choose which optional modules are visible',
      terminalDesc: 'ConPTY, default shell, and buffer sizing',
      shortcutsDesc: 'Keybindings cheat sheet and hotkeys',
      aboutDesc: 'Version, engine details, and credits',
    },
    profile: {
      liveBadge: 'Live Operator ID Badge',
      realtimePreview: 'Realtime Interactive Preview',
      avatarCustomization: 'Avatar Customization',
      avatarDesc: 'Select an avatar preset, upload a local image file, or provide an image URL.',
      uploadLocal: 'Upload Local Image File...',
      orEnterUrl: 'Or enter external image URL...',
      credentials: 'Operator Credentials',
      displayName: 'Display Name',
      handleTag: 'Handle Tag',
      roleSpecialization: 'Role / Specialization',
      languagePreference: 'Language Preference',
      languageDesc: 'Choose interface language (English or Bahasa Indonesia).',
      english: 'English (US)',
      indonesian: 'Bahasa Indonesia',
    },
    settings: {
      title: 'Settings',
      searchPlaceholder: 'Search settings...',
      unsavedPending: 'Unsaved changes pending',
      clickDoneApply: 'Click Done to apply to local disk',
      inSync: 'Preferences in sync with local disk',
      version: `Kingsley v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'} • Win11 Native`,
    },
    sidebar: {
      workspaces: 'Workspaces',
      addProject: '+ Project',
      noProjects: 'No Projects Added',
      noProjectsDesc: 'Click "+ Project" below to add a project folder.',
      activePanes: 'Active Panes',
      splitPresets: 'Split Presets',
      split2Col: 'Split 2-Col',
      split2Row: 'Split 2-Row',
      noProjectActive: 'No Active Project',
      addProjectBegin: 'Add a project to begin',
      openProjectDirectory: 'Add Project (with AI Agent)...',
      settings: 'Settings',
    },
    rightPanel: {
      gitChanges: 'Git Changes',
      filesFolders: 'Files & Folders',
      branch: 'BRANCH:',
      modified: 'modified',
      inspectAllDiffs: 'Inspect All Diffs',
      workingTreeClean: 'Working Tree Clean',
      noProjectActive: 'No Project Active',
      openProjectSidebar: 'Open or add a project in the sidebar to track Git changes.',
      noFilesToDisplay: 'No Files to Display',
      addProjectToBrowse: 'Add a project in the sidebar to browse its folders and files.',
      loadingFiles: 'Loading workspace files...',
      noFilesFound: 'No files found in workspace root.',
    },
    welcome: {
      noActiveProject: 'No Active Project',
      noProjectDesc: 'Add or open a project in the sidebar to spawn terminals and pair with an AI coding agent.',
      projectActiveDesc: 'Project is active. Click below to launch a terminal.',
      welcomeBackTitle: 'Welcome Back',
      welcomeBackDesc: 'Kingsley is initialized and ready for your development workflow.',
      continueBtn: 'Continue',
      skipBtn: 'Skip',
      openTerminalIn: 'Open Terminal in',
      newProjectAi: '+ New Project (with AI Agent)...',
    },
    newProject: {
      title: 'New project',
      nameLabel: 'NAME',
      namePlaceholder: 'Ex: New site, Client X...',
      folderLabel: 'PROJECT FOLDER',
      folderPlaceholder: 'Choose the project folder',
      folderDesc: 'New terminals will start in this folder.',
      githubLabel: 'GITHUB REPOSITORY (OPTIONAL)',
      githubPlaceholder: 'https://github.com/user/repository',
      githubDesc: 'Paste repository URL to clone and initialize with AI context automatically.',
      aiAgentLabel: 'AI CODING AGENT ARSENAL',
      aiAgentDesc: 'Auto-launch chosen AI coding agent directly inside the project terminal.',
      colorLabel: 'COLOR',
      iconLabel: 'ICON',
      iconDesc: 'Optional. Use a URL or upload a local image. If empty, uses the color square.',
      createAndOpen: 'Create project and open terminal',
    },
    statusBar: {
      sidebar: 'Sidebar',
      browser: 'Browser',
      panes: 'Panes',
      commandHint: 'Command',
    },
    closeModal: {
      title: 'Exit Kingsley?',
      warning: 'Warning',
      message: 'Active terminal sessions and running background processes will be terminated. Are you sure you want to close Kingsley?',
      confirm: 'Close Kingsley',
      cancel: 'Cancel',
    },
  },
  id: {
    common: {
      close: 'Tutup',
      cancel: 'Batal',
      done: 'Selesai',
      save: 'Simpan Perubahan',
      browse: 'Pilih Folder',
      refresh: 'Muat Ulang',
      loading: 'Memuat...',
      delete: 'Hapus',
      search: 'Cari',
    },
    nav: {
      account: 'Akun & Profil',
      appearance: 'Tampilan & Tema',
      features: 'Fitur & Modul',
      terminal: 'Engine Terminal',
      shortcuts: 'Pintasan Keyboard',
      about: 'Tentang & Sistem',
      accountDesc: 'Profil lokal, nama tampilan, dan preferensi',
      appearanceDesc: '20 tema, simulasi realtime, dan skala tipografi',
      featuresDesc: 'Pilih modul opsional yang aktif',
      terminalDesc: 'ConPTY, default shell, dan alokasi buffer',
      shortcutsDesc: 'Referensi lengkap tombol pintasan keyboard',
      aboutDesc: 'Versi, detail arsitektur, dan kredit',
    },
    profile: {
      liveBadge: 'Kartu Identitas Operator',
      realtimePreview: 'Pratinjau Interaktif Realtime',
      avatarCustomization: 'Kustomisasi Avatar',
      avatarDesc: 'Pilih preset avatar, unggah file gambar lokal, atau masukkan URL gambar.',
      uploadLocal: 'Unggah File Gambar Lokal...',
      orEnterUrl: 'Atau masukkan URL gambar eksternal...',
      credentials: 'Kredensial Operator',
      displayName: 'Nama Tampilan',
      handleTag: 'Tag Handle',
      roleSpecialization: 'Peran / Spesialisasi',
      languagePreference: 'Pilihan Bahasa',
      languageDesc: 'Pilih bahasa antarmuka aplikasi (Bahasa Inggris atau Bahasa Indonesia).',
      english: 'English (US)',
      indonesian: 'Bahasa Indonesia',
    },
    settings: {
      title: 'Pengaturan',
      searchPlaceholder: 'Cari pengaturan...',
      unsavedPending: 'Perubahan belum disimpan',
      clickDoneApply: 'Klik Selesai untuk menyimpan ke disk',
      inSync: 'Pengaturan tersimpan di disk',
      version: `Kingsley v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'} • Native Windows 11`,
    },
    sidebar: {
      workspaces: 'Project & Folder',
      addProject: '+ Project',
      noProjects: 'Belum Ada Project',
      noProjectsDesc: 'Klik "+ Project" di bawah untuk menambahkan folder project.',
      activePanes: 'Pane Aktif',
      splitPresets: 'Preset Split',
      split2Col: 'Bagi 2 Kolom',
      split2Row: 'Bagi 2 Baris',
      noProjectActive: 'Tidak Ada Project Aktif',
      addProjectBegin: 'Tambahkan project untuk memulai',
      openProjectDirectory: 'Tambah Project (dengan AI Agent)...',
      settings: 'Pengaturan',
    },
    rightPanel: {
      gitChanges: 'Perubahan Git',
      filesFolders: 'File & Folder',
      branch: 'BRANCH:',
      modified: 'diubah',
      inspectAllDiffs: 'Periksa Semua Perubahan',
      workingTreeClean: 'Working Tree Bersih',
      noProjectActive: 'Tidak Ada Project Aktif',
      openProjectSidebar: 'Buka atau tambahkan project di sidebar untuk melihat status Git.',
      noFilesToDisplay: 'Tidak Ada File yang Ditampilkan',
      addProjectToBrowse: 'Tambahkan project di sidebar untuk melihat folder & kodingan.',
      loadingFiles: 'Memuat file project...',
      noFilesFound: 'Tidak ada file di root workspace.',
    },
    welcome: {
      noActiveProject: 'Tidak Ada Project Aktif',
      noProjectDesc: 'Tambahkan atau buka project di sidebar untuk membuka terminal dengan AI coding agent.',
      projectActiveDesc: 'Project sedang aktif. Klik tombol di bawah untuk membuka terminal.',
      welcomeBackTitle: 'Selamat Datang Kembali',
      welcomeBackDesc: 'Kingsley siap menemani alur kerja koding dan orkestrasi agent Anda.',
      continueBtn: 'Lanjutkan',
      skipBtn: 'Lewati',
      openTerminalIn: 'Buka Terminal di',
      newProjectAi: '+ Project Baru (dengan AI Agent)...',
    },
    newProject: {
      title: 'Project Baru',
      nameLabel: 'NAMA PROJECT',
      namePlaceholder: 'Contoh: JoCleanCare, Admin App...',
      folderLabel: 'FOLDER PROJECT',
      folderPlaceholder: 'Pilih folder project',
      folderDesc: 'Terminal baru akan dimulai di folder ini.',
      githubLabel: 'REPOSITORI GITHUB (OPSIONAL)',
      githubPlaceholder: 'https://github.com/user/repository',
      githubDesc: 'Tempel URL repositori untuk clone dan inisialisasi konteks AI otomatis.',
      aiAgentLabel: 'ARSENAL AI CODING AGENT',
      aiAgentDesc: 'Otomatis jalankan agent AI pilihan di terminal project.',
      colorLabel: 'WARNA',
      iconLabel: 'IKON',
      iconDesc: 'Opsional. Gunakan URL atau unggah gambar lokal. Jika kosong, memakai kotak warna.',
      createAndOpen: 'Buat project dan buka terminal',
    },
    statusBar: {
      sidebar: 'Sidebar',
      browser: 'Browser',
      panes: 'Pane',
      commandHint: 'Perintah',
    },
    closeModal: {
      title: 'Tutup Kingsley?',
      warning: 'Peringatan',
      message: 'Sesi terminal yang aktif dan proses background akan dihentikan. Anda yakin ingin menutup aplikasi?',
      confirm: 'Tutup Kingsley',
      cancel: 'Batal',
    },
  },
}

const LANGUAGE_STORAGE_KEY = 'ferminterm_language'

interface LanguageContextType {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null
    if (saved && (saved === 'en' || saved === 'id')) {
      return saved
    }
    return 'en'
  })

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }

  const t = DICTIONARY[language] || DICTIONARY.en

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
