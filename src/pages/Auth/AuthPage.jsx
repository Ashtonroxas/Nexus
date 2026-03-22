import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";

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

                    profileCompleted: false,
                    isActive: true,
                });
            } else {
                await setDoc(userRef, {
                    lastLoginAt: serverTimestamp(),
                }, { merge: true });
            }

            navigate("/projects");
        } catch (error) {
            console.error("Google sign-in error: ", error);
        }
    };

    return (
        <div className="d-flex vh-100 justify-content-center align-items-center">
            <button
                onClick={handleGoogleSignIn}
                className="btn btn-lg btn-primary"
            >
                Sign in with Google
            </button>
        </div>
    );
}

export default AuthPage;
