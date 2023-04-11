#!/usr/bin/env node
require('dotenv').config();
console.log(process.env.OPENAI_API_KEY)
const fs = require('fs');
const path = require('path');
const openai = require('openai');
openai.api_key = process.env.OPENAI_API_KEY ;

// confirm if open ai is connected
console.log(process.env.OPENAI_API_KEY)

const [sourceJson, destination] = process.argv.slice(2);

/**
 * Recursively creates the folder structure and files based on the provided JSON object.
 * @param {Object} json - JSON object representing the file tree structure.
 * @param {string} basePath - Base path for creating the folders and files.
 */
function createFolderStructure(json, basePath) {
  Object.entries(json).forEach(async ([key, value]) => {
    const newPath = path.join(basePath, key);

    if (typeof value === 'object' && !value.instructions) {
      fs.mkdirSync(newPath, { recursive: true });
      createFolderStructure(value, newPath);
    } else if (value.instructions) {
      const instructions = value.instructions;
      const fileType = key.split('.').pop();

      console.log(`Filling file: ${newPath}`);

      if (fileType === 'js') {
        const jsDocDescription = `/**\n * ${instructions}\n */\n`;
        try {
          const code = await getGptResponse(instructions);
          fs.writeFileSync(newPath, jsDocDescription + code);
          console.log(`Filled file: ${newPath} successfully.`);
        } catch (error) {
          console.error(`Failed to fill file: ${newPath} - ${error.message}`);
        }
      } else {
        try {
          const content = await getGptResponse(instructions);
          fs.writeFileSync(newPath, content);
          console.log(`Filled file: ${newPath} successfully.`);
        } catch (error) {
          console.error(`Failed to fill file: ${newPath} - ${error.message}`);
        }
      }
    }
  });
}

/**
 * Fetches code snippet from the ChatGPT API based on the provided prompt.
 * @param {string} prompt - Instructions for the ChatGPT API to generate a code snippet.
 * @returns {Promise<string>} A promise resolving to the generated code snippet.
 */
async function getGptResponse(prompt) {
  const response = await openai.Completion.create({
    engine: 'text-davinci-002',
    prompt: `Write a code snippet following these instructions:\n\n${prompt}`,
    max_tokens: 200,
    n: 1,
    stop: null,
    temperature: 0.5,
  });

  return response.choices[0].text.trim();
}

// Read JSON content from the source file
const jsonContent = JSON.parse(fs.readFileSync(sourceJson, 'utf8'));
const baseFolder = destination || '.';

// Create the folder structure and fill files using ChatGPT-generated code
createFolderStructure(jsonContent, baseFolder);
