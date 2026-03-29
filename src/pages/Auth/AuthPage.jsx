import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button } from "react-bootstrap";
import styles from "./AuthPage.module.css";
import nexusLogo from "../../assets/nexus.png";
import { FcGoogle } from "react-icons/fc";

function AuthPage() {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ")[1] || "",
          displayName: user.displayName || "",
          email: user.email,
          phone: "",
          jobTitle: "",
          department: "",
          imgURL: user.photoURL || "",

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),

          isActive: true,
        });
      } else {
        await setDoc(userRef, {
          displayName: user.displayName || "",
          imgURL: user.photoURL || "",
        }, { merge: true });
      }

      navigate("/projects");
    } catch (error) {
      console.error("Google sign-in error: ", error);
    }
  };

  return (
    <Row className="vh-100 g-0">
      {/* Left panel */}
      <Col xs={12} lg={5} className="d-flex align-items-center justify-content-center p-5">
        <div className={styles.content}>
          <div className="d-flex align-items-center gap-2 mb-5">
            <img src={nexusLogo} alt="Nexus" width={32} height={32} style={{ objectFit: "contain" }} />
            <span className={styles.logoText}>Nexus</span>
          </div>

          <h1 className={styles.headline}>
            Project management powered by dependency graphs
          </h1>

          <p className="text-secondary mb-4">
            Visualize task dependencies, track progress in real time, and keep
            your team aligned — all in one intelligent workspace.
          </p>

          <Button className={`w-100 d-flex align-items-center justify-content-center gap-2 mb-3 ${styles.googleBtn}`} onClick={handleGoogleSignIn}>
            <FcGoogle size={20} />
            Sign in with Google
          </Button>

          <p className={styles.terms}>
            By signing in, you agree to our{" "}
            <a href="">Terms of Service</a> and{" "}
            <a href="">Privacy Policy</a>.
          </p>
        </div>
      </Col>

      {/* Right panel */}
      <Col lg={7} className={`d-none d-lg-flex align-items-center justify-content-center ${styles.rightPanel}`}>
        <img src="/preview.png" alt="Nexus app preview" className={styles.screenshot} />
      </Col>
    </Row>
  );
}

export default AuthPage;
