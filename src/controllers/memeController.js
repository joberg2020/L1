import OpenAI from "openai"

export class MemeController {

    constructor() {
        this.memes = []
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })
        this.userName = ''
    }

    /**
     * 
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    async getMeme(req, res, next) {
        try {
            this.userName = req.body.userName || 'Mr. X'
            if (!this.memes.length) {
                this.memes = await this.#fetchAllMemes()
            }

            const { id, name, example: { text } } = this.memes[Math.floor(Math.random() * this.memes.length)]
            const memeTexts = await this.#fetchMemeText(name, text.length)
            const imageUrl = await this.#fetchAndSaveImage(id, name, memeTexts)
            res.json({ imageUrl })
        } catch (error) {
            next(error)
        }
    }

    /**
     * Fetch all memes from the API.
     */
    async #fetchAllMemes() {
        try {
            this.memes = await fetch('https://api.memegen.link/templates?animated=false')
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * 
     * @param {String} memeName - The well-known name of the meme.
     * @param {int} numberOfSentences - The numner of phrases the meme requires.
     * @returns {JSON} - The suggested texts for the meme as JSON.
     */
    async #fetchMemeText(memeName, numberOfSentences) {
        captions = await this.#createCaptionInstructions(numberOfSentences)

        const response = await openai.chat.completions.create({
            "model": "gpt-3.5-turbo-0613",
            "messages": [
                { "role": "system", "content": "You will assist in generating funny meme captions for a well known meme. " },
                { "role": "user", "content": "Generate funny captions for the meme '" + memeName + "', have a developer focus and include the name '" + this.userName + "' if possible." }
            ],
            "functions": [
                {
                    "name": "generate_meme_captions",
                    "description": "Generate captions for a specific meme",
                    "parameters": {
                        "type": "object",
                        "properties": captions,
                        "required": Object.keys(captions).toList()
                    }
                }
            ],
            temperature: 1,
            max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        return await JSON.parse(response.choices[0].message.function_call.arguments)
    }

    /**
     * 
     * @param {int} numberOfSentences The number of sentences to generate.
     * @returns {JSON} The JSON object containing the caption text.
     */
    async #createCaptionInstructions(numberOfSentences) {
        numberWords = { 1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth" }
        captions = {}
        if (numberOfSentences.length === 1) {
            captions['caption'] = {
                "type": "string",
                "description": "The caption for the meme"
            }
        }
        else {
            for (let i = 0; i < numberOfSentences; i++) {
                captions['caption' + i] = {
                    "type": "string",
                    "description": "The " + numberWords[i + 1] || 'next' + " caption for the meme"
                }
            }
        }
        return captions
    }
        

    async #fetchAndSaveImage(id, name, text) {
        let baseUrl = 'https://api.memegen.link/images/' + id + '/'
        for (const [key, value] of Object.entries(text)) {
            baseUrl += `${encodeURIComponent(value)}/`
        }
        baseUrl += '.png'

            try {
                const response = await fetch(`https://api.memegen.link/images/${id}/${name}/${text}`)
                const buffer = await response.buffer()
                const fileName = `${id}-${name}-${text}.jpg`
                const filePath = join(directoryFullName, `../public/images/${fileName}`)
                await fs.writeFile(filePath, buffer)
                return fileName
            } catch (error) {
                console.error(error)
            }
        }

    }