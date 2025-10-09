import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/exchange-token', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.devcheck.store/');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'Code is required' });
  console.log("In exchange-token route, code:", code);
  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    console.log("Response from GitHub:", response.data);

    const access_token = response.data.access_token;

    if (!access_token) {
      return res.status(401).json({ error: 'Failed to get access token' });
    }

    res.json({ access_token });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
