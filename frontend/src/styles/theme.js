// Central design tokens and helpers for the Campus Complaint System UI.
// Keeping class strings static so Tailwind's JIT can detect them.

export const BRAND = {
    primary: 'indigo',
    primaryHex: '#4f46e5',
};

// Maps a complaint status to pill classes (bg + text + ring).
const STATUS_MAP = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    'in progress': 'bg-blue-50 text-blue-700 ring-blue-200',
    'in process': 'bg-blue-50 text-blue-700 ring-blue-200',
    investigating: 'bg-blue-50 text-blue-700 ring-blue-200',
    resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    escalated: 'bg-rose-50 text-rose-700 ring-rose-200',
    critical: 'bg-rose-50 text-rose-700 ring-rose-200',
    rejected: 'bg-red-50 text-red-700 ring-red-200',
    open: 'bg-sky-50 text-sky-700 ring-sky-200',
    closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const getStatusBadgeClass = (status) =>
    STATUS_MAP[(status || '').toString().toLowerCase()] ||
    'bg-slate-100 text-slate-600 ring-slate-200';

// Maps a priority/urgency level to pill classes.
const PRIORITY_MAP = {
    critical: 'bg-rose-50 text-rose-700 ring-rose-200',
    high: 'bg-orange-50 text-orange-700 ring-orange-200',
    medium: 'bg-blue-50 text-blue-700 ring-blue-200',
    low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export const getPriorityBadgeClass = (priority) =>
    PRIORITY_MAP[(priority || '').toString().toLowerCase()] ||
    'bg-slate-100 text-slate-600 ring-slate-200';

// Role badge colors for chips.
const ROLE_MAP = {
    student: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    faculty: 'bg-violet-50 text-violet-700 ring-violet-200',
    hod: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    dean: 'bg-teal-50 text-teal-700 ring-teal-200',
    principal: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
    admin: 'bg-slate-800 text-white ring-slate-900',
};

export const getRoleBadgeClass = (role) =>
    ROLE_MAP[(role || '').toString().toLowerCase()] ||
    'bg-slate-100 text-slate-600 ring-slate-200';

// Human-friendly status label.
export const formatStatus = (status) => {
    const s = (status || '').toString();
    if (!s) return 'Unknown';
    return s
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Progress step (1-3) used by trackers.
export const getStatusStep = (status) => {
    const lower = (status || '').toLowerCase();
    if (lower === 'resolved' || lower === 'completed' || lower === 'closed')
        return 3;
    if (lower === 'in progress' || lower === 'in process' || lower === 'investigating')
        return 2;
    if (lower === 'escalated' || lower === 'critical')
        return 3;
    return 1;
};

// Sidebar navigation per role. Paths may carry a ?view= query that the target
// (consolidated, role-aware) page reads to select its mode.
export const NAV_BY_ROLE = {
    student: [
        { label: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard' },
        { label: 'My Complaints', path: '/complaints?view=mine', icon: 'ClipboardList' },
        { label: 'Raise Complaint', path: '/student/submit-complaint', icon: 'PlusCircle' },
        { label: 'Lost & Found', path: '/lost-found?view=student', icon: 'Search' },
        { label: 'Notifications', path: '/notifications', icon: 'Bell' },
        { label: 'My Profile', path: '/profile', icon: 'User' },
    ],
    faculty: [
        { label: 'Dashboard', path: '/faculty/dashboard', icon: 'LayoutDashboard' },
        { label: 'My Complaints', path: '/complaints?view=mine', icon: 'ClipboardList' },
        { label: 'Complaint Management', path: '/complaints?view=manage', icon: 'PenTool' },
        { label: 'Lost & Found', path: '/lost-found?view=manage', icon: 'Search' },
        { label: 'Notifications', path: '/notifications', icon: 'Bell' },
        { label: 'My Profile', path: '/profile', icon: 'User' },
    ],
    staff: [
        { label: 'Dashboard', path: '/faculty/dashboard', icon: 'LayoutDashboard' },
        { label: 'My Complaints', path: '/complaints?view=mine', icon: 'ClipboardList' },
        { label: 'Complaint Management', path: '/complaints?view=manage', icon: 'PenTool' },
        { label: 'Lost & Found', path: '/lost-found?view=manage', icon: 'Search' },
        { label: 'Notifications', path: '/notifications', icon: 'Bell' },
        { label: 'My Profile', path: '/profile', icon: 'User' },
    ],
    hod: [
        { label: 'Dashboard', path: '/hod/dashboard', icon: 'LayoutDashboard' },
        { label: 'Department Complaints', path: '/complaints?view=department', icon: 'ClipboardList' },
        { label: 'Lost & Found', path: '/lost-found?view=manage', icon: 'Search' },
        { label: 'Department Analytics', path: '/analytics?view=department', icon: 'BarChart' },
        { label: 'Notifications', path: '/notifications', icon: 'Bell' },
        { label: 'My Profile', path: '/profile', icon: 'User' },
    ],
    dean: [
        { label: 'Dashboard', path: '/dean/dashboard', icon: 'LayoutDashboard' },
        { label: 'All Complaints', path: '/complaints?view=all', icon: 'ClipboardList' },
        { label: 'Escalated Complaints', path: '/complaints?view=escalated', icon: 'AlertTriangle' },
        { label: 'Lost & Found', path: '/lost-found?view=manage', icon: 'Search' },
        { label: 'Analytics & Reports', path: '/analytics?view=college', icon: 'PieChart' },
        { label: 'Notifications', path: '/notifications', icon: 'Bell' },
        { label: 'My Profile', path: '/profile', icon: 'User' },
    ],
    principal: [
        { label: 'Executive Dashboard', path: '/principal/dashboard', icon: 'LayoutDashboard' },
        { label: 'All Complaints', path: '/complaints?view=all', icon: 'ClipboardList' },
        { label: 'Escalated Complaints', path: '/complaints?view=escalated', icon: 'AlertTriangle' },
        { label: 'Lost & Found Overview', path: '/lost-found?view=overview', icon: 'Search' },
        { label: 'Notifications', path: '/notifications', icon: 'Bell' },
        { label: 'My Profile', path: '/profile', icon: 'User' },
    ],
    admin: [
        { group: '', items: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
        ] },
        { group: 'Complaint Management', items: [
            { label: 'All Complaints', path: '/complaints?view=all', icon: 'ClipboardList' },
            { label: 'Complaint Status', path: '/admin/reports?tab=status', icon: 'RefreshCw' },
            { label: 'Complaint Categories', path: '/admin/categories', icon: 'Tags' },
            { label: 'Escalated Complaints', path: '/complaints?view=escalated', icon: 'AlertTriangle' },
        ] },
        { group: 'Lost & Found', items: [
            { label: 'Lost & Found Management', path: '/lost-found?view=manage', icon: 'Package' },
            { label: 'Lost Items', path: '/lost-found?view=lost', icon: 'Package' },
            { label: 'Found Items', path: '/lost-found?view=found', icon: 'Package' },
        ] },
        { group: 'User Management', items: [
            { label: 'Student Management', path: '/admin/users?role=student', icon: 'GraduationCap' },
            { label: 'Faculty Management', path: '/admin/users?role=faculty', icon: 'Users' },
            { label: 'HOD Management', path: '/admin/users?role=hod', icon: 'Users' },
            { label: 'Dean Management', path: '/admin/users?role=dean', icon: 'Users' },
            { label: 'Principal Management', path: '/admin/users?role=principal', icon: 'Users' },
        ] },
        { group: 'College Management', items: [
            { label: 'Department Management', path: '/admin/departments', icon: 'Building2' },
            { label: 'Role & Permission Management', path: '/admin/roles', icon: 'ShieldCheck' },
        ] },
        { group: 'Reports', items: [
            { label: 'Reports & Analytics', path: '/admin/reports?tab=analytics', icon: 'PieChart' },
            { label: 'Complaint Statistics', path: '/admin/reports?tab=statistics', icon: 'BarChart' },
            { label: 'Generate Reports', path: '/admin/reports?tab=generate', icon: 'FileText' },
        ] },
        { group: 'System', items: [
            { label: 'Notifications', path: '/notifications', icon: 'Bell' },
            { label: 'Activity Logs', path: '/admin/logs', icon: 'ScrollText' },
            { label: 'System Settings', path: '/admin/settings', icon: 'Settings' },
        ] },
        { group: 'Account', items: [
            { label: 'My Profile', path: '/profile', icon: 'User' },
        ] },
    ],
};
