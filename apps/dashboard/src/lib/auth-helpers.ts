import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function getSessionFleetId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).fleetId ?? null;
}

export async function requireFleetId(): Promise<string> {
  const fleetId = await getSessionFleetId();
  if (!fleetId) {
    throw new Error("Unauthorized: no fleetId in session");
  }
  return fleetId;
}
