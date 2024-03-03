//Entranamiendo de las api
const express = require('express');
const { json } = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, updateDoc, collection, query, limit, getDocs, where, getDoc, addDoc, doc, deleteDoc } = require('firebase/firestore');
const { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const multer = require('multer');
const { memoryStorage } = require('multer');
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require("firebase/storage");
const isAuthenticated =require('./firebaseAuthentication')
const firebaseConfig =require('./firebaseConfig')
require('dotenv').config()
const { v4 } = require('uuid');
const app = express()
app.use(express.json())

app.use(cors());

// Conexión a Firebase
const appFirebase = initializeApp(firebaseConfig)
const auth = getAuth(appFirebase)
const db = getFirestore(appFirebase)
const firebaseStorage = getStorage(appFirebase)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

//Petición GET a API
app.get('/api', (req, res) => {
  const path = `/api/item/${v4()}`
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate')
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`)
})

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params
  res.end(`Item: ${slug}`)
})

// Autenticación
app.get('/api/isAuth', isAuthenticated, (req, res) => {
    const userId = req.user.uid
    res.json({ message: `Usuario autenticado con ID: ${userId}` })
  })

// Ruta para el endpoint de registro de usuario
app.post('/api/register', async (req, res) => {
    const { email, password, phone, name } = req.body
    try {
      // Crear usuario con correo y contraseña en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid
      // Guardar información adicional en Firestore
      await addDoc(collection(db, 'users'), {
          uid: uid,
          phone: phone,
          name: name
        })
      res.status(200).json({ message: 'Registro exitoso' })
    } catch (error) {
      console.error('Error al registrarse:', error.message)
      res.status(500).json({ error: error.message })
    }
  })
  let userCredential=""
  let user=""
  // Ruta para el endpoint de inicio de sesión
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body
    try {
        // Iniciar sesión con correo y contraseña
         userCredential = await signInWithEmailAndPassword(auth, email, password)
        console.log(await auth.currentUser.getIdToken())
         user = userCredential.user
  
  
        res.status(200).json({ isAuthorized: true, userID: user.uid , idToken: await auth.currentUser.getIdToken() })
      } catch (error) {
      console.error('Error al iniciar sesión:', error.message)
        res.status(500).json({ error: error.message })
    }
  })
  
  // Ruta para envío de correo de recuperación de contraseña
  app.post('/api/user/reset-password', async (req, res) => {
    const { email } = req.body
    try {
      const resetPassword = await sendPasswordResetEmail(auth, email)
      console.log(resetPassword)
      res.status(200).json({message: "Correo enviado exitosamete"})
    } catch (error) {
      console.error('Error al enviar el correo de restablecimiento de contraseña:', error)
      res.status(500).json({ error: error.message })
    }
  })

  // Inicio del servidor
const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`)
})

