import { NextResponse } from "next/server";
import { getGroceryNews } from "@/lib/data/grocery-news";

export async function GET() {
  try {
    const data = await getGroceryNews();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load grocery news", error);
    return NextResponse.json(
      { error: "Failed to load grocery news data" },
      { status: 500 }
    );
  }
}
