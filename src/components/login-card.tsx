"use client"

import axios from "axios"
import { Lock } from "lucide-react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginCardProps = {
  error?: string
}

export function LoginCard({ error }: LoginCardProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(error ?? null)

  const loginMutation = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      await axios.post("/api/auth/login", payload)
    },
    onSuccess: () => {
      setSubmitError(null)
      router.refresh()
    },
    onError: (mutationError) => {
      if (axios.isAxiosError(mutationError)) {
        const message = (mutationError.response?.data as { error?: string } | undefined)?.error
        setSubmitError(message ?? "Sign in failed")
        return
      }
      setSubmitError("Sign in failed")
    },
  })

  return (
    <Card className="mx-auto w-full max-w-sm border-white/10 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Lock className="size-4" />
          Owner Login
        </CardTitle>
        <CardDescription>Sign in to add and manage EMI payments.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            const email = String(formData.get("email") ?? "").trim()
            const password = String(formData.get("password") ?? "")
            if (!email || !password) {
              setSubmitError("Email and password are required")
              return
            }
            setSubmitError(null)
            loginMutation.mutate({ email, password })
          }}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>Sign in failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" className="h-11 w-full">
            {loginMutation.isPending ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
