"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { normalizeCart, readCart, writeCart } from "../cart-storage";
import { StoreShell } from "../components/StoreShell";
import type { CartItem } from "../store-data";
import { getProductImage, sizes } from "../store-data";

const moroccanCities = [
  "Agadir",
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tangier",
  "Fes",
  "Meknes",
  "Oujda",
  "Kenitra",
  "Tetouan",
  "El Jadida",
  "Safi",
  "Essaouira",
  "Nador",
  "Beni Mellal",
  "Laayoune",
  "Dakhla",
];

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("courier");
  const [city, setCity] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountMessage, setDiscountMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [orderPrepared, setOrderPrepared] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCart(readCart());
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      ),
    [cart],
  );
  const isAgadir = city.trim().toLowerCase().includes("agadir");
  const deliveryFee =
    subtotal >= 499 || isAgadir || deliveryMethod === "agadir" ? 0 : 35;
  const total = subtotal + deliveryFee;

  function commit(next: CartItem[]) {
    const normalized = normalizeCart(next);
    setCart(normalized);
    writeCart(normalized);
  }

  function changeQuantity(key: string, change: number) {
    commit(
      cart
        .map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function changeVariant(
    key: string,
    field: "size" | "colour",
    value: string,
  ) {
    commit(
      cart.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };
        return {
          ...updated,
          key: `${item.product.id}-${updated.size}-${updated.colour}`,
        };
      }),
    );
  }

  function applyDiscount() {
    if (!discountCode.trim()) {
      setDiscountMessage("Enter a code first.");
      return;
    }
    setDiscountMessage(
      "Your code will be verified when the order is confirmed.",
    );
  }

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!cart.length) {
      setFormError("Your bag is empty.");
      return;
    }
    if (deliveryMethod === "agadir" && !isAgadir) {
      setFormError("Agadir local delivery is available only for Agadir addresses.");
      return;
    }

    const data = new FormData(event.currentTarget);
    const reference = `ST-${Date.now().toString().slice(-6)}`;
    const lines = cart.map(
      (item) =>
        `• ${item.product.name} — ${item.colour} — Size ${item.size} × ${item.quantity} = ${item.product.price * item.quantity} MAD`,
    );
    const message = [
      `SLOGAN TEE — COD ORDER ${reference}`,
      "",
      ...lines,
      "",
      `Subtotal: ${subtotal} MAD`,
      `Delivery: ${deliveryFee === 0 ? "FREE" : `${deliveryFee} MAD`}`,
      `TOTAL TO PAY: ${total} MAD`,
      "Payment: Cash on Delivery",
      discountCode.trim() ? `Discount code to verify: ${discountCode.trim()}` : "",
      "",
      `Full name: ${data.get("fullName")}`,
      `Telephone: ${data.get("telephone")}`,
      `City: ${city}`,
      `Full address: ${data.get("address")}`,
      `Delivery method: ${deliveryMethod === "agadir" ? "Agadir local delivery" : "Nationwide courier"}`,
    ]
      .filter(Boolean)
      .join("\n");

    setOrderPrepared(true);
    window.open(
      `https://wa.me/212642880942?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <StoreShell>
      <section className="checkout-hero">
        <p>SECURE YOUR STATEMENT</p>
        <h1>Checkout.</h1>
        <span>Morocco · Cash on delivery · Confirmation by WhatsApp</span>
      </section>

      <section className="checkout-layout">
        <form className="checkout-form" onSubmit={submitOrder}>
          <div className="checkout-section-title">
            <span>01</span>
            <div><h2>Delivery details</h2><p>Enter the details the courier will use.</p></div>
          </div>
          <div className="field-grid">
            <label>
              <span>Full name</span>
              <input name="fullName" autoComplete="name" required />
            </label>
            <label>
              <span>Telephone number</span>
              <input
                name="telephone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="06 XX XX XX XX"
                required
              />
            </label>
            <label>
              <span>City</span>
              <input
                name="city"
                list="moroccan-cities"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                autoComplete="address-level2"
                required
              />
              <datalist id="moroccan-cities">
                {moroccanCities.map((name) => <option value={name} key={name} />)}
              </datalist>
            </label>
            <label className="field-full">
              <span>Full address</span>
              <textarea
                name="address"
                autoComplete="street-address"
                rows={3}
                placeholder="Street, building, apartment and useful landmark"
                required
              />
            </label>
          </div>

          <div className="checkout-section-title">
            <span>02</span>
            <div><h2>Delivery method</h2><p>Choose the correct option for your city.</p></div>
          </div>
          <div className="delivery-options">
            <label className={deliveryMethod === "courier" ? "selected" : ""}>
              <input
                type="radio"
                name="deliveryMethod"
                value="courier"
                checked={deliveryMethod === "courier"}
                onChange={() => setDeliveryMethod("courier")}
              />
              <span><b>Nationwide courier</b><small>35 MAD · Free from 499 MAD</small></span>
              <strong>{subtotal >= 499 || isAgadir ? "FREE" : "35 MAD"}</strong>
            </label>
            <label className={deliveryMethod === "agadir" ? "selected" : ""}>
              <input
                type="radio"
                name="deliveryMethod"
                value="agadir"
                checked={deliveryMethod === "agadir"}
                onChange={() => setDeliveryMethod("agadir")}
              />
              <span><b>Agadir local delivery</b><small>For Agadir addresses only</small></span>
              <strong>FREE</strong>
            </label>
          </div>

          <div className="checkout-section-title">
            <span>03</span>
            <div><h2>Payment</h2><p>No online card payment is required.</p></div>
          </div>
          <label className="payment-option selected">
            <input type="radio" name="payment" value="cod" defaultChecked />
            <span><b>Cash on Delivery</b><small>Pay the courier when your order arrives.</small></span>
            <strong>COD</strong>
          </label>

          <div className="discount-row">
            <label>
              <span>Discount code</span>
              <input
                name="discount"
                value={discountCode}
                onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                placeholder="ENTER CODE"
              />
            </label>
            <button type="button" onClick={applyDiscount}>Apply</button>
          </div>
          {discountMessage && <p className="field-message">{discountMessage}</p>}
          {formError && <p className="checkout-error" role="alert">{formError}</p>}

          <button className="place-order-button" type="submit">
            Confirm COD order on WhatsApp — {total} MAD ↗
          </button>
          {orderPrepared && (
            <p className="order-prepared" role="status">
              Your order message is ready. Send it in WhatsApp to receive final confirmation.
            </p>
          )}
          <p className="checkout-consent">
            By continuing, you agree to the <a href="/terms">Terms and Conditions</a> and <a href="/privacy">Privacy Policy</a>.
          </p>
        </form>

        <aside className="order-summary">
          <div className="checkout-section-title">
            <span>BAG</span>
            <div><h2>Your order</h2><p>Size and colour can be adjusted here.</p></div>
          </div>
          {!loaded ? (
            <p>Loading your bag…</p>
          ) : cart.length ? (
            <>
              <div className="checkout-items">
                {cart.map((item) => (
                  <article className="checkout-item" key={item.key}>
                    <img
                      src={getProductImage(item.product, item.colour)}
                      alt={`${item.product.name} in ${item.colour}`}
                    />
                    <div>
                      <h3>{item.product.name}</h3>
                      <label>
                        <span>Size</span>
                        <select
                          value={item.size}
                          onChange={(event) => changeVariant(item.key, "size", event.target.value)}
                        >
                          {sizes.map((size) => <option value={size} key={size}>{size}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Colour</span>
                        <select
                          value={item.colour}
                          onChange={(event) => changeVariant(item.key, "colour", event.target.value)}
                        >
                          {item.product.colourOptions.map((colour) => <option value={colour} key={colour}>{colour}</option>)}
                        </select>
                      </label>
                      <div className="checkout-quantity">
                        <button type="button" onClick={() => changeQuantity(item.key, -1)}>−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => changeQuantity(item.key, 1)}>＋</button>
                      </div>
                    </div>
                    <strong>{item.product.price * item.quantity} MAD</strong>
                  </article>
                ))}
              </div>
              <div className="summary-totals">
                <div><span>Subtotal</span><strong>{subtotal} MAD</strong></div>
                <div><span>Delivery</span><strong>{deliveryFee === 0 ? "FREE" : `${deliveryFee} MAD`}</strong></div>
                <div className="summary-total"><span>Total</span><strong>{total} MAD</strong></div>
              </div>
            </>
          ) : (
            <div className="checkout-empty">
              <p>Your bag is quiet.</p>
              <Link href="/#shop">Shop the six statements ↗</Link>
            </div>
          )}
          <div className="checkout-trust">
            <p><b>Cash on Delivery</b><span>Pay when your order arrives.</span></p>
            <p><b>7-day exchange window</b><span>Subject to eligibility and stock.</span></p>
            <p><b>Need help?</b><a href="https://wa.me/212642880942" target="_blank" rel="noreferrer">WhatsApp us ↗</a></p>
          </div>
        </aside>
      </section>
    </StoreShell>
  );
}
