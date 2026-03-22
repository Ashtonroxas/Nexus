import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ChevronUp, User, LogOut } from 'lucide-react';
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import styles from "./Sidebar.module.css";
import logo from "../../assets/nexus.png";
import testavatarimage from "../../assets/test-avatar.png";

function Sidebar({ variant = "desktop", onNavigate }) {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { pathname } = useLocation();
  const { projectId} = useParams();
  const accountRef = useRef(null);

  const projectSidebar = pathname.startsWith("/projects/") && !!projectId;
  const wrapperStyling = `${styles.sidebar} p-3 h-100`

  const handleLogout = async () => {
    await signOut(auth);
  }

  const handleNav = () => {
    if (onNavigate) onNavigate();
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className={wrapperStyling}>
      <div className={styles.sidebarMain}>
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

            <div className={styles.sectionTitle}>Project Dashboard</div>

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
            </nav>
          </>
        )}
      </div>
      <div className={styles.sidebarBottom} ref={accountRef}>
            <button 
              type="button"
              className={styles.accountButton}
              onClick={() => setShowAccountMenu((prev) => !prev)}
            >
              <div className={styles.accountInfo}>
                <img src={testavatarimage}
                  alt="Profile Image"
                  className={styles.accountImage} />
                <span className={styles.accountName}>John Doe</span>
              </div>

              <ChevronUp size={18}
                className={`${styles.accountChevron} ${
                  showAccountMenu ? styles.accountChevronOpen : ""
                }`}
                />
            </button>

            {showAccountMenu && (
              <div className={styles.accountMenu}>
                <NavLink
                  to="/profile"
                  className={styles.accountMenuItem}
                  onClick={() => {
                    setShowAccountMenu(false);
                    handleNav();
                  }}
                  >
                    <User size={16} />
                    My Profile
                </NavLink>

                <button 
                  type="button"
                  className={styles.accountMenuItem}
                  onClick={() => {
                    setShowAccountMenu(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
    </div>
  );
}

export default Sidebar;