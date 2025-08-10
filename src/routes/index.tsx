import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      throw redirect({
        to: '/admin/dashboard',
      })
    } else {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  component: () => null,
})