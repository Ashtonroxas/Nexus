import { useState } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import { useOutletContext } from "react-router-dom";
import { Pencil, Mail } from "lucide-react";
import styles from "./ProfilePage.module.css";
import testavatarimg from "../../assets/test-avatar.png";

function ProfilePage() {
    const { menuButton } = useOutletContext();
    const initialUser = {
        testavatar: testavatarimg,
        firstName: "John",
        lastName: "Doe",
        email: "john@nexus.com",
        phone: "(978) 000-0000",
        jobTitle: "Project Manager",
        department: "Product",
        monthsActive: 8,
        numProjects: 4,
    };

    const [user, setUser] = useState(initialUser);
    const [tempUser, setTempUser] = useState(initialUser);
    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = () => {
        setTempUser(user);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setTempUser(user);
        setIsEditing(false);
    };

    const handleSave = () => {
        setUser(tempUser);
        setIsEditing(false);
    };

    const isDataChanged = JSON.stringify(user) !== JSON.stringify(tempUser);
    const handleFieldChange = (field, value) => {
        setTempUser((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const profileFields = [
        { label: "First Name", key: "firstName"},
        { label: "Last Name", key: "lastName"},
        { label: "Email", key: "email"},
        { label: "Phone Number", key: "phone"},
        { label: "Job Title", key: "jobTitle"},
        { label: "Department", key: "department"},
    ];

    return (
        <div className={styles.page}>
            <div className={styles.mobileRow}>
                {menuButton}
                <Button variant="link" className={styles.mobileSignOut}>
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
                                        src={user.testavatar}
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
                            
                            <Button variant="link" className={styles.desktopSignOut}>
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
                                            onChange={(e) => handleFieldChange(field.key, e.target.value)} />
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
