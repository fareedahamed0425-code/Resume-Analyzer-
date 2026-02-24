
async function testAI() {
    const apiKey = "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";
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
