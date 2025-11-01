"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableSelectColumn,
  TableTextColumn,
  TableActionsColumn,
  TableAction,
} from "@/components/ui"
import { Button } from "@/components/ui"
import { Plus, Edit, Trash } from "lucide-react"
import { User } from "@/types/user"
import { toast } from "sonner"
import { getUsers, deleteUser } from "@/app/admin/dashboard/users/actions"

export default function UsersPage() {
  const router = useRouter()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
  const users = await getUsers()
  // Normalize Prisma user shape to the frontend `User` type (ensure name is string)
  const normalized = (users || []).map((u: any) => ({ id: u.id, name: u.name ?? "", email: u.email }))
  setData(normalized)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        toast.error("Failed to load users")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEdit = (user: User) => {
    router.push(`/admin/dashboard/users/edit/${user.id}`)
  }

  const handleDelete = async (user: User) => {
    try {
      const res = await deleteUser(user.id)
      if (res.success) {
        toast.success("User deleted")
        setData((prev) => prev.filter((u) => u.id !== user.id))
      } else {
        toast.error(res.message || "Failed to delete user")
      }
    } catch (err) {
      toast.error("Failed to delete user")
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-8 pb-4">
          <div>
            <h1 className="text-4xl font-bold">Users</h1>
            <p className="mt-2 text-muted-foreground">Loading user data...</p>
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
            <h1 className="text-4xl font-bold">Users</h1>
            <p className="mt-2 text-destructive">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-8 pb-4">
        <div>
          <h1 className="text-4xl font-bold">Users</h1>
          <p className="mt-2 text-muted-foreground">Manage application users</p>
        </div>
        <Button
          className="hover:cursor-pointer"
          onClick={() => router.push("/admin/dashboard/users/create")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      <Table data={data}>
        <TableSelectColumn />

        <TableTextColumn accessor="name" header="Name" sortable searchable />
        <TableTextColumn accessor="email" header="Email" searchable />

        <TableActionsColumn>
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
