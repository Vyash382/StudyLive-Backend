const deepgram = require('@deepgram/sdk');
require('dotenv').config();
async function listen(url) {
  const deepgramApiKey = process.env.deepgramApiKey;
  const dgClient = deepgram.createClient(deepgramApiKey);

  const { result, error } = await dgClient.listen.prerecorded.transcribeUrl(
    { url },
    {
      model: 'nova-3',
      language: 'en',
    }
  );

  if (error) {
    console.error(error);
  } else {
    return result.results.channels[0].alternatives[0].transcript;
  }
}
module.exports = {listen};
