import { useEffect, useState } from "react";
import DesktopTaskNode from "./DesktopTaskNode";
import MobileTaskNode from "./MobileTaskNode";

function TaskNode(props) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 992);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return isMobile 
            ? <MobileTaskNode {...props} /> 
            : <DesktopTaskNode {...props} />
}

export default TaskNode;