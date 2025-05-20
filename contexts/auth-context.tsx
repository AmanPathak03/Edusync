"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  role: "student" | "teacher"
  // Add any other user properties from your JWT payload
}

type AuthContextType = {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = sessionStorage.getItem("token")

      if (storedToken) {
        // Verify token and get user data
        try {
          //Verify token with backend (more secure)
          await verifyToken(storedToken)
        } catch (error) {
          console.error("Invalid token:", error)
          sessionStorage.removeItem("token")
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Verify token with backend
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/auth/check`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setToken(token)
      } else {
        // Token is invalid or expired
        sessionStorage.removeItem("token")
        setUser(null)
        setToken(null)
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      sessionStorage.removeItem("token")
      setUser(null)
      setToken(null)
    }
  }

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Make a request to your backend login endpoint
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Login failed")
      }

      const data = await response.json()

      // Validate the structure of the received data
      if (!data.user || !data.user.role) {
        console.error("Invalid user data received:", data)
        throw new Error("Invalid user data received from server")
      }
      // Save token to localStorage
      sessionStorage.setItem("token", data.token)
      sessionStorage.setItem("user", JSON.stringify(data.user))
      console.log("Token in sessionStorage:", sessionStorage.getItem("token"));

      // Set user and token in state
      setUser(data.user)
      setToken(data.token)
      console.log("User set:", data.user);
      console.log("Token set:", data.token);

      // Redirect to the appropriate dashboard
      // console.log("Redirecting to:", `/dashboard/${data.user.role}`);
      // router.push(`/dashboard/${data.user.role}`)
      return data.user
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    // Remove token from sessionStorage
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")

    // Clear user and token from state
    setUser(null)
    setToken(null)

    // Redirect to login page
    window.location.href = "/login"
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
