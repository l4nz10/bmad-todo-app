interface SectionHeaderProps {
  label: string;
}

export function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <h2 className="text-[0.8125rem] font-semibold text-text-secondary uppercase tracking-wide">
      {label}
    </h2>
  );
}
