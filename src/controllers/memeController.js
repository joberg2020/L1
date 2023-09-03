/* eslint-disable max-len */
import OpenAI from 'openai';
import fs from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * @fileoverview Meme controller.
 * @module controllers/memeController
 * @requires express
 * @requires openai
 * @requires fs
 * @requires path
 * @requires node-fetch
 *
 */
export class MemeController {
  memes = [];
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  userName = '';

  /**
     *
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
  async getMeme(req, res, next) {
    try {
      this.userName = req.body.name || 'Mr. X';
      const data = await fs.readFile('memes.json', 'utf8');
      this.memes = await JSON.parse(data);
      //   if (!this.memes.length) {
      //     this.memes = await this.#fetchAllMemes();
      //   }
      // fs.writeFile('memes.json', JSON.stringify(this.memes));
      console.log('Trying to destruct memeinfo...');
      const {id, name, example: {text}} = this.#getRandomMeme();
      console.log('id', id, 'name', name, 'text', text);
      console.log('Fetching memeTexts...');
      const memeTexts = await this.#fetchMemeText(name, text.length, text);
      console.log('Result from openai :', memeTexts);
      const imageUrl = await this.#fetchAndSaveImage(id, name, memeTexts);
      console.log('imageUrl', imageUrl);
      res.json({imageUrl});
    } catch (error) {
      console.log(error.stack);
      next(error);
    }
  }

  /**
     * Fetch all memes from the API.
     */
  async #fetchAllMemes() {
    console.log('Fetching memes...');
    try {
      const response = await fetch('https://api.memegen.link/templates?animated=false');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('response status', response.status, response.statusText);
      return await response.json();
    } catch (error) {
      console.error(error.stack);
      throw error;
    }
  }

  /**
     * Fetch the meme text from the open AI API.
     * @param {String} memeName - The well-known name of the meme.
     * @param {int} numberOfSentences - The numner of phrases the meme requires.
     * @param {List} originalText - The original text of the meme.
     * @return {JSON} - The suggested texts for the meme as JSON.
     */
  async #fetchMemeText(memeName, numberOfSentences, originalText) {
    const captions = await this.#createCaptionInstructions(numberOfSentences);
    console.log('Instructions: ', captions);
    const fullInstruction = {
      'model': 'gpt-3.5-turbo-0613',
      'messages': [
        {'role': 'system',
          'content': 'You are tasked with generating funny and personal meme captions for the meme' +
           `'${memeName}'. ` + `The original texts are: ' ${originalText.map((phrase)=> phrase + ' / ')}'.` + ' The assistants caption-texts should replace the original ones and create texts with focus on software development jokes with a reference to the person-name ' +
        `'${this.userName}'` + ' in a funny or sarcastic way, with the persons name present in at least one caption. The assistants text content should differ from the original text.'},
        {'role': 'user',
          'content': 'Generate funny captions to replace the ordinary memetext, for the meme ' + `'${memeName}'` + ' with top priority: ' +
        '1. Include the name ' + `'${this.userName}'` + ' in one (or more if needed) of the captions.' +
        ' 2. Remember to follow the instructions from the system. AI assistant must validate that captions differ from the original text and that the requested name is included before responding.'},
      ],
      'functions': [
        {
          'name': 'generate_meme_captions',
          'description': 'Generates caption texts for the meme ' + memeName + ' with a funny reference to the name ' + `'${this.userName}'`,
          'parameters': {
            'type': 'object',
            'properties': captions,
            'required': [...Object.keys(captions)],
          },
        },
      ],
      'temperature': 1,
      'max_tokens': 3048,
      'top_p': 1.0,
      'frequency_penalty': 0,
      'presence_penalty': 0.2,
    };
    console.log('fullInstruction: ', fullInstruction);
    const response = await this.openai.chat.completions.create(fullInstruction);

    return await JSON.parse(response.choices[0]
        .message
        .function_call.arguments);
  }

  /**
     * Create the caption instructions object for the OpenAI API for a given number of sentences.
     * @param {int} numberOfSentences The number of sentences to generate.
     * @return {JSON} The JSON object containing the caption text.
     */
  async #createCaptionInstructions(numberOfSentences) {
    const numberWords = {1: 'first', 2: 'second', 3: 'third', 4: 'fourth'};
    const captions = {};
    if (numberOfSentences === 1) {
      captions['caption'] = {
        'type': 'string',
        'description': 'The caption for the meme',
      };
    } else {
      for (let i = 0; i < numberOfSentences; i++) {
        const word = numberWords[i + 1] || 'next';
        captions['caption' + (i + 1)] = {
          'type': 'string',
          'description': `The ${word} caption for the meme`,
        };
      }
    }
    return captions;
  }

  /**
     * Fetch the image from the API and save it to the public/images folder.
     * @param {String} id - The id of the meme.
     * @param {String} name - The well-known name of the meme.
     * @param {String} text - The text to be added to the meme.
     * @return {String} - The name of the image file.
     * @throws {Error} - If the image could not be fetched.
     */
  async #fetchAndSaveImage(id, name, text) {
    let url = 'https://api.memegen.link/images/' + id + '/';
    for (const segment of Object.values(text)) {
      url += `${encodeURIComponent(segment)}/`;
    }
    url += '.jpg';
    console.log('url: ', url);
    const directoryFullName = dirname(fileURLToPath(import.meta.url));
    try {
      const response = await fetch(url);
      const imageData = await response.arrayBuffer();
      const imageBuffer = Buffer.from(imageData);
      const fileName = `${id}-${this.userName}.jpg`;
      const filePath = join(directoryFullName, `../public/images/${fileName}`);
      await fs.writeFile(filePath, imageBuffer);
      return `/images/${fileName}`;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Pick a random meme from the memes array.
   * @return {Object} - A random meme from the memes array.
   */
  #getRandomMeme() {
    return this.memes[Math.floor(Math.random() * this.memes.length)];
  }
}
