import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { 
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDoc
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { buildRiskReport } from "../../utils/graphAnalysis";
import { exportRiskReportPdf } from "../../utils/exportRiskReportPdf";
import { CalendarDays, AlertTriangle, Mail, Share2, ArrowDown } from "lucide-react";
import StatCard from "./components/StatCard";
import styles from "./RiskReport.module.css";

function RiskReport() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { menuButton } = useOutletContext();
  const [report, setReport] = useState(null);
  const [projectName, setProjectName] = useState("Loading...");
  const [projectDueDate, setProjectDueDate] = useState(null);
  const [usersMap, setUsersMap] = useState(new Map());

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
  const getDaysToDeadline = (dueDateValue) => {
    if (!dueDateValue) return "--";

    const dueDate = 
      typeof dueDateValue?.toDate === "function"
        ? dueDateValue.toDate()
        : new Date(dueDateValue);

    if (isNaN(dueDate.getTime())) return "--";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const ms = dueDate.getTime() - today.getTime();
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));

    if (days < 0) return "Overdue";

    return days;
  };

  const handleExport = () => {
    exportRiskReportPdf({
      projectName,
      report,
      daysToDeadline
    });
  };

  const handleEmail = (task) => {
    const user = usersMap.get(task.assigneeId);
    const email = user?.email || "";
    const subject = `Reminder: ${task.title}`;
    const body = `
      Hi ${user?.displayName || task.assigneeName || "there"},

      Quick reminder about:

      ${task.taskCode}: ${task.title}
      ${task.slack === 0 ? "This task is on the critical path." : ""}

      It is due by ${task.dueDate}.
    `;

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, "_blank");
  };

  // Fetching project name from firestore
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = onSnapshot(doc(db, "projects", projectId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProjectName(data.name || "Untitled Project");
        setProjectDueDate(data.dueDate || null);
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  // Fetching firestore tasks/edges and building risk report
  useEffect(() => {
    if (!projectId) return;

    const tasksRef = collection(db, "projects", projectId, "tasks");
    const tasksQuery = query(tasksRef, orderBy("createdAt", "asc"));
    const edgesRef = collection(db, "projects", projectId, "edges");

    let latestTasks = [];
    let latestEdges = [];

    const updateReport = () => {
      if (latestTasks.length === 0) {
        setReport({
          criticalPath: [],
          slackTasks: 0,
          zeroSlackTasks: 0,
          primaryBottleneck: null,
          projectDuration: 0,
        });
        return;
      }

      try {
        const analyzedReport = buildRiskReport(latestTasks, latestEdges);
        setReport({
          ...analyzedReport,
        });
      } catch (error) {
        console.error("Error building risk report: ", error);
        setReport({
          criticalPath: [],
          slackTasks: 0,
          zeroSlackTasks: 0,
          primaryBottleneck: null,
          projectDuration: 0
        });
      }
    };

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      latestTasks = snapshot.docs.map((taskDoc) => ({
        id: taskDoc.id,
        ...taskDoc.data(),
      }));

      updateReport();
    });

    const unsubscribeEdges = onSnapshot(edgesRef, (snapshot) => {
      latestEdges = snapshot.docs.map((edgeDoc) => ({
        id: edgeDoc.id,
        ...edgeDoc.data(),
      }));

      updateReport();
    });

    return () => {
      unsubscribeTasks();
      unsubscribeEdges();
    };
  }, [projectId]);

  // Fetching the project member user information
  useEffect(() => {
    if (!projectId) return;

    const membersRef = collection(db, "projects", projectId, "members");
    const unsubscribe = onSnapshot(membersRef, async (snapshot) => {
      const memberDocs = snapshot.docs.map((doc) => ({
        userId: doc.id,
      }));

      const userMap = new Map();

      await Promise.all(
        memberDocs.map(async ({ userId }) => {
          const userSnap = await getDoc(doc(db, "users", userId));
          if (userSnap.exists()) {
            userMap.set(userId, userSnap.data());
          } 
        })
      );

      setUsersMap(userMap);
    });

    return () => unsubscribe();
  }, [projectId]);
 
  const daysToDeadline = getDaysToDeadline(projectDueDate);
  if (!report) return null;

  return (
    <div className={styles.contentContainer}>
      
      <div className={styles.mobileTopBar}>
        {menuButton}
      </div>
      <hr className={styles.mobileDivider} />

      {/* Overview and description of page + export button */}
      <header className={styles.reportHeader}>
        <div className={styles.titleSection}>
          <h2 className={styles.pageTitle}>Risk Report</h2>
          <p className={styles.pageSubtitle}>{projectName}</p>
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
                  {report.primaryBottleneck?.id === task.id && (
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
                        onClick={() => handleEmail(task)}
                        disabled={!task.assigneeId && !task.assigneeName}
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
          value={daysToDeadline}
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