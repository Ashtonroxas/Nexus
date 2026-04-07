import { useState, useRef, useEffect } from "react";
import { Mail, UserCheck, UserMinus } from "lucide-react";
import styles from '../../pages/Team/Team.module.css';

const TeamMenu = ({ memberId, memberEmail, memberRole, currentUserRole, isYou, onRemove, onChangeRole }) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };

    //Can change role: owners can change anyone below them. Admins can only change Members.
    const canChangeRole = !isYou && roleOrder[currentUserRole] < roleOrder[memberRole];
    
    //Can remove: only owners can remove members.
    const canRemove = !isYou && currentUserRole === "owner";

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close the menu if the user clicks anywhere outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);

    }, [isOpen]);

    return (

        <div className={styles.colActions} style={{ position: 'relative' }}>
            {/* "..." Button */}
            <button 
                className={styles.actionBtn} 
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Member actions"
            >
            ...
            </button>

        {isOpen && (
            <div className={styles.actionMenu} ref={menuRef}>
                <a className={styles.menuItem} href={`mailto:${memberEmail}`}>
                    <Mail size={16} className={styles.menuIcon} />
                    <span>{memberEmail}</span>
                </a>
                
                {canChangeRole && (
                    <div className={styles.menuItem} onClick={() => { setIsOpen(false); onChangeRole(); }}>
                        <UserCheck size={16} className={styles.menuIcon} />
                        <span>Change to {memberRole === 'admin' ? 'Member' : 'Admin'}</span>
                    </div>
                )}
                
                {canRemove && (
                    <div className={`${styles.menuItem} ${styles.removeText}`} onClick={() => { setIsOpen(false); onRemove(); }}>
                        <UserMinus size={16} className={styles.menuIcon} />
                        <span>Remove Member</span>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default TeamMenu;