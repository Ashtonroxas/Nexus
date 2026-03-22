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
import styles from "./ProfilePage.module.css";
import testavatarimg from "../../assets/test-avatar.png";

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
      (now.getMonth() - createdDate.getMonth());

    return Math.max(months, 0);
  }

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

        const projectsQ = query(collection(db, "projects"),
          where("ownerId", "==", currentUser.uid));
        const projectsSnapshot = await getDocs(projectsQ);

        const userInfo = {
          img: data.imgURL || testavatarimg,
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
      setIsEditing(false);
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
      <div className={`${styles.mobileRow} d-flex d-lg-none`}>
        {menuButton}
        <Button variant="link"
          className={styles.mobileSignOut}
          onClick={handleSignout}>
          Sign Out
        </Button>
      </div>

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

              <Button variant="link"
                className={`${styles.desktopSignOut} d-none d-lg-inline`}
                onClick={handleSignout}>
                Sign Out
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>

              {!isEditing ? (
                <Button
                  variant="light"
                  onClick={handleEdit}
                  className={styles.editButton}>
                  <span className="d-none d-md-inline"> Edit Profile </span>
                  <Pencil size={18} className="d-md-none" />
                </Button>
              ) : (
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

            <div className={styles.fieldsGrid}>
              {profileFields.map((field) => (
                <div key={field.key} className={styles.fieldBlock}>
                  <label className={styles.fieldLabel}>{field.label}</label>

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
