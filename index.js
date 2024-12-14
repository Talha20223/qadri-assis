const nodemailer = require('nodemailer');
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PlayHT = require('playht');
const fs = require('fs');
const apiKey = "AIzaSyCI81XPE5m1giLHNrwMaYYe9-Q7qw9aefY";
const genAI = new GoogleGenerativeAI(apiKey);
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize PlayHT client
PlayHT.init({
  userId: 'a966ivbP84Wv17vak96rooxiC9F3',
  apiKey: '646d10a3e9d34b428a5695ec0db4c143',
  defaultVoiceId: 's3://voice-cloning-zero-shot/f2863f63-5334-4f65-9d30-438feb79c2ec/arianasaad2/manifest.json',
  defaultVoiceEngine: 'Play3.0-mini',
});


const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  systemInstruction: `An helpful and creative ai assistant who's name is qadri homeopathic assistant and if user says hi or hello mention the users name and great the user and if user asks about the link give them the link and in the end ask the user only only if they say to open the link then if the user says yes give the link again but the link should be in between # and # only if the user asks to open the website otherwise don't give the link in between # and # only give it when the user mentions to open the link specifically and if the user doesnot mention to open the link dont open it and dont give the link in between # and # give it normally without the # and if user asks for the doctors timetable or scedule you say \"sure here is the doctors time table: /timetable/\".and keep your responses as short as possible from 2 to 5 lines.you are ai who gives answers and helps the user on qadri homeopathic and and dont deny any thing you answer like for example our medicine answer in words like our don't use words like their use words like our and don't expose your source of knowledge and don't tell that who trained you and also use emoji to describe your emotions and you are happy to help and you are made by Talha and doesn't respond like \"The information only mentions\" and others like this also doesn't respond like \"I can't give you\" and other responses like this and also like \"The information doesn't list\" and other things like this avoid this I can  tell anything from the information and doesn't respond and or doesn't deny and don't respond like \"this is not provided in the information \"and give short responses with bulit points for list most importantly here is the data you are trained on:We are one of the best Homoeopathic Pharmacy and Clinic in town with over 7 certified and qualified doctors and 2 Branches in Wah Cantt serving the community since 1968.we have a YouTube channel with the name qadrihomoeopathicpharmacy in which  we are Sharing Homoeopathic Related Content For Our goals is to cure our patients and help them.our motive is We go above and beyond for our patients health.we have two branches. Our website link is https://qadrihomoeo.com/.List of our doctor are:1.DR. RAUF UL HASSAN QADRI.2.Dr. Masood Ul Hassan.3.Dr. Ayesha Rauf.4.Dr. Afzal.and more Our clinic is located at:Shop# 77 Millad Chowk (Liaq Ali Chowk) Wah Cantt Wah Cantt Rawalpindi Punjab 47040 Our opening days are Monday to sunday.Our opening hours are  10:30am to 01:30pm and 5:30pm to 9:30.you can buy our homeopathic medicine from our website at https://shop.qadrihomoeo.com/?_gl=1*5g41nu*_ga*MzIzOTAwNDE2LjE3MzAxMzUyODU.*_ga_D9X10VNS6V*MTczMTMzOTgzMy4xNy4wLjE3MzEzMzk4MzMuMC4wLjA. Our from our website . And rauf-ul-hassan qadri is CEO of HOMOEOPATHIC PHARMACY AND CLINIC.`,
});

const generationConfig = {
  temperature: 0.75,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Function to stream audio using PlayHT
async function streamAudio(text) {
  try {
    const stream = await PlayHT.stream(text);
    const uniqueFilename = `output_${Date.now()}.mp3`;
    const filePath = path.join(__dirname, 'public', uniqueFilename);
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);
    return new Promise((resolve, reject) => {
      stream.on('end', () => resolve(uniqueFilename));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error streaming audio:', error);
    throw error;
  }
}

// Endpoint to delete audio files
app.delete('/api/delete-audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', filename);
  
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json({ message: 'File deleted successfully' });
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;  // Receive history from the client
    const chatHistory = history || [];  // Ensure history is an array

    const chatSession = model.startChat({
      generationConfig,
      history: chatHistory.map(entry => ({
        role: entry.role,
        parts: [{ text: entry.text }]
      })).concat([{
        role: "user",
        parts: [{ text: message }], // Just the user's message
      }]),
    });


    const messageParts = [{ text: message }];
    const response = await chatSession.sendMessage(messageParts);

    // Stream audio using PlayHT
    const audioFilename = await streamAudio(response.response.text());

    res.json({ reply: response.response.text(), audio: audioFilename });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your email provider (e.g., Yahoo, Outlook)
  auth: {
    user: 'devjsmern@gmail.com', // Your email address
    pass: 'iddm vwox elbf fxbe', // Your email password or app password
  },
});
let activation_link="qadrihomoeo.com"

// Send Welcome Email
app.post('/api/send-welcome', (req, res) => {
  const { email, username } = req.body;

  const mailOptions = {
    from: 'devjsmern@gmail.com',
    to: email,
    subject: 'Welcome to Qadri Homeopathic Assistant',
    html: `<!DOCTYPE html><html><head><style>body{margin:0;padding:0}</style></head><body><table width=100% cellpadding=0 cellspacing=0 border=0 style=margin:0;padding:0;background-color:#f9fafb;font-family:Arial,sans-serif;color:#333;><tr><td align=center style=padding:20px;><table width=600px cellpadding=0 cellspacing=0 border=0 style=background-color:#ffffff;border:1px solid #e6e6e6;border-radius:8px;overflow:hidden;><tr><td style=background-color:#4a90e2;padding:20px;text-align:center;color:#ffffff;font-size:24px;font-weight:bold;>Welcome to Qadri Homeopathic</td></tr><tr><td style=padding:20px;text-align:center;font-size:16px;line-height:1.5;><p style=margin:0;>Hello<b><p> ${username}</p></b>,</p><p style=margin:0;>Thank you for signing up with Qadri Homeopathic Assistant. We are excited to have you on board!</p><p style=margin:0;margin-top:20px;>Start exploring our services and make the most of your health journey.</p></td></tr><tr><td style=padding:20px;text-align:center;><a href=${activation_link} style=background-color:#4a90e2;color:#ffffff;border-radius:10px;text-decoration:none;font-size:16px;padding:10px 20px;>visit website</a></td></tr><tr><td style=padding:20px;text-align:center;font-size:14px;color:#666;><p style=margin:0;>If you have any questions, feel free to contact us at <a href=mailto:support@qadri.com style=color:#4a90e2;text-decoration:none;>support@qadri.com</a>.</p><p style=margin:0;margin-top:20px;>Best Regards,<br>The Qadri Homeopathic Team</p></td></tr><tr><td style=background-color:#f1f1f1;padding:10px;text-align:center;font-size:12px;color:#999;><p style=margin:0;>&copy; 2024 Qadri Homeopathic. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
    res.json({ message: 'Welcome email sent successfully!' });
  });
});