// Client-side auth utilities for better-auth
// This is separate from the server-side auth in lib/auth.ts

import type { User } from "./types"
import { authClient } from "./auth-client"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await authClient.getSession();
    if (session && 'data' in session && session.data?.user) {
      const user = session.data.user;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function signOut() {
  await authClient.signOut();
}
