"use client"

import { useState } from "react"
import {
  CheckCircle2,
  Circle,
  Lightbulb,
  Rocket,
  ArrowRight,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  completed: boolean
  project?: {
    name: string
    color: string
  }
}

const todaysTasks: Task[] = [
  {
    id: "1",
    title: "Design todo app wireframes",
    completed: false,
    project: { name: "@Cmd", color: "bg-accent-blue" },
  },
  {
    id: "2",
    title: "Record YouTube video",
    completed: false,
    project: { name: "@YT", color: "bg-accent-purple" },
  },
  {
    id: "3",
    title: "Deploy server hotfix",
    completed: false,
    project: { name: "@Svr", color: "bg-accent-green" },
  },
]

const inboxItems = [
  "Review pull request #234",
  "Schedule team sync",
  "Update documentation",
  "Reply to client email",
  "Check analytics dashboard",
]

const upcomingTasks = {
  tomorrow: [
    "Finalize presentation deck",
    "Send weekly report",
  ],
  thisWeek: [
    "Plan Q2 roadmap",
  ],
}

const projects = [
  { name: "Command Center", color: "bg-accent-blue", status: "3 active tasks" },
  { name: "YouTube Channel", color: "bg-accent-purple", status: "Build #42 completed" },
  { name: "Server API", color: "bg-accent-green", status: "2 active tasks" },
]

const recentActivity = [
  {
    time: "10:30",
    action: "Completed 'Fix auth bug'",
    icon: CheckCircle2,
    iconColor: "text-accent-green",
  },
  {
    time: "09:15",
    action: "Added idea 'Dark mode toggle'",
    icon: Lightbulb,
    iconColor: "text-accent-yellow",
  },
  {
    time: "Yesterday",
    action: "Deployed Build #41",
    icon: Rocket,
    iconColor: "text-accent-purple",
  },
]

export function DashboardContent() {
  const [tasks, setTasks] = useState(todaysTasks)

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Today's Focus Card */}
      <section className="rounded-lg border border-border bg-background-secondary p-4">
        <h2 className="mb-4 text-base font-medium text-foreground">{"Today's Focus"}</h2>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="group flex items-center gap-3 rounded-[6px] p-2 text-left transition-colors hover:bg-background-tertiary"
            >
              {task.completed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-green" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-foreground-secondary group-hover:text-foreground" />
              )}
              <span
                className={cn(
                  "flex-1 text-sm",
                  task.completed
                    ? "text-foreground-secondary line-through"
                    : "text-foreground"
                )}
              >
                {task.title}
              </span>
              {task.project && (
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-xs font-medium",
                    task.project.color === "bg-accent-blue" && "bg-accent-blue/15 text-accent-blue",
                    task.project.color === "bg-accent-purple" && "bg-accent-purple/15 text-accent-purple",
                    task.project.color === "bg-accent-green" && "bg-accent-green/15 text-accent-green"
                  )}
                >
                  {task.project.name}
                </span>
              )}
            </button>
          ))}
        </div>
        <button className="mt-3 flex items-center gap-2 px-2 text-sm text-foreground-secondary transition-colors hover:text-foreground">
          <Plus className="h-4 w-4" />
          Add task
        </button>
      </section>

      {/* Two-column grid: Inbox and Upcoming */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inbox Widget */}
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">Inbox</h2>
            <span className="rounded-[4px] bg-accent-blue/15 px-2 py-0.5 text-xs font-medium text-accent-blue">
              5 items to sort
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {inboxItems.slice(0, 3).map((item, index) => (
              <p
                key={index}
                className="truncate rounded-[6px] px-2 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
              >
                {item}
              </p>
            ))}
          </div>
          <button className="mt-3 flex items-center gap-1 px-2 text-sm text-foreground-secondary transition-colors hover:text-foreground">
            View all
            <ArrowRight className="h-3 w-3" />
          </button>
        </section>

        {/* Upcoming Widget */}
        <section className="rounded-lg border border-border bg-background-secondary p-4">
          <h2 className="mb-3 text-base font-medium text-foreground">Upcoming</h2>
          
          <div className="mb-3">
            <h3 className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
              Tomorrow
            </h3>
            <div className="flex flex-col gap-1">
              {upcomingTasks.tomorrow.map((task, index) => (
                <p
                  key={index}
                  className="truncate rounded-[6px] px-2 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                >
                  {task}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-foreground-secondary">
              This Week
            </h3>
            <div className="flex flex-col gap-1">
              {upcomingTasks.thisWeek.map((task, index) => (
                <p
                  key={index}
                  className="truncate rounded-[6px] px-2 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                >
                  {task}
                </p>
              ))}
            </div>
          </div>

          <button className="mt-3 flex items-center gap-1 px-2 text-sm text-foreground-secondary transition-colors hover:text-foreground">
            View all
            <ArrowRight className="h-3 w-3" />
          </button>
        </section>
      </div>

      {/* Projects Section */}
      <section>
        <h2 className="mb-3 text-base font-medium text-foreground">Projects</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.name}
              className="flex items-center gap-3 rounded-lg border border-border bg-background-secondary p-4 text-left transition-colors hover:bg-background-tertiary"
            >
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", project.color)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {project.name}
                </p>
                <p className="truncate text-xs text-foreground-secondary">
                  {project.status}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section>
        <h2 className="mb-3 text-base font-medium text-foreground">Recent Activity</h2>
        <div className="rounded-lg border border-border bg-background-secondary p-2">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-[6px] px-2 py-2 transition-colors hover:bg-background-tertiary"
            >
              <span className="w-16 shrink-0 text-xs text-foreground-secondary/60">
                {activity.time}
              </span>
              <span className="flex-1 text-sm text-foreground-secondary">
                {activity.action}
              </span>
              <activity.icon className={cn("h-4 w-4 shrink-0", activity.iconColor)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
