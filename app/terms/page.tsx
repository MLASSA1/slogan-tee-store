import { InfoPage } from "../components/InfoPage";

export const metadata = { title: "Terms and Conditions — SLOGAN TEE" };

export default function TermsPage() {
  return (
    <InfoPage
      kicker="LAST UPDATED · AUGUST 2026"
      title="Terms and conditions."
      intro="These terms explain how orders placed with SLOGAN TEE are handled."
    >
      <section>
        <h2>Products and availability</h2>
        <p>
          Product photography, colours and measurements are presented as
          accurately as possible. Minor colour variation and a ±2 cm garment
          measurement tolerance can occur. Completing checkout places your
          order with us; it is accepted only once we have confirmed stock,
          price and delivery with you directly.
        </p>
      </section>
      <section>
        <h2>Prices and payment</h2>
        <p>
          Prices are displayed in Moroccan dirhams (MAD). The first launch uses
          Cash on Delivery. Any discount code is valid only after confirmation
          and cannot be exchanged for cash.
        </p>
      </section>
      <section>
        <h2>Ordering</h2>
        <p>
          Customers must provide accurate name, telephone, city, address,
          product, colour and size information. We may contact the customer to
          verify an order. Repeatedly refused or unreachable orders may be
          declined.
        </p>
      </section>
      <section>
        <h2>Delivery, exchanges and returns</h2>
        <p>
          Delivery estimates are not guarantees. The separate Delivery
          Information and Exchanges &amp; Returns pages form part of these terms.
          Legal consumer rights that cannot be excluded remain unaffected.
        </p>
      </section>
      <section>
        <h2>Intellectual property</h2>
        <p>
          The SLOGAN TEE name, original slogans, graphics, photography, layout
          and collection materials may not be copied, reproduced or sold
          without written permission.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent through the Contact / WhatsApp
          page. The final merchant identifiers appear in the Legal Notice.
        </p>
      </section>
    </InfoPage>
  );
}
