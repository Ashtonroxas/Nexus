import { useEffect, useState } from "react";
import { Row, Col, Form, Button, Dropdown } from "react-bootstrap";
import styles from "./MyProjects.module.css";
import ProjectCard from "./components/ProjectCard/ProjectCard";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";

import { collection, onSnapshot } from "firebase/firestore";
import db from "../../firebase/firebase";

function MyProjects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const numProjects = 4; // Placeholder for the number of projects
  const [sortBy, setSortBy] = useState("recent");

  // Begin firebase testing
   const [projects, setProjects] = useState([]);

   useEffect(() => {
    const projCollection = collection(db, "projects");
    const unsubscribe = onSnapshot(projCollection, (snapshot) => {
      const projectsArr = snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
        id: doc.id,
        name: data.name,
        description: data.description,
        completedTasks: data.completedTaskCount,
        totalTasks: data.taskCount,
        owner: data.ownerId,
        }
      });

      setProjects(projectsArr);
      console.log(projectsArr);
    });

    return () => unsubscribe();
   }, []);
  // End firebase testing

  const dummyProject = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Complete overhaul of website with new branding',
      totalTasks: 4,
      completedTasks: 1,
      dueDate: '2026-03-31',
      numMembers: 6,
      color: '#6366F1',
      owner: 1,
    },
    {
      id: 2,
      name: 'Mobile App Launch',
      description: 'iOS and Android app launch for customer sign in portal',
      totalTasks: 52,
      completedTasks: 18,
      dueDate: '2026-04-30',
      numMembers: 8,
      color: '#E25C3A',
      owner: 0,
    },
    {
      id: 3,
      name: 'Marketing Campaign',
      description: 'Q1 2026 marketing campaign across all media channels',
      totalTasks: 38,
      completedTasks: 31,
      dueDate: '2026-02-28',
      numMembers: 5,
      color: '#10B981',
      owner: 0,
    },
  ];

  const sortedProjects = [...dummyProject].sort((a, b) => {
    if (sortBy === "dueDate") return new Date(a.dueDate) - new Date(b.dueDate);
    if (sortBy === "recent") return a.id - b.id;
    if (sortBy === "progress") return (b.completedTasks / b.totalTasks) - (a.completedTasks / a.totalTasks);
    return 0;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  return (
    <div className="d-flex flex-column">
      <Row className="p-3 order-2 order-lg-1">
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
      <Row className="p-3 order-1 order-lg-2">
        <Col xs={12} lg>
          <h2>My Projects</h2>
          <p>View and manage all your projects • {numProjects} active projects</p>
        </Col>
        <Col xs={12} lg="auto" id={styles["dashboard-buttons"]}>
          <div className={styles.sortDropdown}>
            <Dropdown>
              <Dropdown.Toggle id={styles["sort-by"]} size="lg">
                <ArrowUpDown size={16} className="me-1" /> Sort by
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setSortBy("recent")} active={sortBy === "recent"}>
                  Recently Added
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setSortBy("dueDate")} active={sortBy === "dueDate"}>
                  Approaching Deadline
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setSortBy("progress")} active={sortBy === "progress"}>
                  Most Progress
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <Button id={styles["new-project"]} size="lg">
            + New Project
          </Button>
        </Col>
      </Row>
      <Row className="p-3 gap-3 justify-content-center order-3">
        {sortedProjects.map((project) => (
          <ProjectCard 
            key={project.id}
            project={project}
            onClick={() => navigate(`/projects/abc123`)}
          />
        ))}
      </Row>
    </div>
  );
}

export default MyProjects;