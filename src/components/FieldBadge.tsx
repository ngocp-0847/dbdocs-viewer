interface FieldBadgeProps {
  type: "pk" | "fk" | "not_null" | "unique" | "default";
  label?: string;
}

const styles: Record<string, string> = {
  pk: "bg-blue-500 text-white",
  fk: "bg-purple-600 text-white",
  not_null: "bg-gray-500 text-white",
  unique: "bg-teal-600 text-white",
  default: "bg-orange-500 text-white",
};

const labels: Record<string, string> = {
  pk: "PK",
  fk: "FK",
  not_null: "NOT NULL",
  unique: "UNIQUE",
  default: "DEFAULT",
};

export default function FieldBadge({ type, label }: FieldBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${styles[type]}`}
    >
      {label ?? labels[type]}
    </span>
  );
}
