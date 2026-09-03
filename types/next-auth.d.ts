import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "Admin" | "Tech";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "Admin" | "Tech";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "Admin" | "Tech";
  }
}
