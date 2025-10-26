import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
{{#GOOGLE}}import GoogleProvider from "next-auth/providers/google"{{/GOOGLE}}
{{#GITHUB}}import GitHubProvider from "next-auth/providers/github"{{/GITHUB}}

const handler = NextAuth({
  providers: [
{{#GOOGLE}}    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
{{/GOOGLE}}{{#GITHUB}}    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
{{/GITHUB}}{{#CREDENTIALS}}    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // TODO: Replace with your own authentication logic
        if (credentials?.email === "admin@example.com" && credentials?.password === "admin123") {
          return {
            id: "1",
            email: "admin@example.com",
            name: "Admin User"
          }
        }
        return null
      }
    })
{{/CREDENTIALS}}  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/admin/dashboard`
      }
      return baseUrl
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }
