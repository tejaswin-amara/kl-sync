'use client';

import { useState, useEffect } from 'react';

export type Locale = 'en' | 'te' | 'hi' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ru';

export interface LanguageInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇺🇸' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', flag: '🇨🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', flag: '🇷🇺' },
];

export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    attendance: 'Attendance',
    timetable: 'Timetable',
    marks: 'Marks',
    profile: 'Profile',
    fee: 'Fee Details',
    circulars: 'Circulars',
    hostels: 'Hostel Info',
    library: 'Library',
    examSeating: 'Exam Seating',
    tools: 'Tools',
    compliance: 'Privacy & Accessibility Compliance',
    privacyAndData: 'Privacy & Data',
    accessibility: 'Accessibility',
    exportData: 'Export My Data',
    eraseData: 'Erase All Data',
    signIn: 'Sign In',
    securityCode: 'Security Code',
    studentId: 'Student ID / Username',
    password: 'Password',
    rememberMe: 'Remember me',
    overallAttendance: 'Overall Attendance',
    cgpa: 'Current CGPA',
    totalAttended: 'Attended Classes',
    totalConducted: 'Total Conducted',
    language: 'Language',
    rtlSupport: 'RTL Support',
    theme: 'Theme',
    logout: 'Log Out',
    close: 'Close',
    save: 'Save',
    search: 'Search...',
    noRecords: 'No records found.',
  },
  te: {
    dashboard: 'డ్యాష్‌బోర్డ్',
    attendance: 'హాజరు',
    timetable: 'సమయ పట్టిక',
    marks: 'మార్కులు',
    profile: 'ప్రొఫైల్',
    fee: 'ఫీజు వివరాలు',
    circulars: 'సర్క్యులర్లు',
    hostels: 'హాస్టల్ సమాచారం',
    library: 'లైబ్రరీ',
    examSeating: 'పరీక్షా సీటింగ్',
    tools: 'సాధనాలు',
    compliance: 'గోప్యత & ప్రాప్యత సమ్మతి',
    privacyAndData: 'గోప్యత & డేటా',
    accessibility: 'ప్రాప్యత',
    exportData: 'నా డేటాను ఎగుమతి చేయండి',
    eraseData: 'మొత్తం డేటాను తొలగించండి',
    signIn: 'ప్రవేశించండి',
    securityCode: 'భద్రతా కోడ్',
    studentId: 'విద్యార్థి ఐడి',
    password: 'పాస్‌వర్డ్',
    rememberMe: 'నన్ను గుర్తుంచుకో',
    overallAttendance: 'మొత్తం హాజరు',
    cgpa: 'ప్రస్తుత CGPA',
    totalAttended: 'హాజరైన తరగతులు',
    totalConducted: 'నిర్వహించిన మొత్తం',
    language: 'భాష',
    rtlSupport: 'RTL మద్దతు',
    theme: 'థీమ్',
    logout: 'లాగ్ అవుట్',
    close: 'మూసివేయి',
    save: 'భద్రపరుచు',
    search: 'శోధించండి...',
    noRecords: 'ఎటువంటి రికార్డులు కనుగొనబడలేదు.',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    attendance: 'उपस्थिति',
    timetable: 'समय सारणी',
    marks: 'अंक',
    profile: 'प्रोफाइल',
    fee: 'शुल्क विवरण',
    circulars: 'परिपत्र',
    hostels: 'छात्रावास जानकारी',
    library: 'पुस्तकालय',
    examSeating: 'परीक्षा बैठक व्यवस्था',
    tools: 'उपकरण',
    compliance: 'गोपनीयता और पहुंच अनुपालन',
    privacyAndData: 'गोपनीयता और डेटा',
    accessibility: 'पहुंच',
    exportData: 'मेरा डेटा निर्यात करें',
    eraseData: 'सभी डेटा मिटाएं',
    signIn: 'साइन इन करें',
    securityCode: 'सुरक्षा कोड',
    studentId: 'छात्र आईडी / उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    rememberMe: 'मुझे याद रखें',
    overallAttendance: 'कुल उपस्थिति',
    cgpa: 'वर्तमान सीजीपीए',
    totalAttended: 'उपस्थित कक्षाएं',
    totalConducted: 'कुल कक्षाएं',
    language: 'भाषा',
    rtlSupport: 'आरटीएल समर्थन',
    theme: 'थीम',
    logout: 'लॉग आउट',
    close: 'बंद करें',
    save: 'सहेजें',
    search: 'खोजें...',
    noRecords: 'कोई रिकॉर्ड नहीं मिला।',
  },
  es: {
    dashboard: 'Panel',
    attendance: 'Asistencia',
    timetable: 'Horario',
    marks: 'Calificaciones',
    profile: 'Perfil',
    fee: 'Detalles de Pago',
    circulars: 'Circulares',
    hostels: 'Alojamiento',
    library: 'Biblioteca',
    examSeating: 'Asientos de Examen',
    tools: 'Herramientas',
    compliance: 'Privacidad y Accesibilidad',
    privacyAndData: 'Privacidad y Datos',
    accessibility: 'Accesibilidad',
    exportData: 'Exportar mis Datos',
    eraseData: 'Borrar todos los Datos',
    signIn: 'Iniciar Sesión',
    securityCode: 'Código de Seguridad',
    studentId: 'ID de Estudiante',
    password: 'Contraseña',
    rememberMe: 'Recordarme',
    overallAttendance: 'Asistencia General',
    cgpa: 'CGPA Actual',
    totalAttended: 'Clases Asistidas',
    totalConducted: 'Total Impartidas',
    language: 'Idioma',
    rtlSupport: 'Soporte RTL',
    theme: 'Tema',
    logout: 'Cerrar Sesión',
    close: 'Cerrar',
    save: 'Guardar',
    search: 'Buscar...',
    noRecords: 'No se encontraron registros.',
  },
  fr: {
    dashboard: 'Tableau de bord',
    attendance: 'Présence',
    timetable: 'Emploi du temps',
    marks: 'Notes',
    profile: 'Profil',
    fee: 'Frais',
    circulars: 'Circulaires',
    hostels: 'Résidences',
    library: 'Bibliothèque',
    examSeating: 'Placement d\'examen',
    tools: 'Outils',
    compliance: 'Conformité et Accessibilité',
    privacyAndData: 'Confidentialité et Données',
    accessibility: 'Accessibilité',
    exportData: 'Exporter mes Données',
    eraseData: 'Effacer toutes les Données',
    signIn: 'Connexion',
    securityCode: 'Code de Sécurité',
    studentId: 'Identifiant Étudiant',
    password: 'Mot de passe',
    rememberMe: 'Se souvenir de moi',
    overallAttendance: 'Présence Globale',
    cgpa: 'CGPA Actuel',
    totalAttended: 'Cours Suivis',
    totalConducted: 'Total Dispensés',
    language: 'Langue',
    rtlSupport: 'Support RTL',
    theme: 'Thème',
    logout: 'Déconnexion',
    close: 'Fermer',
    save: 'Enregistrer',
    search: 'Rechercher...',
    noRecords: 'Aucun enregistrement trouvé.',
  },
  de: {
    dashboard: 'Dashboard',
    attendance: 'Anwesenheit',
    timetable: 'Stundenplan',
    marks: 'Noten',
    profile: 'Profil',
    fee: 'Gebühren',
    circulars: 'Rundschreiben',
    hostels: 'Wohnheime',
    library: 'Bibliothek',
    examSeating: 'Prüfungsplatz',
    tools: 'Werkzeuge',
    compliance: 'Datenschutz & Barrierefreiheit',
    privacyAndData: 'Datenschutz & Daten',
    accessibility: 'Barrierefreiheit',
    exportData: 'Meine Daten exportieren',
    eraseData: 'Alle Daten löschen',
    signIn: 'Anmelden',
    securityCode: 'Sicherheitscode',
    studentId: 'Matrikelnummer',
    password: 'Passwort',
    rememberMe: 'Angemeldet bleiben',
    overallAttendance: 'Gesamtanwesenheit',
    cgpa: 'Aktueller CGPA',
    totalAttended: 'Besuchte Stunden',
    totalConducted: 'Gehaltene Stunden',
    language: 'Sprache',
    rtlSupport: 'RTL-Unterstützung',
    theme: 'Design',
    logout: 'Abmelden',
    close: 'Schließen',
    save: 'Speichern',
    search: 'Suchen...',
    noRecords: 'Keine Einträge gefunden.',
  },
  ar: {
    dashboard: 'لوحة القيادة',
    attendance: 'الحضور والغياب',
    timetable: 'الجدول الدراسي',
    marks: 'الدرجات',
    profile: 'الملف الشخصي',
    fee: 'تفاصيل الرسوم',
    circulars: 'التعميمات',
    hostels: 'معلومات السكن',
    library: 'المكتبة',
    examSeating: 'مقاعد الامتحان',
    tools: 'الأدوات',
    compliance: 'الخصوصية وإمكانية الوصول',
    privacyAndData: 'الخصوصية والبيانات',
    accessibility: 'إمكانية الوصول',
    exportData: 'تصدير بياناتي',
    eraseData: 'مسح جميع البيانات',
    signIn: 'تسجيل الدخول',
    securityCode: 'رمز الأمان',
    studentId: 'الرقم الجامعي / اسم المستخدم',
    password: 'كلمة المرور',
    rememberMe: 'تذكرني',
    overallAttendance: 'نسبة الحضور العامة',
    cgpa: 'المعدل التراكمي',
    totalAttended: 'الحصص المحضورة',
    totalConducted: 'إجمالي الحصص',
    language: 'اللغة',
    rtlSupport: 'دعم من اليمين إلى اليسار (RTL)',
    theme: 'المظهر',
    logout: 'تسجيل الخروج',
    close: 'إغلاق',
    save: 'حفظ',
    search: 'بحث...',
    noRecords: 'لم يتم العثور على سجلات.',
  },
  zh: {
    dashboard: '仪表板',
    attendance: '考勤记录',
    timetable: '课程表',
    marks: '成绩单',
    profile: '个人档案',
    fee: '学费明细',
    circulars: '官方通告',
    hostels: '宿舍信息',
    library: '图书馆',
    examSeating: '考场座位',
    tools: '实用工具',
    compliance: '隐私与无障碍合规',
    privacyAndData: '隐私与数据安全',
    accessibility: '无障碍支持',
    exportData: '导出我的数据',
    eraseData: '清除所有本地数据',
    signIn: '登录',
    securityCode: '验证码',
    studentId: '学号 / 用户名',
    password: '密码',
    rememberMe: '记住账号',
    overallAttendance: '总出勤率',
    cgpa: '当前绩点 (CGPA)',
    totalAttended: '已出勤课时',
    totalConducted: '总授课课时',
    language: '语言选择',
    rtlSupport: 'RTL 从右至左支持',
    theme: '界面主题',
    logout: '退出登录',
    close: '关闭',
    save: '保存',
    search: '搜索...',
    noRecords: '暂无数据记录。',
  },
  ru: {
    dashboard: 'Панель управления',
    attendance: 'Посещаемость',
    timetable: 'Расписание',
    marks: 'Оценки',
    profile: 'Профиль',
    fee: 'Оплата обучения',
    circulars: 'Объявления',
    hostels: 'Общежития',
    library: 'Библиотека',
    examSeating: 'Рассадка на экзамене',
    tools: 'Инструменты',
    compliance: 'Конфиденциальность и Доступность',
    privacyAndData: 'Конфиденциальность и Данные',
    accessibility: 'Доступность',
    exportData: 'Экспортировать мои данные',
    eraseData: 'Удалить все данные',
    signIn: 'Войти',
    securityCode: 'Код безопасности',
    studentId: 'Студенческий ID',
    password: 'Пароль',
    rememberMe: 'Запомнить меня',
    overallAttendance: 'Общая посещаемость',
    cgpa: 'Текущий CGPA',
    totalAttended: 'Посещено занятий',
    totalConducted: 'Всего проведено',
    language: 'Язык',
    rtlSupport: 'Поддержка RTL',
    theme: 'Тема оформления',
    logout: 'Выйти',
    close: 'Закрыть',
    save: 'Сохранить',
    search: 'Поиск...',
    noRecords: 'Записей не найдено.',
  },
};

const listeners = new Set<(locale: Locale) => void>();

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('kl_locale') as Locale;
    if (stored && TRANSLATIONS[stored]) return stored;
  } catch {}
  return 'en';
}

export function setLocale(locale: Locale): void {
  if (!TRANSLATIONS[locale]) return;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kl_locale', locale);
      const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === locale);
      const dir = langInfo?.dir || 'ltr';
      document.documentElement.setAttribute('lang', locale);
      document.documentElement.setAttribute('dir', dir);
      if (dir === 'rtl') {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    } catch {}
  }
  listeners.forEach((l) => l(locale));
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  useEffect(() => {
    const handler = (newLoc: Locale) => setLocaleState(newLoc);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const t = (key: string, defaultText?: string): string => {
    return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || defaultText || key;
  };

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0];
  const isRtl = currentLanguage.dir === 'rtl';

  return { locale, t, changeLocale, currentLanguage, isRtl, supportedLanguages: SUPPORTED_LANGUAGES };
}
