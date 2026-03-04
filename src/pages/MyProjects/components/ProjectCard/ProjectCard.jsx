import { Col, ProgressBar } from "react-bootstrap";
import styles from "./ProjectCard.module.css";
import { X, Users, Calendar, CheckSquare } from "lucide-react";

function ProjectCard({ project, onClick }) {
  const progress = Math.round((project.completedTasks / project.totalTasks) * 100);

  return (
    <Col id={styles["project-card"]} className="rounded-4 p-4" onClick={onClick} role="button">
      <div className="d-flex justify-content-between">
        <CheckSquare size={50} color={project.color} />
        {project.owner === 1 && (
          <X size={25} color="#EF4444" />
        )}
      </div>

      <div className="mb-5 mt-3" style={{ height: 70 }}>
        <h5 className="fw-bold mb-3">{project.name}</h5>
        <p className="text-muted small">
          {project.description.length > 100
            ? project.description.slice(0, 100) + "..."
            : project.description}
        </p>
      </div>

      <div className="d-flex justify-content-between">
        <span className="text-muted small">Progress</span>
        <span className="text-muted small">{progress}%</span>
      </div>
      <ProgressBar
        now={progress}
        className="mb-1"
        style={{ height: 8, "--bs-progress-bar-bg": project.color }} />
      <p className="text-muted small">
        {project.completedTasks} of {project.totalTasks} tasks completed
      </p>

      <hr />

      <div className="d-flex justify-content-between text-muted small">
        <span><Users size={16} />{project.numMembers}</span>
        <span>
          <Calendar size={16} />
          {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </Col>
  );
}

export default ProjectCard;