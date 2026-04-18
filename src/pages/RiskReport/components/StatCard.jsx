import { Info } from "lucide-react";
import styles from "../RiskReport.module.css";

function StatCard({ title, value, valueClassName = "", tooltip, className = "" }) {
  return ( 
  <>
    {/** Card label */}
    <div className={className || styles.statCard}>
      <div className={styles.statTitle}>
        {title}

        {/** Tool tip to explain slack/zero slack labeling from usability and HE reports */}
        {tooltip && (
          <span className={styles.infoWrapper}>
            <Info size={14} className={styles.infoIcon} />
            <span className={styles.tooltip}>{tooltip}</span>
          </span>
        )}
      </div>

      
      <div className={`${styles.statValue} ${valueClassName}`}>
        {value}
      </div>
    </div>
  </>
  );
}

export default StatCard;