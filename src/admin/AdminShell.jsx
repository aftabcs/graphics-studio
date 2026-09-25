import { useState } from 'react'
import PosterStudio from './PosterStudio.jsx'
import TextLibraryManager from './TextLibraryManager.jsx'
import PostersManager from './PostersManager.jsx'
import TricolourBar from '../components/TricolourBar.jsx'
import { MountainMark } from '../components/icons.jsx'
import { useLang, LanguageToggle } from '../lib/i18n.jsx'

/** Admin area: My Posters (file management) · Poster Studio (editor) · Text Library. */
export default function AdminShell({ onExit }) {
  const { t } = useLang()
  const [tab, setTab] = useState('files')
  const [editId, setEditId] = useState(null)

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === id ? 'bg-[#12306e] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {label}
    </button>
  )

  function editPoster(id) {
    setEditId(id)
    setTab('editor')
  }

  return (
    <div className="flex h-screen flex-col">
      <TricolourBar />
      <nav className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <span className="mr-2 flex items-center gap-2 text-sm font-bold text-[#12306e]">
          <MountainMark className="h-5 w-5" /> {t('admin')}
        </span>
        {tabBtn('files', t('tabPosters'))}
        {tabBtn('editor', t('tabStudio'))}
        {tabBtn('text', t('tabText'))}
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <button onClick={onExit} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            {t('exitToApp')}
          </button>
        </div>
      </nav>
      <div className="min-h-0 flex-1">
        {tab === 'files' && <PostersManager onEdit={editPoster} />}
        {tab === 'editor' && <PosterStudio key={editId || 'new'} initialTemplateId={editId} />}
        {tab === 'text' && <TextLibraryManager />}
      </div>
    </div>
  )
}
