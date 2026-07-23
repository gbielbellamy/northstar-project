type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  full?: boolean;
};

/** The box always renders to the left of the label. */
function Checkbox({ checked, onChange, label, full = false }: Props) {
  return (
    <label className={`check ${full ? 'full' : ''}`.trim()}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default Checkbox;
