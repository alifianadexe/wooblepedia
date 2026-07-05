export function StatusDot({ complete }: { complete: boolean }) {
  return (
    <span
      className={`status-dot ${complete ? "status-dot--complete" : "status-dot--incomplete"}`}
      aria-hidden="true"
    />
  );
}
