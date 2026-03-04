import { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import { Container, Row, Col, Offcanvas, Button } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import styles from "./NexusLayout.module.css";

function NexusLayout() {
  const [showSidebar, setShowSidebar ] = useState(false);

  return (
    <Container fluid className="px-0">
      <div className="d-lg-none p-2">
        <Button
          variant="light"
          onClick={() => setShowSidebar(true)}
          className={styles.hamburger}
        >
          <Menu size={28} color="#6366F1" />
        </Button>
      </div>

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

      {/* Desktop Sidebar */}
      {/* <Row className="min-vh-100 g-0 flex-nowrap">
        <Col lg={2} className="p-0 d-none d-lg-block">
          <Sidebar variant="desktop" />
        </Col>
        <Col className={`${styles.content} p-3`}>
          <Outlet />
        </Col>
      </Row> */}

      <div className={styles.cont}>
        <aside className={styles.sidebarColumn}>
          <Sidebar variant="desktop" />
        </aside>

        <main className={`${styles.contentColumn} p-3`}>
          <Outlet />
        </main>
      </div>

    </Container>
  );
}

export default NexusLayout;