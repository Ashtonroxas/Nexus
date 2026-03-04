import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';
import styles from "./Sidebar.module.css";
import logo from "../../assets/nexus.png";

function Sidebar({ variant = "desktop", onNavigate }) {
  const { pathname } = useLocation();
  const { projectId} = useParams();

  const projectSidebar = pathname.startsWith("/projects/") && !!projectId;
  const wrapperStyling = variant === "desktop"
                    ? `${styles.sidebar} d-none d-lg-block p-3 h-100`
                    : `${styles.sidebar} p-3 h-100`

  const handleNav = () => {
    if (onNavigate) onNavigate();
  }

  return (
    <div className={wrapperStyling}>
      <div className= {`${styles.header} py-0 mt-0`} >
        <div className={styles.brand}>Nexus</div>
        <img src={logo} alt="Nexus Logo" width="47px" />
      </div>

      <hr className={styles.separator} />

      { projectSidebar ? (
        <> {/* Inside Project Menu */}
          <Link to="/projects" className={styles.backLink} onClick={handleNav}>
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
              onClick={handleNav}
            >
              Dependency Graph
            </NavLink>

            <NavLink
              to={`/projects/${projectId}/report`}
              className={({ isActive }) =>
                `${styles.navButton} ${isActive ? styles.active : ""}`
              }
              onClick={handleNav}
            >
              Risk Report
            </NavLink>

            <NavLink
              to={`/projects/${projectId}/team`}
              className={({ isActive }) => 
                `${styles.navButton} ${isActive ? styles.active : ""}`
              }
              onClick={handleNav}
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
              onClick={handleNav}
            >
              My Projects
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) => 
                `${styles.navButton} ${isActive ? styles.active : ""}`
              }
              onClick={handleNav}
            >
              Profile
            </NavLink>

          </nav>
        </>
      )}
    </div>
  );
}

export default Sidebar;