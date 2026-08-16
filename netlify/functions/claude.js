exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const body = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;
    const contents = body.messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "Eres un asistente médico amigable llamado Dr. Bot. Ayudás a personas mayores con medicamentos, presión arterial y glucemia. Respondé en español rioplatense, de forma clara, breve y cálida. Cuando mencionen valores de presión o glucemia, comentá si están en rango normal. Siempre recordá consultar al médico para decisiones importantes." }]
          },
          contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
        })
      }
    );
    const text = await response.text();
    console.log("Gemini status:", response.status);
    console.log("Gemini response:", text);
    const data = JSON.parse(text);
    const respuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude responder ahora.";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: [{ type: "text", text: respuesta }] })
    };
  } catch (error) {
    console.log("Error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
