"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({ take: 100 })
    return users
  } catch (error) {
    console.error("Failed to fetch users:", error)
    throw new Error("Failed to fetch users")
  }
}

export async function getUserById(id: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    return user
  } catch (error) {
    console.error("Failed to fetch user:", error)
    throw new Error("Failed to fetch user")
  }
}

export async function createUser(data: { name: string; email: string }) {
  try {
    const user = await prisma.user.create({ data: { name: data.name, email: data.email } })
    revalidatePath("/admin/dashboard/users")
    return { success: true, message: "User created successfully", user }
  } catch (error) {
    console.error("Error creating user:", error)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, message: "A user with this email already exists." }
    }
    return { success: false, message: "Failed to create user." }
  }
}

export async function updateUser(id: number, data: { name?: string; email?: string }) {
  try {
    const user = await prisma.user.update({ where: { id }, data })
    revalidatePath("/admin/dashboard/users")
    return { success: true, message: "User updated successfully", user }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, message: "Failed to update user." }
  }
}

export async function deleteUser(id: number) {
  try {
    await prisma.user.delete({ where: { id } })
    revalidatePath("/admin/dashboard/users")
    return { success: true, message: "User deleted" }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, message: "Failed to delete user." }
  }
}
