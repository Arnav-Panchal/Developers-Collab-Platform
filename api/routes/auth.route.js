import express from 'express';
import { google, login, signup, github } from '../controllers/auth.controller.js';
import { uploadProject } from '../controllers/project.controller.js';
// const Repository = require('../models/projectModel.js');


// const existingRepo = await Repository.findOne({
//     email: email,
//     'repository.full_name': repository.full_name,
//   });
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', google);
router.post('/github', github);
router.post('/upload-project', uploadProject);
// router.get('/repositories/:email', async (req, res) => {
//     const { email } = req.params;
//     try {
//       const repos = await Repository.find({ email: email });
//       return res.status(200).json(repos);
//     } catch (error) {
//       console.error('Error fetching repositories:', error);
//       return res.status(500).json({ message: 'Server error' });
//     }
//   });


export default router;
