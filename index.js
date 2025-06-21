import express from 'express'
import dotenv, { config } from 'dotenv'
import multer from 'multer'

import fs from 'fs' 
import path from 'path'

import { createPartFromUri, createUserContent, GoogleGenAI } from '@google/genai'
import { MIMEType } from 'util'

//setup aplikasi 

dotenv.config()

//inisialisasi express
const app = express()
app.use(

//tambahkan Exprees JSON Middleware
//content-type: aplication/json
    express.json()
)

//inisisalisasi model gemini
const genAi = new GoogleGenAI({ apiKey: process.env.API_KEY});

// async function main() {
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: "Explain how AI works in a few words",
//     config: {
//       thinkingConfig: {
//         thinkingBudget: 0, // Disables thinking
//       },
//     }
//   });
//   console.log(response.text);
// }

// await main();

  const result = await genAi.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Hi, ",
    config: {
      thinkingConfig: {
        thinkingBudget: 0, // Disables thinking
      },
    }
  });
//   console.log(result + result.text);

const upload = multer({
    dest: 'uploads/'
})

//route Enpoints

app.post('/generate-text', async (req, res) => {

    const {prompt} = req.body
    try {
        const result = await genAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt }) 

res.json({
        output: result.text
    })


}
// menangani error
    catch (e) {
        console.error(e)
        res.status(500).json({
            error: e.message || 'Terjadi kesalahan saat memproses permintaan'
        })
    }
    })


// Endpoint untuk menghasilkan gambar
/* * Endpoint ini menerima permintaan POST dengan file gambar dan prompt,
   * kemudian menghasilkan gambar berdasarkan prompt tersebut.
   * Pastikan untuk mengirimkan file gambar dengan nama 'image' dan prompt dalam body request.
   * upload.sinle('image') digunakan untuk menangani upload file gambar.
   * Hasil gambar akan dikembalikan dalam format JSON dengan URL gambar yang dihasilkan.
   * contoh: upload.single('file') ---> yang dicari di FormData bernama 'file'
   */

// app.post('/generate-image', upload.single('image'), async (req, res) => {
//     const { prompt = "Jelaskan gambar yang diupload" } = req.body
//     const imagePath = req.file.path

//     try {
//         const result = await genAi.models.generateImage({
//             model: "gemini-2.5-flash",
//             contents: prompt,
//             image: fs.createReadStream(imagePath)
//         })

//         // Hapus file gambar setelah digunakan
//         fs.unlinkSync(imagePath)

//         res.json({
//             output: result.imageUrl
//         })
//     } catch (e) {
//         console.error(e)
//         res.status(500).json({
//             error: e.message || 'Terjadi kesalahan saat memproses permintaan'
//         })
//     }
// })

app.post('/generate-image', upload.single('image'), async (req, res) => {
    const { prompt = "Jelaskan gambar yang diupload" } = req.body

    try {
    const image = await genAi.files.upload({
    file: req.file.path,
    config: {
        mimeType: req.file.mimetype
    }
})


    const result = await genAi.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
                createUserContent([
                prompt,
                createPartFromUri(image.uri, image.mimeType)
                ])
            ]
        })
res.json({output: result.text})

    }
    catch (e) {
        console.error(e)
        res.status(500).json({
            error: e.message || 'Terjadi kesalahan saat memproses permintaan'
        })
    } finally {
        // Hapus file gambar setelah digunakan
        fs.unlinkSync(req.file.path)
    }
})

/* Untuk menguji endpoint generate-image, Anda dapat menggunakan Postman atau curl. berikut adalah contoh penggunaan curl untuk mengirim permintaan POST dengan gambar dan prompt:
// Contoh penggunaan curl untuk mengirim permintaan POST dengan gambar dan prompt
curl -X POST -F "prompt=Ini adalah gambar seekor kucing yang sedang duduk di atas meja" -F "image=@C:\Users\Pictures\20210930_181554.jpg" http://localhost:3000/generate-image   

Pastikan untuk mengganti path gambar dengan path yang sesuai di sistem Anda.
catatan : buat komentar pada function finally jika ingin memastikan file sudah berhasil atau tidak
*/


app.post('/generate-from-document', upload.single('image'), async (req, res) => {
    const { prompt = "Jelaskan dokumen yang diupload" } = req.body

    try {
        const filePath = req.file.path
        const base64 = buffer.toString('base64')
        // Cek apakah file ada
        const buffer = fs.readFileSync(filePath)
        const MIMEType = require.file.mimeType

        const documentPart = {
            inlineData: { data: base64, mimeType }
            }
        


        const result = await genAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                createUserContent([
                    prompt,
                    createPartFromUri(document.uri, document.mimeType)
                ])
            ]
        })

        res.json({ output: result.text })
    } catch (e) {
        console.error(e)
        res.status(500).json({
            error: e.message || 'Terjadi kesalahan saat memproses permintaan'
        })
    } finally {
        // // Hapus file dokumen setelah digunakan
        // fs.unlinkSync(req.file.path)
    }
})


app.post('/generate-from-audio', upload.single('image'), async (req, res) => {
    const { prompt = "Jelaskan audio  yang diupload" } = req.body
    try {
        const filePath = req.file.path
        const base64 = fs.readFileSync(filePath).toString('base64')
        const mimeType = req.file.mimetype

        const audioPart = {
            inlineData: { data: base64, mimeType }
        }

        const result = await genAi.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                createUserContent([
                    prompt,
                    createPartFromUri(audioPart.uri, audioPart.mimeType)
                ])
            ]
        })

        res.json({ output: result.text })
    } catch (e) {
        console.error(e)
        res.status(500).json({
            error: e.message || 'Terjadi kesalahan saat memproses permintaan'
        })
    } finally {
        // Hapus file audio setelah digunakan
        fs.unlinkSync(req.file.path)
    }

})









//penanganan server error dan start server 
const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`)
    console.log("server berjalan")
})


console.log("serverjalan")
