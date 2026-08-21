import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const content = `B77D1BA3772C0352E09248A98DC16A36EAE20E0DEFCA90AD7AECA70A3A06E923\ncomodoca.com\ne2aff5903078002\n`;
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}
