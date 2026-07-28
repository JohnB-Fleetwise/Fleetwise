import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/db";

function uid(): string {
  return "user-" + Math.random().toString(36).slice(2, 12);
}

function fleetId(): string {
  return "fleet-" + Math.random().toString(36).slice(2, 8);
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await createUser({
      id: uid(),
      email,
      passwordHash,
      displayName: name,
      fleetId: fleetId(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    const message = error instanceof Error && error.message?.includes("DATABASE_URL")
      ? "Database connection is not configured. Please set DATABASE_URL."
      : "Internal server error.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
