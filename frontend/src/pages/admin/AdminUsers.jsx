import { useEffect, useState } from 'react'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadUsers = () => {
    setLoading(true)
    api.get('/admin/users')
      .then(res => setUsers(res.data.users || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handlePromote = async (userId, name) => {
    if (!confirm(`Promote ${name} to admin?`)) return
    try {
      await api.post(`/admin/users/${userId}/promote`)
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to promote')
    }
  }

  const handleDemote = async (userId, name) => {
    if (!confirm(`Remove admin status from ${name}?`)) return
    try {
      await api.post(`/admin/users/${userId}/demote`)
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to demote')
    }
  }

  const handleDelete = async (userId, name) => {
    if (!confirm(`DELETE user "${name}" permanently? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${userId}`)
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} total users</p>
        </div>
        
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No users found</p>
          ) : (
            filtered.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-white font-bold flex items-center justify-center flex-shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {user.name}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-brand-500">(you)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                  <span title="Favorites">{user.favorite_count} favs</span>
                  <span title="Conversations">{user.chat_count} chats</span>
                </div>

                <div className="flex items-center gap-2">
                  {user.is_admin ? (
                    <>
                      <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                        ADMIN
                      </span>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDemote(user.id, user.name)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePromote(user.id, user.name)}
                        className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium"
                      >
                        Promote
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
