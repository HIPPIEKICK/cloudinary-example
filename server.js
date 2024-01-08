import express from "express"
import cors from "cors"
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

dotenv.config()

const port = process.env.PORT || 8080
const app = express()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/imageUploadsCodealong"
mongoose.connect(mongoUrl)
mongoose.Promise = Promise

const Image = mongoose.model('Image', {
  name: String,
  imageUrl: String,
  folder: String
})

cloudinary.config({ 
  cloud_name: 'dykpkkl5g', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    allowedFormats: ['jpg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
})

const parser = multer({ storage })

const handleUpload = async (file, folder) => {
  const res = await cloudinary.uploader.upload(file, { folder })
  return res
}

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())

//Routes
app.get("/", (req, res) => {
  res.send("Hello Technigo!")
})

app.post('/images', parser.single('image'), async (req, res) => {
  const cloudinaryRes = await handleUpload(req.file.path, req.body.folder)
  
  try {
    const image = await new Image({ name: req.body.name, imageUrl: req.file.path, folder: req.body.folder }).save()
    res.json({ mongoDBImage: image, cloudinaryInfo: cloudinaryRes})
  } catch (err) {
    res.status(400).json({ errors: err.errors })
  }
})

app.get('/images', async (req, res) => {
  const images = await Image.find({})
  res.json(images)
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
