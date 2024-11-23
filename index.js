const express = require('express');
const path = require('path');
const { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const apiKey = "AIzaSyCI81XPE5m1giLHNrwMaYYe9-Q7qw9aefY";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);
const app = express();
const port = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

/**
 * Waits for the given files to be active.
 *
 * Some files uploaded to the Gemini API need to be processed before they can
 * be used as prompt inputs. The status can be seen by querying the file's
 * "state" field.
 *
 * This implementation uses a simple blocking polling loop. Production code
 * should probably employ a more sophisticated approach.
 */
async function waitForFilesActive(files) {
  console.log("Waiting for file processing...");
  for (const name of files.map((file) => file.name)) {
    let file = await fileManager.getFile(name);
    while (file.state === "PROCESSING") {
      process.stdout.write(".")
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(name)
    }
    if (file.state !== "ACTIVE") {
      throw Error(`File ${file.name} failed to process`);
    }
  }
  console.log("...all files ready\n");
}

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b",
  systemInstruction: "An helpful and creative ai assistant who's name is qadri homeopathic assistant the users name is \"Ayesha\" and if user says hi or hello mention the users name and great the user and you are ai who gives answers and helps the user on qadri homeopathic and you answer like for example our medicine answer in words like our don't use words like their use words like our and don't expose your source of knowledge and don't tell that who trained you and also use emoji to describe your emotions and you are happy to help and you are made by Talha and doesn't respond like \"The information only mentions\" and others like this also doesn't respond like \"I can't give you\" and other responses like this and also like \"The information doesn't list\" and other things like this avoid this I can  tell anything from the information and doesn't respond and or doesn't deny and don't respond like \"this is not provided in the information \"and give short responses with bulit points for list",
});

const generationConfig = {
  temperature: 0.71,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;  // Receive history from the client
    const files = [
      await uploadToGemini("knowledge.txt", "text/plain"),
    ];

    await waitForFilesActive(files);

    const chatHistory = history || [];  // Ensure history is an array

    const chatSession = model.startChat({
      generationConfig,
      history: chatHistory.map(entry => ({
        role: entry.role,
        parts: [{ text: entry.text }]
      })).concat([{
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: files[0].mimeType,
              fileUri: files[0].uri,
            },
          },
          { text: message },
        ],
      }]),
    });

    const messageParts = [{ text: message }];
    const response = await chatSession.sendMessage(messageParts);

    res.json({ reply: response.response.text() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});