async function main() {
  const res = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hr@acme.com', password: 'password123' })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
main();
