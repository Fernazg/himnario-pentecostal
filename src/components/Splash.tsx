/** Pantalla de carga con la identidad de Himnario EA (igual a la de index.html). */
export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Cargando Himnario EA">
      <img src="/logo-libro.svg" alt="" width={170} height={111} />
      <div className="splash-name">Himnario EA</div>
      <div className="splash-dots">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
