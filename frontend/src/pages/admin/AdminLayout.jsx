import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center gap-3 mb-8 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-md">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)' }}
                >
                    <svg className="w-7 h-7" fill="white" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage EduMatch platform</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Sidebar */}
                <aside className="col-span-12 md:col-span-3">
                    <nav className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sticky top-24">
                        <SidebarLink to="/admin" end label="Dashboard" icon={<DashboardIcon />} />
                        <SidebarLink to="/admin/users" label="Users" icon={<UsersIcon />} />
                        <SidebarLink to="/admin/schools" label="Schools" icon={<SchoolIcon />} />
                        <SidebarLink to="/admin/majors" label="Majors" icon={<BookIcon />} />
                        <SidebarLink to="/admin/reports" label="Reports" icon={<ReportIcon />} />
                    </nav>
                </aside>

                {/* Main content */}
                <main className="col-span-12 md:col-span-9">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}


function SidebarLink({ to, label, icon, end }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition mb-1 ${isActive
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
            }
        >
            {icon}
            {label}
        </NavLink>
    )
}


function DashboardIcon() {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function UsersIcon() {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
}
function SchoolIcon() {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
}
function BookIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
}
function ReportIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}