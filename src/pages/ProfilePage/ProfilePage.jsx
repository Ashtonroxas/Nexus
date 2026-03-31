import { useEffect, useState } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import { useOutletContext } from "react-router-dom";
import { Pencil, Mail } from "lucide-react";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { useAuth } from "../../firebase/AuthContext";
import defaultimage from "../../assets/default-img.png";
import styles from "./ProfilePage.module.css";

function ProfilePage() {
  const { menuButton } = useOutletContext();
  const { currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [tempUser, setTempUser] = useState(null); //draft

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const getMonthsActive = (createdAt) => {
    if (!createdAt) return 0;

    const createdDate = createdAt.toDate ? createdAt.toDate() : createdAt;
    const now = new Date();

    let months =
      (now.getFullYear() - createdDate.getFullYear()) * 12 +
      (now.getMonth() - createdDate.getMonth()) + 1; // at least one to avoid 0 months

    return Math.max(months, 0);
  }

  // Loading user information and parsing JSON for website usage
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
          console.error("User not found");
          setLoading(false);
          return;
        }

        const data = userSnapshot.data();

        // Load user's project for number status - live firestore snapshot
        const projectsQ = query(collection(db, "projects"),
          where("ownerId", "==", currentUser.uid));
        const projectsSnapshot = await getDocs(projectsQ);

        const userInfo = {
          img: data.imgURL || defaultimage,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || currentUser.email || "",
          phone: data.phone || "",
          jobTitle: data.jobTitle || "",
          department: data.department || "",
          monthsActive: getMonthsActive(data.createdAt),
          numProjects: projectsSnapshot.size,
        };

        setUser(userInfo);
        setTempUser(userInfo);
      } catch (error) {
        console.error("Error loading profile: ", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const handleEdit = () => {
    setTempUser(user);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempUser(user);
    setIsEditing(false);
  };

  // Saving information changes updates user state with temporary state and updates firestore
  // with the permanent changes
  const handleSave = async () => {
    if (!currentUser || !tempUser) return;

    try {
      const updatedProfile = {
        firstName: tempUser.firstName,
        lastName: tempUser.lastName,
        displayName: `${tempUser.firstName} ${tempUser.lastName}`.trim(),
        email: tempUser.email,
        phone: tempUser.phone,
        jobTitle: tempUser.jobTitle,
        department: tempUser.department,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "users", currentUser.uid), updatedProfile);
      setUser(tempUser);
      setIsEditing(false); // system status display (may take longer than a few seconds)
    } catch (error) {
      console.error("Error saving profile: ", error);
    }
  };

  const handleSignout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Handling moment user begins typing
  const isDataChanged = JSON.stringify(user) !== JSON.stringify(tempUser);
  const handleFieldChange = (field, value) => {
    setTempUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const profileFields = [
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Job Title", key: "jobTitle" },
    { label: "Department", key: "department" },
  ];

  if (loading || !user || !tempUser) {
    return <div className="p-4">Loading profile...</div>;
  }

  return (
    <div className={styles.page}>
      {/* Mobile screen header - includes menu and sign out */}
      <div className={`${styles.mobileRow} d-flex d-lg-none`}>
        {menuButton}
        <Button variant="link"
          className={styles.mobileSignOut}
          onClick={handleSignout}>
          Sign Out
        </Button>
      </div>

      {/* Top user information header - contains profile picture, image, job desc */}
      <Row className="g-4">
        <Col xs={12}>
          <Card className={styles.profileCard}>
            <div className={styles.profileInner}>
              <div className={styles.profileInfo}>
                <div className={styles.profileIconWrapper}>
                  <img
                    src={user.img}
                    alt="Profile avatar"
                    className={styles.profileImage}
                  />
                </div>

                <div className={styles.textFields}>
                  <h2 className={styles.userName}>
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className={styles.userRole}>{user.jobTitle}</p>

                  <div className={styles.emailRow}>
                    <Mail size={18} className={styles.emailIcon} />
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Sign out button appears in the title header on mobile */}
              <Button variant="link"
                className={`${styles.desktopSignOut} d-none d-lg-inline`}
                onClick={handleSignout}>
                Sign Out
              </Button>
            </div>
          </Card>
        </Col>

        {/* Viewable/Editable user information sections */}
        <Col xs={12}>
          <Card className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>

              {!isEditing ? ( // When not editing, displays edit button,
                              // applies proper css styles for darker field inputs to indicate permanence
                <Button
                  variant="light"
                  onClick={handleEdit}
                  className={styles.editButton}>
                  <span className="d-none d-md-inline"> Edit Profile </span>
                  <Pencil size={18} className="d-md-none" />
                </Button>
              ) : ( // If editing, displays cancel button and if any change is detected, renders save button
                    // applies proper css styles for lighter field inputs to indicate editability
                <div className={styles.editActions}>
                  {isDataChanged && (
                    <Button
                      variant="success"
                      onClick={handleSave}
                      className={styles.actionButton}
                    >
                      Save
                    </Button>
                  )}
                  <Button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    className={styles.actionButton}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            {/* Generating field inputs */}
            <div className={styles.fieldsGrid}>
              {profileFields.map((field) => (
                <div key={field.key} className={styles.fieldBlock}>
                  <label className={styles.fieldLabel}>{field.label}</label>

                  {/* Attaching proper handler for editing status */}
                  {isEditing ? (
                    <input className={styles.fieldInput}
                      value={tempUser[field.key]}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      disabled={field.key === "email"} />
                  ) : (
                    <div className={styles.fieldValue}>{user[field.key]}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Single row on mobile, 2 row on larger screens (md bootstrap breakpoint) */}
        <Col xs={12} md={6}>
          <Card className={styles.statCard}>
            <div className={styles.statTitle}>Projects</div>
            <div className={styles.statDivider} />
            <div className={styles.statValue}>{user.numProjects}</div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className={styles.statCard}>
            <div className={styles.statTitle}>Months Active</div>
            <div className={styles.statDivider} />
            <div className={styles.statValue}>{user.monthsActive}</div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProfilePage;
