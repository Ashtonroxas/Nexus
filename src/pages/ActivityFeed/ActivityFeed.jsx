import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, UserPlus, CheckCircle, Clock, X, Check } from 'lucide-react';
import styles from './ActivityFeed.module.css';

export default function ActivityFeed() {
  const { menuButton } = useOutletContext() || {};
  const [filter, setFilter] = useState('all');

  //Sample use
  const [notifications, setNotifications] = useState([
    {
      id: 'inv-1',
      type: 'invite',
      senderName: 'Angelos Boules',
      projectName: 'Nexus Mobile App',
      timestamp: '10 minutes ago',
      read: false,
      status: 'pending',
    },
    {
      id: 'act-1',
      type: 'task_completed',
      senderName: 'Antonio Hbaiter',
      taskCode: 'TASK-104',
      projectName: 'Frontend Redesign',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 'inv-2',
      type: 'invite',
      senderName: 'Brandon Bui',
      projectName: 'Q3 Marketing site',
      timestamp: '1 day ago',
      read: true,
      status: 'pending',
    },
    {
      id: 'act-2',
      type: 'bottleneck',
      senderName: 'System',
      taskCode: 'TASK-089',
      projectName: 'Backend API',
      timestamp: '2 days ago',
      read: true,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleInviteResponse = (id, response) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, status: response, read: true } : n
      )
    );
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'invite':
        return <div className={`${styles.iconWrapper} ${styles.iconInvite}`}><UserPlus size={18} /></div>;
      case 'task_completed':
        return <div className={`${styles.iconWrapper} ${styles.iconSuccess}`}><CheckCircle size={18} /></div>;
      case 'bottleneck':
        return <div className={`${styles.iconWrapper} ${styles.iconWarning}`}><Bell size={18} /></div>;
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
              onClick={() => {
                if (!notif.read) {
                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                }
              }}
            >
              {!notif.read && <div className={styles.unreadDot} />}
              
              <div className={styles.cardContent}>
                {renderIcon(notif.type)}
                
                <div className={styles.textStack}>
                  <div className={styles.mainText}>
                    {notif.type === 'invite' && (
                      <span><strong>{notif.senderName}</strong> invited you to join <strong>{notif.projectName}</strong></span>
                    )}
                    {notif.type === 'task_completed' && (
                      <span><strong>{notif.senderName}</strong> completed <strong>{notif.taskCode}</strong> in {notif.projectName}</span>
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
                        onClick={(e) => { e.stopPropagation(); handleInviteResponse(notif.id, 'accepted'); }}
                      >
                        <Check size={16} /> Accept
                      </button>
                      <button 
                        className={styles.declineBtn}
                        onClick={(e) => { e.stopPropagation(); handleInviteResponse(notif.id, 'declined'); }}
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