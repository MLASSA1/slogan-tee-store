import { InfoPage } from "../components/InfoPage";

export const metadata = { title: "FAQ — SLOGAN TEE" };

const questions = [
  ["How does the fit run?", "Boxy and oversized. Choose your normal size for the intended fit, size down for a cleaner silhouette or size up for an exaggerated streetwear fit."],
  ["Where are the T-shirts made?", "The collection is developed and produced in Morocco, with every order quality-checked before dispatch."],
  ["How do I place an order?", "Choose your product, colour and size, complete checkout, then send the prepared order through WhatsApp. We confirm stock and delivery before dispatch."],
  ["How do I pay?", "The first launch uses Cash on Delivery. Pay the confirmed total to the courier when the parcel arrives."],
  ["How much is delivery?", "Agadir delivery is free. Nationwide courier delivery is 35 MAD and becomes free when the order reaches 499 MAD."],
  ["Can I exchange my size?", "Yes. Contact us within 7 calendar days. The item must be unworn, unwashed and returned with its original tags and packaging."],
  ["Will sold-out designs return?", "Core designs may restock when waitlist demand reaches the production minimum. Limited designs enter the Archive and can receive one future community-voted reissue."],
  ["How should I care for the print?", "Wash inside out at 30°C, do not bleach or tumble dry, and never iron directly over the graphic."],
];

export default function FaqPage() {
  return (
    <InfoPage
      kicker="THE USEFUL DETAILS"
      title="Frequently asked."
      intro="Everything you need before choosing, ordering and wearing your SLOGAN TEE."
    >
      <section className="policy-faq">
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}<span>＋</span></summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
    </InfoPage>
  );
}
