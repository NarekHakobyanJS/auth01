import express from 'express';
import mongoose from 'mongoose';
import { registerValidation } from './validations/auth.js';
import { validationResult } from 'express-validator';
import UserModel from './models/User.js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import checkAuth from './utils/checkAuth.js'

mongoose.connect('mongodb://localhost:27017/posts')
    .then(() => console.log("DB ok"))
    .catch((err) => console.log("DB error", err))

const app = express()
const port = 3003

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/auth/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json(errors.array())
        }

        const password = req.body.password
        const salt = await bcryptjs.genSalt(10)
        const hash = await bcryptjs.hash(password, salt)

        const doc = new UserModel({
            email: req.body.email,
            fullName: req.body.fullName,
            avatarUrl: req.body.avatarUrl,
            passwordHash: hash
        })

        const user = await doc.save();

        const token = jwt.sign({
            _id: user._id,
        },
            'secret123', {
            expiresIn: "30d"
        })


        const { passwordHash, ...userData } = user._doc
        res.json({
            ...userData,
            token
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "msg": "Chkaroxacanq grancvel"
        })
    }

})

app.post('/auth/login', async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email })

        if (!user) {
            return req.status(404).json({
                "msg": "Users Not Found"
            })
        }

        const isValidPass = await bcryptjs.compare(req.body.password, user._doc.passwordHash)

        if (!isValidPass) {
            return res.status(400).json({
                "msg": "No Login or Password"
            })
        }

        const token = jwt.sign({
            _id: user._id,
        },
            'secret123',
            {
                expiresIn: '30d'
            }
        )

        const { passwordHash, ...userData } = user._doc
        res.json({
            ...userData,
            token
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "msg": "Chkaroxacanq grancvel"
        })
    }
})

app.get('/auth/me', checkAuth, async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId)
console.log(user);

        if(!user) {
            return res.status(404)
                .json({'msg' : "user not found"})
        }

        const { passwordHash, ...userData } = user._doc
        res.json({
            ...userData,
            
        })
    } catch (error) {
        res.status(500).json({
            msg : 'vata'
        })
    }
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})