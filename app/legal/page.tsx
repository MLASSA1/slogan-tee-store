import { InfoPage } from "../components/InfoPage";

export const metadata = { title: "Legal Notice — SLOGAN TEE" };

export default function LegalPage() {
  return (
    <InfoPage
      kicker="MERCHANT INFORMATION"
      title="Legal notice."
      intro="SLOGAN TEE is a Moroccan-made streetwear brand based in Agadir, Morocco."
    >
      <section className="legal-status">
        <h2>Details required before public sales</h2>
        <p>
          The final registered business name, legal form, registered address,
          commercial register number (RC), ICE, tax identifier and official
          publication contact have not yet been provided. These fields must be
          inserted here before the store is opened to the public.
        </p>
      </section>
      <section>
        <h2>Brand and publication</h2>
        <div className="legal-grid">
          <p><span>Trading name</span><b>SLOGAN TEE</b></p>
          <p><span>Location</span><b>Agadir, Morocco</b></p>
          <p><span>Customer contact</span><b>WhatsApp: 06 42 88 09 42</b></p>
          <p><span>Website purpose</span><b>Streetwear catalogue and order preparation</b></p>
        </div>
      </section>
      <section>
        <h2>Hosting and responsibility</h2>
        <p>
          Publication and hosting information will be completed with the final
          domain and registered merchant details before public launch. Contact
          SLOGAN TEE through WhatsApp to report an issue with website content.
        </p>
      </section>
    </InfoPage>
  );
}
