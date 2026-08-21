import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { Button } from '../components/ui/button'
import { useAuthStore } from '../store/auth-store'

export function ChatPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <main className="flex min-h-svh flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <HiOutlineChatBubbleLeftRight className="h-6 w-6 text-emerald-400" />
          <div>
            <p className="text-sm font-medium">Pulse</p>
            <p className="text-xs text-slate-400">
              Signed in as {user?.name} · {user?.phone}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={logout}>
          Log out
        </Button>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Inbox comes next</h1>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            Login and the API layer are in place. Next we add conversations,
            groups, and the chat panel.
          </p>
        </div>
      </section>
    </main>
  )
}
