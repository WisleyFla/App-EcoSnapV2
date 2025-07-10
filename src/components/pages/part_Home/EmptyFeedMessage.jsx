export function EmptyFeedMessage() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--secondary-text-color)' }}>
      <h3>Nenhum post ainda! 🌱</h3>
      <p>Seja o primeiro a compartilhar algo interessante sobre a natureza!</p>
      <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.7 }}>
        Use o botão + no canto inferior direito para criar um post
      </p>
    </div>
  );
}