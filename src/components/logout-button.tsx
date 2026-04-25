"use client"

import axios from "axios"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/auth/logout")
    },
    onSuccess: () => {
      router.refresh()
    },
  })

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? "Logging out..." : "Logout"}
    </Button>
  )
}
