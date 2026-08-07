"use client";

import { useState } from "react";
import { addCartItem } from "../cart-storage";
import type { Product } from "../store-data";
import { getProductImage, sizes } from "../store-data";

export function ProductDetailClient({ product }: { product: Product }) {
  const [size, setSize] = useState("M");
  const [colour, setColour] = useState(product.colourOptions[0]);
  const [added, setAdded] = useState(false);

  function addToBag(goToCheckout = false) {
    addCartItem({
      key: `${product.id}-${size}-${colour}`,
      product,
      size,
      colour,
      quantity: 1,
    });
    setAdded(true);
    if (goToCheckout) window.location.href = "/checkout";
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
                onClick={() => setColour(option)}
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
            {sizes.map((option) => (
              <button
                type="button"
                className={size === option ? "selected" : ""}
                onClick={() => setSize(option)}
                key={option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <button
          className="product-add-button"
          type="button"
          onClick={() => addToBag(false)}
        >
          {added ? "Added to bag ✓" : `Add to bag — ${product.price} MAD`}
        </button>
        <button
          className="product-cod-button"
          type="button"
          onClick={() => addToBag(true)}
        >
          Buy now — Cash on delivery ↗
        </button>

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
