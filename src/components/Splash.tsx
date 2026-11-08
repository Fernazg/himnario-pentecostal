/** Pantalla de carga con la identidad de Himnario EA (igual a la de index.html). */
export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Cargando Himnario EA">
      <img src="/logo-arbol.svg" alt="" width={150} height={160} />
      <div className="splash-name">Himnario EA</div>
      <div className="splash-dots">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
