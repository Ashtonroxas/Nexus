import { Col, Nav } from "react-bootstrap";
import { Link ,NavLink, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';
import styles from "./Sidebar.module.css";
import logo from "../../assets/nexus.png";

function Sidebar() {
  const { pathname } = useLocation();
  const { projectId} = useParams();

  const projectSidebar = pathname.startsWith("/projects/") && !!projectId;

  return (
    <Col lg={2} sm={3} className={`${styles.sidebar} d-none d-md-block p-3 h-100`}>
      <div className= {`${styles.header} py-0 mt-0`} >
        <div className={styles.brand}>Nexus</div>
        <img src={logo} alt="Nexus Logo" width="47px" />
      </div>

      <hr className={styles.separator} />

      { projectSidebar ? (
        <> {/* Inside Project Menu */}
          <Link to="/projects" className={styles.backLink}>
            <ArrowLeft size={18} />
            Back to My Projects
          </Link>

          <div className={styles.sectionTitle}> Project Dashboard </div>

          <hr className={styles.separator} />

          <nav className={styles.nav}>
            <NavLink
              to={`/projects/${projectId}`} end
              className={({ isActive }) =>
                `${styles.navButton} ${isActive ? styles.active : ""}`
              }
            >
              Dependency Graph
            </NavLink>

            <NavLink
              to={`/projects/${projectId}/report`}
              className={({ isActive }) =>
                `${styles.navButton} ${isActive ? styles.active : ""}`
              }
            >
              Risk Report
            </NavLink>

            <NavLink
              to={`/projects/${projectId}/team`}
              className={({ isActive }) => 
                `${styles.navButton} ${isActive ? styles.active : ""}`
              }
            >
              Team
            </NavLink>
          </nav>
        </>
      ) : (
        <> {/* General Menu */}
          <nav className={styles.nav}>
            <NavLink
              to="/projects"
              className={({ isActive }) => 
                `${styles.navButton} ${isActive ? styles.active : ""}`
              }
            >
              My Projects
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) => 
                `${styles.navButton} ${isActive ? styles.active : ""}`
              }
            >
              Profile
            </NavLink>

          </nav>
        </>
      )
      }
    </Col>
  );
}

export default Sidebar;