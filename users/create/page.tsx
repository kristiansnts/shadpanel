"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Form, FormInput, FormSection, FormGrid } from "@/components/ui"
import { Button } from "@/components/ui"
import { toast } from "sonner"
import { createUser } from "../actions"

export default function CreateUserPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true)

    try {
      const result = await createUser({ name: values.name as string, email: values.email as string })

      if (result.success) {
        toast.success("Success!", { description: result.message })
        setTimeout(() => router.push("/admin/dashboard/users"), 700)
      } else {
        toast.error("Error!", { description: result.message })
      }
    } catch (error) {
      toast.error("Error!", { description: "An unexpected error occurred." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => router.push("/admin/dashboard/users")

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-8 pb-4">
        <div>
          <h1 className="text-4xl font-bold">Create New User</h1>
          <p className="mt-2 text-muted-foreground">Add a new user to the system</p>
        </div>
      </div>

      <Form
        initialValues={{ name: "", email: "" }}
        onSubmit={handleSubmit}
      >
        <FormSection title="User Information" description="Enter the user's personal details">
          <FormGrid columns={{ sm: 1, md: 2 }} gap={4}>
            <FormInput accessor="name" label="Username" placeholder="John" required />
            <FormInput accessor="email" label="Email Address" type="email" placeholder="john.doe@example.com" required />
          </FormGrid>
        </FormSection>

        <div className="flex gap-4">
          <Button type="submit" className="hover:cursor-pointer" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
