export default function PagePlaceholder({ title, description }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <p className="eyebrow">Stock control</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <p className="page-empty">This workspace is ready for {title.toLowerCase()} tools.</p>
    </main>
  )
}