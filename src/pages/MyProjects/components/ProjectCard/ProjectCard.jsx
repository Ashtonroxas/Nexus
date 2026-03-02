import { Row, Col } from "react-bootstrap";
import styles from "./ProjectCard.module.css";

function ProjectCard({ project }) {
  return (
    <Col lg={4} id={styles["project-card"]}>
      <Row>
        <Col>
          Icon
        </Col>
        <Col>
          X
        </Col>
      </Row>
    </Col>
  )
}

export default ProjectCard;