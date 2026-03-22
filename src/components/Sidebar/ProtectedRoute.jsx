import { Navigate } from "react-router-dom";
import { useAuth } from "../../firebase/AuthContext";

function ProtectedRoute({ children }) {
    const { currentUser, authLoading } = useAuth();

    if (authLoading) return <div>Loading...</div>;
    if (!currentUser) return <Navigate to="/login" replace />

    return children;
}

export default ProtectedRoute;