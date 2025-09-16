import NextAuth, { AuthError, type Session, type User } from "next-auth";
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
class InvalidCredentialsError extends AuthError {
  constructor(message: string) {
    super();
    this.message = message;
    this.type = "CredentialsSignin"; // Standard type for credential errors
  }
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
        const { email, password } = credentials as { email: string; password: string };

        // Validate password length
        if (password.length < 8) {
          throw new InvalidCredentialsError("Password must be at least 8 characters.");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new InvalidCredentialsError("Invalid email or password.");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new InvalidCredentialsError("Invalid email or password.");
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