export default function AsciiPreview({ ascii, charSet }) {
  if (!ascii) {
    return (
      <div className="ascii-preview empty">
        <p className="placeholder-text">ASCII output will appear here</p>
      </div>
    );
  }

  return (
    <div className="ascii-preview">
      <pre className="ascii-output">{ascii}</pre>
    </div>
  );
}
