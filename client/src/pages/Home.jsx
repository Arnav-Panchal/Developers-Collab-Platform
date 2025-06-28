import { Link } from "react-router-dom"
import { useSelector } from "react-redux"
import { Analytics } from "@vercel/analytics/next"

export default function HomePage() {
  const { currentUser } = useSelector((state) => state.user)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Analytics />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-44 bg-gradient-to-r from-blue-700 via-black to-blue-500 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                {currentUser ? "Welcome Back to DevConnect" : "Collaborate Smarter with AI-Powered Developer Matching"}
              </h1>
              <p className="mx-auto max-w-[700px] text-xl text-gray-200">
                {currentUser
                  ? `Ready to continue your journey, ${currentUser.username}? Explore new projects or connect with fellow developers.`
                  : "Join the next generation of developer collaboration. Our AI matches you with the perfect team and projects based on your skills and interests."}
              </p>
              <div className="space-x-4 mt-8">
                {currentUser ? (
                  <>
                    <Link
                      to="/discover"
                      className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-block"
                    >
                      Discover Projects
                    </Link>
                    <Link
                      to="/dashboard"
                      className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-700 transition-colors inline-block"
                    >
                      My Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/sign-up"
                      className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors inline-block"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/about"
                      className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-700 transition-colors inline-block"
                    >
                      Learn More
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-12">Key Features</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Smart Team Formation",
                  description:
                    "AI-powered matching connects you with developers who complement your skills and project needs.",
                },
                {
                  title: "Project Collaboration",
                  description:
                    "Post project ideas, join ongoing projects, and collaborate seamlessly with built-in tools.",
                },
                {
                  title: "GitHub Integration",
                  description:
                    "Manage your projects with full GitHub integration for version control and collaboration.",
                },
                {
                  title: "Real-time Communication",
                  description: "Built-in group chat feature for efficient team communication and decision-making.",
                },
                {
                  title: "Skill Analytics",
                  description:
                    "AI analyzes your projects and updates your profile with newly identified skills and competencies.",
                },
                {
                  title: "Local Networking",
                  description:
                    "Connect with developers in your area or from your school for local collaboration opportunities.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-400">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">AI-Powered Collaboration</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Our advanced AI algorithms analyze user profiles, project requirements, and skill sets to create the
                  most effective teams. Experience seamless collaboration with developers who complement your abilities
                  and share your passion.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-gradient-to-r from-blue-700 via-black to-blue-500 rounded-full flex items-center justify-center text-6xl text-white font-bold shadow-lg">
                  AI
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-center mb-12">Benefits for Developers</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Learn and Grow",
                  description: "Collaborate on diverse projects and expand your skill set with every new challenge.",
                },
                {
                  title: "Build Your Network",
                  description:
                    "Connect with like-minded developers and industry professionals to expand your opportunities.",
                },
                {
                  title: "Showcase Your Work",
                  description:
                    "Build a portfolio of collaborative projects that demonstrate your skills to potential employers.",
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-400">{benefit.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {!currentUser && (
          <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
            <div className="container mx-auto px-4 md:px-6 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">Ready to Get Started?</h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300 mb-8">
                Join our community of developers and start collaborating on exciting projects today!
              </p>
              <Link
                to="/sign-up"
                className="px-8 py-4 bg-gradient-to-r from-blue-700 via-black to-blue-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity inline-block text-lg"
              >
                Create Your Account
              </Link>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">&copy; 2025 DevConnect. All rights reserved.</p>
            <nav className="flex gap-4 mt-4 md:mt-0">
              <Link to="/terms" className="text-sm hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-sm hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

