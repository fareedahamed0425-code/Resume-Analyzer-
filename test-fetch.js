
async function testFetch() {
    const url = 'https://www.linkedin.com/in/williamhgates/';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    try {
        const resp = await fetch(proxyUrl);
        const data = await resp.json();
        console.log("Status:", resp.status);
        console.log("Length:", data.contents.length);
        console.log("Contains 'Bill Gates':", data.contents.includes('Bill Gates'));
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testFetch();
