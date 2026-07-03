import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/pr";

declare module "next-auth" {
  interface Session {
    user: { role: Role } & DefaultSession["user"];
  }
  interface User {
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
  }
}
