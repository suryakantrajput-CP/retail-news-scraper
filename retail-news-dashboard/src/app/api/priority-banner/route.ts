import { NextResponse } from "next/server";
import { getPriorityBanner } from "@/lib/data/priority-banner";

export async function GET() {
  try {
    const data = await getPriorityBanner();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load priority banner", error);
    return NextResponse.json(
      { error: "Failed to load priority banner data" },
      { status: 500 }
    );
  }
}
