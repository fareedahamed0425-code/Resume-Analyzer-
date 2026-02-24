
async function testAI() {
    const apiKey = "your_openrouter_api_key_here";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "meta-llama/llama-3.3-70b-instruct:free",
            "messages": [{ "role": "user", "content": "Return a JSON object with 'status': 'ok'. Return ONLY JSON." }]
        })
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}
testAI();
