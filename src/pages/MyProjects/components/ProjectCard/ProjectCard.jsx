import { Col, ProgressBar, Button, Modal } from "react-bootstrap";
import styles from "./ProjectCard.module.css";
import { X, Users, Calendar, CheckSquare } from "lucide-react";
import { useState } from "react";
import { motion } from 'framer-motion';

const MotionCol = motion(Col);

function ProjectCard({ project, onClick }) {
  const progress = Math.round((project.completedTasks / project.totalTasks) * 100);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);


  return (
    <>
      <Modal dialogClassName={styles.deleteWarning} show={show} onHide={handleClose} centered>
        <Modal.Header className = "gap-2 border-0">
          <Modal.Title id = {styles["del-title"]}>Delete Project?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this project for everyone? This action cannot be undone.</Modal.Body>
        <Modal.Footer className="justify-content-center gap-2 border-0">
          <Button id = {styles["snd-button"]} variant="secondary" onClick = {(e) => {
            e.stopPropagation();
            handleClose();
          }}>
            Cancel
          </Button>
          <Button id = {styles["fst-button"]} variant="primary" onClick = {(e) => {
            e.stopPropagation();
            handleClose();
          }}>
            <i>DELETE</i>
          </Button>
        </Modal.Footer>
      </Modal>
      <MotionCol layout transition = {{layout: {duration: 0.4, ease: "easeInOut"}}}
        id={styles["project-card"]} className="rounded-4 p-4" onClick={onClick} role="button">
        <div className="d-flex justify-content-between">
          <CheckSquare size={50} color={project.color} />
          {project.owner === 1 && (
            <X size={25} color="#EF4444"
            onClick = {(e) => {
              e.stopPropagation();
              handleShow();
            }}
            />
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
          <span><Users size={16} className="me-1" />{project.numMembers}</span>
          <span>
            <Calendar size={16} className="me-1" />
            {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </MotionCol>
    </>
  );
}

export default ProjectCard;