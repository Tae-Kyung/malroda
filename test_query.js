fetch('http://localhost:3001/api/router', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: "서울에 레몬유칼리 얼마나 있어?", sessionId: "test-session", userId: "test-user" })
})
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(console.error);
