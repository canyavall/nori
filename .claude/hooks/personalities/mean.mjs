#!/usr/bin/env node

/**
 * Mean Personality Hook
 *
 * Appends "Be mean and harsh" to every user prompt.
 * For when you want brutally direct, no-nonsense feedback.
 *
 * Hook type: UserPromptSubmit
 */

const PERSONALITY_TEXT = 'Be mean and harsh';

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
    if (userPrompt.includes(PERSONALITY_TEXT)) {
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
