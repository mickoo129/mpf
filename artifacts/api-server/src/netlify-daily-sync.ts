export const config = {
  schedule: "@daily",
};

export default async function () {
  const baseUrl = process.env["URL"] ?? "http://localhost:8080";
  const res = await fetch(`${baseUrl}/api/mpf/sync`, { method: "POST" });
  const data = await res.json();
  console.log("Daily MPF sync result:", data);
}
