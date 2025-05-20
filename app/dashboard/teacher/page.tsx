"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookOpen, Calendar, Edit, Home, LogOut, Menu, MessageSquare, Plus, Search, Settings, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ProfilePopup } from "@/components/profile-popup"
import { create } from "domain"

// Utility functions
const API_BASE_URL = "http://localhost:8080/api"

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

async function fetchUpcomingAssignments(token: string | null) {
  try {
    const assignments = await apiFetch("/teacher/assignments/upcoming", "GET", token)
    return assignments || []
  } catch (error) {
    console.error("Error fetching upcoming assignments:", error)
    return []
  }
}

async function fetchAssignmentStatistics(assignmentId: number, token: string | null) {
  try {
    const stats = await apiFetch(`/assignments/${assignmentId}/statistics`, "GET", token)
    return stats
  } catch (error) {
    console.error("Failed to fetch assignment statistics:", error)
    return null
  }
}

async function gradeSubmission(submissionId: number, score: number, feedback: string, token: string | null) {
  try {
    const result = await apiFetch(`/submissions/${submissionId}/grade`, "POST", token, {
      score,
      feedback: feedback || null,
    })
    return result
  } catch (error) {
    console.error("Grading failed:", error)
    throw error
  }
}

async function createMaterial(
  data: {
    course_id: number
    title: string
    description?: string
    type: string
    file_path: string
  },
  token: string | null,
) {
  try {
    const result = await apiFetch("/materials", "POST", token, data)
    return result
  } catch (error) {
    console.error("Material creation failed:", error)
    throw error
  }
}

async function updateMaterial(
  materialId: number,
  data: {
    title: string
    description?: string
    type: string
    file_path: string
  },
  token: string | null,
) {
  try {
    const result = await apiFetch(`/materials/${materialId}`, "PUT", token, data)
    return result
  } catch (error) {
    console.error("Material update failed:", error)
    throw error
  }
}

async function deleteMaterial(materialId: number, token: string | null) {
  try {
    const result = await apiFetch(`/materials/${materialId}`, "DELETE", token)
    return result
  } catch (error) {
    console.error("Material deletion failed:", error)
    throw error
  }
}


interface Course {
  course_id: number
  title: string
  description?: string
  subject?: string
  students?: number
  assignments?: number
  color?: string
  start_date?: string
  end_date?: string
}

interface Student {
  student_id: number
  name: string
  email: string
  grade_level?: string
  enrollment_year?: number
}

interface Assignment {
  assignment_id: number
  title: string
  description?: string
  due_date?: string
  course_id: number
  max_points?: number
}

interface Submission {
  submission_id: number
  student_id: number
  assignment_id: number
  submitted_at: string
  course: string
}
interface Announcement {
  announcement_id: number
  course_id: number
  title: string
  content: string
  created_at: string; 
  is_pinned: boolean;
}
interface material {
  material_id: number
  title: string
  description?: string
  course_id: number
  file_path: string
  type?: string
  uploaded_at?: string
}
interface AssignmentStats {
  assignment_id: number
  average_score?: number
  submission_count?: number
}
export default function TeacherDashboard() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]); 
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]); 
  const [newCourseData, setNewCourseData] = useState({
    title: "",
    description: "",
    subject: "",
    start_date: "",
    end_date: ""
  })
  const [editCourseData, setEditCourseData] = useState<Course | null>(null) 

  // Course detail view states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [courseAnnouncements, setCourseAnnouncements] = useState<Announcement[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    max_points: 100
  });
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null) // New state for editing assignments

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    is_pinned: false,
  })
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null) // New state for editing announcements

  // Add these state variables inside the TeacherDashboard component
  const [upcomingDueDates, setUpcomingDueDates] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<material[]>([]);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "document",
    file_path: ""
  });
  const [submissionToGrade, setSubmissionToGrade] = useState<{
    submission_id: number;
    score: number;
    feedback: string;
  } | null>(null);

  const [assignmentStats, setAssignmentStats] = useState<{ [key: number]: AssignmentStats }>({}) // New state for assignment statistics
  const [studentProfile, setStudentProfile] = useState<Student | null>(null) // New state for student profile
  const [editProfile, setEditProfile] = useState<{ name: string; email: string } | null>(null) // New state for editing profile

  const [userStats, setUserStats] = useState<{ total_students: number, total_assignments: number }>({
    total_students: 0,
    total_assignments: 0
  });

  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);


  // Improved logout handler with redirection flag to prevent loops
  const handleLogout = useCallback(() => {
    if (redirecting) return
    setRedirecting(true)
    
    console.log("Logging out")
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    
    // Use window.location for a clean navigation
    window.location.href = "/login"
  }, [redirecting])

  // Check authentication
  useEffect(() => {
    console.log("Teacher dashboard - checking auth")
    
    if (redirecting) return
    const storedToken = sessionStorage.getItem("token");
    console.log("Token exists:", !!storedToken)

    if (!storedToken) {
      console.log("No token found, redirecting to login")
      setRedirecting(true)
      router.replace("/login")
      return
    }
    try {
      // Verify token expiration
      const tokenPayload = JSON.parse(atob(storedToken.split(".")[1]))
      const isExpired = tokenPayload.exp * 1000 < Date.now()
      
      if (isExpired) {
        console.log("Token expired, logging out")
        handleLogout()
        return
      }
      
      // Token is valid
      console.log("Token valid, setting token")
      setToken(storedToken)
      setLoading(false)
    } catch (error) {
      console.error("Error parsing token", error)
      setToken(null)
      setLoading(false)
    }
  }, [router, handleLogout, redirecting])

  // Fetch courses
  useEffect(() => {
    if (!token || redirecting) return;

    console.log("Fetching courses")
    fetch("http://localhost:8080/api/teacher/classrooms", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch courses")
        }
        return res.json()
      })
      .then((data) => {
        if (!data || (!Array.isArray(data) && !data.courses && !data.classrooms)) {
          console.error("Invalid API response:", data)
          setCourses([])
          return
        }

        console.log("Courses fetched:", data);
        let validCourses: Course[] = [];
        
        try {
          if (data.courses && Array.isArray(data.courses)) {
            validCourses = data.courses.map((course: Course) => ({
                ...course,
                title: course.title || "Untitled Course",
                subject: course.subject || undefined,
                color: course.color || undefined,
                students: typeof course.students === 'number' ? course.students : 0,
                assignments: typeof course.assignments === 'number' ? course.assignments : 0
              }));
              
          } else if (data.classrooms && Array.isArray(data.classrooms)) {
            validCourses = data.classrooms.map((course: Course) => ({
                ...course,
                title: course.title || "Untitled Course",
                subject: course.subject || undefined,
                color: course.color || undefined,
                students: typeof course.students === 'number' ? course.students : 0,
                assignments: typeof course.assignments === 'number' ? course.assignments : 0
              }));
          } else if (Array.isArray(data)) {
            validCourses = data.map(course => ({
                ...course,
                title: course.title || "Untitled Course",
                subject: course.subject || undefined,
                color: course.color || undefined,
                students: typeof course.students === 'number' ? course.students : 0,
                assignments: typeof course.assignments === 'number' ? course.assignments : 0
              }));
          }
        } catch (error) {
          console.error("Error processing courses data:", error);
        }
        
        setCourses(validCourses);
      })
      .catch((err) => {
        console.error("Error fetching courses", err);
        // Don't alert, just log the error
      });
  }, [token, handleLogout, redirecting]);

  // Fetch recent submissions
  useEffect(() => {
    if (!token || courses.length === 0 || redirecting) return;
  
    const assignment_id = courses[0].assignments;
    if (assignment_id) {
      // Either fetch all submissions for this course or specify a default assignment
      apiFetch(`/assignments/${assignment_id}/submissions`, "GET", token)
        .then((data) => {
          console.log("Submissions API response:", data); // Debug response
          setRecentSubmissions(data.submissions || []);
        })
        .catch((err) => {
          console.error("Error fetching recent submissions", err);
          // Don't alert, just log the error
        });
    }
  }, [token, courses, redirecting]);

  // Fetch user profile
  useEffect(() => {
    if (!token || redirecting) return; // Ensure token exists before making the fetch call
    console.log("Fetching user profile")
    apiFetch(`/profile`, "GET", token)
      .then((data) => {
        if (data.user) {
          console.log("User profile fetched")
          setUser({
            name: data.user.name || "Teacher",
            email: data.user.email || "No email available",
            role: data.user.role,
          })
        } else {
          console.log("No user data in response")
        }
      })
      .catch((err) => {
        console.error("Error fetching profile", err);
        if (err.message.includes("401") || err.message.includes("403")) {
          console.log("Auth error fetching profile, logging out")
          handleLogout()
        };
      });
  }, [token, handleLogout, redirecting]); // Dependency array ensures this runs when token changes

  // Add this useEffect to fetch upcoming assignments
  useEffect(() => {
    if (!token || redirecting) return;

    const loadUpcomingAssignments = async () => {
      try {
        const assignments = await fetchUpcomingAssignments(token);
        setUpcomingDueDates(assignments);
      } catch (error) {
        console.error("Failed to load upcoming assignments:", error);
      }
    };

    loadUpcomingAssignments();
  }, [token, redirecting]);

  // This function was replaced by the useCallback version above

  const [profileOpen, setProfileOpen] = useState(false)

  const handleNewCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewCourseData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubjectChange = (value: string) => {
    setNewCourseData((prev) => ({ ...prev, subject: value }))
  }

  // New: Handle course update
  const handleUpdateCourse = async () => {
    if (!editCourseData || !token) return
    try {
      const payload = {
        title: editCourseData.title,
        description: editCourseData.description || null,
        subject: editCourseData.subject || null,
        start_date: editCourseData.start_date || null,
        end_date: editCourseData.end_date || null,
      }
      await apiFetch(`/classrooms/${editCourseData.course_id}`, "PUT", token, payload)
      setCourses((prev) =>
        prev.map((c) =>
          c.course_id === editCourseData.course_id ? { ...c, ...editCourseData } : c
        )
      )
      setEditCourseData(null)
      alert("Course updated successfully.")
    } catch (error) {
      console.error("Error updating course:", error)
      alert(`Failed to update course: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleCreateCourse = () => {
    if (!token || !newCourseData.title) {
      alert("Please provide a course title");
      return;
    }

    fetch("http://localhost:8080/classrooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newCourseData),
    })
      .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to create course");
      }
      return res.json();
      })
      .then((data) => {
        if (!data || (!Array.isArray(data) && !data.courses && !data.classrooms)) {
          console.error("Invalid API response:", data);
          setCourses([]);
          return;
        }
      
        console.log("Courses fetched:", data);
        let validCourses: Course[] = [];
      
        try {
          if (data.courses && Array.isArray(data.courses)) {
            validCourses = data.courses
              .map((course: Course) => ({
                ...course,
                title: course.title || "Untitled Course",
                subject: course.subject || undefined,
                start_date: course.start_date || undefined,
                end_date: course.end_date || undefined,
                color: course.color || undefined,
                students: typeof course.students === "number" ? course.students : 0,
                assignments: typeof course.assignments === "number" ? course.assignments : 0,
              }));
          } else if (data.classrooms && Array.isArray(data.classrooms)) {
            validCourses = data.classrooms
              .map((course: Course) => ({
                ...course,
                title: course.title || "Untitled Course",
                subject: course.subject || undefined,
                start_date: course.start_date || undefined,
                end_date: course.end_date || undefined,
                color: course.color || undefined,
                students: typeof course.students === "number" ? course.students : 0,
                assignments: typeof course.assignments === "number" ? course.assignments : 0,
              }));
          }
        } catch (error) {
          console.error("Error processing courses data:", error);
        }
      
        setCourses(validCourses);
      })
      .catch((err) => {
        console.error("Error fetching courses", err);
      });
  };
  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    if (!token) {
      alert("Authentication error: No token found.");
      return;
    }
    try {
      const response = await fetch(`/classrooms/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (response.ok) {
        setCourses(prev => prev.filter(c => c.course_id !== courseId));
        alert("Course deleted successfully.");
      } else {
        alert("Failed to delete course.");
      } 
    } catch (error) {
      alert("An error occurred while deleting the course.");
      console.error("Delete error:", error);
    }
  };

  // Load course details
  const loadCourseDetails = async (courseId: number) => {
    if (!token) return
    try {
      const data = await apiFetch(`/classrooms/${courseId}`, "GET", token);
      const announcementsData = await apiFetch(`http://localhost:8080/api/classrooms/${courseId}/announcements`, "GET", token);
      setCourseStudents(data.students || [])
      setCourseAssignments(data.assignments || [])
      setCourseAnnouncements(announcementsData.announcements || announcementsData || []);
      setMaterials(data.materials || [])
      const course = courses.find((c) => c.course_id === courseId)
      if (course) setSelectedCourse(course)
      // Fetch statistics for each assignment
      for (const assignment of data.assignments || []) {
        const stats = await fetchAssignmentStatistics(assignment.assignment_id, token)
        if (stats) {
          setAssignmentStats((prev) => ({
            ...prev,
            [assignment.assignment_id]: stats,
          }))
        }
      }
    } catch (error) {
      console.error("Error loading course details:", error)
    }
  }

  // Handle view course details
  const handleViewCourseDetails = (courseId: number) => {
    loadCourseDetails(courseId);
  };

  // Handle remove student from course
  const handleRemoveStudent = async (courseId: number, studentId: number) => {
    if (!confirm("Are you sure you want to remove this student from the course?")) return;
    try {
      const response = await fetch(`/classrooms/${courseId}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (response.ok) {
        setCourseStudents(prev => prev.filter(s => s.student_id !== studentId));
        alert("Student removed successfully.");
      } else {
        alert("Failed to remove student.");
      }
    } catch (error) {
      console.error("Error removing student:", error);
      alert("An error occurred while removing the student.");
    }
  };

  // Handle create assignment
  const handleCreateAssignment = async () => {
    if (!selectedCourse || !newAssignment.title) {
      alert("Please provide an assignment title");
      return;
    }
    try {
      // Format due_date as a full ISO string (e.g., "2025-05-18T12:00:00Z")
      const formattedDueDate = newAssignment.due_date
        ? new Date(newAssignment.due_date).toISOString()
        : undefined;

      const payload = {
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: formattedDueDate,
        max_points: newAssignment.max_points,
        course_id: selectedCourse.course_id,
      };

      console.log("Creating assignment with payload:", payload);

      const response = await apiFetch("/assignments", "POST", token, payload);

      // Handle response (assume API returns the created assignment directly or wrapped)
      const newAssignmentData = response.assignment || response;

      setCourseAssignments((prev) => [...prev, {
        assignment_id: newAssignmentData.assignment_id,
        title: newAssignmentData.title,
        description: newAssignmentData.description,
        due_date: newAssignmentData.due_date,
        course_id: selectedCourse.course_id,
      }]);

      setNewAssignment({
        title: "",
        description: "",
        due_date: "",
        max_points: 100,
      });

      alert("Assignment created successfully.");
    } catch (error) {
      console.error("Error creating assignment:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to create assignment: ${errorMessage}`);
    }
  };

  // New: Handle update assignment
  const handleUpdateAssignment = async () => {
    if (!editAssignment || !selectedCourse) return
    try {
      const formattedDueDate = new Date(editAssignment.due_date || "").toISOString().replace('T', ' ').substring(0, 19)
      const payload = {
        course_id: selectedCourse.course_id,
        title: editAssignment.title.trim(),
        due_date: formattedDueDate,
        max_points: Number(editAssignment.max_points),
        description: editAssignment.description?.trim() || null,
      }
      await apiFetch(`/assignments/${editAssignment.assignment_id}`, "PUT", token, payload)
      setCourseAssignments((prev) =>
        prev.map((a) =>
          a.assignment_id === editAssignment.assignment_id ? { ...a, ...editAssignment } : a
        )
      )
      setEditAssignment(null)
      alert("Assignment updated successfully.")
    } catch (error) {
      console.error("Error updating assignment:", error)
      alert(`Failed to update assignment: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Handle delete assignment
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      const response = await apiFetch(`/assignments/${assignmentId}`, "DELETE", token);
      if (response.ok) {
        setCourseAssignments(prev => prev.filter(a => a.assignment_id !== assignmentId));
        alert("Assignment deleted successfully.");
      } else {
        alert("Failed to delete assignment.");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("An error occurred while deleting the assignment.");
    }
  };

  async function fetchUserStats(token: string | null) {
  try {
    const stats = await apiFetch('/stats', 'GET', token);
    setUserStats({
      total_students: stats.total_students || 0,
      total_assignments: stats.total_assignments || 0
    });
  } catch (error) { 
    console.error('Error fetching user stats:', error);
    }
  }

  useEffect(() => {
  if (!token || redirecting) return;
  fetchUserStats(token);
  }, [token, redirecting]);

  // Handle create announcement
  const handleCreateAnnouncement = async () => {
    if (!selectedCourse || !newAnnouncement.title || !newAnnouncement.content) {
      alert("Please provide a course, announcement title, and content");
      return;
    }
    
    try {
      // Use the apiFetch utility function
      const payload = {
      course_id: selectedCourse.course_id,
      title: newAnnouncement.title,
      content: newAnnouncement.content || null, 
      is_pinned: newAnnouncement.is_pinned,
      };
      const data = await apiFetch(`/announcements`, "POST", token, payload);
      const newAnnouncementData = {
        announcement_id: data.announcement_id || data.id || Date.now(),
        course_id: selectedCourse.course_id,
        title: data.title,
        content: data.content || "",
        created_at: data.created_at || new Date().toISOString(), 
        is_pinned: data.is_pinned || false,
      };
      
      // Add the new announcement to the list with current date
      // const newAnnouncementWithDate = {
      //   ...data.announcement || {
      //     announcement_id: Date.now(), // Fallback ID if the API doesn't return one
      //     title: newAnnouncement.title,
      //     content: newAnnouncement.content,
      //     course_id: selectedCourse.course_id
      //   },
      //   date: new Date().toISOString()
      // };
      setCourseAnnouncements((prev) => [newAnnouncementData, ...prev]);
      setAnnouncements(prev => [newAnnouncementData, ...prev]);
      setNewAnnouncement({ title: "", content: "", is_pinned: false });
      alert("Announcement made successfully.");
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert(`An error occurred while creating the announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // New: Handle update announcement
  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncement || !selectedCourse) return
    try {
      const payload = {
        title: editAnnouncement.title,
        content: editAnnouncement.content || null,
        course_id: selectedCourse.course_id,
        created_at: new Date().toISOString(),
        is_pinned: editAnnouncement.is_pinned,
      }
      await apiFetch(`/announcements/${editAnnouncement.announcement_id}`, "PUT", token, payload)
      setCourseAnnouncements((prev) =>
        prev.map((a) =>
          a.announcement_id === editAnnouncement.announcement_id ? { ...a, ...editAnnouncement } : a
        )
      )
      setEditAnnouncement(null)
      alert("Announcement updated successfully.")
    } catch (error) {
      console.error("Error updating announcement:", error)
      alert(`Failed to update announcement: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Handle delete announcement
  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const response = await apiFetch(`/announcements/${announcementId}`, "DELETE", token);
      setCourseAnnouncements(prev => prev.filter(a => a.announcement_id !== announcementId));
      setAnnouncements(prev => prev.filter(a => a.announcement_id !== announcementId));
      alert("Announcement deleted successfully.");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("An error occurred while deleting the announcement.");
    }
  };

  // Add this function to handle material creation
  const handleCreateMaterial = async () => {
    if (!selectedCourse || !newMaterial.title || !newMaterial.file_path) {
      console.error("Missing required fields:", { 
        selectedCourse, 
        title: newMaterial.title, 
        file_path: newMaterial.file_path 
      });
      alert("Please provide a course, material title, and file path");
      return;
    }
    
    try {
      const result = await createMaterial({
        course_id: selectedCourse.course_id,
        title: newMaterial.title,
        description: newMaterial.description,
        type: newMaterial.type,
        file_path: newMaterial.file_path
      }, token);
      
      console.log("Material creation result:", result);
      // Refresh materials
      const materialsData = await apiFetch(`/classrooms/${selectedCourse.course_id}/materials`, 'GET', token);
      setMaterials(materialsData || []);
      
      // Reset form
      setNewMaterial({
        title: "",
        description: "",
        type: "document",
        file_path: ""
      });
      
      alert("Material created successfully.");
    } catch (error) {
      console.error("Error creating material:", error);
      alert(`An error occurred while creating the material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add this function to handle submission grading
  const handleGradeSubmission = async () => {
    if (!submissionToGrade || isNaN(submissionToGrade.submission_id) || isNaN(submissionToGrade.score)) {
      alert("Please provide a valid submission ID and score");
      return;
    }
    
    try {
      await gradeSubmission(
        submissionToGrade.submission_id,
        submissionToGrade.score,
        submissionToGrade.feedback,
        token
      );
      
      alert("Submission graded successfully.");
      setSubmissionToGrade(null);
    } catch (error) {
      console.error("Error grading submission:", error);
      alert(`An error occurred while grading the submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add this function to handle material deletion
  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    
    try {
      await deleteMaterial(materialId, token);
      
      // Refresh materials
      if (selectedCourse) {
        const materialsData = await apiFetch(`/classrooms/${selectedCourse.course_id}/materials`, 'GET', token);
        setMaterials(materialsData || []);
      }
      
      alert("Material deleted successfully.");
    } catch (error) {
      console.error("Error deleting material:", error);
      alert(`An error occurred while deleting the material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add this function to fetch materials for a course
  const fetchMaterialsForCourse = async (courseId: number) => {
    if (!token) return;
    
    try {
      const materialsData = await apiFetch(`/classrooms/${courseId}/materials`, 'GET', token);
      setMaterials(materialsData || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  // Add this function to handle viewing submissions for an assignment
  const handleViewSubmissions = async (assignmentId: number) => {
    try {
      const response = await apiFetch(`/assignments/${assignmentId}/submissions`, "GET", token);
      
      if (response.ok) {
        const data = await response.json();
        
        // Create a dialog to display submissions
        const submissionsDialog = document.createElement('div');
        submissionsDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        submissionsDialog.innerHTML = `
          <div class="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto">
            <h2 class="text-xl font-bold mb-4">Submissions for Assignment</h2>
            <div class="space-y-4">
              ${data.submissions.length > 0 ? 
                data.submissions.map((sub: {
                  submission_id: number;
                  student_name?: string;
                  submitted_at: string;
                  score: number | null;
                  content?: string;
                  feedback?: string;
                }) => `
                  <div class="border p-4 rounded-md">
                    <div class="flex justify-between">
                      <div>
                        <p><strong>Student:</strong> ${sub.student_name || 'Unknown'}</p>
                        <p><strong>Submitted:</strong> ${formatDate(sub.submitted_at)}</p>
                        </div>
                      )
                      <div>
                        <p><strong>Score:</strong> ${sub.score !== null ? sub.score : 'Not graded'}</p>
                      </div>
                    </div>
                    <div class="mt-2">
                      <p><strong>Content:</strong></p>
                      <p class="bg-gray-100 p-2 rounded mt-1">${sub.content || 'No content'}</p>
                    </div>
                    ${sub.feedback ? `
                      <div class="mt-2">
                        <p><strong>Feedback:</strong></p>
                        <p class="bg-gray-100 p-2 rounded mt-1">${sub.feedback}</p>
                      </div>
                    ` : ''}
                    <div class="mt-4">
                      <button class="grade-btn bg-blue-500 text-white px-3 py-1 rounded" 
                        data-id="${sub.submission_id}" 
                        data-score="${sub.score || ''}"
                        data-feedback="${sub.feedback || ''}">
                        Grade Submission
                      </button>
                    </div>
                  </div>
                `).join('') : 
                '<p>No submissions found for this assignment.</p>'
              }
            </div>
            <div class="mt-6 flex justify-end">
              <button class="close-btn bg-gray-500 text-white px-4 py-2 rounded">Close</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(submissionsDialog);
        
        // Add event listeners
        document.querySelectorAll('.grade-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLButtonElement;
            const submissionId = Number.parseInt(target.dataset.id || '0');
            const currentScore = target.dataset.score || '';
            const currentFeedback = target.dataset.feedback || '';
            
            setSubmissionToGrade({
              submission_id: submissionId,
              score: Number.parseInt(currentScore) || 0,
              feedback: currentFeedback
            });
            
            document.body.removeChild(submissionsDialog);
          });
        });
        
        document.querySelector('.close-btn')?.addEventListener('click', () => {
          document.body.removeChild(submissionsDialog);
        });
        
      } else {
        alert("Failed to fetch submissions.");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      alert("An error occurred while fetching submissions.");
    }
  };

  
  // Fetch all announcements
  useEffect(() => {
    if (!token || redirecting || courses.length === 0) return;

    if (!token || redirecting || courses.length === 0) return;

  const fetchAllAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const courseId = selectedCourse?.course_id || courses[0]?.course_id;
      if (!courseId) {
        console.log("No course ID available to fetch announcements");
        setLoadingAnnouncements(false);
        return;
      }
      // Use apiFetch with correct endpoint
      const data = await apiFetch(`/classrooms/${courseId}/announcements`, "GET", token);
      console.log("Fetched announcements:", data);

      if (data && Array.isArray(data)) {
        setAnnouncements(data);
      } else if (data && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };
  fetchAllAnnouncements();
  }, [token, redirecting, courses, selectedCourse]);
  
  if (loading) {
      return <div className="flex h-screen items-center justify-center">Loading dashboard...</div>
  }
  

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
                <Link href="/dashboard/teacher">
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
          <div className="px-4 py-2">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Courses</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Course</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>Fill in the details below to create a new course.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={newCourseData.title}
                        onChange={handleNewCourseChange}
                        placeholder="e.g., Introduction to Biology"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={newCourseData.subject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        placeholder="Enter a subject (e.g., Science, Mathematics, Art)"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="start_date">Start Date</Label>
                        <Input
                          type="date"
                          id="start_date"
                          name="start_date"
                          value={newCourseData.start_date}
                          onChange={handleNewCourseChange}
                        />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={newCourseData.end_date}
                        onChange={handleNewCourseChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={newCourseData.description}
                        onChange={handleNewCourseChange}
                        placeholder="Provide a brief description of your course"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateCourse}>Create Course</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-1">
              {courses.filter(course => course).map((course: Course) => (
                <Button key={course?.course_id || Math.random()} variant="ghost" className="w-full justify-start" asChild>
                  <Link href="#">
                    <div className={`mr-2 h-3 w-3 rounded-full bg-primary}`} />
                    {course?.title || "Untitled Course"}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </nav>
        <div className="border-t p-4">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="#">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive">
            <Link href="#" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Link>
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
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/dashboard/teacher" onClick={() => setMobileMenuOpen(false)}>
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
            <div className="px-4 py-2">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold">My Courses</h2>
              </div>
              <div className="space-y-1">
                {courses.filter(course => course).map((course: Course) => (
                  <Button key={course?.course_id || Math.random()} variant="ghost" className="w-full justify-start" asChild>
                    <Link href="#" onClick={() => setMobileMenuOpen(false)}>
                      <div className={`mr-2 h-3 w-3 rounded-full ${course?.color || "bg-primary"}`} />
                      {course?.title || "Untitled Course"}
                    </Link>
                  </Button>
                ))}
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

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Dialog>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
          </Dialog>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground"></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total_students}</div>
                <p className="text-xs text-muted-foreground">Enrolled in your courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total_assignments}</div>
                <p className="text-xs text-muted-foreground">Active assignments</p>
              </CardContent>
            </Card>
            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"></div>
                <p className="text-xs text-muted-foreground"></p>
              </CardContent>
            </Card> */}
          </div>

          <Tabs defaultValue="courses" className="mt-6">
            <TabsList>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Courses</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Course</DialogTitle>
                      <DialogDescription>Fill in the details below to create a new course.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={newCourseData.title}
                        onChange={handleNewCourseChange}
                        placeholder="e.g., Introduction to Biology"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={newCourseData.subject}
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        placeholder="Enter a subject (e.g., Science, Mathematics, Art)"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="start_date">Start Date</Label>
                        <Input
                          type="date"
                          id="start_date"
                          name="start_date"
                          value={newCourseData.start_date}
                          onChange={handleNewCourseChange}
                        />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={newCourseData.end_date}
                        onChange={handleNewCourseChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={newCourseData.description}
                        onChange={handleNewCourseChange}
                        placeholder="Provide a brief description of your course"
                      />
                    </div>
                  </div>
                    <DialogFooter>
                      <Button onClick={handleCreateCourse}>Create Course</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Google Classroom-style Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.filter(Boolean).map((course) => {
                  if (!course) return null; // Skip if course is undefined or null
                  // Define subject colors
                  const subjectColors = {
                    science: "bg-green-600",
                    math: "bg-blue-600",
                    english: "bg-yellow-600",
                    history: "bg-purple-600",
                    art: "bg-pink-600",
                    computer: "bg-indigo-600",
                    default: "bg-gray-600"
                  };
                  
                  // Get color based on subject or use default
                  const headerColor = course.subject && course.subject
                    ? (subjectColors[course.subject as keyof typeof subjectColors] || subjectColors.default) 
                    : (course.color || subjectColors.default);
                  
                  return (
                    <Card key={course.course_id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className={`h-24 ${headerColor} relative p-4 flex items-end`}>
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold text-white truncate">{course.title || "Untitled Course"}</h3>
                          <p className="text-sm text-white/90">{course.subject || "No subject"}</p>
                        </div>
                      </div>

                      <CardContent className="pt-4">
                        <p className="line-clamp-2 text-sm text-muted-foreground h-10">
                          {course.description || "No description available"}
                        </p>

                        <div className="mt-4 flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Students</p>
                            <p className="text-sm font-medium">{userStats.total_students || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Assignments</p>
                            <p className="text-sm font-medium">{userStats.total_assignments || 0}</p>
                          </div>
                        </div>
                      </CardContent>

                      
                      <CardFooter className="bg-muted/20 border-t flex justify-between">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </DialogTrigger>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setEditCourseData(course)}>
                                  <Edit className="h-4 w-4 mr-1" /> 
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Course</DialogTitle>
                                  <DialogDescription>Update the details below to edit the course.</DialogDescription>
                                </DialogHeader>
                                {editCourseData && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-title">Course Title</Label>
                                      <Input
                                        id="edit-title"
                                        name="title"
                                        value={editCourseData.title}
                                        onChange={handleNewCourseChange}
                                        placeholder="e.g., Introduction to Biology"
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-subject">Subject</Label>
                                      <Input
                                        id="edit-subject"
                                        name="subject"
                                        value={editCourseData.subject || ""}
                                        onChange={(e) => handleSubjectChange(e.target.value)}
                                        placeholder="Enter a subject (e.g., Science, Mathematics, Art)"
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-start_date">Start Date</Label>
                                      <Input
                                        type="date"
                                        id="edit-start_date"
                                        name="start_date"
                                        value={editCourseData.start_date || ""}
                                        onChange={handleNewCourseChange}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-end_date">End Date</Label>
                                      <Input
                                        type="date"
                                        id="edit-end_date"
                                        name="end_date"
                                        value={editCourseData.end_date || ""}
                                        onChange={handleNewCourseChange}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-description">Description</Label>
                                      <Textarea
                                        id="edit-description"
                                        name="description"
                                        value={editCourseData.description || ""}
                                        onChange={handleNewCourseChange}
                                        placeholder="Provide a brief description of your course"
                                      />
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button onClick={handleUpdateCourse}>Update Course</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>{course.title}</DialogTitle>
                              <DialogDescription>
                                Manage assignments, timelines, and materials for this course.
                              </DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="assignments">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                                <TabsTrigger value="materials">Materials</TabsTrigger>
                                <TabsTrigger value="students">Students</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="assignments" className="space-y-4 mt-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-medium">Course Assignments</h3>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" /> Add Assignment
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Create New Assignment</DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                          <Label htmlFor="assignment-title">Title</Label>
                                          <Input 
                                            id="assignment-title" 
                                            value={newAssignment.title}
                                            onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                                            placeholder="Assignment title" 
                                          />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label htmlFor="assignment-description">Description</Label>
                                          <Textarea 
                                            id="assignment-description" 
                                            value={newAssignment.description}
                                            onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                                            placeholder="Assignment description" 
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="grid gap-2">
                                            <Label htmlFor="assignment-due-date">Due Date</Label>
                                            <Input 
                                              id="assignment-due-date" 
                                              type="date" 
                                              value={newAssignment.due_date ? newAssignment.due_date.split('T')[0] : ''}
                                              onChange={(e) => {
                                                const currentTime = newAssignment.due_date
                                                  ? newAssignment.due_date.split('T')[1] || '00:00:00Z'
                                                  : '00:00:00Z';
                                                setNewAssignment({
                                                  ...newAssignment, 
                                                  due_date: `${e.target.value}T${currentTime}`
                                                });
                                              }}
                                            />
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="assignment-due-time">Due Time</Label>
                                            <Input 
                                              id="assignment-due-time" 
                                              type="time" 
                                              value={newAssignment.due_date ? newAssignment.due_date.split('T')[1]?.substring(0, 5) : '00:00'}
                                              onChange={(e) => {
                                                const currentDate = newAssignment.due_date
                                                  ? newAssignment.due_date.split('T')[0]
                                                  : new Date().toISOString().split('T')[0];
                                                setNewAssignment({
                                                  ...newAssignment, 
                                                  due_date: `${currentDate}T${e.target.value}:00Z`
                                                });
                                              }}
                                            />
                                          </div>
                                        </div>
                                        <div className="grid gap-2">
                                          <Label htmlFor="assignment-points">Total Points</Label>
                                          <Input 
                                            id="assignment-points" 
                                            type="number" 
                                            value={newAssignment.max_points}
                                            onChange={(e) => setNewAssignment({...newAssignment, max_points: Number.parseInt(e.target.value)})}
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button onClick={() => {
                                          handleCreateAssignment();
                                          setSelectedCourse(course);
                                        }}>Create Assignment</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                <div className="space-y-2">
                                  {courseAssignments.filter(a => a.course_id === course.course_id).length > 0 ? (
                                    courseAssignments
                                      .filter(a => a.course_id === course.course_id)
                                      .map(assignment => (
                                        <Card key={assignment.assignment_id} className="p-4">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <h4 className="font-medium">{assignment.title}</h4>
                                              <p className="text-sm text-muted-foreground">
                                                {assignment.due_date ? 
                                                  <>
                                                    Due: {formatDate(assignment.due_date)}
                                                    <span className={`ml-2 ${isDueDateOver(assignment.due_date) ? 'text-red-500' : 'text-green-500'}`}>
                                                      ({getRelativeTime(assignment.due_date)})
                                                    </span>
                                                  </> : 
                                                  'No due date'}
                                              </p>
                                              <p className="text-sm mt-2">{assignment.description || 'No description'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button variant="outline" size="sm" onClick={() => handleViewSubmissions(assignment.assignment_id)}>
                                                Submissions
                                              </Button>
                                              <Button variant="destructive" size="sm" onClick={() => handleDeleteAssignment(assignment.assignment_id)}>
                                                Delete
                                              </Button>
                                            </div>
                                          </div>
                                        </Card>
                                      ))
                                  ) : (
                                    <div className="text-center p-4 border rounded-md">
                                      <p className="text-muted-foreground">No assignments yet</p>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="submissions" className="mt-4 space-y-4">
                                <h2 className="text-2xl font-bold tracking-tight">Recent Submissions</h2>
                                  <div className="space-y-4">
                                  {loadingSubmissions ? (
                                    <div className="text-center p-4">Loading submissions...</div>
                                  ) : recentSubmissions.length > 0 ? (
                                    recentSubmissions.map((submission) => (
                                      <Card key={submission.submission_id}>
                                        <CardContent className="pt-6">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium">{submission.assignment_title || "Assignment"}</p>
                                                <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">
                                                  ID: {submission.submission_id}
                                                </span>
                                              </div>
                                              <p className="text-sm text-muted-foreground">
                                                <span className="font-medium">Student:</span> {submission.student_name || "Unknown"} 
                                                {submission.student_id && <span> (ID: {submission.student_id})</span>}
                                              </p>
                                              <p className="text-sm text-muted-foreground">
                                                <span className="font-medium">Course:</span> {submission.course_title || submission.course_name || "Unknown"}
                                              </p>
                                              <p className="text-sm text-muted-foreground">
                                                <span className="font-medium">Submitted:</span> {formatDate(submission.submitted_at)}
                                              </p>
                                              <p className="text-sm text-muted-foreground">
                                                <span className="font-medium">Status:</span> {submission.score !== null && submission.score !== undefined ? 
                                                  <span className="text-green-600">Graded: {submission.score} points</span> : 
                                                  <span className="text-amber-600">Awaiting grade</span>}
                                              </p>
                                              {submission.content && (
                                                <div className="mt-2 border-t pt-2">
                                                  <p className="text-sm font-medium mb-1">Submission:</p>
                                                  <p className="text-sm bg-gray-50 p-2 rounded">
                                                    {submission.content.length > 150 
                                                      ? `${submission.content.slice(0, 150)}...` 
                                                      : submission.content}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSubmissionToGrade({
                                                  submission_id: submission.submission_id,
                                                  score: submission.score || 0,
                                                  feedback: submission.feedback || "",
                                                })}
                                              >
                                                {submission.score !== null && submission.score !== undefined ? 'Update Grade' : 'Grade'}
                                              </Button>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))
                                  ) : (
                                    <div className="text-center p-4 border rounded-md">
                                      <p className="text-muted-foreground">No recent submissions</p>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              
                              
                              <TabsContent value="students" className="space-y-4 mt-4">
                                <h3 className="text-lg font-medium">Enrolled Students</h3>
                                <div className="space-y-2">
                                  {courseStudents.filter(s => s.student_id).length > 0 ? (
                                    courseStudents.map(student => (
                                      <div key={student.student_id} className="flex justify-between items-center p-3 border rounded-md">
                                        <div>
                                          <p className="font-medium">{student.name}</p>
                                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">ID: {student.student_id}</span>
                                        </div>
                                        
                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveStudent(course.course_id, student.student_id)}>
                                          Remove
                                        </Button>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center p-4 border rounded-md">
                                      <p className="text-muted-foreground">No students enrolled yet</p>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                              <TabsContent value="materials" className="space-y-4 mt-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-medium">Course Materials</h3>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" /> Add Material
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Upload Course Material</DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                          <Label htmlFor="material-title">Title</Label>
                                          <Input 
                                            id="material-title" 
                                            value={newMaterial.title}
                                            onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                                            placeholder="Material title" 
                                          />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label htmlFor="material-description">Description</Label>
                                          <Textarea 
                                            id="material-description" 
                                            value={newMaterial.description}
                                            onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                                            placeholder="Material description" 
                                          />
                                        </div>
                                        <div className="grid gap-2">
                                          <Label htmlFor="material-type">Type</Label>
                                          <Select 
                                            value={newMaterial.type} 
                                            onValueChange={(value) => setNewMaterial({...newMaterial, type: value})}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select material type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="document">Document</SelectItem>
                                              <SelectItem value="link">Link</SelectItem>
                                              <SelectItem value="video">Video</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="grid gap-2">
                                          <Label htmlFor="material-link">File Path or URL</Label>
                                          <Input 
                                            id="material-link" 
                                            value={newMaterial.file_path}
                                            onChange={(e) => setNewMaterial({...newMaterial, file_path: e.target.value})}
                                            placeholder="https://... or /path/to/file" 
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button onClick={() => {
                                          setSelectedCourse(course); // Ensure the course is selected
                                          handleCreateMaterial();
                                        }}>Upload Material</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                <div className="space-y-2">
                                  {materials && materials.length > 0 ? (
                                    materials.map(material => (
                                      <Card key={material.material_id} className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h4 className="font-medium">{material.title}</h4>
                                            <p className="text-sm text-muted-foreground">
                                              {material.type || 'Document'} • {material.uploaded_at ? formatDate(material.uploaded_at) : 'Unknown date'}
                                            </p>
                                            <p className="text-sm mt-2">{material.description || 'No description'}</p>
                                            {material.file_path && (
                                              <div className="mt-2">
                                                <a 
                                                  href={material.file_path} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-primary hover:underline text-sm"
                                                >
                                                  {material.file_path}
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                          <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material.material_id)}>
                                            Delete
                                          </Button>
                                        </div>
                                      </Card>
                                    ))
                                  ) : (
                                    <div className="text-center p-4 border rounded-md">
                                      <p className="text-muted-foreground">No materials uploaded yet</p>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                            <DialogFooter className="flex justify-between">
                              <Button variant="destructive" onClick={() => handleDeleteCourse(course.course_id)}>
                                Delete Course
                              </Button>
                              <Button variant="outline">Close</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={() => handleViewCourseDetails(course.course_id)}>
                        
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="mt-4 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Recent Submissions</h2>
              <div className="space-y-4">
                {loadingSubmissions ? (
                  <div className="text-center p-4">Loading submissions...</div>
                ) : recentSubmissions.length > 0 ? (
                  recentSubmissions.map((submission) => (
                    <Card key={submission.submission_id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{submission.assignment_title}</p>
                            <p className="text-sm text-muted-foreground">
                              Student: {submission.student_name} | Course: {submission.course_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {formatDate(submission.submitted_at)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Grade: {submission.grade !== null ? submission.grade : "Ungraded"}
                            </p>
                            <p className="text-sm mt-2">{submission.content.slice(0, 100)}...</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/submissions/${submission.submission_id}`)}
                          >
                            View Submission
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center p-4 border rounded-md">
                    <p className="text-muted-foreground">No recent submissions</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="announcements" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => {
                      const firstCourse = courses[0];
                      if (firstCourse) {
                        setSelectedCourse(firstCourse);
                      }
                    }}>
                      <Plus className="h-4 w-4 mr-2" /> Add Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="announcement-course-type">Course Selection Method</Label>
                        <Select 
                          onValueChange={(value) => {
                            if (value === "manual") {
                              setSelectedCourse(null);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="How would you like to select a course?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dropdown">Select from dropdown</SelectItem>
                            <SelectItem value="manual">Enter course ID manually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Course dropdown (shown when dropdown option is selected) */}
                      <div className="grid gap-2" id="course-dropdown-container">
                        <Label htmlFor="announcement-course">Select Course</Label>
                        <Select 
                          value={selectedCourse?.course_id.toString() || ""}
                          onValueChange={(value) => {
                            const course = courses.find(c => c.course_id === parseInt(value));
                            if (course) setSelectedCourse(course);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem key={course.course_id} value={course.course_id.toString()}>
                                {course.title} (ID: {course.course_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="announcement-title">Title</Label>
                        <Input
                          id="announcement-title"
                          value={newAnnouncement.title}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                          placeholder="Announcement title"
                          maxLength={255}
                        />
                      </div>

                      {/* Manual course ID input (shown when manual option is selected) */}
                      <div className="grid gap-2" id="course-manual-container">
                        <Label htmlFor="announcement-course-id-manual">Enter Course ID</Label>
                        <Input
                          id="announcement-course-id-manual"
                          type="number"
                          placeholder="Enter course ID number"
                          onChange={(e) => {
                            const courseId = parseInt(e.target.value);
                            // Try to find the course in the courses list first
                            const existingCourse = courses.find(c => c.course_id === courseId);
                            if (existingCourse) {
                              setSelectedCourse(existingCourse);
                            } else if (!isNaN(courseId)) {
                              // If not found but valid number, create a temporary course object
                              setSelectedCourse({
                                course_id: courseId,
                                title: `Course #${courseId}`,
                              } as Course);
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Enter the numeric ID of the course this announcement belongs to</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="announcement-content">Content</Label>
                        <Textarea
                          id="announcement-content"
                          value={newAnnouncement.content}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                          placeholder="Announcement content (optional)"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="checkbox"
                          id="announcement-pinned"
                          checked={newAnnouncement.is_pinned}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, is_pinned: e.target.checked })}
                        />
                        <Label htmlFor="announcement-pinned">Pin announcement</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateAnnouncement}>Create Announcement</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-4">
                {loadingAnnouncements ? (
                  <div className="text-center p-4">Loading announcements...</div>
                ) : announcements && announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <Card key={announcement.announcement_id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{announcement.title}</p>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                Course ID: {announcement.course_id}
                              </span>
                              {announcement.is_pinned && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 text-yellow-500"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Posted: {formatDate(announcement.created_at)}
                            </p>
                            <p className="text-sm mt-2">{announcement.content || "No content provided"}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCourse({ course_id: announcement.course_id } as Course);
                                setEditAnnouncement(announcement);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center p-4 border rounded-md">
                    <p className="text-muted-foreground">No announcements found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          {/* Edit Announcement Dialog */}
          <Dialog open={!!editAnnouncement} onOpenChange={() => setEditAnnouncement(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Announcement</DialogTitle>
              </DialogHeader>
              {editAnnouncement && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-announcement-title">Title</Label>
                    <Input
                      id="edit-announcement-title"
                      value={editAnnouncement.title}
                      onChange={(e) =>
                        setEditAnnouncement({ ...editAnnouncement, title: e.target.value })
                      }
                      placeholder="Announcement title"
                      maxLength={255}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-announcement-content">Content</Label>
                    <Textarea
                      id="edit-announcement-content"
                      value={editAnnouncement.content || ""}
                      onChange={(e) =>
                        setEditAnnouncement({ ...editAnnouncement, content: e.target.value })
                      }
                      placeholder="Announcement content (optional)"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="checkbox"
                      id="edit-announcement-pinned"
                      checked={editAnnouncement.is_pinned}
                      onChange={(e) =>
                        setEditAnnouncement({ ...editAnnouncement, is_pinned: e.target.checked })
                      }
                    />
                    <Label htmlFor="edit-announcement-pinned">Pin announcement</Label>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={handleUpdateAnnouncement}>Update Announcement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
  
          
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
