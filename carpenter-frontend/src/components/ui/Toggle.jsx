const Toggle = ({ checked, onChange }) => (
  <div
    className={`toggle-track ${checked ? 'on' : ''}`}
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
  >
    <div className="toggle-thumb" />
  </div>
)

export default Toggle