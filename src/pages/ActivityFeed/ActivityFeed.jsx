import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, UserPlus, CheckCircle, Clock, X, Check, PlusCircle, Trash2, CalendarClock } from 'lucide-react';
import { collectionGroup, query, where, orderBy, onSnapshot, updateDoc, writeBatch, doc, setDoc, collection, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../firebase/AuthContext';
import styles from './ActivityFeed.module.css';

export default function ActivityFeed() {
  const { menuButton } = useOutletContext() || {};
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth(); 

  useEffect(() => {
    if (!currentUser) return;

    // Fetches from EVERY 'activities' subcollection where the user's UID is in visibleTo
    const q = query(
      collectionGroup(db, 'activities'),
      where('visibleTo', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Activity Feed Query Results:', {
        userId: currentUser.uid,
        activitiesFound: snapshot.docs.length,
        activities: snapshot.docs.map(doc => ({
          id: doc.id,
          type: doc.data().type,
          visibleTo: doc.data().visibleTo,
          senderName: doc.data().senderName,
          projectName: doc.data().projectName
        }))
      });
      
      const fetchedNotifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ref: doc.ref, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString() || 'Just now'
      }));
      setNotifications(fetchedNotifs);
    }, (error) => {
      console.error('Activity Feed Query Error:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const markAllAsRead = async () => {
    if (!currentUser || unreadCount === 0) return;
    
    const batch = writeBatch(db);
    notifications.forEach((notif) => {
      if (!notif.read) {
        batch.update(notif.ref, { read: true });
      }
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleInviteResponse = async (notif, response) => {
    try {
      // Extract projectId from the notification ref path (projects/projectId/activities/docId)
      const projectId = notif.ref.path.split('/')[1];
      
      // Update the activity document with the response
      await updateDoc(notif.ref, { 
        status: response, 
        read: true 
      });

      // If accepted, add user to the project's members
      if (response === 'accepted') {
        // Add to members subcollection
        await setDoc(doc(db, "projects", projectId, "members", currentUser.uid), {
          userId: currentUser.uid,
          role: "member",
          joinedAt: new Date(),
        });

        // Add to memberIds array
        await updateDoc(doc(db, "projects", projectId), {
          memberIds: arrayUnion(currentUser.uid)
        });
      }
    } catch (error) {
      console.error("Error updating invite status:", error);
      alert("Failed to process invite response. Please try again.");
    }
  };

  const markAsRead = async (notif) => {
    if (notif.read) return; 
    try {
      await updateDoc(notif.ref, { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'invite':
        return <div className={`${styles.iconWrapper} ${styles.iconInvite}`}><UserPlus size={18} color="#3B82F6" /></div>;
      case 'task_completed':
        return <div className={`${styles.iconWrapper} ${styles.iconSuccess}`}><CheckCircle size={18} color="#10B981" /></div>;
      case 'task_created':
        return <div className={`${styles.iconWrapper}`} style={{ backgroundColor: '#E0F2FE', padding: '8px', borderRadius: '50%' }}><PlusCircle size={18} color="#0284C7" /></div>;
      case 'task_deleted':
        return <div className={`${styles.iconWrapper}`} style={{ backgroundColor: '#FEE2E2', padding: '8px', borderRadius: '50%' }}><Trash2 size={18} color="#EF4444" /></div>;
      case 'deadline':
        return <div className={`${styles.iconWrapper}`} style={{ backgroundColor: '#FFEDD5', padding: '8px', borderRadius: '50%' }}><CalendarClock size={18} color="#EA580C" /></div>;
      case 'bottleneck':
        return <div className={`${styles.iconWrapper} ${styles.iconWarning}`}><Bell size={18} color="#F59E0B" /></div>;
      default:
        return <div className={`${styles.iconWrapper} ${styles.iconDefault}`}><Bell size={18} /></div>;
    }
  };

  return (
    <div className={styles.feedContainer}>
      <div className={styles.feedHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.mobileMenuWrapper}>
            {menuButton}
          </div>
          <h1 className={styles.pageTitle}>Activity Feed</h1>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount} new</span>
          )}
        </div>
        
        <div className={styles.headerRight}>
          <button 
            className={styles.markReadBtn}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tab} ${filter === 'all' ? styles.activeTab : ''}`}
          onClick={() => setFilter('all')}
        >
          All Activity
        </button>
        <button 
          className={`${styles.tab} ${filter === 'unread' ? styles.activeTab : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
      </div>

      <div className={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={40} color="#9CA3AF" />
            <p>You're all caught up!</p>
            <span>No new notifications right now.</span>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`${styles.notificationCard} ${!notif.read ? styles.unreadCard : ''}`}
              onClick={() => markAsRead(notif)}
            >
              {!notif.read && <div className={styles.unreadDot} />}
              
              <div className={styles.cardContent}>
                {renderIcon(notif.type)}
                
                <div className={styles.textStack}>
                  <div className={styles.mainText}>
                    
                    {/* Render different text based on the activity type */}
                    {notif.type === 'invite' && (
                      <span><strong>{notif.senderName}</strong> invited you to join <strong>{notif.projectName}</strong></span>
                    )}
                    {notif.type === 'task_completed' && (
                      <span><strong>{notif.senderName}</strong> completed <strong>{notif.taskCode}</strong> in {notif.projectName}</span>
                    )}
                    {notif.type === 'task_created' && (
                      <span><strong>{notif.senderName}</strong> added a new task <strong>{notif.taskCode}</strong> to {notif.projectName}</span>
                    )}
                    {notif.type === 'task_deleted' && (
                      <span><strong>{notif.senderName}</strong> deleted task <strong>{notif.taskCode}</strong> from {notif.projectName}</span>
                    )}
                    {notif.type === 'deadline' && (
                      <span><strong>{notif.taskCode}</strong> in {notif.projectName} is approaching its deadline!</span>
                    )}
                    {notif.type === 'bottleneck' && (
                      <span><strong>{notif.taskCode}</strong> in {notif.projectName} has been marked as a bottleneck.</span>
                    )}

                  </div>
                  
                  <div className={styles.timeText}>
                    <Clock size={12} className={styles.clockIcon} />
                    {notif.timestamp}
                  </div>

                  {notif.type === 'invite' && notif.status === 'pending' && (
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.acceptBtn}
                        onClick={(e) => { e.stopPropagation(); handleInviteResponse(notif, 'accepted'); }}
                      >
                        <Check size={16} /> Accept
                      </button>
                      <button 
                        className={styles.declineBtn}
                        onClick={(e) => { e.stopPropagation(); handleInviteResponse(notif, 'declined'); }}
                      >
                        <X size={16} /> Decline
                      </button>
                    </div>
                  )}

                  {notif.type === 'invite' && notif.status === 'accepted' && (
                    <div className={styles.statusFeedbackAccepted}>You joined {notif.projectName}</div>
                  )}
                  {notif.type === 'invite' && notif.status === 'declined' && (
                    <div className={styles.statusFeedbackDeclined}>Invitation declined</div>
                  )}

                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}