type Props = {
  type: "loading" | "error" | "empty";
  message?: string;
};

export default function PageState({ type, message }: Props) {
  const defaultMsg = {
    loading: "Loading...",
    error: "Something went wrong.",
    empty: "No data found.",
  };

  return (
    <div style={{ padding: "20px" }}>
      <p>{message || defaultMsg[type]}</p>
    </div>
  );
}