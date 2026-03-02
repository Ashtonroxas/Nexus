import { useState } from "react";
import NexusLayout from "../../layouts/NexusLayout";
import { Row, Col, Form, Button } from "react-bootstrap";
import styles from "./MyProjects.module.css";
import ProjectCard from "./components/ProjectCard/ProjectCard";

function MyProjects() {
  const [searchTerm, setSearchTerm] = useState("");
  const numProjects = 4; // Placeholder for the number of projects

  const dummyProject = {
    id: 1,
    name: 'Nexus',
    description: 'A project management tool for teams.',
    progress: 75,
    totalTasks: 20,
    completedTasks: 15,
    dueDate: '2024-12-31',
    numMembers: 5,
  }

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  return (
    <NexusLayout>
      <Row className="p-3">
        <Form onSubmit={(e) => handleSearch(e)}>
          <Form.Control
            type="search"
            placeholder="Search projects"
            value={searchTerm}
            size="lg"
            onChange={(e) => setSearchTerm(e.target.value)}
            onSubmit={() => handleSearch()}
          />
        </Form>
      </Row>
      <Row className="p-3">
        <Col>
          <h2>My Projects</h2>
          <p>View and manage all your projects • {numProjects} active projects</p>
        </Col>
        <Col id={styles["dashboard-buttons"]}>
          <Button id={styles["sort-by"]} size="lg">
            Sort by
          </Button>
          <Button id={styles["new-project"]} size="lg">
            + New Project
          </Button>
        </Col>
      </Row>
      <Row className="p-3">
        <ProjectCard project={dummyProject} />
      </Row>
    </NexusLayout>
  );
}

export default MyProjects;