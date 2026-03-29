import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ChevronUp, User, LogOut, PanelLeftClose } from 'lucide-react';
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore"; 
import { useAuth } from "../../firebase/AuthContext";
import styles from "./Sidebar.module.css";
import logo from "../../assets/nexus.png";
import defaultimg from "../../assets/default-img.png";

function Sidebar({ variant = "desktop", onNavigate }) {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { pathname } = useLocation();
  const { projectId} = useParams();
  const { currentUser } = useAuth();
  const [sidebarUser, setSidebarUser] = useState({
    displayName: "User",
    imgURL: defaultimg,
  });
  const accountRef = useRef(null);
  const projectSidebar = pathname.startsWith("/projects/") && !!projectId;
  const wrapperStyling = `${styles.sidebar} p-3 h-100`

  useEffect(() => {
    const loadSidebarUser = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) return;

        const data = userSnapshot.data();

        setSidebarUser({
          displayName: data.displayName || currentUser.displayName || "User",
          imgURL: data.imgURL || defaultimg,
        });
      } catch (error) {
        console.error("Error loading sidebar user: ", error);
      }
    };

    loadSidebarUser();
  }, [currentUser]);

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
        
        {/* Updated Header Layout */}
        <div className={styles.header}>
          <Link to="/projects" className={styles.logoGroup} onClick={handleNav}>
            {/* Show logo on the left only for mobile */}
            {variant === "mobile" && (
              <img src={logo} alt="Nexus Logo" className={styles.logoImg} />
            )}
            <span className={styles.brand}>Nexus</span>
          </Link>
          
          {/* Show Logo on desktop right, or Collapse Icon on mobile right */}
          {variant === "desktop" ? (
            <Link to="/projects" className={styles.logoLink}>
              <img src={logo} alt="Nexus Logo" width="47px" />
            </Link>
          ) : (
            <button className={styles.collapseBtn} onClick={handleNav} aria-label="Close Menu">
              <PanelLeftClose size={24} color="#6B7280" />
            </button>
          )}
        </div>

        <hr className={styles.separator} />

        { projectSidebar ? (
          <> {/* Inside Project Menu */}
            <Link to="/projects" className={styles.backLink} onClick={handleNav}>
              <ArrowLeft size={22} strokeWidth={2.5} />
              Back to My Projects
            </Link>

            <div className={styles.sectionTitle}>Project Dashboard</div>

            <hr className={styles.separator} />

            <nav className={styles.nav}>
              <NavLink
                to={`/projects/${projectId}/report`}
                className={({ isActive }) =>
                  `${styles.navButton} ${isActive ? styles.active : ""}`
                }
                onClick={handleNav}
              >
                Overview
              </NavLink>

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
            <img src={sidebarUser.imgURL}
              alt="Profile Image"
              className={styles.accountImage} />
            <span className={styles.accountName}>{currentUser?.displayName || "User"}</span>
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