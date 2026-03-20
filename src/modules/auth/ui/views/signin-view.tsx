import { useCallback } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "@tanstack/react-router"

import { LoginForm } from "../components/login-form"

export function SignInView() {
  const navigate = useNavigate()

  const onNavigateSignUp = useCallback(() => {
    navigate({ to: "/sign-up/create-account" })
  }, [navigate])

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-full w-full items-center justify-center p-6"
      >
        <div className="w-full max-w-md">
          <LoginForm onNavigateSignUp={onNavigateSignUp} />
        </div>
      </motion.div>

      <div className="hidden items-center justify-center p-12 md:flex">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600">
          <motion.img
            src="/auth/plane.svg"
            alt="Plane"
            className="max-h-96 w-full object-contain"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  )
}
