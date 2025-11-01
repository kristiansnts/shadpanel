"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Form, FormInput, FormSection, FormGrid } from "@/components/ui"
import { Button } from "@/components/ui"
import { toast } from "sonner"
import { getUserById, updateUser } from "../../actions"

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const idParam = params?.id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialValues, setInitialValues] = useState({ name: "", email: "" })

  useEffect(() => {
    async function fetchUser() {
      if (!idParam) {
        setError("Missing user id")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const user = await getUserById(Number(idParam))
        if (user) {
          setInitialValues({ name: user.name ?? "", email: user.email ?? "" })
        } else {
          setError("User not found")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [idParam])

  const handleSubmit = async (values: Record<string, any>) => {
    if (!idParam) return
    setIsSubmitting(true)

    try {
      const result = await updateUser(Number(idParam), { name: values.name as string, email: values.email as string })
      if (result.success) {
        toast.success("Updated", { description: result.message })
        setTimeout(() => router.push("/admin/dashboard/users"), 700)
      } else {
        toast.error("Error updating user", { description: result.message })
      }
    } catch (err) {
      toast.error("Error updating user")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading user...</div>
  }

  if (error) {
    return <div className="p-8 text-destructive">{error}</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-8 pb-4">
        <div>
          <h1 className="text-4xl font-bold">Edit User</h1>
          <p className="mt-2 text-muted-foreground">Update user details</p>
        </div>
      </div>

      <Form initialValues={initialValues} onSubmit={handleSubmit}>
        <FormSection title="User Information" description="Update the user's personal details">
          <FormGrid columns={{ sm: 1, md: 2 }} gap={4}>
            <FormInput accessor="name" label="Username" placeholder="John" required />
            <FormInput accessor="email" label="Email Address" type="email" placeholder="john.doe@example.com" required />
          </FormGrid>
        </FormSection>

        <div className="flex gap-4">
          <Button type="submit" className="hover:cursor-pointer" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/dashboard/users")} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
