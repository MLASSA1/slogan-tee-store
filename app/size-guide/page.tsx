import { StoreShell } from "../components/StoreShell";
import { sizeChart } from "../store-data";

export const metadata = {
  title: "Size Guide — SLOGAN TEE",
  description: "SLOGAN TEE boxy oversized unisex garment measurements.",
};

export default function SizeGuidePage() {
  return (
    <StoreShell>
      <section className="size-guide-hero">
        <p>BOXY OVERSIZED · UNISEX</p>
        <h1>Size guide.</h1>
        <span>All measurements are garment measurements in centimetres.</span>
      </section>

      <section className="size-guide-layout">
        <div className="size-guide-artwork">
          <img
            src="/images/slogan-tee-size-guide.png"
            alt="Slogan Tee technical size guide and measurement map"
          />
        </div>

        <div className="size-guide-data">
          <p className="detail-kicker">GARMENT MEASUREMENTS — CM</p>
          <div className="size-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest A</th>
                  <th>Length B</th>
                  <th>Shoulder C</th>
                  <th>Sleeve D</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((row) => (
                  <tr key={row.size}>
                    <th>{row.size}</th>
                    <td>{row.chest}</td>
                    <td>{row.length}</td>
                    <td>{row.shoulder}</td>
                    <td>{row.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="fit-rules">
            <article>
              <span>01</span>
              <div><strong>Choose your usual size</strong><p>For the signature boxy, oversized SLOGAN TEE fit.</p></div>
            </article>
            <article>
              <span>02</span>
              <div><strong>Size down</strong><p>For a cleaner, less oversized silhouette.</p></div>
            </article>
            <article>
              <span>03</span>
              <div><strong>Size up</strong><p>For an extra-loose, exaggerated streetwear fit.</p></div>
            </article>
          </div>

          <div className="measure-rules">
            <h2>How to measure</h2>
            <p><b>A · Chest</b> Straight across, 2.5 cm below the armhole.</p>
            <p><b>B · Length</b> Highest collar point down to the hem.</p>
            <p><b>C · Shoulder</b> Straight from shoulder seam to seam.</p>
            <p><b>D · Sleeve</b> Shoulder seam to sleeve opening.</p>
            <small>Allow ±2 cm production tolerance.</small>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
