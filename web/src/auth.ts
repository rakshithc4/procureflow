import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/lib/pr";

// PRD §13 item 3: two seeded demo users, no external IdP (v1 non-goal: SSO/IAS).
const DEMO_USERS: Record<string, { password: string; role: Role; name: string }> = {
  "requestor@demo": { password: "demo1234", role: "requestor", name: "Demo Requestor" },
  "approver@demo": { password: "demo1234", role: "approver", name: "Demo Approver" },
};

// Shown on the login card so the demo credentials are always visible.
export const DEMO_CREDENTIALS = [
  { email: "requestor@demo", password: "demo1234", label: "Requestor" },
  { email: "approver@demo", password: "demo1234", label: "Approver" },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;
        const user = email ? DEMO_USERS[email] : undefined;
        if (!user || !password || user.password !== password) return null;
        return { id: email, email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      // next-auth v5 beta's session-callback `token` param doesn't pick up
      // the @auth/core/jwt module augmentation under pnpm's strict node_modules
      // isolation (verified: importing JWT directly does see the augmentation).
      session.user.role = token.role as Role;
      return session;
    },
  },
});
