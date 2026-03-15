import { useState, useEffect, useRef } from "react";
import { Row, Col, Card, Form, Button, Dropdown } from "react-bootstrap";
import emailIcon from "../../assets/email-icon.png";
import avatarimg from "../../assets/avatar.png";
import testavatarimg from "../../assets/test-avatar.png";
import styles from "./ProfilePage.module.css";



function ProfilePage() {

    const dummyUserData = {
        avatar:avatarimg,
        testavatar:testavatarimg,
        firstName: "John",
        lastName: "Doe",
        email: "john@nexus.com",
        phone: "(978) 000-0000",
        jobTitle: "Project Manager",
        department: "Product",
        monthsActive: 8,
        numProjects: 4
    };

    const [user, setUser] = useState(dummyUserData);
    const [isEditing, setIsEditing] = useState(false);
    const [tempUser, setTempUser] = useState(user);

    const handleEdit = () => {
      setTempUser(user);
      setIsEditing(true);  
    };

    const handleSave = () => {
        setUser(tempUser);
        setIsEditing(false);
    }

    const handleCancel = () => {
        setIsEditing(false);
    }

    const isDataChanged =  JSON.stringify(user) !== JSON.stringify(tempUser);

    const [accentColor, setAccentColor] = useState('#000000');
    const imgRef = useRef(null);

    const getAccentColor = (imgElement) => {
        if (!imgElement) return '#000000';

        try{        
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = imgElement.naturalWidth || imgElement.width;
            canvas.height = imgElement.naturalHeight || imgElement.height;
            context.drawImage(imgElement, 0, 0);

            const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
            let r = 0, g = 0, b= 0;
            let count = 0;

            for (let i = 0; i <data.length; i += 40) {
                const pr = data[i];
                const pg = data[i+1];
                const pb = data[i+2];

                if (pr > 220 && pg > 220 && pb > 220) continue;

                if (pr < 30 && pg < 30 && pb < 30) continue;

                r += pr;
                g += pg;
                b += pb;
                count++;
            }
            
            if (count === 0) return '#000000';

            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);

            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

        } catch(e) {
            console.error("Color extraction failed:", e);
            return '#000000';
        }
    };

    const handleImageLoad = () => {
        if (imgRef.current) {
            const color = getAccentColor(imgRef.current);
            setAccentColor(color);
        }
    };

    return(
        <>
            {/*Profile Header*/}
            <Row className = "mb-4">
                <Col>
                    <Card className = "p-4 shadow-sm rounded-4">
                        <div className = "d-flex justify-content-between align-items-center">
                            <div className = "d-flex align-items-center">
                                <div className={styles["avatar-size"]}>
                                    <img 
                                    ref = {imgRef}
                                    src = {user.testavatar}
                                    onLoad = {handleImageLoad} 
                                    alt = "Test-Avatar" 
                                    //crossOrigin="anonymous" for non-local images
                                    className = {styles["avatar-img-size"]}
                                    /*style = {{ width: '100%', height: '100%', objectFit: 'cover' }}*/ />
                                </div>
                                <div>
                                    <h3 className = "fw-bold">{user.firstName} {user.lastName}</h3>
                                    <p className = "text-muted mb-0">{user.jobTitle}</p>
                                    <span className = "d-flex align-items-center">
                                        <img src={emailIcon} alt="Email Icon" className = {styles["email-img-size"]}></img>
                                        <p className = {styles["user-email"]}>{user.email}</p>
                                    </span>
                                </div>
                            </div>
                            <Button variant = "outline-danger" className = {styles["sign-out"]}>Sign Out</Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/*Personal Information Card*/}
            <Row className = "mb-4">
                <Col>
                    <Card className = "p-4 shadow-sm rounded-4">
                        <div className = "d-flex justify-content-between align-items-center mb-4">
                            <h4 className = "fw-bold mb-0">Personal Information</h4>

                            { 
                                !isEditing ? 
                                ( <Button variant = "light" className = "shadow-sm px-4" onClick = {handleEdit}>Edit Profile</Button> 
                                ) : ( 
                                <div className = "d-flex gap-2">
                                    
                                    { isDataChanged && <Button variant = "success" className = "px-4" onClick = {handleSave}>Save</Button> }
                                    <Button variant = "outline-secondary" className = "px-4" onClick = {handleCancel}>Cancel</Button>
                                </div>
                                )
                            }
                        </div>

                        <Row>
                            {/*First Name*/}
                            <Col md={6} className = "mb-3 text-start">
                            <label className = {styles["column-text"]}>First Name</label>
                            {
                                isEditing ?
                                (
                                    <input
                                        className = "form-control bg-light"
                                        value = {tempUser.firstName}
                                        onChange = {(e) => setTempUser({...tempUser, firstName: e.target.value})}
                                    />
                                ) : (
                                    <div className = "p-2 bg-light rounded border-0 text-muted">{user.firstName}</div>
                                )
                            }
                            </Col>

                            {/*Last Name*/}
                            <Col md={6} className = "mb-3 text-start">
                            <label className = {styles["column-text"]}>Last Name</label>
                            {
                                isEditing ?
                                (
                                    <input
                                        className = "form-control bg-light"
                                        value = {tempUser.lastName}
                                        onChange = {(e) => setTempUser({...tempUser, lastName: e.target.value})}
                                    />
                                ) : (
                                    <div className = "p-2 bg-light rounded border-0 text-muted">{user.lastName}</div>
                                )
                            }
                            </Col>
                        </Row>

                        <Row>
                            {/*Email*/}
                            <Col md={6} className = "mb-3 text-start">
                            <label className = {styles["column-text"]}>Email</label>
                            {
                                isEditing ?
                                (
                                    <input
                                        className = "form-control bg-light"
                                        value = {tempUser.email}
                                        onChange = {(e) => setTempUser({...tempUser, email: e.target.value})}
                                    />
                                ) : (
                                    <div className = "p-2 bg-light rounded border-0 text-muted">{user.email}</div>
                                )
                            }
                            </Col>

                            {/*Phone Number*/}
                            <Col md={6} className = "mb-3 text-start">
                            <label className = {styles["column-text"]}>Phone Number</label>
                            {
                                isEditing ?
                                (
                                    <input
                                        className = "form-control bg-light"
                                        value = {tempUser.phone}
                                        onChange = {(e) => setTempUser({...tempUser, phone: e.target.value})}
                                    />
                                ) : (
                                    <div className = "p-2 bg-light rounded border-0 text-muted">{user.phone}</div>
                                )
                            }
                            </Col>
                        </Row>

                        <Row>
                            {/*Job Title*/}
                            <Col md={6} className = "mb-3 text-start">
                            <label className = {styles["column-text"]}>Job Title</label>
                            {
                                isEditing ?
                                (
                                    <input
                                        className = "form-control bg-light"
                                        value = {tempUser.jobTitle}
                                        onChange = {(e) => setTempUser({...tempUser, jobTitle: e.target.value})}
                                    />
                                ) : (
                                    <div className = "p-2 bg-light rounded border-0 text-muted">{user.jobTitle}</div>
                                )
                            }
                            </Col>

                            {/*Department*/}
                            <Col md={6} className = "mb-3 text-start">
                            <label className = {styles["column-text"]}>Department</label>
                            {
                                isEditing ?
                                (
                                    <input
                                        className = "form-control bg-light"
                                        value = {tempUser.department}
                                        onChange = {(e) => setTempUser({...tempUser, department: e.target.value})}
                                    />
                                ) : (
                                    <div className = "p-2 bg-light rounded border-0 text-muted">{user.department}</div>
                                )
                            }
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/*Stats*/}
            <Row className = "mb-4">
                <Col md={6}>
                    <Card className = "p-4 shadow-sm rounded-4 border-1 h-100">
                        <div className = "text-center">
                            <label className = {styles["stats-text"]}>Projects</label>
                            <div className="border-top" style={{ height: '1px', marginLeft: '-1.5rem', marginRight: '-1.5rem' }}></div>
                            <h3 className = "display-4 fw-bold mb-0" style={{ color: accentColor, transition: 'color 0.4s ease' }}>{user.numProjects}</h3>
                        </div>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className = "p-4 shadow-sm rounded-4 border-1 h-100">
                        <div className = "text-center">
                            <label className = {styles["stats-text"]}>Months Active</label>
                            <div className="border-top" style={{ height: '1px', marginLeft: '-1.5rem', marginRight: '-1.5rem' }}></div>
                            <h3 className = "display-4 fw-bold mb-0" style={{ color: accentColor, transition: 'color 0.4s ease' }}>{user.monthsActive}</h3>
                        </div>
                    </Card>
                </Col>
            </Row>
        </>
    )
}

export default ProfilePage;