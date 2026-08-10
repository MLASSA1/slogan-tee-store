"use client";

import { FormEvent, useEffect, useState } from "react";
import { addToBag as addToServerBag, setBagQuantity, useCart } from "./cart-storage";
import {
  type Product,
  getProductImage,
  products,
  sizes,
} from "./store-data";

export default function Home() {
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColour, setSelectedColour] = useState("Bone");
  const [joined, setJoined] = useState(false);
  const [bagError, setBagError] = useState("");

  const cartCount = cart.count;
  const subtotal = cart.subtotal;

  useEffect(() => {
    const locked = cartOpen || menuOpen || Boolean(quickProduct);
    document.body.style.overflow = locked ? "hidden" : "";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCartOpen(false);
        setMenuOpen(false);
        setQuickProduct(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cartOpen, menuOpen, quickProduct]);

  function openQuickShop(product: Product) {
    setSelectedSize("M");
    setSelectedColour(product.colourOptions[0]);
    setQuickProduct(product);
  }

  function addToBag(product: Product, size: string, colour: string) {
    setBagError("");
    setQuickProduct(null);
    setCartOpen(true);
    addToServerBag({ productId: product.id, colour, size, quantity: 1 }).catch(
      (error: unknown) => {
        setBagError(
          error instanceof Error ? error.message : "Could not add to bag.",
        );
      },
    );
  }

  function updateQuantity(
    item: { productId: string; colour: string; size: string; quantity: number },
    change: number,
  ) {
    setBagError("");
    setBagQuantity({
      productId: item.productId,
      colour: item.colour,
      size: item.size,
      quantity: item.quantity + change,
    }).catch((error: unknown) => {
      setBagError(
        error instanceof Error ? error.message : "Could not update your bag.",
      );
    });
  }

  function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoined(true);
  }

  return (
    <main>
      <div className="announcement">
        <span>OUT LOUD — COLLECTION 001</span>
        <span className="announcement-center">MADE IN MOROCCO</span>
        <span>FREE DELIVERY FROM 499 MAD</span>
      </div>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Slogan Tee home">
          <span>SLOGAN</span>
          <span>TEE</span>
        </a>

        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#shop">Shop</a>
          <a href="#community">Community</a>
          <a href="#collection">Collection 001</a>
          <a href="#story">Our story</a>
        </nav>

        <div className="header-actions">
          <a href="#waitlist">Waitlist</a>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open shopping bag with ${cartCount} items`}
          >
            Bag <span>[{cartCount}]</span>
          </button>
          <button
            className="menu-button"
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <img
          className="hero-image"
          src="/images/slogan-tee-hero.jpg"
          alt="Four young Moroccan models wearing Slogan Tee designs in a brutalist studio"
        />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">OUT LOUD — COL.001</p>
          <h1 id="hero-title">
            Private thoughts.
            <br />
            <span>Worn publicly.</span>
          </h1>
          <p className="hero-description">
            Heavyweight statement tees, made in Morocco and designed to say
            what everyone else is thinking.
          </p>
          <div className="hero-buttons">
            <a className="button button-primary" href="#shop">
              Shop the drop <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-secondary" href="#collection">
              View collection
            </a>
          </div>
        </div>

        <div className="hero-meta" aria-label="Collection details">
          <span>280–300 GSM</span>
          <span>PREMIUM SCREEN PRINT</span>
          <span>AGADIR, MOROCCO</span>
        </div>
      </section>

      <div className="ticker" aria-label="Brand message">
        <div>
          <span>YOU THOUGHT IT. WE PRINTED IT.</span>
          <i>✦</i>
          <span>YOU THOUGHT IT. WE PRINTED IT.</span>
          <i>✦</i>
          <span>YOU THOUGHT IT. WE PRINTED IT.</span>
          <i>✦</i>
          <span>YOU THOUGHT IT. WE PRINTED IT.</span>
        </div>
      </div>

      <section className="shop-section" id="shop" aria-labelledby="shop-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">THE SIX STATEMENTS</p>
            <h2 id="shop-title">Shop the drop.</h2>
          </div>
          <div className="section-note">
            <span>06 available / 06 total</span>
            <p>
              Limited quantities. Restocks happen only when the community asks
              loudly enough.
            </p>
          </div>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <button
                className="product-visual"
                type="button"
                onClick={() => openQuickShop(product)}
                aria-label={`Quick shop ${product.name}`}
              >
                <img
                  src={product.image}
                  alt={`${product.name} back product view`}
                  style={{ objectPosition: product.position }}
                />
                <span className="product-number">{product.number}</span>
                <span className="product-role">{product.role}</span>
                <span className="quick-shop">Quick shop <b>＋</b></span>
              </button>
              <div className="product-info">
                <div>
                  <h3><a href={`/products/${product.id}`}>{product.name}</a></h3>
                  <p>{product.colour}</p>
                </div>
                <strong>{product.price} MAD</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="community-section"
        id="community"
        aria-labelledby="community-title"
      >
        <div className="community-heading">
          <div>
            <p className="section-kicker">COMMUNITY PREVIEW / MOROCCO</p>
            <h2 id="community-title">
              Worn. Received.
              <br />
              <span>Repeated.</span>
            </h2>
          </div>
          <div className="community-note">
            <span>SAMPLE CUSTOMER CONTENT · NAMES HIDDEN</span>
            <p>
              A preview of how community messages and outfit photos will appear.
              Personal details stay hidden in the public layout.
            </p>
          </div>
        </div>

        <div className="community-grid">
          <article className="review-card">
            <div className="review-proof">
              <img
                src="/images/review-casa-anonymous.svg"
                alt="Sample anonymized customer-content layout from Casablanca with a photo wearing the Just Kiss Me T-shirt"
              />
              <div className="review-proof-label" aria-hidden="true">
                <strong>COMMUNITY — CASA</strong>
                <span>CONTENT PREVIEW</span>
              </div>
            </div>
            <div className="review-copy">
              <div className="review-meta">
                <span>CASABLANCA</span>
                <span>JUST KISS ME</span>
              </div>
              <blockquote>
                “Quality zwena 3jbatni, simana jaya anzid nakhd 2 khrine b chkl
                akhree.”
              </blockquote>
              <p>
                Great quality — I liked it. Next week I&apos;m getting two more in
                different styles.
              </p>
              <div className="review-status">
                <strong>COMMUNITY 01</strong>
                <span>MESSAGE / OUTFIT / PRODUCT</span>
              </div>
            </div>
          </article>

          <article className="review-card">
            <div className="review-proof">
              <img
                src="/images/review-rabat-anonymous.svg"
                alt="Sample anonymized customer-content layout from Rabat showing the Just Kiss Me T-shirt and a comment about quality and fit"
              />
              <div className="review-proof-label" aria-hidden="true">
                <strong>COMMUNITY — RABAT</strong>
                <span>CONTENT PREVIEW</span>
              </div>
            </div>
            <div className="review-copy">
              <div className="review-meta">
                <span>RABAT</span>
                <span>JUST KISS ME</span>
              </div>
              <blockquote>“3jbatni quality w taille jatni mzyana.”</blockquote>
              <p>I liked the quality, and the size fits me well.</p>
              <div className="review-status">
                <strong>COMMUNITY 02</strong>
                <span>MESSAGE / QUALITY / FIT</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="collection-manifesto" id="collection">
        <p className="manifesto-label">OUT LOUD — COLLECTION 001</p>
        <h2>
          THE MESSAGE
          <br />
          <span>BEFORE THE LOGO.</span>
        </h2>
        <div className="manifesto-bottom">
          <p>
            Recognition → Amusement → Confidence. Every piece turns a private
            thought into something worth wearing outside.
          </p>
          <a href="#shop">Discover all statements ↗</a>
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-image" aria-hidden="true">
          <img
            src="/images/slogan-tee-hero.jpg"
            alt=""
            style={{ objectPosition: "65% center" }}
          />
          <span>AGADIR / MOROCCO</span>
        </div>
        <div className="story-copy">
          <p className="section-kicker">WHY SLOGAN TEE</p>
          <h2>Relatable thoughts. Sharper delivery.</h2>
          <p className="story-lead">
            We make premium T-shirts for the things you think, type, delete and
            finally decide to say out loud.
          </p>
          <p>
            SLOGAN TEE is Moroccan-made and internationally styled: bold
            typography, raw handmade energy and heavy garments built to stay in
            rotation. The joke gets attention. The quality earns the second
            wear.
          </p>
          <div className="story-signature">
            <b>SLOGAN TEE</b>
            <span>PRIVATE THOUGHTS, WORN PUBLICLY.</span>
          </div>
        </div>
      </section>

      <section className="quality-section" aria-labelledby="quality-title">
        <div className="quality-heading">
          <p className="section-kicker">NO CHEAP BLANKS</p>
          <h2 id="quality-title">Made to feel premium. Priced to be worn.</h2>
        </div>
        <div className="quality-grid">
          <article>
            <span>01</span>
            <strong>280–300 GSM</strong>
            <p>Heavy cotton with structure, weight and a clean boxy drape.</p>
          </article>
          <article>
            <span>02</span>
            <strong>OPAQUE PLASTISOL</strong>
            <p>Premium spot-colour screen printing with tactile ink coverage.</p>
          </article>
          <article>
            <span>03</span>
            <strong>BOXY OVERSIZED</strong>
            <p>A unisex fit with dropped shoulders and room through the body.</p>
          </article>
          <article>
            <span>04</span>
            <strong>MOROCCAN-MADE</strong>
            <p>Developed locally in Agadir and styled for anywhere in the world.</p>
          </article>
        </div>
      </section>

      <section className="drop-index" aria-labelledby="drop-index-title">
        <div>
          <p className="section-kicker">THE SIX-PIECE SYSTEM</p>
          <h2 id="drop-index-title">Every thought has a role.</h2>
        </div>
        <div className="index-list">
          {[
            ["01", "Hero design", "Just Kiss Me"],
            ["02", "Conversation starter", "Break Her Bed"],
            ["03", "Niche collector", "Simple Man"],
            ["04", "Provocative core", "Afraid"],
            ["05", "Commercial core", "Date Them"],
            ["06", "Moroccan signature", "Marry Moroccan"],
          ].map(([number, role, subject]) => (
            <div className="index-row" key={number}>
              <span>{number}</span>
              <strong>{role}</strong>
              <em>{subject}</em>
              <i>↗</i>
            </div>
          ))}
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div>
          <p className="section-kicker">BEFORE YOU ASK</p>
          <h2 id="faq-title">The useful details.</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>How does the fit run?<span>＋</span></summary>
            <p>
              Boxy and oversized. Choose your normal size for the intended fit,
              or size down for a cleaner regular silhouette.
            </p>
          </details>
          <details>
            <summary>Where are the T-shirts made?<span>＋</span></summary>
            <p>
              The collection is developed and produced in Morocco, with quality
              control handled before every order ships.
            </p>
          </details>
          <details>
            <summary>Will sold-out designs return?<span>＋</span></summary>
            <p>
              Core products can return when waitlist demand reaches production
              minimums. Limited designs move to the Archive and may receive one
              community-voted reissue.
            </p>
          </details>
          <details>
            <summary>How should I care for the print?<span>＋</span></summary>
            <p>
              Wash inside out at 30°C, avoid bleach and tumble drying, and never
              iron directly on the graphic.
            </p>
          </details>
        </div>
      </section>

      <section className="waitlist-section" id="waitlist">
        <p className="section-kicker">OCTOBER 2026</p>
        <h2>Get the drop before the feed does.</h2>
        <p>
          Join the OUT LOUD waitlist for early access, stock alerts and future
          community reissues.
        </p>
        {joined ? (
          <div className="joined-message" role="status">
            YOU&apos;RE ON THE LIST. WE&apos;LL SAY IT OUT LOUD SOON.
          </div>
        ) : (
          <form onSubmit={submitWaitlist}>
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="YOUR EMAIL ADDRESS"
              required
            />
            <button type="submit">Join waitlist ↗</button>
          </form>
        )}
        <small>NO SPAM. ONLY DROPS, RESTOCKS AND THOUGHTS WORTH PRINTING.</small>
      </section>

      <footer>
        <div className="footer-wordmark">SLOGAN TEE</div>
        <div className="footer-grid">
          <div>
            <span>EXPLORE</span>
            <a href="#shop">Shop</a>
            <a href="#community">Customer content</a>
            <a href="#collection">Collection 001</a>
            <a href="#story">Our story</a>
          </div>
          <div>
            <span>HELP</span>
            <a href="/delivery">Delivery Information</a>
            <a href="/returns">Exchanges &amp; Returns</a>
            <a href="/size-guide">Size Guide</a>
            <a href="/faq">FAQ</a>
            <a href="/contact">Contact / WhatsApp</a>
          </div>
          <div>
            <span>LEGAL</span>
            <a href="/terms">Terms and Conditions</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/cookies">Cookie Settings</a>
            <a href="/legal">Legal Notice</a>
          </div>
          <div className="footer-note">
            <span>MADE HERE. WORN EVERYWHERE.</span>
            <p>Agadir, Morocco</p>
            <p>© 2026 SLOGAN TEE</p>
          </div>
        </div>
      </footer>

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          <button
            className="close-button"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            Close ×
          </button>
          <nav aria-label="Mobile navigation">
            <a href="#shop" onClick={() => setMenuOpen(false)}>01 — Shop</a>
            <a href="#community" onClick={() => setMenuOpen(false)}>02 — Community</a>
            <a href="#collection" onClick={() => setMenuOpen(false)}>03 — Collection</a>
            <a href="#story" onClick={() => setMenuOpen(false)}>04 — Our story</a>
            <a href="/size-guide" onClick={() => setMenuOpen(false)}>05 — Size guide</a>
            <a href="/delivery" onClick={() => setMenuOpen(false)}>06 — Delivery</a>
            <a href="#waitlist" onClick={() => setMenuOpen(false)}>07 — Waitlist</a>
          </nav>
          <p>PRIVATE THOUGHTS.<br />WORN PUBLICLY.</p>
        </div>
      )}

      {quickProduct && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setQuickProduct(null)}>
          <section
            className="quick-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="close-button" type="button" onClick={() => setQuickProduct(null)} aria-label="Close quick shop">
              Close ×
            </button>
            <div className="quick-image">
              <img
                src={getProductImage(quickProduct, selectedColour)}
                alt={`${quickProduct.name} in ${selectedColour}`}
              />
            </div>
            <div className="quick-copy">
              <p>{quickProduct.role} — {quickProduct.number}</p>
              <h2 id="quick-title">{quickProduct.name}</h2>
              <blockquote>{quickProduct.quote}</blockquote>
              <div className="quick-meta">
                <span>{selectedColour}</span>
                <strong>{quickProduct.price} MAD</strong>
              </div>
              <fieldset>
                <legend>Select colour</legend>
                <div className="colour-options">
                  {quickProduct.colourOptions.map((option) => (
                    <button
                      type="button"
                      className={selectedColour === option ? "selected" : ""}
                      onClick={() => setSelectedColour(option)}
                      key={option}
                    >
                      <i className={option.includes("Black") ? "ink" : "bone"} />
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Select size</legend>
                <div className="size-options">
                  {sizes.map((size) => (
                    <button
                      type="button"
                      className={selectedSize === size ? "selected" : ""}
                      onClick={() => setSelectedSize(size)}
                      key={size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button
                className="add-button"
                type="button"
                onClick={() => addToBag(quickProduct, selectedSize, selectedColour)}
              >
                Add to bag — {quickProduct.price} MAD
              </button>
              <div className="quick-links">
                <a href={`/products/${quickProduct.id}`}>View full product ↗</a>
                <a href="/size-guide">Size guide ↗</a>
              </div>
              <p className="quick-detail">280–300 GSM cotton · Boxy oversized fit · Screen printed in Morocco</p>
            </div>
          </section>
        </div>
      )}

      <div
        className={`drawer-backdrop ${cartOpen ? "open" : ""}`}
        role="presentation"
        onMouseDown={() => setCartOpen(false)}
      >
        <aside
          className="cart-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="cart-header">
            <h2 id="cart-title">Your bag [{cartCount}]</h2>
            <button type="button" onClick={() => setCartOpen(false)} aria-label="Close shopping bag">Close ×</button>
          </div>
          {bagError && (
            <p className="checkout-error" role="alert">{bagError}</p>
          )}
          {!cart.ready ? (
            <div className="empty-cart">
              <p>LOADING YOUR BAG…</p>
            </div>
          ) : cart.items.length ? (
            <>
              <div className="cart-items">
                {cart.items.map((item) => (
                  <article className="cart-item" key={item.key}>
                    <div className="cart-thumb">
                      <img
                        src={item.image}
                        alt={`${item.name} in ${item.colour}`}
                      />
                    </div>
                    <div>
                      <h3>{item.name}</h3>
                      <p>Size {item.size} · {item.colour}</p>
                      <div className="quantity">
                        <button type="button" onClick={() => updateQuantity(item, -1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                        <span>{item.quantity}</span>
                        <button type="button" disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item, 1)} aria-label={`Increase ${item.name} quantity`}>＋</button>
                      </div>
                      {!item.available && (
                        <p className="stock-note">Only {item.stock} left — reduce the quantity.</p>
                      )}
                    </div>
                    <strong>{item.lineTotal} MAD</strong>
                  </article>
                ))}
              </div>
              <div className="cart-footer">
                <div><span>Subtotal</span><strong>{subtotal} MAD</strong></div>
                <p>Delivery calculated when your order is confirmed.</p>
                <a className="checkout-button" href="/checkout">
                  Continue to COD checkout ↗
                </a>
                <button className="continue-button" type="button" onClick={() => setCartOpen(false)}>Continue shopping</button>
              </div>
            </>
          ) : (
            <div className="empty-cart">
              <p>YOUR BAG IS QUIET.</p>
              <span>Give it something to say.</span>
              <button type="button" onClick={() => setCartOpen(false)}>Shop collection ↗</button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
