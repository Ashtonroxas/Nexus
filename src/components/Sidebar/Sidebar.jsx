import { Col } from "react-bootstrap";
import styles from "./Sidebar.module.css";

function Sidebar() {
  return (
    <Col lg={2} sm={3} className={`${styles.sidebar} d-none d-sm-block p-3`}>
      <h1>Nexus</h1>
    </Col>
  );
}

export default Sidebar;