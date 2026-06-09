export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-2 text-[12px] text-ember">
      {msg}
    </p>
  );
}
