import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function getRisk(vulns: Array<{ label: number }>) {
  if (!vulns.length) return "SAFE";
  if (vulns.some((v) => v.label === 0)) return "CRITICAL";
  if (vulns.some((v) => v.label === 2)) return "HALLUCINATED";
  return "HIGH";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const scans = await prisma.scanResult.findMany({
      where: { userId: session.user.id },
      include: { vulnerabilities: true },
      orderBy: { createdAt: "desc" },
    });

    const reportRows = scans.map(
      (scan: {
        id: string;
        createdAt: Date;
        fixedCode: string | null;
        vulnerabilities: Array<{ label: number }>;
      }) => {
        const vulnerabilityCount = scan.vulnerabilities.filter((v: { label: number }) => v.label !== 1).length;
        return {
          id: scan.id,
          createdAt: new Date(scan.createdAt).toISOString(),
          risk: getRisk(scan.vulnerabilities),
          vulnerabilityCount,
          fixedCodeAvailable: scan.fixedCode ? "yes" : "no",
        };
      }
    );

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

    let page = pdf.addPage([842, 595]); // A4 landscape
    const { height } = page.getSize();
    const marginX = 36;
    const marginTop = 36;
    const lineHeight = 18;
    let cursorY = height - marginTop;

    const addPage = () => {
      page = pdf.addPage([842, 595]);
      cursorY = height - marginTop;
    };

    const drawText = (text: string, x: number, y: number, isBold = false, size = 11) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: isBold ? boldFont : font,
        color: rgb(0.1, 0.1, 0.1),
      });
    };

    drawText("CodeTrust Forensic Report", marginX, cursorY, true, 18);
    cursorY -= lineHeight + 8;
    drawText(`Generated: ${new Date().toISOString()}`, marginX, cursorY, false, 10);
    cursorY -= lineHeight;
    drawText(`Total scans: ${reportRows.length}`, marginX, cursorY, false, 10);
    cursorY -= lineHeight + 6;

    drawText("Scan ID", marginX, cursorY, true, 10);
    drawText("Created At", marginX + 180, cursorY, true, 10);
    drawText("Risk", marginX + 400, cursorY, true, 10);
    drawText("Vulnerabilities", marginX + 480, cursorY, true, 10);
    drawText("Fixed Code", marginX + 610, cursorY, true, 10);
    cursorY -= lineHeight;

    reportRows.forEach((row) => {
      if (cursorY < 40) {
        addPage();
      }

      drawText(row.id.slice(0, 26), marginX, cursorY, false, 9);
      drawText(row.createdAt, marginX + 180, cursorY, false, 9);
      drawText(row.risk, marginX + 400, cursorY, false, 9);
      drawText(String(row.vulnerabilityCount), marginX + 500, cursorY, false, 9);
      drawText(row.fixedCodeAvailable, marginX + 620, cursorY, false, 9);
      cursorY -= lineHeight;
    });

    const pdfBytes = await pdf.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=codetrust-forensic-report-${Date.now()}.pdf`,
      },
    });
  } catch (error) {
    console.error("HISTORY_EXPORT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
