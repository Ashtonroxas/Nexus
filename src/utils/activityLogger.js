import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const logActivity = async (projectId, type, details) => {
  try {
    let visibleTo = [];

    //If it's an invite, only show it to the person being invited
    if (type === 'invite' && details.invitedUserId) {
      visibleTo = [details.invitedUserId];
      console.log('Logging INVITE activity:', {
        projectId,
        invitedUserId: details.invitedUserId,
        visibleTo,
        senderName: details.senderName,
        projectName: details.projectName
      });
    } else {
      //tasks/deadlines, fetch all current members in the project
      const membersRef = collection(db, `projects/${projectId}/members`);
      const membersSnap = await getDocs(membersRef);
      visibleTo = membersSnap.docs.map(doc => doc.id);
      console.log('Logging activity (visible to members):', {
        projectId,
        type,
        visibleToCount: visibleTo.length,
        visibleTo
      });
    }

    // Log the activity to the project's subcollection
    const activitiesRef = collection(db, `projects/${projectId}/activities`);
    
    const activityDoc = await addDoc(activitiesRef, {
      type: type,
      visibleTo: visibleTo,
      senderName: details.senderName || 'System',
      projectName: details.projectName || 'Project',
      taskCode: details.taskCode || '',
      status: details.status || null,
      read: false,
      timestamp: serverTimestamp()
    });
    
    console.log('Activity logged successfully:', {
      docId: activityDoc.id,
      type,
      visibleTo
    });
    
  } catch (error) {
    console.error("Error logging activity: ", error);
  }
};