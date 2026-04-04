import React, { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom"; 
import { useAuth } from "../../firebase/AuthContext";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Menu } from "lucide-react"; 
import styles from './Team.module.css';
import AddModal from "../../components/AddModal/AddModal";
import TeamMenu from "../../components/TeamMenu/TeamMenu.jsx";

// Helper to generate initials from a display name
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// Helper to assign a color based on name
const getAvatarColor = (name) => {
  const colors = ['#91B7ED', '#A7F3D0', '#FCD34D', '#FCA5A5', '#C4B5FD'];
  if (!name) return colors[0];
  const charCode = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
  return colors[charCode % colors.length];
};

function Team() {
  const { projectId } = useParams();
  const { currentUser } = useAuth();

  // State for Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Handlers for Add Member Modal
  const handleCloseAddModal = () => setShowAddModal(false);
  const handleShowAddModal = () => setShowAddModal(true);

  // Placeholder confirm handler for adding a member
  const handleConfirmAdd = async ({ nameOrEmail, role }) => {
    if (!nameOrEmail) return;

    handleCloseAddModal();
  };
  
  // Grab the toggle function from the Layout context
  const { toggleSidebar } = useOutletContext();
  
  const [members, setMembers] = useState([]);
  const [projectName, setProjectName] = useState("Loading...");

  // Fetch project name for the breadcrumb
  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = onSnapshot(doc(db, "projects", projectId), (docSnap) => {
      if (docSnap.exists()) {
        setProjectName(docSnap.data().name || "Untitled Project");
      }
    });
    return () => unsubscribe();
  }, [projectId]);

  // Fetch members from Firestore
  useEffect(() => {
    if (!currentUser || !projectId) return;

    const membersRef = collection(db, "projects", projectId, "members");

    const unsubscribe = onSnapshot(membersRef, async (snapshot) => {
      const memberDocs = snapshot.docs.map((doc) => ({
        userId: doc.id,
        role: doc.data().role,
      }));

      const memberDetails = await Promise.all(
        memberDocs.map(async ({ userId, role }) => {
          const userSnap = await getDoc(doc(db, "users", userId));
          const userData = userSnap.exists() ? userSnap.data() : {};
          return {
            userId,
            role,
            displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || "Unknown User",
            email: userData.email || "",
            jobTitle: userData.jobTitle || "Team Member",
          };
        })
      );

      setMembers(memberDetails);
    });

    return () => unsubscribe();
  }, [projectId, currentUser]);

  return (
    <div className={styles.contentContainer}>
      
      {/* Mobile Top Bar (Hamburger + Breadcrumbs) */}
      <div className={styles.mobileTopBar}>
        <button className={styles.menuToggle} onClick={toggleSidebar} aria-label="Open Menu">
          <Menu size={28} color="#6366F1" strokeWidth={2} />
        </button>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbMuted}>Projects / </span>
          <span className={styles.breadcrumbActive}>{projectName}</span>
        </div>
      </div>

      <hr className={styles.mobileDivider} />

      {/* Page Title & Add Button */}
      <header className={styles.teamHeader}>
        <div className={styles.titleSection}>
          <h2 className={styles.pageTitle}>Team</h2>
          <p className={styles.pageSubtitle}>Manage members and roles for this project</p>
        </div>
        
        <button className={styles.addBtn} onClick={handleShowAddModal}>
          + Add Member
        </button>
      </header>

      {/* The White Card Container */}
      <div className={styles.tableCard}>
        <h3 className={styles.cardTitle}>Member</h3>

        {/* Scrollable Wrapper for the table */}
        <div className={styles.tableScrollWrapper}>
          <div className={styles.tableHeader}>
            <div className={styles.colMember}>Member</div>
            <div className={styles.colRole}>Role</div>
            <div className={styles.colEmail}>Email</div>
            <div className={styles.colActions}></div> 
          </div>

          <div className={styles.tableBody}>
            {members.map((member) => {
              const isYou = currentUser?.uid === member.userId;
              
              return (
                <div className={styles.tableRow} key={member.userId}>
                  <div className={`${styles.colMember} ${styles.memberInfo}`}>
                    <div 
                      className={styles.avatar} 
                      style={{ backgroundColor: getAvatarColor(member.displayName) }}
                    >
                      {getInitials(member.displayName)}
                    </div>
                    <div className={styles.memberDetails}>
                      <span className={styles.memberName}>{member.displayName}</span>
                      <span className={styles.memberTitle}>{member.jobTitle}</span>
                    </div>
                  </div>
                  
                  <div className={`${styles.colRole} ${styles.roleInfo}`}>
                    <span className={`${styles.badge} ${styles.roleBadge}`}>
                      {member.role.toLowerCase() === 'owner' 
                        ? 'Admin' 
                        : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    {isYou && <span className={`${styles.badge} ${styles.youBadge}`}>You</span>}
                  </div>
                  
                  <div className={`${styles.colEmail} ${styles.emailText}`}>
                    {member.email}
                  </div>

                  <div className={styles.colActions}>
                    <TeamMenu memberEmail={member.email} />
                  </div>
                </div>
              );
            })}
            
            {members.length === 0 && (
              <div className={styles.emptyState}>No members found in this project.</div>
            )}
          </div>
        </div>
      </div>
      <AddModal
        show={showAddModal}
        onHide={handleCloseAddModal}
        onConfirm={handleConfirmAdd}
        title="Add Member"
        confirmText="Send Invite"
        cancelText="Cancel"/>
    </div>
  );
}

export default Team;