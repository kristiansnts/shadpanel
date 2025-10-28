"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableSelectColumn,
  TableTextColumn,
  TableImageColumn,
  TableActionsColumn,
  TableAction,
} from "@/components/ui"
import { Button } from "@/components/ui"
import { Plus, Eye, Edit, Trash } from "lucide-react"
import { User, UsersResponse } from "@/types/user"
import { toast } from "sonner"

export default function TableDemoPage() {
  const router = useRouter()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("https://dummyjson.com/users")
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }
        const result: UsersResponse = await response.json()
        setData(result.users)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        toast.error("Failed to load users")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleView = (user: User) => {
    toast.info(`Viewing user: ${user.firstName} ${user.lastName}`)
    console.log("View user:", user)
  }

  const handleEdit = (user: User) => {
    toast.info(`Editing user: ${user.firstName} ${user.lastName}`)
    console.log("Edit user:", user)
  }

  const handleDelete = (user: User) => {
    toast.error(`Deleting user: ${user.firstName} ${user.lastName}`)
    setData((prevData) => prevData.filter((u) => u.id !== user.id))
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-8 pb-4">
          <div>
            <h1 className="text-4xl font-bold">Table Builder Demo</h1>
            <p className="mt-2 text-muted-foreground">
              Loading user data...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-8 pb-4">
          <div>
            <h1 className="text-4xl font-bold">Table Builder Demo</h1>
            <p className="mt-2 text-destructive">
              Error: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-8 pb-4">
        <div>
          <h1 className="text-4xl font-bold">Table Builder Demo</h1>
          <p className="mt-2 text-muted-foreground">
            Example table built with ShadPanel Table Builder
          </p>
        </div>
        <Button onClick={() => router.push("/admin/dashboard/table-demo/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <Table data={data}>
          <TableSelectColumn />

          <TableImageColumn
            accessor="image"
            header="Avatar"
            alt={(row) => `${(row as User).firstName} ${(row as User).lastName}`}
          />

          <TableTextColumn
            accessor="firstName"
            header="First Name"
            sortable
            searchable
          />

          <TableTextColumn
            accessor="lastName"
            header="Last Name"
            sortable
            searchable
          />

          <TableTextColumn
            accessor="email"
            header="Email"
            searchable
          />

          <TableTextColumn
            accessor="phone"
            header="Phone"
            searchable
          />

          <TableTextColumn
            accessor="company.title"
            header="Job Title"
            searchable
          />

          <TableTextColumn
            accessor="age"
            header="Age"
            sortable
            numeric
          />

          <TableActionsColumn>
            <TableAction icon={Eye} label="View details" onClick={(row) => handleView(row as User)} />
            <TableAction icon={Edit} label="Edit user" onClick={(row) => handleEdit(row as User)} />
            <TableAction separator label="" onClick={() => {}} />
            <TableAction
              icon={Trash}
              label="Delete user"
              onClick={(row) => handleDelete(row as User)}
              variant="destructive"
            />
          </TableActionsColumn>
      </Table>
    </div>
  )
}
