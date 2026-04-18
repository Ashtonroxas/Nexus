import { useMemo } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { CalendarDays, AlertTriangle, Mail, Share2, ArrowDown } from "lucide-react";
import StatCard from "./components/StatCard";
import styles from "./RiskReport.module.css";

function RiskReport() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { menuButton } = useOutletContext();

  const report = useMemo(
    () => ({
      projectName: "Website Redesign",
      subtitle:
        "Analyze project bottlenecks and scheduling based on task dependency and complexity",
      criticalPath: [
        {
          id: "1",
          taskCode: "TASK-101",
          title: "Generate Design Prototype",
          complexity: "Low",
          dueDate: "2026-02-14",
          assigneeInitials: "AR",
          isBottleneck: false,
        },
        {
          id: "2",
          taskCode: "TASK-103",
          title: "Authentication & Permission",
          complexity: "Severe",
          dueDate: "2026-02-16",
          assigneeInitials: "TN",
          isBottleneck: true,
        },
        {
          id: "3",
          taskCode: "TASK-104",
          title: "Quality Assurance",
          complexity: "High",
          dueDate: "2026-02-22",
          assigneeInitials: "AB",
          isBottleneck: false,
        },
      ],
      daysToDeadline: 3,
      slackTasks: 1,
      zeroSlackTasks: 3
    }),
    []
  );

  // Helper format functions for date and complexity class styling
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
  };
  const getComplexityClass = (complexity) => {
    switch (complexity.toLowerCase()) {
      case "severe":
        return styles.severePill;
      case "high":
        return styles.highPill;
      case "medium":
        return styles.mediumPill;
      case "low":
        return styles.lowPill;
    }
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className={styles.contentContainer}>
      
      <div className={styles.mobileTopBar}>
        {menuButton}
      </div>
      <hr className={styles.mobileDivider} />

      {/* Overview and description of page + export button */}
      <header className={styles.reportHeader}>
        <div className={styles.titleSection}>
          <h2 className={styles.pageTitle}>Overview</h2>
          <p className={styles.pageSubtitle}>{report.subtitle}</p>
        </div>

        <button className={styles.exportBtn} onClick={handleExport}>
          <Share2 size={16} />
          Export
        </button>
      </header>

      {/** Main section of page displaying critical path */}
      <section className={styles.reportCard}>
        <div className={styles.cardHeader}> Critical Path </div>
        <div className={styles.cardBody}>
          {/** Mapping each task in the critical path to be rendered */}
          {report.criticalPath.map((task, index) => (
            <div key={task.id}>
              <div className={styles.taskRow}>
                <div className={styles.taskLeft}>
                  <div className={styles.taskCode}>{task.taskCode}</div>
                  <div className={styles.taskTitle}> {task.title} </div>

                  <div className={styles.taskMeta}>
                    <span className={`${styles.pill} ${getComplexityClass(task.complexity)}`}>{task.complexity}</span>
                    <span className={styles.date}>
                      <CalendarDays size={14} />
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>

                {/** Highest weight task marked as primary bottlenexk */}
                <div className={styles.taskRight}>
                  {task.isBottleneck && (
                    <div className={styles.bottleneck}>
                        <AlertTriangle size={28} />
                        <span> Primary Project Bottleneck </span>
                      </div>
                  )}

                  <div className={styles.assigneeBlock}>
                    <span className={styles.assigneeLabel}> Nudge Assignee </span>

                    <div className={styles.assigneeRow}>
                      <button
                        type="button"
                        className={styles.mailButton}
                      >
                        <Mail size={18} />
                      </button>
                      <div className={styles.avatar}> {task.assigneeInitials} </div>
                    </div>
                  </div>
                </div>
              </div>

              {/** Render n - 1 down arrows to display the flow in between tasks */}
              {index < report.criticalPath.length -1 && (
                <div className={styles.arrowRow}>
                  <ArrowDown size={24} strokeWidth={1.75} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/** Stats section with days to deadline and slack/no slack tasks */}
      <section className={styles.statsGrid}>
        <StatCard
          title="Days to Deadline"
          value={report.daysToDeadline}
          valueClassName={styles.deadlineValue}
          className={styles.statCard}
        />

        <StatCard
          title="Slack Tasks"
          value={report.slackTasks}
          valueClassName={styles.slackValue}
          className={styles.statCardDesktop}
          tooltip="Tasks that can be delayed without affecting the overall project deadline."
        />

        <StatCard
          title="Zero Slack Tasks"
          value={report.zeroSlackTasks}
          valueClassName={styles.deadlineValue}
          className={styles.statCardDesktop}
          tooltip="Tasks must be completed on time or the entire project will be delayed."
        />
      </section>
    </div>
  );
}

export default RiskReport;