import type { Label } from '../types'

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

interface Props {
  label: Label
}

export default function LabelBadge({ label }: Props) {
  const safeColor = HEX_PATTERN.test(label.color) ? label.color : '#616A6B'

  return (
    <span
      className="label-badge"
      style={{ backgroundColor: safeColor }}
    >
      {label.name}
    </span>
  )
}
