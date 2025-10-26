# Form Builder

A comprehensive form builder system inspired by Filament PHP, matching the declarative API pattern of the Table builder.

## Features

- **Declarative API**: Build forms using JSX components similar to Filament PHP
- **Built-in Validation**: Field-level validation with custom rules
- **Type Safety**: Full TypeScript support
- **Responsive Layouts**: Grid, Section, Tabs, and more
- **Rich Components**: 12+ field types including file upload, rich text, and more
- **Form State Management**: Built-in context for managing form values and errors

## Installation

All components are already installed in your project. Simply import from:

```tsx
import { Form, TextInput, Select, Grid } from "@/components/ui/form-builder"
```

## Basic Usage

```tsx
import { Form, TextInput, Select, Button } from "@/components/ui/form-builder"

export default function MyForm() {
  const handleSubmit = (values: Record<string, unknown>) => {
    console.log("Form submitted:", values)
  }

  return (
    <Form onSubmit={handleSubmit}>
      <TextInput
        accessor="first_name"
        label="First Name"
        required
        placeholder="John"
      />

      <TextInput
        accessor="email"
        label="Email"
        type="email"
        required
      />

      <Select
        accessor="country"
        label="Country"
        options={[
          { label: "United States", value: "us" },
          { label: "Canada", value: "ca" },
        ]}
      />

      <Button type="submit">Submit</Button>
    </Form>
  )
}
```

## Available Components

### Field Components

#### TextInput
```tsx
<TextInput
  accessor="name"
  label="Name"
  placeholder="Enter your name"
  required
  tooltip="Your legal name"
  helperText="As it appears on your ID"
  numeric={false}
  prefix="$"
  suffix="USD"
  validation={{
    minLength: { value: 2, message: "Too short" },
    maxLength: { value: 50, message: "Too long" },
  }}
/>
```

#### Textarea
```tsx
<Textarea
  accessor="bio"
  label="Biography"
  rows={4}
  resize="vertical"
  placeholder="Tell us about yourself..."
/>
```

#### Checkbox
```tsx
<Checkbox
  accessor="terms"
  label="I agree to terms"
  description="You must agree to continue"
  required
/>
```

#### Toggle
```tsx
<Toggle
  accessor="notifications"
  label="Email Notifications"
  description="Receive updates via email"
/>
```

#### Select
```tsx
<Select
  accessor="role"
  label="Role"
  placeholder="Select a role"
  options={[
    { label: "Admin", value: "admin" },
    { label: "User", value: "user", disabled: true },
  ]}
  required
/>
```

#### TagsInput
```tsx
<TagsInput
  accessor="skills"
  label="Skills"
  placeholder="Type and press Enter"
  maxTags={10}
  suggestions={["React", "TypeScript", "Next.js"]}
/>
```

#### DatePicker
```tsx
{/* Native HTML5 date picker (default) */}
<DatePicker
  accessor="birth_date"
  label="Date of Birth"
  native={true}
  minDate={new Date(1900, 0, 1)}
  maxDate={new Date()}
/>

{/* Shadcn calendar picker with dropdown */}
<DatePicker
  accessor="birth_date"
  label="Date of Birth"
  native={false}
  minDate={new Date(1900, 0, 1)}
  maxDate={new Date()}
/>
```

#### DateTimePicker
```tsx
<DateTimePicker
  accessor="appointment"
  label="Appointment"
  showTime={true}
  disablePast
/>
```

#### FileUpload
```tsx
<FileUpload
  accessor="avatar"
  label="Profile Picture"
  accept="image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  maxFiles={1}
  preview
/>
```

#### KeyValue
```tsx
<KeyValue
  accessor="metadata"
  label="Metadata"
  keyLabel="Key"
  valueLabel="Value"
  addLabel="Add metadata"
/>
```

#### MarkdownEditor
```tsx
<MarkdownEditor
  accessor="notes"
  label="Notes"
  height="300px"
  preview
/>
```

#### RichEditor
```tsx
<RichEditor
  accessor="content"
  label="Content"
  height="400px"
/>
```

### Layout Components

#### Grid
```tsx
<Grid columns={2} gap={4}>
  <TextInput accessor="first_name" label="First Name" />
  <TextInput accessor="last_name" label="Last Name" />
</Grid>

{/* Responsive grid */}
<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap={6}>
  {/* fields */}
</Grid>
```

#### Section
```tsx
<Section
  title="Personal Information"
  description="Enter your details below"
  collapsible
  defaultCollapsed={false}
>
  {/* fields */}
</Section>
```

#### Fieldset
```tsx
<Fieldset legend="Address">
  <TextInput accessor="street" label="Street" />
  <TextInput accessor="city" label="City" />
</Fieldset>
```

#### Tabs
```tsx
<Tabs
  tabs={[
    { label: "Profile", value: "profile", icon: <User /> },
    { label: "Security", value: "security", icon: <Lock /> },
  ]}
  defaultTab="profile"
>
  <Group>
    <TextInput accessor="username" label="Username" />
  </Group>
  <Group>
    <TextInput accessor="password" label="Password" type="password" />
  </Group>
</Tabs>
```

#### Group
```tsx
<Group>
  <TextInput accessor="field1" label="Field 1" />
  <TextInput accessor="field2" label="Field 2" />
</Group>
```

#### Placeholder
```tsx
<Placeholder
  text="No content available"
  icon={<FileQuestion />}
  height="200px"
/>
```

## Validation

### Built-in Validation Rules

```tsx
<TextInput
  accessor="email"
  label="Email"
  validation={{
    required: "Email is required",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Invalid email format",
    },
    minLength: {
      value: 5,
      message: "Email must be at least 5 characters",
    },
    maxLength: {
      value: 100,
      message: "Email must be less than 100 characters",
    },
  }}
/>
```

### Custom Validation

```tsx
<TextInput
  accessor="username"
  label="Username"
  validation={{
    validate: (value) => {
      if (value === "admin") {
        return "Username 'admin' is reserved"
      }
      return true
    },
  }}
/>
```

### Numeric Validation

```tsx
<TextInput
  accessor="age"
  label="Age"
  numeric
  validation={{
    min: { value: 18, message: "Must be 18 or older" },
    max: { value: 120, message: "Must be less than 120" },
  }}
/>
```

## Form State Management

### Accessing Form Values

```tsx
import { useFormContext } from "@/components/ui/form-builder"

function CustomField() {
  const { values, errors, touched } = useFormContext()

  return (
    <div>
      <pre>{JSON.stringify(values, null, 2)}</pre>
    </div>
  )
}
```

### Programmatic Updates

```tsx
const { setValue, setError } = useFormContext()

setValue("email", "new@example.com")
setError("email", "Email already exists")
```

## Advanced Examples

### Complex Form with Validation

```tsx
<Form
  initialValues={{
    first_name: "",
    email: "",
    country: "",
  }}
  onSubmit={handleSubmit}
  onChange={(values) => console.log(values)}
>
  <Section title="User Information">
    <Grid columns={2}>
      <TextInput
        accessor="first_name"
        label="First Name"
        required
        validation={{
          minLength: { value: 2, message: "Too short" },
        }}
      />
      <TextInput
        accessor="last_name"
        label="Last Name"
        required
      />
    </Grid>

    <TextInput
      accessor="email"
      label="Email"
      type="email"
      required
      validation={{
        pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: "Invalid email",
        },
      }}
    />
  </Section>

  <Button type="submit">Submit</Button>
</Form>
```

## Comparison with Filament PHP

The API closely mirrors Filament PHP's form builder:

### Filament PHP
```php
TextInput::make('name')
    ->label('Full Name')
    ->required()
    ->maxLength(255)
    ->placeholder('John Doe')
```

### Form Builder (React/Next.js)
```tsx
<TextInput
  accessor="name"
  label="Full Name"
  required
  placeholder="John Doe"
  validation={{
    maxLength: { value: 255, message: "Too long" }
  }}
/>
```

## Demo

Visit `/admin/dashboard/form-demo` to see all components in action with live form state preview.

## TypeScript Support

All components are fully typed. Import types when needed:

```tsx
import type {
  TextInputProps,
  SelectProps,
  ValidationRule
} from "@/components/ui/form-builder"
```
