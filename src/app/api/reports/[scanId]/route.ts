import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ scanId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { scanId } = await context.params;
    if (!scanId) {
      return new NextResponse("Missing scanId", { status: 400 });
    }

    const scan = await prisma.scanResult.findFirst({
      where: {
        id: scanId,
        userId: session.user.id,
      },
      include: {
        vulnerabilities: true,
      },
    });

    if (!scan) {
      return new NextResponse("Scan not found", { status: 404 });
    }

    const findings = scan.vulnerabilities
      .filter((v: { label: number }) => v.label !== 1)
      .map((v: {
        lineNumber: number;
        codeSnippet: string;
        label: number;
        labelName: string;
        confidence: number;
      }, index: number) => ({
        id: `F-${String(index + 1).padStart(3, "0")}`,
        title:
          v.label === 0
            ? "Critical Code Vulnerability"
            : "Potential Hallucinated/Unsafe Logic",
        severity: v.label === 0 ? "CRITICAL" : "HIGH",
        cwe: v.label === 0 ? "CWE-89" : "CWE-20",
        owasp: v.label === 0 ? "A03:2021" : "A04:2021",
        description: `Detected at line ${v.lineNumber} with model confidence ${Math.round(v.confidence * 100)}%.`,
        file: "scanned_code",
        line: v.lineNumber,
        unsafeCode: v.codeSnippet,
        safeCode: scan.fixedCode || "Secure patch not generated yet.",
        aiRationale:
          "Use parameterized operations, strict input validation, and explicit allow-lists for untrusted values.",
        label: v.label,
        labelName: v.labelName,
        confidence: v.confidence,
      }));

    const createdAt = new Date(scan.createdAt);

    return NextResponse.json({
      scan: {
        id: scan.id,
        displayId: `SCN-${scan.id.substring(scan.id.length - 4).toUpperCase()}`,
        createdAt,
        fixedCode: scan.fixedCode,
        originalCode: scan.originalCode,
      },
      findings,
    });
  } catch (error) {
    console.error("REPORT_DETAIL_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
