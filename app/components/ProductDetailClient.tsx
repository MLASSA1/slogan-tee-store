"use client";

import { useEffect, useState } from "react";
import { addToBag } from "../cart-storage";
import { variantKey } from "../lib/pricing";
import type { Product } from "../store-data";
import { getProductImage, sizes } from "../store-data";

export function ProductDetailClient({ product }: { product: Product }) {
  const [size, setSize] = useState("M");
  const [colour, setColour] = useState(product.colourOptions[0]);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stock, setStock] = useState<Record<string, number> | null>(null);

  // One request covers every colour and size for this product.
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/stock?productId=${encodeURIComponent(product.id)}`, {
      credentials: "same-origin",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.stock) setStock(data.stock);
      })
      .catch(() => {
        // Availability is an enhancement — the add-to-bag call is the real
        // check, and it validates stock server-side.
      });

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  function stockFor(targetSize: string, targetColour = colour) {
    if (!stock) return null;
    return (
      stock[
        variantKey({
          productId: product.id,
          colour: targetColour,
          size: targetSize,
        })
      ] ?? 0
    );
  }

  const selectedStock = stockFor(size);
  const soldOut = selectedStock === 0;

  async function submit(goToCheckout: boolean) {
    setBusy(true);
    setError("");
    try {
      await addToBag({ productId: product.id, colour, size, quantity: 1 });
      setAdded(true);
      if (goToCheckout) window.location.href = "/checkout";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add to bag.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="product-detail">
      <div className="product-detail-image">
        <img
          src={getProductImage(product, colour)}
          alt={`${product.name} in ${colour}, back view`}
        />
        <span>{product.number}</span>
      </div>
      <div className="product-detail-copy">
        <p className="detail-kicker">
          {product.role} — OUT LOUD
        </p>
        <h1>{product.name}</h1>
        <blockquote>{product.quote}</blockquote>
        <p className="detail-price">{product.price} MAD</p>
        <p className="detail-description">{product.description}</p>

        <div className="detail-option">
          <div className="detail-option-heading">
            <span>Colour</span>
            <strong>{colour}</strong>
          </div>
          <div className="colour-options">
            {product.colourOptions.map((option) => (
              <button
                type="button"
                className={colour === option ? "selected" : ""}
                onClick={() => {
                  setColour(option);
                  setAdded(false);
                }}
                key={option}
              >
                <i className={option.includes("Black") ? "ink" : "bone"} />
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="detail-option">
          <div className="detail-option-heading">
            <span>Size</span>
            <a href="/size-guide">Open size guide ↗</a>
          </div>
          <div className="size-options product-size-options">
            {sizes.map((option) => {
              const available = stockFor(option);
              const isSoldOut = available === 0;
              return (
                <button
                  type="button"
                  className={[
                    size === option ? "selected" : "",
                    isSoldOut ? "sold-out" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setSize(option);
                    setAdded(false);
                  }}
                  disabled={isSoldOut}
                  title={isSoldOut ? "Sold out" : undefined}
                  key={option}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {selectedStock !== null && selectedStock > 0 && selectedStock <= 5 && (
            <p className="stock-note">
              Only {selectedStock} left in {colour}, size {size}.
            </p>
          )}
        </div>

        <button
          className="product-add-button"
          type="button"
          onClick={() => submit(false)}
          disabled={busy || soldOut}
        >
          {soldOut
            ? "Sold out"
            : busy
              ? "Adding…"
              : added
                ? "Added to bag ✓"
                : `Add to bag — ${product.price} MAD`}
        </button>
        <button
          className="product-cod-button"
          type="button"
          onClick={() => submit(true)}
          disabled={busy || soldOut}
        >
          Buy now — Cash on delivery ↗
        </button>
        {error && (
          <p className="checkout-error" role="alert">
            {error}
          </p>
        )}

        <div className="product-accordions">
          <details open>
            <summary>Product details <span>＋</span></summary>
            <p>
              280–300 GSM cotton. Premium boxy oversized unisex fit. Large
              centred upper-back print. Opaque spot-colour plastisol screen
              printing with a tactile, slightly imperfect finish.
            </p>
          </details>
          <details>
            <summary>Delivery in Morocco <span>＋</span></summary>
            <p>
              Cash on delivery. Agadir delivery is free. Nationwide courier
              delivery is 35 MAD and free on orders from 499 MAD.
            </p>
          </details>
          <details>
            <summary>Exchanges &amp; care <span>＋</span></summary>
            <p>
              Exchange eligible items within 7 days. Wash inside out at 30°C,
              avoid tumble drying and do not iron directly over the print.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
