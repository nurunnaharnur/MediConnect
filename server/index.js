import express from 'express'
import homeRoutes from './routes/homeRoutes.js'
import authRoutes from "./routes/authRoutes.js"

const app = express()
app.listen(3000,()=>{
    console.log("Server running on port 3000")
})

app.use('/api/home', homeRoutes)
app.use('/api/auth', authRoutes)