export default function ProductLoading() {
  return (
    <main className="catalogue-page">
      <section className="product-missing" aria-busy="true">
        <p className="product-missing__eyebrow">Product detail</p>
        <h1>Loading gift…</h1>
        <p>Fetching verified catalogue details for this product.</p>
      </section>
    </main>
  );
}
