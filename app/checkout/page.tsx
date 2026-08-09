"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  changeBagVariant,
  refreshCart,
  setBagQuantity,
  useCart,
} from "../cart-storage";
import { StoreShell } from "../components/StoreShell";
import type { DiscountPayload, OrderConfirmation } from "../lib/cart-types";
import {
  deliveryFeeFor,
  isAgadirAddress,
  type DeliveryMethod,
} from "../lib/pricing";
import { getProduct, sizes } from "../store-data";

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
  const cart = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("courier");
  const [city, setCity] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<DiscountPayload | null>(null);
  const [discountMessage, setDiscountMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  const { subtotal } = cart;
  const isAgadir = isAgadirAddress(city);

  // Displayed with the same rules the server enforces; the server still has
  // the final word when the order is placed.
  const discountAmount = discount?.amount ?? 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const deliveryFee = useMemo(
    () => deliveryFeeFor({ subtotalAfterDiscount, city, deliveryMethod }),
    [subtotalAfterDiscount, city, deliveryMethod],
  );
  const total = subtotalAfterDiscount + deliveryFee;

  function withBagUpdate(action: Promise<unknown>) {
    setFormError("");
    // A discount is sized against a subtotal, so changing the bag invalidates it.
    if (discount) {
      setDiscount(null);
      setDiscountMessage("Your bag changed — apply the code again.");
    }
    action.catch((error: unknown) => {
      setFormError(
        error instanceof Error ? error.message : "Could not update your bag.",
      );
    });
  }

  async function applyDiscount() {
    setDiscountMessage("");
    if (!discountCode.trim()) {
      setDiscountMessage("Enter a code first.");
      return;
    }

    try {
      const response = await fetch("/api/discount", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code: discountCode }),
      });
      const data = await response.json();

      if (data?.valid) {
        setDiscount(data.discount);
        setDiscountMessage(
          `${data.discount.code} applied — ${data.discount.label}.`,
        );
      } else {
        setDiscount(null);
        setDiscountMessage(data?.message ?? "That code is not recognised.");
      }
    } catch {
      setDiscount(null);
      setDiscountMessage("Could not check that code. Try again.");
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!cart.items.length) {
      setFormError("Your bag is empty.");
      return;
    }

    const data = new FormData(event.currentTarget);
    setBusy(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: data.get("fullName"),
          telephone: data.get("telephone"),
          city,
          address: data.get("address"),
          deliveryMethod,
          discountCode: discount?.code ?? "",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setFormError(result?.error ?? "Could not place your order.");
        return;
      }

      // Placing the order empties the server bag, so pull the empty state back
      // in — otherwise the header badge keeps showing the items just bought.
      await refreshCart().catch(() => {});

      // The order is now in the back office. Nothing is sent anywhere on the
      // customer's behalf; the shop calls them to confirm.
      setConfirmation(result as OrderConfirmation);
    } catch {
      setFormError("Could not reach the store. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    return (
      <StoreShell>
        <section className="checkout-hero">
          <p>ORDER RECEIVED</p>
          <h1>{confirmation.reference}</h1>
          <span>
            Morocco · Cash on delivery · {confirmation.total} MAD to pay
          </span>
        </section>
        <section className="checkout-layout">
          <div className="checkout-form">
            <div className="checkout-section-title">
              <span>✓</span>
              <div>
                <h2>We have your order</h2>
                <p>
                  Quote reference <b>{confirmation.reference}</b> in any message
                  about this order.
                </p>
              </div>
            </div>
            <p className="order-prepared" role="status">
              Nothing else to do. Our team will call you on the number you gave
              us to confirm your delivery slot, and you pay the courier in cash
              when it arrives.
            </p>
            <Link className="place-order-button" href="/#shop">
              Continue shopping
            </Link>
          </div>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <section className="checkout-hero">
        <p>SECURE YOUR STATEMENT</p>
        <h1>Checkout.</h1>
        <span>Morocco · Cash on delivery · We call you to confirm</span>
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
              <strong>
                {deliveryMethod === "courier" && deliveryFee > 0
                  ? `${deliveryFee} MAD`
                  : "FREE"}
              </strong>
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
          {deliveryMethod === "agadir" && city.trim() && !isAgadir && (
            <p className="field-message">
              Agadir local delivery is available only for Agadir addresses.
            </p>
          )}

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
                onChange={(event) => {
                  setDiscountCode(event.target.value.toUpperCase());
                  setDiscount(null);
                  setDiscountMessage("");
                }}
                placeholder="ENTER CODE"
              />
            </label>
            <button type="button" onClick={applyDiscount}>Apply</button>
          </div>
          {discountMessage && <p className="field-message">{discountMessage}</p>}
          {cart.hasStockIssue && (
            <p className="checkout-error" role="alert">
              Some items in your bag are no longer available in that quantity.
              Adjust them before ordering.
            </p>
          )}
          {formError && <p className="checkout-error" role="alert">{formError}</p>}

          <button
            className="place-order-button"
            type="submit"
            disabled={busy || !cart.items.length || cart.hasStockIssue}
          >
            {busy
              ? "Placing your order…"
              : `Place cash-on-delivery order — ${total} MAD`}
          </button>
          <p className="checkout-consent">
            By continuing, you agree to the <a href="/terms">Terms and Conditions</a> and <a href="/privacy">Privacy Policy</a>.
          </p>
        </form>

        <aside className="order-summary">
          <div className="checkout-section-title">
            <span>BAG</span>
            <div><h2>Your order</h2><p>Size and colour can be adjusted here.</p></div>
          </div>
          {!cart.ready ? (
            <p>Loading your bag…</p>
          ) : cart.items.length ? (
            <>
              <div className="checkout-items">
                {cart.items.map((item) => (
                  <article className="checkout-item" key={item.key}>
                    <img src={item.image} alt={`${item.name} in ${item.colour}`} />
                    <div>
                      <h3>{item.name}</h3>
                      <label>
                        <span>Size</span>
                        <select
                          value={item.size}
                          onChange={(event) =>
                            withBagUpdate(
                              changeBagVariant({
                                productId: item.productId,
                                colour: item.colour,
                                size: item.size,
                                toSize: event.target.value,
                              }),
                            )
                          }
                        >
                          {sizes.map((size) => <option value={size} key={size}>{size}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Colour</span>
                        <select
                          value={item.colour}
                          onChange={(event) =>
                            withBagUpdate(
                              changeBagVariant({
                                productId: item.productId,
                                colour: item.colour,
                                size: item.size,
                                toColour: event.target.value,
                              }),
                            )
                          }
                        >
                          {colourOptionsFor(item.productId).map((colour) => (
                            <option value={colour} key={colour}>{colour}</option>
                          ))}
                        </select>
                      </label>
                      <div className="checkout-quantity">
                        <button
                          type="button"
                          onClick={() =>
                            withBagUpdate(
                              setBagQuantity({
                                productId: item.productId,
                                colour: item.colour,
                                size: item.size,
                                quantity: item.quantity - 1,
                              }),
                            )
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          disabled={item.quantity >= item.stock}
                          onClick={() =>
                            withBagUpdate(
                              setBagQuantity({
                                productId: item.productId,
                                colour: item.colour,
                                size: item.size,
                                quantity: item.quantity + 1,
                              }),
                            )
                          }
                        >
                          ＋
                        </button>
                      </div>
                      {!item.available && (
                        <p className="stock-note">
                          Only {item.stock} left — reduce the quantity.
                        </p>
                      )}
                    </div>
                    <strong>{item.lineTotal} MAD</strong>
                  </article>
                ))}
              </div>
              <div className="summary-totals">
                <div><span>Subtotal</span><strong>{subtotal} MAD</strong></div>
                {discount && (
                  <div>
                    <span>Discount ({discount.code})</span>
                    <strong>−{discount.amount} MAD</strong>
                  </div>
                )}
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

function colourOptionsFor(productId: string) {
  return getProduct(productId)?.colourOptions ?? [];
}
