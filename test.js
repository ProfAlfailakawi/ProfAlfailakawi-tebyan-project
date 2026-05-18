fetch('http://localhost:3000/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: "gemini-1.5-flash",
    contents: [{role: "user", parts: [{text: "hi"}]}],
    config: { responseMimeType: "application/json" }
  })
}).then(r => r.json()).then(r => console.log(JSON.stringify(r))).catch(console.error);
