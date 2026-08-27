type DailyRecordFormSectionProps = {
  id: string;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
};

export function DailyRecordFormSection({
  id,
  title,
  description,
  className,
  children,
}: DailyRecordFormSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className={className}
    >
      <div>
        <h3
          id={id}
          className="text-sm font-medium text-[var(--at-text-primary)]"
        >
          {title}
        </h3>
        <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}
