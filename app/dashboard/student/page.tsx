"use client"

import { useEffect } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, BookOpen, Calendar, Home, LogOut, Menu, MessageSquare, Search, Settings, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfilePopup } from "@/components/profile-popup"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Utility functions
function formatDate(isoDate: string) {
  if (!isoDate) return "N/A"
  const date = new Date(isoDate)
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function getRelativeTime(isoDate: string) {
  if (!isoDate) return "No due date"
  const now = new Date()
  const dueDate = new Date(isoDate)
  const diffMs = dueDate.getTime() - now.getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  const diffMinutes = Math.round(diffSeconds / 60)
  const diffHours = Math.round(diffMinutes / 60)
  const diffDays = Math.round(diffHours / 24)

  if (diffSeconds < 0) {
    const absSeconds = Math.abs(diffSeconds)
    const absMinutes = Math.abs(diffMinutes)
    const absHours = Math.abs(diffHours)
    const absDays = Math.abs(diffDays)
    if (absSeconds < 60) return `${absSeconds} seconds overdue`
    if (absMinutes < 60) return `${absMinutes} minutes overdue`
    if (absHours < 24) return `${absHours} hours overdue`
    return `${absDays} days overdue`
  } else {
    if (diffSeconds < 60) return `due in ${diffSeconds} seconds`
    if (diffMinutes < 60) return `due in ${diffMinutes} minutes`
    if (diffHours < 24) return `due in ${diffHours} hours`
    return `due in ${diffDays} days`
  }
}

function isDueDateOver(dueDate: string) {
  if (!dueDate) return false
  const now = new Date()
  const due = new Date(dueDate)
  return now > due
}

async function apiFetch(endpoint: string, method: string, token: string | null, data: any = null) {
  const API_BASE_URL = "http://localhost:8080/api"
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const options: RequestInit = {
    method,
    headers,
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  console.log(`Making ${method} request to ${API_BASE_URL}${endpoint}`, { data, headers })

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    const bodyText = await response.text()

    if (!response.ok) {
      let errorMessage = `Request failed (Status: ${response.status})`
      try {
        const errorData = JSON.parse(bodyText)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch {
        errorMessage = bodyText || errorMessage
      }
      console.error(`Error in ${endpoint}: ${errorMessage}`)
      throw new Error(`${errorMessage} (Status: ${response.status})`)
    }

    let result
    try {
      result = bodyText ? JSON.parse(bodyText) : {}
    } catch {
      throw new Error("Failed to parse response as JSON")
    }

    console.log(`Response from ${endpoint}:`, result)
    return result
  } catch (error) {
    console.error(`API fetch error for ${endpoint}:`, error)
    throw error
  }
}

// Add these utility functions at the top of the file, after the existing utility functions

async function updateStudentProfile(token: string | null, data: { grade_level?: string; enrollment_year?: number }) {
  try {
    const result = await apiFetch("/student/profile", "PUT", token, data)
    return result
  } catch (error) {
    console.error("Student profile update failed:", error)
    throw error
  }
}

async function fetchStudentDashboard(token: string | null) {
  try {
    const dashboard = await apiFetch(`/student/dashboard`, "GET", token)
    return dashboard
  } catch (error) {
    console.error("Dashboard fetch failed:", error)
    throw error
  }
}

interface Course {
  course_id: number
  user_id: number
  teacher_name: string
  title: string
  color?: string
  announcements?: number | string
  description?: string
  assignments?: number
  subject_area?: string
  upcoming_assignments?: number
  start_date?: string
  end_date?: string
}

interface Assignment {
  assignment_id: number
  title: string
  course_id: number
  description: string
  due_date: string
  max_points?: number
  status?: string
}

interface Submission {
  submission_id: number
  assignment_id: number
  student_id: number
  assignmentTitle?: string
  content: string
  score?: string | number
  grade?: string
  feedback?: string
  status?: string
  submitted_at: string
}

interface Announcement {
  announcement_id: number
  course_id: number
  title: string
  content: string
  message?: string
  created_at?: string
  postedAt?: string
  course?: string
  is_pinned?: boolean
  date?: string
}

interface Material {
  material_id: number
  title: string
  description?: string
  type?: string
  file_path?: string
  uploaded_at: string
  course_id: number
}

export default function StudentDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const { isAuthenticated } = useAuth() // Assume this checks session validity
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [router, setRouter] = useState(useRouter())
  const [joinedCourses, setJoinedCourses] = useState<Course[]>([])
  const [joinData, setJoinData] = useState({ course_id: "", name: "" })
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  // Add these state variables inside the StudentDashboard component
  const [studentProfile, setStudentProfile] = useState<{
    grade_level?: string
    enrollment_year?: number
  }>({})
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseDetails, setCourseDetails] = useState<any>(null)
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([])
  const [courseMaterials, setCourseMaterials] = useState<Material[]>([])
  const [courseAnnouncements, setCourseAnnouncements] = useState<Announcement[]>([])
  const [courseSubmissions, setCourseSubmissions] = useState<Submission[]>([])
  const [newSubmission, setNewSubmission] = useState({
    assignment_id: "",
    content: "",
  })
  const [updateSubmissionData, setUpdateSubmissionData] = useState({
    submission_id: "",
    content: "",
  })
  const [profileUpdateData, setProfileUpdateData] = useState({
    grade_level: "",
    enrollment_year: "",
  })

  // Check authentication and load profile once
  useEffect(() => {
    const storedToken = sessionStorage.getItem("token")
    if (!storedToken) {
      router.replace("/login")
      return
    }

    try {
      const payload = JSON.parse(atob(storedToken.split(".")[1]))
      if (payload.exp * 1000 < Date.now()) {
        handleLogout()
        return
      }
      setToken(storedToken)
      setLoading(false)
    } catch (err) {
      console.error("Invalid token format", err)
      handleLogout()
    }
  }, [router])

  // Fetch profile if token exists
  useEffect(() => {
    if (!token) return

    apiFetch(`/profile`, "GET", token)
      .then((data) => {
        if (data.user) {
          setUser({ name: data.user.name, email: data.user.email })
        } else {
          handleLogout()
        }
      })
      .catch((err) => {
        console.error("Failed to fetch profile", err)
        handleLogout()
      })
  }, [token, router])

  // Logout function
  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    router.replace("/login")
    window.location.reload()
  }

  // Fetch Joined Courses
  useEffect(() => {
    if (!token) return

    apiFetch(`/student/enrollments`, "GET", token)
      .then((data) => setJoinedCourses(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load joined courses", err))
  }, [token])

  // Fetch Assignments, Announcements, and Materials
  useEffect(() => {
    if (!token || joinedCourses.length === 0) return

    const fetchCourseData = async () => {
      try {
        // Fetch assignments for all courses
        const assignmentPromises = joinedCourses.map((course) =>
          apiFetch(`/classrooms/${course.course_id}/assignments`, "GET", token),
        )
        const assignmentResults = await Promise.all(assignmentPromises)
        const allAssignments = assignmentResults.flat().filter(Boolean)
        setUpcomingAssignments(allAssignments)

        // Fetch announcements for all courses
        const announcementPromises = joinedCourses.map((course) =>
          apiFetch(`/classrooms/${course.course_id}/announcements`, "GET", token),
        )
        const announcementResults = await Promise.all(announcementPromises)
        const allAnnouncements = announcementResults.flat().filter((a) => a && a.course)
        setAnnouncements(allAnnouncements)

        // Fetch materials for all courses
        const materialPromises = joinedCourses.map((course) =>
          apiFetch(`/classrooms/${course.course_id}/materials`, "GET", token),
        )
        const materialResults = await Promise.all(materialPromises)
        const allMaterials = materialResults.flat().filter(Boolean)
        setMaterials(allMaterials)
      } catch (error) {
        console.error("Failed to fetch course data:", error)
      }
    }

    fetchCourseData()
  }, [token, joinedCourses])

  // Fetch Submissions
  useEffect(() => {
    if (!token) return

    const fetchSubmissions = async () => {
      try {
        const data = await apiFetch(`/student/submissions`, "GET", token)
        setSubmissions(data || [])
      } catch (error) {
        console.error("Failed to load submissions:", error)
      }
    }

    fetchSubmissions()
  }, [token])

  // Add these useEffect hooks after the existing ones

  // Fetch student dashboard data
  useEffect(() => {
    if (!token) return

    const loadDashboardData = async () => {
      try {
        const data = await fetchStudentDashboard(token)
        setDashboardData(data)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      }
    }

    loadDashboardData()
  }, [token])

  // Fetch course details when a course is selected
  useEffect(() => {
    if (!token || !selectedCourse) return

    const loadCourseDetails = async () => {
      try {
        // Fetch course details
        const details = await apiFetch(`/classrooms/${selectedCourse.course_id}`, "GET", token)
        setCourseDetails(details)

        // Fetch assignments
        const assignments = await apiFetch(`/classrooms/${selectedCourse.course_id}/assignments`, "GET", token)
        setCourseAssignments(assignments || [])

        // Fetch materials
        const materials = await apiFetch(`/classrooms/${selectedCourse.course_id}/materials`, "GET", token)
        setCourseMaterials(materials || [])

        // Fetch announcements
        const announcements = await apiFetch(`/classrooms/${selectedCourse.course_id}/announcements`, "GET", token)
        setCourseAnnouncements(announcements || [])

        // Fetch submissions for this course's assignments
        const allSubmissions: Submission[] = []
        for (const assignment of assignments || []) {
          try {
            const submissions = await apiFetch(`/assignments/${assignment.assignment_id}/submissions`, "GET", token)
            if (submissions && Array.isArray(submissions)) {
              allSubmissions.push(...submissions)
            }
          } catch (err) {
            console.error(`Failed to fetch submissions for assignment ${assignment.assignment_id}:`, err)
          }
        }
        setCourseSubmissions(allSubmissions)
      } catch (error) {
        console.error("Failed to load course details:", error)
      }
    }

    loadCourseDetails()
  }, [token, selectedCourse])

  // Join course
  const handleJoinCourse = async () => {
    const courseId = Number.parseInt(joinData.course_id)
    const teacherName = joinData.name.trim()

    if (isNaN(courseId) || courseId <= 0) {
      alert("Valid Course ID is required")
      return
    }

    if (!teacherName) {
      alert("Teacher name is required")
      return
    }

    try {
      const result = await apiFetch(`/enroll`, "POST", token, {
        course_id: courseId,
        teacher_name: teacherName,
      })

      const teacherInfo =
        result.teacher_name && result.teacher_name.trim() !== "" ? result.teacher_name : "No teacher assigned"

      alert(
        `Enrollment successful: ${result.message}\nEnrolled in "${result.course_title}" (Course ID: ${result.course_id}) with teacher: ${teacherInfo}`,
      )

      // Clear inputs
      setJoinData({ course_id: "", name: "" })

      // Refresh dashboard data
      if (result.course) {
        setJoinedCourses((prev) => [...prev, result.course])
      } else {
        // Refresh the entire course list if the API doesn't return the new course
        const enrollments = await apiFetch("/student/enrollments", "GET", token)
        setJoinedCourses(Array.isArray(enrollments) ? enrollments : [])
      }
    } catch (error: any) {
      const errorMsg = error.message || "Unknown error occurred"
      if (errorMsg.includes("No classroom exists")) {
        alert("No classroom exists with this Course ID. Please check the ID and try again.")
      } else if (errorMsg.includes("Teacher does not match the course")) {
        alert("The teacher name does not match the course. Please check the teacher name and try again.")
      } else {
        alert(`Enrollment failed: ${errorMsg}`)
      }
    }
  }

  // Create submission
  // const handleCreateSubmission = async (assignmentId: number, content: string) => {
  //   if (!assignmentId || !content.trim()) {
  //     alert("Assignment ID and content are required")
  //     return
  //   }

  //   try {
  //     const result = await apiFetch("/submissions", "POST", token, {
  //       assignment_id: assignmentId,
  //       content,
  //     })

  //     alert("Submission created: " + (result.message || "Success"))

  //     // Refresh submissions
  //     const updatedSubmissions = await apiFetch("/student/submissions", "GET", token)
  //     setSubmissions(updatedSubmissions || [])

  //     return true
  //   } catch (error: any) {
  //     console.error("Create submission error:", error)
  //     alert(`Submission failed: ${error.message}`)
  //     return false
  //   }
  // }

  // Update submission
  // const handleUpdateSubmission = async (submissionId: number, content: string) => {
  //   if (!submissionId || !content.trim()) {
  //     alert("Submission ID and content are required")
  //     return
  //   }

  //   try {
  //     const result = await apiFetch(`/submissions/${submissionId}`, "PUT", token, {
  //       content,
  //     })

  //     alert("Submission updated: " + (result.message || "Success"))

  //     // Refresh submissions
  //     const updatedSubmissions = await apiFetch("/student/submissions", "GET", token)
  //     setSubmissions(updatedSubmissions || [])

  //     return true
  //   } catch (error: any) {
  //     console.error("Update submission error:", error)
  //     alert(`Submission update failed: ${error.message}`)
  //     return false
  //   }
  // }

  // Add these handler functions to the component

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!token) return

    try {
      const data = {
        grade_level: profileUpdateData.grade_level || undefined,
        enrollment_year: profileUpdateData.enrollment_year ? Number(profileUpdateData.enrollment_year) : undefined,
      }

      if (!data.grade_level && !data.enrollment_year) {
        alert("Please provide at least one field to update")
        return
      }

      await updateStudentProfile(token, data)
      alert("Profile updated successfully")

      // Reset form
      setProfileUpdateData({
        grade_level: "",
        enrollment_year: "",
      })

      // Refresh profile data
      const updatedProfile = await apiFetch("/profile", "GET", token)
      setUser({
        name: updatedProfile.user.name,
        email: updatedProfile.user.email,
      })
      setStudentProfile({
        grade_level: updatedProfile.student?.grade_level,
        enrollment_year: updatedProfile.student?.enrollment_year,
      })
    } catch (error) {
      console.error("Failed to update profile:", error)
      alert(`Failed to update profile: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Handle course selection
  const handleCourseSelect = (courseId: number) => {
    const course = joinedCourses.find((c) => c.course_id === courseId)
    if (course) {
      setSelectedCourse(course)
    }
  }

  // Handle submission creation
  const handleCreateSubmission = async () => {
    if (!token) return

    const assignmentId = Number(newSubmission.assignment_id)
    const content = newSubmission.content.trim()

    if (isNaN(assignmentId) || assignmentId <= 0) {
      alert("Please provide a valid assignment ID")
      return
    }

    if (!content) {
      alert("Please provide submission content")
      return
    }

    try {
      await apiFetch(`/submissions`, "POST", token, {
        assignment_id: assignmentId,
        content,
      })

      alert("Submission created successfully")

      // Reset form
      setNewSubmission({
        assignment_id: "",
        content: "",
      })

      // Refresh submissions if a course is selected
      if (selectedCourse) {
        const assignments = await apiFetch(`/classrooms/${selectedCourse.course_id}/assignments`, "GET", token)
        const allSubmissions: Submission[] = []
        for (const assignment of assignments || []) {
          try {
            const submissions = await apiFetch(`/assignments/${assignment.assignment_id}/submissions`, "GET", token)
            if (submissions && Array.isArray(submissions)) {
              allSubmissions.push(...submissions)
            }
          } catch (err) {
            console.error(`Failed to fetch submissions for assignment ${assignment.assignment_id}:`, err)
          }
        }
        setCourseSubmissions(allSubmissions)
      }
    } catch (error) {
      console.error("Failed to create submission:", error)
      alert(`Failed to create submission: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Handle submission update
  const handleUpdateSubmission = async () => {
    if (!token) return

    const submissionId = Number(updateSubmissionData.submission_id)
    const content = updateSubmissionData.content.trim()

    if (isNaN(submissionId) || submissionId <= 0) {
      alert("Please provide a valid submission ID")
      return
    }

    if (!content) {
      alert("Please provide submission content")
      return
    }

    try {
      await apiFetch(`/submissions/${submissionId}`, "PUT", token, {
        content,
      })

      alert("Submission updated successfully")

      // Reset form
      setUpdateSubmissionData({
        submission_id: "",
        content: "",
      })

      // Refresh submissions if a course is selected
      if (selectedCourse) {
        const assignments = await apiFetch(`/classrooms/${selectedCourse.course_id}/assignments`, "GET", token)
        const allSubmissions: Submission[] = []
        for (const assignment of assignments || []) {
          try {
            const submissions = await apiFetch(`/assignments/${assignment.assignment_id}/submissions`, "GET", token)
            if (submissions && Array.isArray(submissions)) {
              allSubmissions.push(...submissions)
            }
          } catch (err) {
            console.error(`Failed to fetch submissions for assignment ${assignment.assignment_id}:`, err)
          }
        }
        setCourseSubmissions(allSubmissions)
      }
    } catch (error) {
      console.error("Failed to update submission:", error)
      alert(`Failed to update submission: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // const isDueTomorrow = (dueDate: string) => {
  //   const date = new Date(dueDate);
  //   const tomorrow = new Date();
  //   tomorrow.setDate(tomorrow.getDate() + 1);
  //   return (
  //     date.getDate() === tomorrow.getDate() &&
  //     date.getMonth() === tomorrow.getMonth() &&
  //     date.getFullYear() === tomorrow.getFullYear()
  //   );
  // };

  // const dueTomorrow = upcomingAssignments.filter((a) => isDueTomorrow(a.dueDate));

  // Prevent premature rendering
  if (loading) return null

  // Replace the Tabs section in the return statement with this updated version
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-col bg-card border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EduSync</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="px-4 py-2">
            <h2 className="mb-2 text-lg font-semibold">Dashboard</h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard/student">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="#">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="#">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </Button>
            </div>
          </div>
        </nav>
        <div className="px-4 py-2">
          <h2 className="mb-2 text-lg font-semibold">My Courses</h2>
          <div className="space-y-1">
            {joinedCourses.map((course) => (
              <Button
                key={course.course_id}
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link href={`/classrooms/${course.course_id}`}>
                  <div className={`mr-2 h-3 w-3 rounded-full ${course.color}`} />
                  {course.title}
                </Link>
              </Button>
            ))}

            {/* Join Course Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <span className="mr-2">+</span>
                  Join Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Class</DialogTitle>
                  <DialogDescription>
                    Enter the course ID and Teacher name to join a class.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Course ID"
                    value={joinData.course_id}
                    onChange={(e) =>
                      setJoinData({ ...joinData, course_id: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Teacher Name"
                    value={joinData.name}
                    onChange={(e) =>
                      setJoinData({ ...joinData, name: e.target.value })
                    }
                  />
                  <Button className="w-full" onClick={handleJoinCourse}>
                    Join Class
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="border-t p-4">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="#">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EduSync</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <div className="px-4 py-2">
              <h2 className="mb-2 text-lg font-semibold">Dashboard</h2>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" asChild>     <Link href="/dashboard/student" onClick={() => setMobileMenuOpen(false)}>
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="#" onClick={() => setMobileMenuOpen(false)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="#" onClick={() => setMobileMenuOpen(false)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages
                  </Link>
                </Button>
              </div>
            </div>
          </nav>
          <div className="border-t p-4">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="#" onClick={() => setMobileMenuOpen(false)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>

          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full appearance-none bg-background pl-8 md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setProfileOpen(!profileOpen)} className="relative">
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Button>
          {user && (
            <ProfilePopup
              name={user.name}
              email={user.email}
              isOpen={profileOpen}
              onClose={() => setProfileOpen(false)}
              onLogout={handleLogout}
            />
          )}
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Tabs defaultValue="announcements" className="mt-6">
            <TabsList>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {joinedCourses.length > 0 ? (
                  joinedCourses.map((course) => (
                    <Card key={course.course_id} className="overflow-hidden">
                      <div className={`h-2 w-full ${course.color}`} />
                      <CardHeader>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>Teacher: {course.teacher_name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description || "No description available."}
                        </p>
                      </CardContent>
                      <CardFooter className="bg-muted/50 flex justify-between">
                        <Button variant="ghost" className="w-full" asChild>
                          <Link href={`/classrooms/${course.course_id}`}></Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCourseSelect(course.course_id)}>
                          Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">You haven't joined any courses yet.</p>
                )}
              </div>

              {selectedCourse && (
                <div className="mt-8 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Details: {selectedCourse.title}</CardTitle>
                      <CardDescription>Teacher: {selectedCourse.teacher_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Course Information</h3>
                        <div className="grid gap-2">
                          <div>
                            <span className="font-medium">Subject:</span> {courseDetails?.subject_area || "Not specified"}
                          </div>
                          <div>
                            <span className="font-medium">Start Date:</span>{" "}
                            {courseDetails?.start_date ? formatDate(courseDetails.start_date) : "Not specified"}
                          </div>
                          <div>
                            <span className="font-medium">End Date:</span>{" "}
                            {courseDetails?.end_date ? formatDate(courseDetails.end_date) : "Not specified"}
                          </div>
                          <div>
                            <span className="font-medium">Description:</span>{" "}
                            {courseDetails?.description || "No description available."}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Assignments</h3>
                        {courseAssignments.length > 0 ? (
                          <div className="space-y-2">
                            {courseAssignments.map((assignment) => {
                              const dueDate = assignment.due_date
                              const dueDateFormatted = dueDate ? formatDate(dueDate) : "No due date"
                              const relativeTime = dueDate ? getRelativeTime(dueDate) : ""
                              const isOverdue = dueDate ? isDueDateOver(dueDate) : false
                              const timeClass = isOverdue
                                ? "text-red-500 font-bold"
                                : dueDate && new Date(dueDate).getTime() - Date.now() <= 24 * 60 * 60 * 1000
                                  ? "text-orange-500 font-bold"
                                  : "text-green-500"

                              return (
                                <Card key={assignment.assignment_id} className="p-4">
                                  <div className="flex justify-between">
                                    <div>
                                      <h4 className="font-medium">{assignment.title}</h4>
                                      <p className="text-sm">
                                        <span className="font-medium">Due:</span> {dueDateFormatted}
                                        {relativeTime && <span className={`ml-2 ${timeClass}`}>({relativeTime})</span>}
                                      </p>
                                      <p className="text-sm mt-1">{assignment.description || "No description"}</p>
                                    </div>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm">Submit</Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Submit Assignment</DialogTitle>
                                          <DialogDescription>
                                            Enter your submission for "{assignment.title}"
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                          <Textarea
                                            placeholder="Enter your submission here..."
                                            className="min-h-[150px]"
                                            value={newSubmission.content}
                                            onChange={(e) =>
                                              setNewSubmission({
                                                assignment_id: assignment.assignment_id.toString(),
                                                content: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        <DialogFooter>
                                          <Button
                                            onClick={() => {
                                              setNewSubmission({
                                                assignment_id: assignment.assignment_id.toString(),
                                                content: newSubmission.content,
                                              })
                                              handleCreateSubmission()
                                            }}
                                          >
                                            Submit Assignment
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No assignments for this course.</p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Announcements</h3>
                        {courseAnnouncements.length > 0 ? (
                          <div className="space-y-2">
                            {courseAnnouncements.map((announcement) => (
                              <Card
                                key={announcement.announcement_id}
                                className={`p-4 ${announcement.is_pinned ? "border-primary" : ""}`}
                              >
                                {announcement.is_pinned && (
                                  <div className="bg-primary text-primary-foreground text-xs px-3 py-1 absolute right-2 top-2 rounded-full">
                                    Pinned
                                  </div>
                                )}
                                <h4 className="font-medium">{announcement.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {(announcement.created_at || announcement.date) ? 
                                    formatDate(announcement.created_at || announcement.date || "") : 
                                    "Unknown date"}
                                </p>
                                <p className="text-sm mt-2">{announcement.content || "No content"}</p>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No announcements for this course.</p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Materials</h3>
                        {courseMaterials.length > 0 ? (
                          <div className="space-y-2">
                            {courseMaterials.map((material) => (
                              <Card key={material.material_id} className="p-4">
                                <h4 className="font-medium">{material.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {material.type || "Document"} • {formatDate(material.uploaded_at)}
                                </p>
                                <p className="text-sm mt-1">{material.description || "No description"}</p>
                                {material.file_path && (
                                  <div className="mt-2">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={material.file_path} target="_blank" rel="noopener noreferrer">
                                        Open
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No materials for this course.</p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">My Submissions</h3>
                        {courseSubmissions.length > 0 ? (
                          <div className="space-y-2">
                            {courseSubmissions.map((submission) => {
                              const assignment = courseAssignments.find((a) => a.assignment_id === submission.assignment_id)
                              return (
                                <Card key={submission.submission_id} className="p-4">
                                  <div className="flex justify-between">
                                    <div>
                                      <h4 className="font-medium">
                                        {assignment?.title || `Assignment ID: ${submission.assignment_id}`}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        Submitted: {formatDate(submission.submitted_at)}
                                      </p>
                                      <div className="mt-2">
                                        <p className="font-medium">Content:</p>
                                        <p className="text-sm bg-muted p-2 rounded mt-1">{submission.content}</p>
                                      </div>
                                      {(submission.score !== undefined || submission.grade !== undefined) && (
                                        <p className="text-sm mt-2">
                                          <span className="font-medium">Score:</span>{" "}
                                          {submission.score || submission.grade || "Not graded"}
                                        </p>
                                      )}
                                      {submission.feedback && (
                                        <div className="mt-2">
                                          <p className="font-medium">Feedback:</p>
                                          <p className="text-sm bg-muted p-2 rounded mt-1">{submission.feedback}</p>
                                        </div>
                                      )}
                                    </div>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          Update
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Update Submission</DialogTitle>
                                          <DialogDescription>Edit your submission content</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                          <Textarea
                                            placeholder="Enter your updated submission here..."
                                            className="min-h-[150px]"
                                            defaultValue={submission.content}
                                            onChange={(e) =>
                                              setUpdateSubmissionData({
                                                submission_id: submission.submission_id.toString(),
                                                content: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        <DialogFooter>
                                          <Button
                                            onClick={() => {
                                              setUpdateSubmissionData({
                                                submission_id: submission.submission_id.toString(),
                                                content: updateSubmissionData.content || submission.content,
                                              })
                                              handleUpdateSubmission()
                                            }}
                                          >
                                            Update Submission
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No submissions for this course.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="mt-4">
              <div className="space-y-4">
                {upcomingAssignments.length > 0 ? (
                  upcomingAssignments
                    .filter((assignment): assignment is Assignment => assignment !== null && assignment !== undefined)
                    .map((assignment) => {
                      const dueDate = assignment.due_date
                      const dueDateFormatted = dueDate ? formatDate(dueDate) : "No due date"
                      const relativeTime = dueDate ? getRelativeTime(dueDate) : ""
                      const isOverdue = dueDate ? isDueDateOver(dueDate) : false
                      const timeClass = isOverdue
                        ? "text-red-500 font-bold"
                        : dueDate && new Date(dueDate).getTime() - Date.now() <= 24 * 60 * 60 * 1000
                          ? "text-orange-500 font-bold"
                          : "text-green-500"

                      return (
                        <Card key={assignment.assignment_id}>
                          <CardHeader>
                            <CardTitle>{assignment.title}</CardTitle>
                            <CardDescription>Course ID: {assignment.course_id}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-2">
                              <span className="font-medium">Due Date:</span> {dueDateFormatted}
                              {relativeTime && <span className={`ml-2 ${timeClass}`}>({relativeTime})</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.description || "No description provided."}
                            </p>
                          </CardContent>
                          <CardFooter className="bg-muted/50 flex justify-between">
                            <span className="text-sm text-muted-foreground">Status: {assignment.status || "Pending"}</span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm">Submit Assignment</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Submit Assignment</DialogTitle>
                                  <DialogDescription>Enter your submission for "{assignment.title}"</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <Textarea
                                    placeholder="Enter your submission here..."
                                    className="min-h-[150px]"
                                    value={newSubmission.content}
                                    onChange={(e) =>
                                      setNewSubmission({
                                        assignment_id: assignment.assignment_id.toString(),
                                        content: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={() => {
                                      setNewSubmission({
                                        assignment_id: assignment.assignment_id.toString(),
                                        content: newSubmission.content,
                                      })
                                      handleCreateSubmission()
                                    }}
                                  >
                                    Submit
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </CardFooter>
                        </Card>
                      )
                    })
                ) : (
                  <p className="text-muted-foreground">No upcoming assignments.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="announcements" className="mt-4">
              <div className="space-y-4">
                {announcements.length > 0 ? (
                  announcements
                    .filter(
                      (a): a is Announcement =>
                        a !== null && a !== undefined && (a.course !== undefined || a.course_id !== undefined),
                    )
                    .map((a) => {
                      const announcementDate = a.created_at || a.postedAt || a.date
                      const formattedDate = announcementDate ? formatDate(announcementDate) : "Unknown date"

                      return (
                        <Card key={a.announcement_id} className={a.is_pinned ? "border-primary" : ""}>
                          {a.is_pinned && (
                            <div className="bg-primary text-primary-foreground text-xs px-3 py-1 absolute right-2 top-2 rounded-full">
                              Pinned
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle>{a.title}</CardTitle>
                            <CardDescription>
                              {a.course || `Course ID: ${a.course_id}`} • {formattedDate}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {a.content || a.message || "No content available."}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })
                ) : (
                  <p className="text-muted-foreground">No recent announcements.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="mt-4">
              <div className="space-y-4">
                {submissions.length > 0 ? (
                  submissions.map((s) => {
                    const submittedDate = formatDate(s.submitted_at)

                    return (
                      <Card key={s.submission_id}>
                        <CardHeader>
                          <CardTitle>{s.assignmentTitle || `Assignment ID: ${s.assignment_id}`}</CardTitle>
                          <CardDescription>Submitted on {submittedDate}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Content:</span>
                              <p className="text-sm mt-1 p-3 bg-muted rounded-md">{s.content || "No content"}</p>
                            </div>
                            <div className="flex justify-between">
                              <div>
                                <span className="font-medium">Score:</span>
                                <span className="text-sm ml-2">{s.score || s.grade || "Not graded yet"}</span>
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>
                                <span className="text-sm ml-2">{s.status || "Pending"}</span>
                              </div>
                            </div>
                            {s.feedback && (
                              <div>
                                <span className="font-medium">Feedback:</span>
                                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{s.feedback}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="bg-muted/50 flex justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Update Submission
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Submission</DialogTitle>
                                <DialogDescription>Edit your submission content</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Textarea
                                  placeholder="Enter your updated submission here..."
                                  className="min-h-[150px]"
                                  defaultValue={s.content}
                                  onChange={(e) =>
                                    setUpdateSubmissionData({
                                      submission_id: s.submission_id.toString(),
                                      content: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => {
                                    setUpdateSubmissionData({
                                      submission_id: s.submission_id.toString(),
                                      content: updateSubmissionData.content || s.content,
                                    })
                                    handleUpdateSubmission()
                                  }}
                                >
                                  Update
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      </Card>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground">You have no submissions yet.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="materials" className="mt-4">
              <div className="space-y-4">
                {materials.length > 0 ? (
                  materials.map((material) => (
                    <Card key={material.material_id}>
                      <CardHeader>
                        <CardTitle>{material.title}</CardTitle>
                        <CardDescription>
                          {material.type || "Document"} • Uploaded {formatDate(material.uploaded_at)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {material.description || "No description available."}
                        </p>
                        {material.file_path && (
                          <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                            <span className="text-sm font-medium truncate max-w-[70%]">{material.file_path}</span>
                            <Button size="sm" variant="outline" asChild>
                              <a href={material.file_path} target="_blank" rel="noopener noreferrer">
                                Open
                              </a>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No materials available.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Profile</CardTitle>
                  <CardDescription>Update your student information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="grade-level">Grade Level</Label>
                      <Input
                        id="grade-level"
                        placeholder="e.g., 10th Grade, Freshman, etc."
                        value={profileUpdateData.grade_level}
                        onChange={(e) => setProfileUpdateData({ ...profileUpdateData, grade_level: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="enrollment-year">Enrollment Year</Label>
                      <Input
                        id="enrollment-year"
                        type="number"
                        placeholder="e.g., 2023"
                        value={profileUpdateData.enrollment_year}
                        onChange={(e) => setProfileUpdateData({ ...profileUpdateData, enrollment_year: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleUpdateProfile}>Update Profile</Button>
                </CardFooter>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Create Submission</CardTitle>
                  <CardDescription>Submit an assignment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="assignment-id">Assignment ID</Label>
                      <Input
                        id="assignment-id"
                        placeholder="Enter assignment ID"
                        value={newSubmission.assignment_id}
                        onChange={(e) => setNewSubmission({ ...newSubmission, assignment_id: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="submission-content">Submission Content</Label>
                      <Textarea
                        id="submission-content"
                        placeholder="Enter your submission here..."
                        className="min-h-[150px]"
                        value={newSubmission.content}
                        onChange={(e) => setNewSubmission({ ...newSubmission, content: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCreateSubmission}>Submit Assignment</Button>
                </CardFooter>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Update Submission</CardTitle>
                  <CardDescription>Update an existing submission</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="submission-id">Submission ID</Label>
                      <Input
                        id="submission-id"
                        placeholder="Enter submission ID"
                        value={updateSubmissionData.submission_id}
                        onChange={(e) =>
                          setUpdateSubmissionData({ ...updateSubmissionData, submission_id: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="update-submission-content">Updated Content</Label>
                      <Textarea
                        id="update-submission-content"
                        placeholder="Enter your updated submission here..."
                        className="min-h-[150px]"
                        value={updateSubmissionData.content}
                        onChange={(e) => setUpdateSubmissionData({ ...updateSubmissionData, content: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleUpdateSubmission}>Update Submission</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
