import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  
  if (filename.endsWith(".txt") || filename.includes("1EAB17E1356BACBE")) {
    const content = `B77D1BA3772C0352E09248A98DC16A36EAE20E0DEFCA90AD7AECA70A3A06E923\ncomodoca.com\ne2aff5903078002\n`;
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  }

  return new NextResponse("Not Found", { status: 404 });
}
