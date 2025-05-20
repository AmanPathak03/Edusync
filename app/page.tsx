import Link from "next/link"
import { ArrowRight, BookOpen, GraduationCap, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EduSync</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:underline underline-offset-4">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:underline underline-offset-4">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-12 md:py-24 lg:py-32">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                The modern classroom platform for educators and students
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Simplify teaching, enhance learning, and stay connected with EduSync - the all-in-one classroom
                management solution.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-1.5">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-4 ">
              <div className="absolute inset-0 bg-[url('/classroom.jpg?height=400&width=800')] bg-cover bg-center opacity-50"></div>
              <div className="relative z-10 flex h-full flex-col items-center justify-center space-y-4 text-center">
                {/* <GraduationCap className="h-16 w-16 text-primary" /> */}
                {/* <h2 className="text-2xl font-bold">Transform Your Teaching Experience</h2>
                <p className="max-w-md text-muted-foreground">
                  Join thousands of educators and students already using EduSync to enhance their classroom experience.
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">Features</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to manage your classroom efficiently and effectively.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3 lg:max-w-5xl lg:gap-8 mt-8">
          {/* Feature 1 */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-bold">Course Management</h3>
              <p className="text-muted-foreground">
                Create, organize, and manage courses with ease. Add materials, assignments, and track progress.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-bold">Collaborative Learning</h3>
              <p className="text-muted-foreground">
                Foster collaboration with discussion boards, group projects, and real-time feedback.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
                <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
              </svg>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-bold">Assessment Tools</h3>
              <p className="text-muted-foreground">
                Create quizzes, assignments, and grade them efficiently with our intuitive assessment tools.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M2 12h10" />
                <path d="M9 4v16" />
                <path d="M12 9h10" />
                <path d="M19 4v16" />
              </svg>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-bold">Customizable Dashboard</h3>
              <p className="text-muted-foreground">
                Personalize your dashboard to focus on what matters most to you as a teacher or student.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 2v8" />
                <path d="m4.93 10.93 1.41 1.41" />
                <path d="M2 18h2" />
                <path d="M20 18h2" />
                <path d="m19.07 10.93-1.41 1.41" />
                <path d="M22 22H2" />
                <path d="m16 6-4 4-4-4" />
                <path d="M16 18a4 4 0 0 0-8 0" />
              </svg>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-bold">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor student progress with detailed analytics and performance insights.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-bold">Secure Environment</h3>
              <p className="text-muted-foreground">
                Keep your classroom data safe with our secure platform designed with privacy in mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container py-12 md:py-24 lg:py-32">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">How It Works</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Get started with EduSync in just a few simple steps.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold">Create an Account</h3>
            <p className="text-muted-foreground">
              Sign up as a teacher or student and set up your profile with just a few clicks.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-bold">Set Up Your Classroom</h3>
            <p className="text-muted-foreground">
              Teachers can create courses, add materials, and invite students. Students can join with a class code.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-bold">Start Learning</h3>
            <p className="text-muted-foreground">
              Engage with course materials, submit assignments, and collaborate with classmates.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="container py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">Testimonials</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            See what educators and students are saying about EduSync.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-between rounded-lg border bg-background p-6 shadow-sm">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                "EduSync has transformed how I manage my classroom. The intuitive interface and comprehensive features
                have saved me countless hours of administrative work."
              </p>
            </div>
            <div className="mt-6 flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary/10"></div>
              <div className="ml-4">
                <p className="text-sm font-medium">Dr. Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Professor of Biology</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-lg border bg-background p-6 shadow-sm">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                "As a student, I love how organized all my courses are in EduSync. I never miss an assignment deadline,
                and the collaboration tools make group projects so much easier."
              </p>
            </div>
            <div className="mt-6 flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary/10"></div>
              <div className="ml-4">
                <p className="text-sm font-medium">Michael Chen</p>
                <p className="text-sm text-muted-foreground">Computer Science Student</p>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="container py-12 md:py-24 lg:py-32">
        <div className="mx-auto max-w-[58rem] flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
            Ready to transform your classroom?
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Join thousands of educators and students already using EduSync.
          </p>
          <div className="flex flex-col gap-2 min-[400px]:flex-row mt-6">
            <Link href="/register">
              <Button size="lg" className="gap-1.5">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:py-12">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EduSync</span>
          </div>
          <nav className="flex flex-wrap gap-4 md:gap-6">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              About
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Pricing
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Contact
            </Link>
          </nav>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} EduSync. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
