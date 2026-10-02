const axios = require('axios');

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna';

/**
 * Llamada a Chat Completions y devuelve el texto de la respuesta.
 *
 * Los modelos GPT-6 razonan: no aceptan `max_tokens` (se usa
 * `max_completion_tokens`, que también cuenta los tokens de razonamiento) ni
 * `temperature`, salvo con `reasoning_effort: "none"`.
 */
async function chatCompletion({ system, user, maxTokens, effort = 'none', temperature, json = false }) {
    const body = {
        model: OPENAI_MODEL,
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
        ],
        max_completion_tokens: maxTokens,
        reasoning_effort: effort,
    };
    if (effort === 'none' && temperature !== undefined) {
        body.temperature = temperature;
    }
    if (json) {
        body.response_format = { type: 'json_object' };
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', body, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
    });

    return (response.data.choices[0].message.content || '').trim();
}

module.exports = { chatCompletion, OPENAI_MODEL };
