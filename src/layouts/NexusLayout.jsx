import Sidebar from "../components/Sidebar/Sidebar";
import { Container, Row, Col } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import styles from "./NexusLayout.module.css";

function NexusLayout() {
  return (
    <Container fluid className="px-0">
      <Row className="min-vh-100 g-0 flex-nowrap">
        <Sidebar />
        <Col className={`${styles.content} p-3`}>
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}

export default NexusLayout;