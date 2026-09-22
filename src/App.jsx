import KaryakartaStudio from './KaryakartaStudio.jsx'
import AdminShell from './admin/AdminShell.jsx'

/**
 * Karyakartas open straight into the simple flow. The admin visits `/?admin`
 * (hidden — no password) to build posters and manage the campaign text library.
 */
export default function App() {
  const isAdmin = new URLSearchParams(window.location.search).has('admin')

  if (isAdmin) {
    return <AdminShell onExit={() => { window.location.href = window.location.pathname }} />
  }
  return <KaryakartaStudio />
}
