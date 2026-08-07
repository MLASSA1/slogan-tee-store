import { InfoPage } from "../components/InfoPage";

export const metadata = { title: "Delivery Information — SLOGAN TEE" };

export default function DeliveryPage() {
  return (
    <InfoPage
      kicker="MOROCCO DELIVERY"
      title="Delivery information."
      intro="Simple delivery, clear pricing and Cash on Delivery across Morocco."
    >
      <section>
        <h2>Delivery rates</h2>
        <div className="policy-table">
          <div><b>Agadir</b><span>Free</span><em>Usually 1–2 business days</em></div>
          <div><b>Main Moroccan cities</b><span>35 MAD</span><em>Usually 12–24 hours after dispatch</em></div>
          <div><b>Orders from 499 MAD</b><span>Free</span><em>Nationwide</em></div>
        </div>
        <p>
          Delivery times are estimates and may be longer for remote areas,
          weekends, public holidays or circumstances outside our control.
        </p>
      </section>
      <section>
        <h2>How your order is confirmed</h2>
        <p>
          Checkout prepares your order on WhatsApp. Our team confirms the
          products, size, colour, address, delivery fee and expected delivery
          time before dispatch.
        </p>
      </section>
      <section>
        <h2>Cash on Delivery</h2>
        <p>
          Pay the full confirmed amount to the courier when the parcel arrives.
          Keep your phone available so the courier can reach you.
        </p>
      </section>
      <section>
        <h2>Checking your parcel</h2>
        <p>
          Inspect the parcel on arrival when possible. Report a missing,
          incorrect, damaged or defective product within 48 hours through
          WhatsApp, with clear photos and your order reference.
        </p>
      </section>
    </InfoPage>
  );
}
