const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const {
    allowInsecurePrototypeAccess
} = require('@handlebars/allow-prototype-access')
const methodeOverride = require("method-override")
const sharp = require("sharp")

const path = require("path")

// UPLOAD IMAGE  //
const multer = require("multer")

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/uploads')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1 * 4098 * 4098,
        files: 1
    },
    fileFilter: function(req, file, cb) {
        if (

            file.mimetype === "image/png" ||
            file.mimetype === "image/jpg" ||
            file.mimetype === "image/gif" ||
            file.mimetype === "image/jpeg"
        ) {
            cb(null, true)
        } else {
            cb(null, false)
            cb(new Error('Le fichier doit être au format jpg, png, gif ou jpeg !'))
        }



    }
})

// EXPRESS //
const port = 1996;
const app = express();

// EXPRESS STATIQUE //

app.use(express.static("public"))

// METHODE-OVERRIDE
app.use(methodeOverride("_method"))


// Handlebars
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: 'hbs',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'hbs')

// BodyParser
app.use(bodyParser.urlencoded({
    extended: true
}));


// MongoDB
mongoose.connect("mongodb://localhost:27017/boutiqueGame", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const productSchema = new mongoose.Schema({
    title: String,
    content: String,
    price: Number,
    cover: {
        name: String,
        originalName: String,
        path: String,
        urlSharp: String,
        createAt: Date
    }
});

const categorySchema = new mongoose.Schema({
    title: String
})

const Product = mongoose.model("product", productSchema)
const Category = mongoose.model("category", categorySchema)

// Routes

app.route("/category")
    .get((req, res) => {
        Category.find((err, category) => {
            if (!err) {
                res.render("category", {
                    category: category
                })
            } else {
                res.send(err)
            }
        })
    })

.post((req, res) => {
    const newCategory = new Category({

        title: req.body.title
    })
    newCategory.save(function(err) {
        if (!err) {
            res.send("Category save")
        } else {
            res.send(err)
        }

    })
})

app.route("/")
    .get((req, res) => {
        // MODEL FIND //
        Product.find(function(err, produit) {
            if (!err) {
                res.render("index", {
                    product: produit
                })
            } else {
                res.send(err)
            }

        })
    })

.post(upload.single("cover"), (req, res) => {

    const file = req.file;
    console.log(file);
    sharp(file.path)
        .resize(200)
        .webp({
            quality: 80
        })
        .toFile('./public/uploads/web/' + file.originalname.split('.').slice(0, -1).join('.') + ".webp", (err, info) => {});
    const newProduct = new Product({
        title: req.body.title,
        content: req.body.content,
        price: req.body.price
    })

    if (file) {
        newProduct.cover = {
            name: file.filename,
            originalName: file.originalname,
            path: file.path.replace("public", ""),
            urlSharp: '/uploads/web/' + file.originalname.split('.').slice(0, -1).join('.') + ".webp",
            createAt: Date.now(),
        }
    }

    newProduct.save(function(err) {

        if (!err) {
            res.send("save ok !")
        } else {
            res.send(err)
        }
    })
})


.delete(function(req, res) {
    Product.deleteMany(function(err) {
        if (!err) {
            res.send("All delete")
        } else {
            res.send(err)
        }
    })

})

// ROUTE EDITION //

app.route("/:id")
    .get(function(req, res) {
        Product.findOne({
                _id: req.params.id
            },
            function(err, produit) {
                if (!err) {
                    res.render("edition", {

                        _id: produit.id,
                        title: produit.title,
                        content: produit.content,
                        price: produit.price
                    })
                } else {
                    res.send("err")
                }
            }
        )
    })

.put(function(req, res) {
    Product.updateOne(
        // CONDITION //
        {
            _id: req.params.id
        },
        // UPDATE //
        {
            title: req.body.title,
            content: req.body.content,
            price: req.body.price
        },
        // OPTION //
        // PERMET DE FAIRE PLUSIEURS MODIFS D'UN COUP //
        {
            multi: true
        },
        // EXEC //
        function(err) {
            if (!err) {
                res.send("Update OK !")
            } else {
                res.send(err)
            }
        }
    )
})

.delete(function(req, res) {

    Product.deleteOne({
            _id: req.params.id
        },
        function(err) {

            if (!err) {
                res.send("Product delete !")
            } else {
                res.send(err)
            }
        }
    )
})




app.listen(port, function() {
    console.log(`Ecoute le port ${port}, lancé à : ${new Date().toLocaleString()}`);
})