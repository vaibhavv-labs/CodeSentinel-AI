// src/app/api/history/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch all scans for the user, including their vulnerabilities
        const scans = await prisma.scanResult.findMany({
            where: { userId: session.user.id },
            include: { vulnerabilities: true },
            orderBy: { createdAt: 'desc' },
        });

        const formattedScans = scans.map(scan => {
            // Determine Risk Level
            let risk = 'SAFE';
            if (scan.isVulnerable) {
                const hasCritical = scan.vulnerabilities.some(v => v.label === 0);
                const hasWarning = scan.vulnerabilities.some(v => v.label === 2);
                if (hasCritical) risk = 'CRITICAL';
                else if (hasWarning) risk = 'HALLUCINATED';
                else risk = 'HIGH';
            }

            // Calculate a score out of 10
            const vulnCnt = scan.vulnerabilities.filter(v => v.label !== 1).length;
            const score = Math.max(0.1, 10 - (vulnCnt * 1.5)).toFixed(1);

            return {
                id: `SCN-${scan.id.substring(scan.id.length - 4).toUpperCase()}`,
                realId: scan.id,
                project: 'CodeTrust Scan', // Defaulting since repo name isn't in DB schema
                branch: 'main',
                status: 'Completed',
                risk,
                score,
                date: new Date(scan.createdAt).toLocaleString([], { 
                    year: 'numeric', month: 'short', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                }),
                language: 'Auto', 
            };
        });

        return NextResponse.json(formattedScans);
    } catch (error) {
        console.error("HISTORY_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}