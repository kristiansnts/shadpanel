"use client"

import { Button } from "@/components/ui"
import { toast } from "sonner"
import {
  Info,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Bell,
} from "lucide-react"

export default function NotificationDemoPage() {
  const showDefaultToast = () => {
    toast("Event has been created", {
      description: "Sunday, December 03, 2023 at 9:00 AM",
    })
  }

  const showSuccessToast = () => {
    toast.success("Success!", {
      description: "Your changes have been saved successfully.",
    })
  }

  const showErrorToast = () => {
    toast.error("Error!", {
      description: "There was a problem with your request.",
    })
  }

  const showWarningToast = () => {
    toast.warning("Warning!", {
      description: "Please review your input before continuing.",
    })
  }

  const showInfoToast = () => {
    toast.info("Information", {
      description: "This is an informational message.",
    })
  }

  const showToastWithAction = () => {
    toast("New message received", {
      description: "You have 1 unread message.",
      action: {
        label: "View",
        onClick: () => {
          toast.success("Action clicked!")
        },
      },
    })
  }

  const showPromiseToast = () => {
    const promise = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ name: "User" }), 2000)
      })

    toast.promise(promise, {
      loading: "Loading...",
      success: (data) => {
        return `Successfully loaded data for ${(data as { name: string }).name}`
      },
      error: "Error loading data",
    })
  }

  const showCustomToast = () => {
    toast("Custom styled toast", {
      description: "This toast has a custom icon",
      icon: <Bell className="h-4 w-4" />,
      duration: 5000,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-8 pb-4">
        <div>
          <h1 className="text-4xl font-bold">Notification Demo</h1>
          <p className="mt-2 text-muted-foreground">
            Examples of different toast notification types using Sonner
          </p>
        </div>
      </div>

      <div className="px-8 pb-8 space-y-8">
        {/* Basic Toast Types */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Basic Toast Types</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Standard notification types for common use cases
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={showDefaultToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <Bell className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Default</div>
                <div className="text-xs text-muted-foreground">
                  Standard notification
                </div>
              </div>
            </Button>

            <Button
              onClick={showSuccessToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">Success</div>
                <div className="text-xs text-muted-foreground">
                  Successful operation
                </div>
              </div>
            </Button>

            <Button
              onClick={showErrorToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <div className="font-semibold">Error</div>
                <div className="text-xs text-muted-foreground">
                  Error message
                </div>
              </div>
            </Button>

            <Button
              onClick={showWarningToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="text-left">
                <div className="font-semibold">Warning</div>
                <div className="text-xs text-muted-foreground">
                  Warning message
                </div>
              </div>
            </Button>

            <Button
              onClick={showInfoToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <Info className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Info</div>
                <div className="text-xs text-muted-foreground">
                  Informational message
                </div>
              </div>
            </Button>
          </div>
        </section>

        {/* Advanced Toast Examples */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Advanced Examples</h2>
            <p className="text-sm text-muted-foreground mb-4">
              More complex notification patterns
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={showToastWithAction}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <Bell className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">With Action</div>
                <div className="text-xs text-muted-foreground">
                  Toast with action button
                </div>
              </div>
            </Button>

            <Button
              onClick={showPromiseToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <CheckCircle className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Promise</div>
                <div className="text-xs text-muted-foreground">
                  Loading state with promise
                </div>
              </div>
            </Button>

            <Button
              onClick={showCustomToast}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <Bell className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Custom</div>
                <div className="text-xs text-muted-foreground">
                  Custom icon and duration
                </div>
              </div>
            </Button>
          </div>
        </section>

        {/* Code Example */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Usage Example</h2>
            <p className="text-sm text-muted-foreground mb-4">
              How to use toast notifications in your code
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <pre className="text-xs overflow-auto">
              <code>{`import { toast } from "sonner"

// Basic toast
toast("Event has been created")

// Success toast
toast.success("Changes saved!")

// Error toast
toast.error("Something went wrong")

// Warning toast
toast.warning("Please review your input")

// Info toast
toast.info("New update available")

// Toast with action
toast("New message", {
  action: {
    label: "View",
    onClick: () => console.log("Action clicked")
  }
})

// Promise toast
toast.promise(fetchData(), {
  loading: "Loading...",
  success: "Data loaded!",
  error: "Failed to load"
})`}</code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
}
