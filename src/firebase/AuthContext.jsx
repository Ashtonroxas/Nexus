import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    // Used to update user on status while waiting in case of auth delay
    const [authLoading, setAuthLoading] = useState(true); 

    // Store user and auth status
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        // Pass auth'd user and loading status to child components
        <AuthContext.Provider value={{ currentUser, authLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to return auth'd user and loading status
export function useAuth() {
    return useContext(AuthContext);
}
