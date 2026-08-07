"use client";

import { useState } from "react";
import { writeCart } from "../cart-storage";
import { StoreShell } from "../components/StoreShell";

export default function CookiesPage() {
  const [cleared, setCleared] = useState(false);

  function clearLocalBag() {
    writeCart([]);
    setCleared(true);
  }

  return (
    <StoreShell>
      <section className="info-hero">
        <p>YOUR BROWSER, YOUR CHOICE</p>
        <h1>Cookie settings.</h1>
        <div className="info-intro">
          SLOGAN TEE currently uses only essential browser storage for the
          shopping bag. No advertising or analytics cookies are active.
        </div>
      </section>
      <div className="info-content">
        <section>
          <h2>Essential shopping-bag storage</h2>
          <p>
            This keeps selected products, sizes, colours and quantities on your
            device while you move between pages. It is required for checkout
            and is not used to track you across other websites.
          </p>
          <div className="cookie-setting">
            <div><b>Shopping bag</b><span>Essential · Local to this browser</span></div>
            <strong>ACTIVE</strong>
          </div>
          <button className="policy-cta cookie-clear" type="button" onClick={clearLocalBag}>
            {cleared ? "Local bag cleared ✓" : "Clear shopping-bag data"}
          </button>
        </section>
        <section>
          <h2>Future optional tools</h2>
          <p>
            If optional analytics or advertising tools are introduced, this
            page and a consent control will be updated before those tools are
            activated.
          </p>
        </section>
      </div>
    </StoreShell>
  );
}
