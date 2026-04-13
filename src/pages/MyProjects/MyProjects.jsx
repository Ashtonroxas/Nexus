import { useEffect, useState } from "react";
import { useAuth } from "../../firebase/AuthContext";
import { Row, Col, Form, Button, Dropdown } from "react-bootstrap";
import styles from "./MyProjects.module.css";
import ProjectCard from "./components/ProjectCard/ProjectCard";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";

import { 
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  or,
  getDocs
} from "firebase/firestore";
import { db } from "../../firebase/firebase";

function MyProjects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Header caption
  const [projects, setProjects] = useState([]);
  const numProjects = projects.length;

  const [sortBy, setSortBy] = useState("recent");
  const { menuButton } = useOutletContext(); // menu components passed from Layout
  const { currentUser } = useAuth(); // custom hook from firebase auth to obtain user

  // Query and parse all user's projects
  useEffect(() => {
    if (!currentUser) return;

    // Query and parse all user's projects
    const q = query(
      collection(db, "projects"),
      or(
        where("memberIds", "array-contains", currentUser.uid), // Catches projects of which user is a member
        where("ownerId", "==", currentUser.uid)                // Catches projects of which user is owner
      )
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const projectsArr = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Fetch member count from the members subcollection (source of truth)
          let memberCount = 1;
          try {
            const membersSnapshot = await getDocs(collection(db, "projects", doc.id, "members"));
            memberCount = membersSnapshot.size || 1;
          } catch (error) {
            // Fallback to memberIds array length if subcollection doesn't exist
            memberCount = data.memberIds ? data.memberIds.length : 1;
          }

          return {
            id: doc.id,
            name: data.name || "Untitled Project",
            description: data.description || "",
            completedTasks: data.completedTaskCount || 0,
            totalTasks: data.taskCount || 0,
            owner: data.ownerId || "",
            dueDate: data.dueDate?.toDate? data.dueDate.toDate() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
            numMembers: memberCount,
            color: data.color || "#3b82f6",
          };
        })
      );

      setProjects(projectsArr);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Create new project and store it in firestore with default initializations
  const handleNewProject = async () => {
    try {
      if (!currentUser) return;

      const currentUserId = currentUser?.uid;

      const projectRef = await addDoc(collection(db, "projects"), {
        name: "Untitled Project",
        description: "",
        ownerId: currentUserId,
        memberIds: [currentUserId],
        taskCount: 0,
        completedTaskCount: 0,
        dueDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, "projects", projectRef.id, "members", currentUserId), {
        userId: currentUserId,
        role: "owner",
      });

      navigate(`/projects/${projectRef.id}`);
    } catch (error) {
      console.error("Error creating project: ", error);
    }
  };

  // Remove specific project collection from firestore
  const handleDeleteProject = async (projectId) => {
    try {
      await deleteDoc(doc(db, "projects", projectId));
    } catch (error) {
      console.error("Error deleting project: ", error);
    }
  };

  // Custom sorting function based on deadline, recency, progress
  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === "dueDate") {
      return (
        (a.dueDate ? a.dueDate.getTime() : Infinity) - 
        (b.dueDate ? b.dueDate.getTime() : Infinity) // unspecified deadlines treated as far into future
      );
    }
    if (sortBy === "recent") {
      return (
        (b.updatedAt?.getTime?.() || 0) -
        (a.updatedAt?.getTime?.() || 0)
      );
    }
    if (sortBy === "progress") return (b.completedTasks / (b.totalTasks || 1)) - (a.completedTasks / (a.totalTasks || 1));
    return 0;
  });

  // Filter the sorted projects based on the search term. Checks case-insensitively and 
  // looks for matches in project name and description
  const filteredProjects = sortedProjects.filter((project) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true; // default case to show all projects

    return (
      project.name.toLowerCase().includes(term) ||
      project.description.toLowerCase().includes(term)
    );
  });

  return (
    <div className="d-flex flex-column">
      {/* Top bar - search on desktop*/}
      <Row className="p-3 order-2 order-lg-1">
        <Form>
          <Form.Control
            type="search"
            placeholder="Search projects"
            value={searchTerm}
            size="lg"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Form>
      </Row>
      {/* Metadata column - displays number of active projects */}
      <Row className="p-3 order-1 order-lg-2">
        <Col xs={12} lg>
          <div className={styles.mobileHeader}>
            {menuButton}
            <div>
              <h2>My Projects</h2>
              <p>
                View and manage all your projects • 
                {searchTerm.trim()
                  ? ` ${filteredProjects.length} matching project${filteredProjects.length !== 1 ? "s" : ""}`
                  : ` ${numProjects} active project${numProjects !== 1 ? "s" : ""}`}
                  </p>
            </div>
          </div>
        </Col>
        
        {/* Action buttons - sort by and New Project */}
        <Col xs={12} lg="auto" id={styles["dashboard-buttons"]}>
          <div className={styles.sortDropdown}>
            <Dropdown>
              <Dropdown.Toggle id={styles["sort-by"]} size="lg">
                <ArrowUpDown size={16} className="me-1" /> Sort by
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setSortBy("recent")} active={sortBy === "recent"}>
                  Recently Edited
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
          <Button id={styles["new-project"]} 
                  size="lg"
                  onClick={handleNewProject}>
            + New Project
          </Button>
        </Col>
      </Row>
      {/* Rendering parsed project information for user */}
      <Row className="p-3 gap-3 justify-content-evenly justify-content-md-start order-3">
        {filteredProjects.map((project) => {
          const currentUserId = currentUser?.uid;
          const canDelete = project.owner === currentUserId; //verify user priveleges

          return (
            <ProjectCard 
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
              canDelete={canDelete}
              onDelete={handleDeleteProject}
            />
          );
        })}
      </Row>
    </div>
  );
}

export default MyProjects;