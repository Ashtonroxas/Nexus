import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../firebase/AuthContext";
import { collection, onSnapshot, doc, getDoc, getDocs, query, where, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { Form, Button } from "react-bootstrap";

function Team() {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [addMember, setAddMember] = useState("");

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
            displayName: userData.displayName || "",
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            jobTitle: userData.jobTitle || "",
            department: userData.department || "",
            imgURL: userData.imgURL || "",
          };
        })
      );

      setMembers(memberDetails);
    });

    return () => unsubscribe();
  }, [projectId, currentUser]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMember.trim()) return;

    const usersQuery = query(collection(db, "users"), where("email", "==", addMember.trim()));
    const usersSnap = await getDocs(usersQuery);

    if (usersSnap.empty) {
      console.error("No user found with that email");
      return;
    }

    const userDoc = usersSnap.docs[0];
    await setDoc(doc(db, "projects", projectId, "members", userDoc.id), {
      userId: userDoc.id,
      role: "member",
    });

    setAddMember("");
  }

  return (
    <div>
        <h1>Members:</h1>
        {members.map(m => (
            <p key={m.userId}> - {m.displayName}</p>
        ))}
        <Form onSubmit={(e) => handleAddMember(e)}>
          <Form.Control
            type="search"
            placeholder="Email"
            value={addMember}
            size="lg"
            onChange={(e) => setAddMember(e.target.value)}
          />
          <Button type="submit">Add Member</Button>
        </Form>
    </div>
  );
}

export default Team;
