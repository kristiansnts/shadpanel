"use client"

import { useState } from "react"
import {
  Form,
  FormInput,
  FormTextarea,
  FormCheckbox,
  FormToggle,
  FormSelect,
  FormSection,
  FormGrid,
} from "@/components/ui"
import { Button } from "@/components/ui"

export default function FormDemoPage() {
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const handleSubmit = (values: Record<string, unknown>) => {
    console.log("Form submitted:", values)
    alert("Form submitted! Check console for values.")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-8 pb-4">
        <div>
          <h1 className="text-4xl font-bold">Form Builder Demo</h1>
          <p className="mt-2 text-muted-foreground">
            Example form built with ShadPanel Form Builder
          </p>
        </div>
      </div>

      <Form
        initialValues={{
          first_name: "",
          email: "",
          terms: false,
          notifications: true,
          country: "",
        }}
        onSubmit={handleSubmit}
        onChange={setFormData}
      >
        <FormSection
          title="Basic Information"
          description="Enter your personal details"
        >
          <FormGrid columns={{ sm: 1, md: 2 }} gap={4}>
            <FormInput
              accessor="first_name"
              label="First Name"
              placeholder="John"
              required
            />

            <FormInput
              accessor="last_name"
              label="Last Name"
              placeholder="Doe"
              required
            />

            <FormInput
              accessor="email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
            />

            <FormSelect
              accessor="country"
              label="Country"
              placeholder="Select your country"
              required
              options={[
                { label: "United States", value: "us" },
                { label: "Canada", value: "ca" },
                { label: "United Kingdom", value: "uk" },
              ]}
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Additional Details">
          <FormTextarea
            accessor="bio"
            label="Biography"
            placeholder="Tell us about yourself..."
            rows={4}
          />

          <FormToggle
            accessor="notifications"
            label="Email Notifications"
            description="Receive email notifications for updates"
          />

          <FormCheckbox
            accessor="terms"
            label="I agree to the terms and conditions"
            required
          />
        </FormSection>

        <div className="flex gap-4">
          <Button type="submit">Submit Form</Button>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </div>

        <div className="mt-8 p-4 rounded-lg border bg-muted/30">
          <h3 className="font-semibold mb-2">Form State (Live Preview)</h3>
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </Form>
    </div>
  )
}
