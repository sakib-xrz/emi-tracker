import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SetupNotice() {
  return (
    <Card className="mx-auto w-full max-w-xl border-white/10 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Supabase is not configured</CardTitle>
        <CardDescription>Set environment variables before running the app.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <p>
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
        </p>
      </CardContent>
    </Card>
  )
}
