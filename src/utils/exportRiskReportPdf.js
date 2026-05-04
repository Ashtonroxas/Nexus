import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import nexusLogo from "../assets/nexus.png";

/**
 * Function to build and downoad the PDF report
 * of the project Risk Report
 * 
 * Docs: https://parallax.github.io/jsPDF/docs/jsPDF.html
 * 
 * @param {Object} params
 * @param {string} params.projectName
 * @param {Object} params.report
 * @param {string|number} params.daysToDeadline
 */
export function exportRiskReportPdf({ projectName, report, daysToDeadline }) {
  const doc = new jsPDF({
    orientation: "protrait",
    unit: "pt",
    format: "letter"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 48;
  let y = 60;

  // Branding
  doc.setFillColor("#6366F1");
  doc.rect(0, 0, pageWidth, 10, "F");

  const logoSize = 24;
  const logoY = y - 18;
  doc.addImage(nexusLogo, "PNG", left, logoY, logoSize, logoSize);

  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const bottleneck = report.primaryBottleneck;

  // PDF Report header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Nexus Risk Report", left + 38, y);

  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Project: ${projectName}`, left, y);

  y += 18;
  doc.text(`Exported: ${exportDate}`, left, y);

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Summary", left, y);

  y += 16;

  const summaryRows = [
    ["Days to Deadline", String(daysToDeadline)],
    ["Slack Tasks", String(report.slackTasks)],
    ["Zero Slack Tasks", String(report.zeroSlackTasks)],
    [
      "Primary Bottleneck",
      bottleneck ? `${bottleneck.taskCode} - ${bottleneck.title}` : "None",
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: summaryRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 11,
      cellPadding: 8,
      valign: "middle",
    },
    headStyles: {
      fillColor: "#6366F1",
      textColor: 255,
      fontStyle: "bold",
    },
    margin: { left, right: left },
  });

  y = doc.lastAutoTable.finalY + 28;

  // Critical path
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Critical Path", left, y);

  y += 16;

  const criticalPathRows = report.criticalPath.map((task) => [
    task.taskCode || "--",
    task.title || "--",
    task.complexity || "--",
    task.dueDate || "--",
    task.assigneeName || "Unassigned",
    String(task.slack ?? "--"),
    report.primaryBottleneck?.id === task.id ? "Yes" : "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [[
      "Task Code",
      "Title",
      "Complexity",
      "Due Date",
      "Assignee",
      "Slack",
      "Bottleneck",
    ]],
    body: criticalPathRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 7,
      valign: "middle",
    },
    headStyles: {
      fillColor: "#6366F1",
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 64 },
      1: { cellWidth: 160 },
      2: { cellWidth: 70 },
      3: { cellWidth: 70 },
      4: { cellWidth: 90 },
      5: { cellWidth: 45, halign: "center" },
      6: { cellWidth: 55, halign: "center" },
    },
    margin: { left, right: left },
  });

  y = doc.lastAutoTable.finalY + 28;

  if (y > 700) {
    doc.addPage();
    y = 56;
  }

  const isAtRisk = 
    typeof daysToDeadline === "number" &&
    report.projectDuration > daysToDeadline;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Analysis", left, y);

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const analysisLines = [
    `Project duration is ${report.projectDuration} weighted units.`,
    `There are ${report.zeroSlackTasks} zero-slack tasks on the critical path.`,
    bottleneck
      ? `The primary bottleneck is ${bottleneck.taskCode} (${bottleneck.title}) due to its critical position and weight.`
      : "No primary bottleneck was identified.",
    isAtRisk
      ? "The project appears at risk of missing its deadline based on current schedule analysis."
      : "The project does not currently appear to be at risk based on current schedule analysis.",
  ];

  const wrapped = doc.splitTextToSize(analysisLines.join(" "), pageWidth - left * 2);
  doc.text(wrapped, left, y);

  doc.save(`${projectName.replace(/\s+/g, "_")}_risk_report.pdf`);
}