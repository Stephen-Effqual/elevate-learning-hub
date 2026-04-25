import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(
  request: Request,
  { params }: { params: { reportId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: params.reportId },
      include: {
        student: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check authorization
    if (user.role === "STUDENT" && report.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PARENT") {
      const link = await prisma.studentParentLink.findFirst({
        where: {
          studentId: report.studentId,
          parentId: user.id,
        },
      });

      if (!link) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const reportData = JSON.parse(report.reportContent);
    const generatedDate = report.generatedAt.toLocaleDateString("en-NZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Progress Report - ${report.student.username}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1e40af;
    }
    .header h1 {
      color: #1e40af;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #1e40af;
      font-size: 20px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .section p {
      font-size: 14px;
      line-height: 1.8;
      color: #444;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Elevate Learning Hub</h1>
    <h2>NCEA Progress Report</h2>
    <p><strong>Student:</strong> ${report.student.username}</p>
    <p><strong>Generated:</strong> ${generatedDate}</p>
  </div>

  ${reportData.sessionSummary ? `
  <div class="section">
    <h2>Session Summary</h2>
    <p>${reportData.sessionSummary}</p>
  </div>
  ` : ""}

  <div class="section">
    <h2>Topics Covered</h2>
    <p>${reportData.topicsCovered || "No topics covered yet."}</p>
  </div>

  <div class="section">
    <h2>Standards Practiced</h2>
    <p>${reportData.standardsPracticed || "No standards practiced yet."}</p>
  </div>

  <div class="section">
    <h2>Strengths</h2>
    <p>${reportData.strengths || "No strengths identified yet."}</p>
  </div>

  <div class="section">
    <h2>Areas for Improvement</h2>
    <p>${reportData.areasForImprovement || "No areas for improvement identified yet."}</p>
  </div>

  <div class="section">
    <h2>Suggested Next Steps</h2>
    <p>${reportData.nextSteps || "No next steps suggested yet."}</p>
  </div>

  <div class="footer">
    <p>Elevate Learning Hub &copy; ${new Date().getFullYear()}</p>
    <p>NCEA Tutoring System</p>
  </div>
</body>
</html>
`;

    // Step 1: Create PDF generation request
    const createResponse = await fetch(
      "https://apps.abacus.ai/api/createConvertHtmlToPdfRequest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          html_content: htmlContent,
          pdf_options: {
            format: "A4",
            print_background: true,
            margin: {
              top: "20mm",
              right: "15mm",
              bottom: "20mm",
              left: "15mm",
            },
          },
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse
        .json()
        .catch(() => ({ error: "Failed to create PDF request" }));
      return NextResponse.json(
        { success: false, error: error.error },
        { status: 500 }
      );
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json(
        { success: false, error: "No request ID returned" },
        { status: 500 }
      );
    }

    // Step 2: Poll for status until completion
    const maxAttempts = 300;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        "https://apps.abacus.ai/api/getConvertHtmlToPdfStatus",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            request_id: request_id,
            deployment_token: process.env.ABACUSAI_API_KEY,
          }),
        }
      );

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || "FAILED";
      const result = statusResult?.result || null;

      if (status === "SUCCESS") {
        if (result && result.result) {
          const pdfBuffer = Buffer.from(result.result, "base64");
          return new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="Progress_Report_${report.student.username}_${generatedDate.replace(/\s+/g, "_")}.pdf"`,
            },
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "PDF generation completed but no result data",
            },
            { status: 500 }
          );
        }
      } else if (status === "FAILED") {
        const errorMsg = result?.error || "PDF generation failed";
        return NextResponse.json(
          { success: false, error: errorMsg },
          { status: 500 }
        );
      }

      attempts++;
    }

    return NextResponse.json(
      { success: false, error: "PDF generation timed out" },
      { status: 500 }
    );
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
