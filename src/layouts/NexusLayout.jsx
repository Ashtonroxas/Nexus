import Sidebar from "../components/Sidebar/Sidebar";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./NexusLayout.module.css";

function NexusLayout({ children }) {
  return (
    <Container fluid>
      <Row className="min-vh-100">
        <Sidebar />
        <Col lg={10} sm={9} className={`${styles.content} p-3`}>
          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default NexusLayout;