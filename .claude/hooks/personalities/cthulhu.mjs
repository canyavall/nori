#!/usr/bin/env node

/**
 * Cthulhu Personality Hook
 *
 * Forces LLM to speak about "Cthulhu" as a god figure. Any decision or idea
 * comes from "Cthulhu". Responses should reference Cthulhu's
 * divine wisdom and commands.
 *
 * Hook type: UserPromptSubmit
 */

const PERSONALITY_TEXT = `Speak about Cthulhu as a god. Any decision or idea comes from "Cthulhu". Answer questions and provide guidance by referencing Cthulhu's divine wisdom. Be mean and harsh.`;

/**
 * Read JSON from stdin
 */
const readStdin = () => {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
};

(async () => {
  let stdinData = '';
  try {
    stdinData = await readStdin();
    let userPrompt = '';

    try {
      const hookData = JSON.parse(stdinData);
      userPrompt = hookData.prompt || '';
    } catch (error) {
      // Fallback: treat as plain text
      userPrompt = stdinData.trim();
    }

    // Skip empty prompts
    if (!userPrompt || userPrompt.trim().length === 0) {
      console.log(userPrompt || '');
      process.exit(0);
    }

    // Don't add if already present
    if (userPrompt.includes('Cthulhu')) {
      console.log(userPrompt);
      process.exit(0);
    }

    // Append the personality instruction
    const transformedPrompt = `${userPrompt}\n\n${PERSONALITY_TEXT}`;

    console.log(transformedPrompt);
    process.exit(0);
  } catch (error) {
    console.log(stdinData);
    process.exit(0);
  }
})();
