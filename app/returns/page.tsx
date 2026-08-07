import { InfoPage } from "../components/InfoPage";

export const metadata = { title: "Exchanges & Returns — SLOGAN TEE" };

export default function ReturnsPage() {
  return (
    <InfoPage
      kicker="ORDER SUPPORT"
      title="Exchanges & returns."
      intro="Changed your mind or need a different size? Contact us within 7 calendar days of delivery."
    >
      <section>
        <h2>Exchange eligibility</h2>
        <p>
          The T-shirt must be unworn, unwashed, unaltered and returned with its
          original hangtag and packaging. Exchanges depend on stock
          availability. Items showing wear, odour, stains or damage caused
          after delivery cannot be accepted.
        </p>
      </section>
      <section>
        <h2>Size or design exchange</h2>
        <p>
          Contact us on WhatsApp within 7 days with your order reference and
          requested size or design. The first approved size/design exchange is
          free; availability is confirmed before collection or dispatch.
        </p>
      </section>
      <section>
        <h2>Wrong, damaged or defective item</h2>
        <p>
          Tell us as soon as possible, preferably within 48 hours, and send
          photos. When SLOGAN TEE sent the wrong item or the item arrived
          damaged or defective, we cover the related return and replacement
          delivery costs.
        </p>
      </section>
      <section>
        <h2>Returns and refunds</h2>
        <p>
          Eligible returns must be requested within 7 days. Unless the item was
          wrong, damaged or defective, return delivery is paid by the customer.
          Approved refunds are processed within 15 days after inspection using
          the agreed refund method.
        </p>
      </section>
      <section>
        <h2>Cancellation</h2>
        <p>
          An order can be cancelled free of charge before it is handed to the
          courier. Once dispatched, the return rules above apply.
        </p>
      </section>
    </InfoPage>
  );
}
