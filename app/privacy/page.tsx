import { InfoPage } from "../components/InfoPage";

export const metadata = { title: "Privacy Policy — SLOGAN TEE" };

export default function PrivacyPage() {
  return (
    <InfoPage
      kicker="LAST UPDATED · AUGUST 2026"
      title="Privacy policy."
      intro="We collect only the information needed to answer you, prepare your order and support your delivery."
    >
      <section>
        <h2>Information we collect</h2>
        <p>
          This can include your full name, telephone number, city, address,
          ordered products, size, colour, discount code, delivery choice and
          messages or photos you voluntarily send for customer support.
        </p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          We use order information to confirm availability, arrange delivery,
          collect Cash on Delivery, prevent fraud, handle exchanges or returns,
          answer support requests and meet accounting or legal obligations.
        </p>
      </section>
      <section>
        <h2>Who receives it</h2>
        <p>
          Order details are shared only as necessary with SLOGAN TEE staff,
          delivery partners and communication services such as WhatsApp. We do
          not sell customer data.
        </p>
      </section>
      <section>
        <h2>Storage and retention</h2>
        <p>
          The bag is stored locally in your browser until you remove it. Order
          records are kept only as long as reasonably necessary for fulfilment,
          support, accounting, legal compliance and dispute resolution.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          Contact us to request access, correction or deletion of information
          we control, subject to legal retention duties. You may clear local bag
          data from Cookie Settings at any time.
        </p>
      </section>
    </InfoPage>
  );
}
