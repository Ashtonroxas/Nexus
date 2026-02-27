import Sidebar from "../../components/Sidebar";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./MyProjects.module.css";

function MyProjects() {
  return (
    <Container fluid>
      <Row>
        <Sidebar />
        <Col lg={10} md={9} className={styles.dashboard}>
          <h1>My Projects</h1>
        </Col>
      </Row>
    </Container>
  );
}

export default MyProjects;