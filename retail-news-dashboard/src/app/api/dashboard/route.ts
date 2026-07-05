import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/data/dashboard";

export async function GET() {
  try {
    const data = await getDashboardSummary();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load dashboard summary", error);
    return NextResponse.json(
      { error: "Failed to load dashboard summary" },
      { status: 500 }
    );
  }
}
