"use client"

import { useRouter } from "next/navigation"
import {
  Form,
  FormInput,
  FormSelect,
  FormSection,
} from "@/components/ui"
import { Button } from "@/components/ui"
import { toast } from "sonner"

export default function CreateUserPage() {
  const router = useRouter()

  const handleSubmit = (values: Record<string, unknown>) => {
    console.log("Creating user:", values)
    toast.success("User created successfully!")

    // Redirect back to table after creation
    setTimeout(() => {
      router.push("/admin/dashboard/table-demo")
    }, 1000)
  }

  const handleCancel = () => {
    router.push("/admin/dashboard/table-demo")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-8 pb-4">
        <div>
          <h1 className="text-4xl font-bold">Create New User</h1>
          <p className="mt-2 text-muted-foreground">
            Add a new user to the system
          </p>
        </div>
      </div>

      <Form
        initialValues={{
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "",
        }}
        onSubmit={handleSubmit}
        className="max-w-2xl"
      >
        <FormSection
          title="User Information"
          description="Enter the user's personal details"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              accessor="firstName"
              label="First Name"
              placeholder="John"
              required
            />

            <FormInput
              accessor="lastName"
              label="Last Name"
              placeholder="Doe"
              required
            />
          </div>

          <FormInput
            accessor="email"
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            required
          />

          <FormInput
            accessor="phone"
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 000-0000"
          />

          <FormSelect
            accessor="role"
            label="Role"
            placeholder="Select a role"
            required
            options={[
              { label: "Administrator", value: "admin" },
              { label: "Manager", value: "manager" },
              { label: "User", value: "user" },
              { label: "Guest", value: "guest" },
            ]}
          />
        </FormSection>

        <div className="flex gap-4">
          <Button type="submit">Create User</Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
