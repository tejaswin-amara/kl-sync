# Live KLHB baseline

Source: https://klhb.vercel.app/
Repository: https://github.com/tejaswin-amara/kl-sync

The live deployment is the current dark-first KL Sync product. The public login uses a two-column split: KLH branding and academic-sync message on the left, dark glass sign-in card on the right, with compliance and language controls in the upper-right. The left panel shows a dense compliance badge block, System Live status, and Security Info. The form includes student ID, password, remember-me, captcha, refresh, and sign-in controls.

The authenticated `/dashboard` route is accessible in the connected browser session and confirms the deployed information architecture: persistent left sidebar with Dashboard, Attendance, Timetable, Marks, Profile, Fee Details, Circulars, Hostel Info, Library, Tools, and Privacy & Accessibility Compliance; contextual top header with page title/date, Compliance, language, Current Sem, notifications, and profile; overview content with live-sync welcome banner, Cumulative GPA, Attendance, Pending Fees, Completed Credits, Daily Schedule, Current Courses, and AI Copilot.

Observed live sample values were attendance 88%, pending fees ₹142,500, completed credits 45, CGPA 8.19, and profile name TEJASWIN. These are live session data and should not be hardcoded; they only confirm the data presentation hierarchy and existing route behavior.

Redesign implication: preserve the current navigation and module coverage exactly, but replace the high-contrast black/glass aesthetic with the approved light-first academic system, reduce compliance-badge density through better grouping/wrapping, improve sidebar label readability, and keep the KPI/schedule/course hierarchy recognizable for returning users.
