import { Col, ProgressBar } from "react-bootstrap";
import styles from "./ProjectCard.module.css";
import { X, Users, Calendar, CheckSquare } from "lucide-react";
import { useState } from "react";
import { motion } from 'framer-motion';
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";

const MotionCol = motion(Col);

function ProjectCard({ project, onClick, canDelete, onDelete }) {
  const progress = 
    project.totalTasks > 0
      ? Math.round((project.completedTasks / project.totalTasks) * 100)
      : 0;

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  const handleShowDeleteModal = () => setShowDeleteModal(true);

  const handleConfirmDelete = async () => {
    await onDelete?.(project.id);
    handleCloseDeleteModal();
  };

  return (
    <>
      <MotionCol layout transition = {{layout: {duration: 0.4, ease: "easeInOut"}}}
        id={styles["project-card"]} className="rounded-4 p-4" onClick={onClick} role="button">
        <div className="d-flex justify-content-between">
          <CheckSquare size={50} color={project.color} />
          {canDelete && (
            <X size={25}
               color="#EF4444"
               role="button"
               style={{cursor: "pointer"}}
               onClick={(e) => {
                e.stopPropagation();
                handleShowDeleteModal();
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
            {project.dueDate ?
                    project.dueDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    : "Unspecified"}
          </span>
        </div>
      </MotionCol>

      <ConfirmModal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Project?"
        message={`Are you sure you want to delete "${project.name}" for everyone? This action is irreversible.`}
        confirmText="Delete"
        cancelText="Cancel"/>
    </>
  );
}

export default ProjectCard;