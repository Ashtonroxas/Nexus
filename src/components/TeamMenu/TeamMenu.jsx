import { useState, useRef, useEffect } from "react";
import { Mail, UserCheck, UserMinus } from "lucide-react";
import styles from '../../pages/Team/Team.module.css';

const TeamMenu = ({ memberEmail }) => {
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

    // Change alerts after figuring out how to work with firebase
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
                {/* Email */}
                <div className={styles.menuItem}>
                    <Mail size={16} className={styles.menuIcon} />
                        <span>{memberEmail}</span>
                </div>
                {/* Change Role */}
                <div className={styles.menuItem} onClick={() => alert("Change Role Clicked")}>
                    <UserCheck size={16} className={styles.menuIcon} />
                    <span>Change role</span>
                </div>
                {/* Remove Member */}
                <div className={`${styles.menuItem} ${styles.removeText}`} onClick={() => alert("Remove Member Clicked")}>
                    <UserMinus size={16} className={styles.menuIcon} />
                    <span>Remove Member</span>
                </div>
            </div>
        )}
    </div>
  );
};

export default TeamMenu;