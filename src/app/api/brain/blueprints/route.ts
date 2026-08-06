import { NextResponse } from "next/server";
import { getBlueprintMeta, type Skill } from "@/lib/ielts-brain";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const module = url.searchParams.get("module") as Skill | null;

  if (!module) {
    return NextResponse.json({ error: "A module query parameter is required." }, { status: 400 });
  }

  return NextResponse.json(getBlueprintMeta(module));
}
