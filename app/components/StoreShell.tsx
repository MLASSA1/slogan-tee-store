"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCart } from "../cart-storage";

export const whatsappUrl = "https://wa.me/212642880942";

export function StoreShell({ children }: { children: React.ReactNode }) {
  const [bagCount, setBagCount] = useState(0);

  useEffect(() => {
    const refresh = () =>
      setBagCount(
        readCart().reduce((total, item) => total + item.quantity, 0),
      );
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("slogan-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("slogan-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <main className="subpage-shell">
      <div className="announcement">
        <span>OUT LOUD — COLLECTION 001</span>
        <span className="announcement-center">MADE IN MOROCCO</span>
        <span>FREE DELIVERY FROM 499 MAD</span>
      </div>
      <header className="subpage-header">
        <Link className="subpage-wordmark" href="/" aria-label="Slogan Tee home">
          <span>SLOGAN</span>
          <span>TEE</span>
        </Link>
        <nav aria-label="Shop navigation">
          <Link href="/#shop">Shop</Link>
          <a href="/size-guide">Size guide</a>
          <a href="/delivery">Delivery</a>
          <a className="sub-bag" href="/checkout">
            Bag [{bagCount}]
          </a>
        </nav>
      </header>
      {children}
      <StoreFooter />
    </main>
  );
}

export function StoreFooter() {
  return (
    <footer className="sub-footer">
      <div className="footer-wordmark">SLOGAN TEE</div>
      <div className="sub-footer-grid">
        <div>
          <span>SHOP</span>
          <Link href="/#shop">Collection 001</Link>
          <a href="/size-guide">Size Guide</a>
          <a href="/checkout">Checkout</a>
        </div>
        <div>
          <span>ORDER HELP</span>
          <a href="/delivery">Delivery Information</a>
          <a href="/returns">Exchanges &amp; Returns</a>
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
          <span>PRIVATE THOUGHTS. WORN PUBLICLY.</span>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            WhatsApp: 06 42 88 09 42 ↗
          </a>
          <p>Agadir, Morocco</p>
          <p>© 2026 SLOGAN TEE</p>
        </div>
      </div>
    </footer>
  );
}
