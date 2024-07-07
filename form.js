const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator'); // middleware for form validation 
const cors = require('cors');
const multer = require('multer'); // Import multer
const path = require('path');
const sharp = require('sharp');
const { getDb } = require("./db"); // Updated import to get the db object

// Instantiating Express
const app = express();
app.use(express.static('public'));
// Middleware Use
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // installing cors to allow access 

// Serve the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setting up Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // specifying the destination directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // specify the file name
    }
});

const upload = multer({ storage: storage }); // Create the upload object

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
//validating form infos
app.post('/data', upload.single('image'),
[
    body('fullName')
        .notEmpty().withMessage('Full name is required')
        .matches(/^[A-Za-z]+\s[A-Za-z]+$/).withMessage('Full name must contain first and last name'),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('phoneNumber')
        .notEmpty().withMessage('Phone number is required')
        .isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits')
        .isNumeric().withMessage('Phone number must contain only numbers'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d]+$/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
]
, async (req, res) => {
    console.log("Request body:", req.body);
    console.log("File:", req.file);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, phoneNumber, password } = req.body;
    //validating file uploads 
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    //REGEXP FOR IMAGE UPLOAD OPTIONAL 
    // if (req.file) {
    //     try {
    //         // Validate image dimensions
    //         const metadata = await sharp(req.file.path).metadata();
    //         const maxWidth = 800; // Define your desired width
    //         const maxHeight = 800; // Define your desired height

    //         if (metadata.width !== maxWidth || metadata.height !== maxHeight) {
    //             return res.status(400).json({ error: 'Image must be 800x800 pixels' });
    //         }
    //     } catch (error) {
    //         console.error('Error processing image:', error);
    //         return res.status(500).json({ error: 'Error processing image' });
    //     }
    // }

    //receiving datas from the frontend and inserting into the database 
    try {
        const db = getDb();
        if (!db) {
            throw new Error("Database not connected");
        }
        console.log("Inserting data into the database...");
        const result = await db.collection("loginss").insertOne({ fullName, email, phone: phoneNumber, password, imagePath });
         console.log("Data inserted:", result);
        res.json({ message: 'Form submitted successfully', data: result.insertedId });
    } catch (err) {
        console.error("Error inserting data:", err.message);
        res.status(500).json({ error: err.message });
    }
});
//getting datas from database to display on the frontend 
app.get('/data', async (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            throw new Error("Database not connected");
        }
        const data = await db.collection("loginss").find().toArray();
        console.log("Data retrieved from the database:", data);
        res.status(200).json(data);
    } catch (err) {
        console.error("Error retrieving data:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(45, () => {
    console.log('Server is running on port 45');
});

