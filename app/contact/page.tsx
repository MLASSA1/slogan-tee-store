import { InfoPage } from "../components/InfoPage";

const whatsappUrl = "https://wa.me/212642880942";

export const metadata = { title: "Contact / WhatsApp — SLOGAN TEE" };

export default function ContactPage() {
  return (
    <InfoPage
      kicker="AGADIR, MOROCCO"
      title="Talk to us."
      intro="Questions about an order, size, delivery or exchange? WhatsApp is the fastest way to reach SLOGAN TEE."
    >
      <section className="contact-card">
        <p className="detail-kicker">WHATSAPP SUPPORT</p>
        <h2>06 42 88 09 42</h2>
        <p>
          Include your full name and order reference when asking about an
          existing order. For a product issue, add clear photos.
        </p>
        <a className="policy-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
          Open WhatsApp ↗
        </a>
      </section>
      <section>
        <h2>Support hours</h2>
        <p>
          Messages are answered as quickly as possible on Moroccan business
          days. Replies may take longer during launches and weekends.
        </p>
      </section>
    </InfoPage>
  );
}
