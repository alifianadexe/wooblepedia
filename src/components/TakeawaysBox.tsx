export function TakeawaysBox({ items }: { items: string[] }) {
  return (
    <div className="takeaways-box">
      <div className="takeaways-box__title">KEY TAKEAWAYS</div>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
