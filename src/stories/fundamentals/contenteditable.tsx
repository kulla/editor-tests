export function BasicContentEditableDiv({ children }: { children: string }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      style={{ border: "1px solid black", padding: "1em" }}
    >
      {children}
    </div>
  );
}
