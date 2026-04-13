import { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import { Container, Offcanvas, Button } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import styles from "./NexusLayout.module.css";

function NexusLayout() {
  const [showSidebar, setShowSidebar ] = useState(false);

  const menuButton = (
    <Button
      variant="light"
      onClick={() => setShowSidebar(true)}
      className={`${styles.hamburger} d-lg-none`}
    >
      <Menu size={28} color="#3b82f6" />
    </Button>
  );

  return (
    <Container fluid className="px-0">
      {/* Mobile Sidebar */}
      <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        placement="start"
        className={styles.offcanvas}
      >
        <Offcanvas.Body className="p-0">
          <Sidebar variant="mobile" onNavigate={() => setShowSidebar(false)} />
        </Offcanvas.Body>
      </Offcanvas>

      <div className={styles.cont}>
        <aside className={styles.sidebarColumn}>
          <Sidebar variant="desktop" />
        </aside>

        <main className={`${styles.contentColumn} p-3`}>
          <Outlet context={{ 
            menuButton, 
          }}/>
        </main>
      </div>

    </Container>
  );
}

export default NexusLayout;