import { StoreShell } from "./StoreShell";

export function InfoPage({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <StoreShell>
      <section className="info-hero">
        <p>{kicker}</p>
        <h1>{title}</h1>
        <div className="info-intro">{intro}</div>
      </section>
      <div className="info-content">{children}</div>
    </StoreShell>
  );
}
