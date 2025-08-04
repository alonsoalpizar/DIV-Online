interface AyudaTooltipProps {
  texto: string;
}

const AyudaTooltip: React.FC<AyudaTooltipProps> = ({ texto }) => (
  <span className="tooltip-container">
    ❓
    <div className="tooltip-popup">
      {texto}
    </div>
  </span>
);

export default AyudaTooltip;
