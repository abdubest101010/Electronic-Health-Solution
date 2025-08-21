import NextAuth, { type Session, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// Extend User type for session/jwt
interface ExtendedUser extends User {
  id: string;
  name: string;
  role: Role;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { email, password } = credentials as { email: string; password: string };

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("No user found with this email.");
        }

        // Validate password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as ExtendedUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedUser;
        token.id = u.id;
        token.name = u.name;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {} as ExtendedUser;
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
});