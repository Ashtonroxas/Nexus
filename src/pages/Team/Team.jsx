import { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom"; 
import { useAuth } from "../../firebase/AuthContext";
import { 
  collection,
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove,
  getDocs,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import styles from './Team.module.css';
import AddModal from "./components/AddModal/AddModal.jsx";
import TeamMenu from "../../components/TeamMenu/TeamMenu.jsx";

//Import the activity logger
import { logActivity } from "../../utils/activityLogger";

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
  const { menuButton } = useOutletContext();

  const [members, setMembers] = useState([]);
  const [projectName, setProjectName] = useState("Loading...");

  // State for Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);

  const [suggestions, setSuggestions] = useState([]);

  // Handlers for Add Member Modal
  const handleCloseAddModal = () => setShowAddModal(false);
  const handleShowAddModal = () => setShowAddModal(true);

  // Invite Team Member
  const handleConfirmAdd = async ({ email, role }) => {
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) return;

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", cleanedEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const user = {
        uid: userDoc.id,
        ...userData,
      };

      await setDoc(doc(db, "projects", projectId, "members", user.uid), {
        role: role,
      });

      await updateDoc(doc(db, "projects", projectId), {
        memberIds: arrayUnion(user.uid),
      });

      //Trigger the activity logger for the invite
      console.log('About to log invite activity...');
      await logActivity(projectId, 'invite', {
        senderName: currentUser.displayName || "A team member",
        projectName: projectName !== "Loading..." ? projectName : "Nexus Project",
        invitedUserId: user.uid, // Sends to the specific invited user
        status: 'pending' // Gives them the Accept/Decline buttons
      });
      console.log('Invite activity logged!');

      // Write docs of previously invited member history
      await setDoc(doc(db, "users", currentUser.uid, "inviteHistory", user.uid),
        {
          uid: user.uid,
          displayName: user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User",
          email: user.email || cleanedEmail,
          imgURL: user.imgURL || "",
          lastInteractedAt: serverTimestamp(),
        },
        { merge: true }
    );

      handleCloseAddModal();
    } catch (error) {
      console.error("Error adding member: ", error);
      alert("Failed to add team member.");
    }
  };

  // Remove Team Member
  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        // Delete the user from the projects/{projectId}/members collection
        await deleteDoc(doc(db, "projects", projectId, "members", memberId));

        // Remove their ID from the project's memberIds array so it hides from their dashboard
        await updateDoc(doc(db, "projects", projectId), {
          memberIds: arrayRemove(memberId)
        });

      } catch (error) {
        console.error("Error removing member: ", error);
        alert("Failed to remove member.");
      }
    }
  };

  // Change Role
  const handleChangeRole = async (memberId, currentRole) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await updateDoc(doc(db, "projects", projectId, "members", memberId), {
          role: newRole
        });
      } catch (error) {
        console.error("Error updating role: ", error);
        alert("Failed to update role.");
      }
    }
  };
    
  // derive the current user's role from the members list
  const currentUserRole = members.find((m) => m.userId === currentUser?.uid)?.role ?? "member";

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

      const roleOrder = { owner: 0, admin: 1, member: 2 };
      memberDetails.sort((a, b) => {
        const roleDiff = (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
        if (roleDiff !== 0) return roleDiff;
        return a.displayName.localeCompare(b.displayName);
      });

      setMembers(memberDetails);
    });

    return () => unsubscribe();
  }, [projectId, currentUser]);

  // Loading history of interacted with users for suggestions
  useEffect(() => {
    if (!currentUser?.uid) return;

    const historyRef = collection(db, "users", currentUser.uid, "inviteHistory");
    const historyQuery = query(historyRef, orderBy("lastInteractedAt", "desc"), limit(6));

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const history = snapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data(),
      }));

      setSuggestions(history);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className={styles.contentContainer}>
      
      {/* Mobile Top Bar (Hamburger + Breadcrumbs) */}
      <div className={styles.mobileTopBar}>
        {menuButton}
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
        
        {/* ONLY show the Add Member button to owners and admins */}
        {(currentUserRole === "owner" || currentUserRole === "admin") && (
          <button className={styles.addBtn} onClick={handleShowAddModal}>
            + Add Member
          </button>
        )}
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
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    {isYou && <span className={`${styles.badge} ${styles.youBadge}`}>You</span>}
                  </div>
                  
                  <div className={`${styles.colEmail} ${styles.emailText}`}>
                    {member.email}
                  </div>

                  <div className={styles.colActions}>
                    <TeamMenu
                      memberId={member.userId}
                      memberEmail={member.email}
                      memberRole={member.role}
                      currentUserRole={currentUserRole}
                      isYou={isYou}
                      onRemove={() => handleRemoveMember(member.userId)}
                      onChangeRole={() => handleChangeRole(member.userId, member.role)}
                    />
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
        cancelText="Cancel"
        suggestions={suggestions.filter(
          (suggestion) => !members.some((member) => member.userId === suggestion.uid)
        )}
      />
    </div>
  );
}

export default Team;