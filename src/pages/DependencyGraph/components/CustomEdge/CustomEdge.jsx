import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { X } from 'lucide-react';
import styles from './CustomEdge.module.css';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  //Calculate the path curve and the exact center coordinates (labelX, labelY)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  //Show the button if the user is hovering over the line OR if they clicked to select it
  const showButton = data?.isHovered || data?.isSelected;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      
      {/* Invisible thicker path overlay to make catching the mouse hover much easier */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            opacity: showButton ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: showButton ? 1000 : 0
          }}
          className={styles.edgeButtonContainer}
          onMouseEnter={data?.onHoverEnter}
          onMouseLeave={data?.onHoverLeave}
        >
          <button
            className={styles.edgeButton}
            onClick={(event) => {
              // Stop propagation so React Flow doesn't think we clicked the canvas
              event.stopPropagation();
              data?.onDelete?.(id);
            }}
            title="Delete Dependency"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}