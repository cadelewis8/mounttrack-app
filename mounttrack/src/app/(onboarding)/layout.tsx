export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b py-4 px-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-bold text-lg">MountTrack</span>
          <span className="text-sm text-muted-foreground">Setup</span>
        </div>
      </header>
      <main className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>
    </div>
  )
}
