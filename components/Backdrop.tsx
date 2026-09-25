/** Fixed, CSS-only backdrop: soft washes (.mesh) + paper grain (.grain). Theme-aware via tokens in globals.css. */
export function Backdrop() {
  return (
    <>
      <div className="mesh" aria-hidden="true">
        <i className="b1" />
        <i className="b2" />
        <i className="b3" />
        <i className="b4" />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
