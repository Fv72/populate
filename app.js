const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')

const app = express();

// Handlebars
app.engine('hbs', exphbs({ defaultLayout: 'main', extname: 'hbs', handlebars: allowInsecurePrototypeAccess(Handlebars) }));
app.set('view engine', 'hbs')

// BodyParser
app.use(bodyParser.urlencoded({
    extended: true
}));


// MongoDB
mongoose.connect("mongodb://localhost:27018/boutiqueGame", { useNewUrlParser: true })

const productSchema = {
    title: String,
    Content: String,
    Price: Number
};

const Product = mongoose.model("product", productSchema)

// Routes
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
    .post((req, res) => {
        const newProduct = new Product({
            title: req.body.title,
            content: req.body.content,
            Price: req.body.price
        });
        newProduct.save(function(err) {
            if (!err) {
                res.send("Save OK !")
            } else {
                res.send(err)
            }
        })
    })
    .put(function(req, res) {
        Product.updateOne(
            // CONDITION //
            { _id: req.params.id },
            // UPDATE //
            {
                title: req.body.title,
                content: req.body.content,
                price: req.body.price
            },
            // OPTION //
            // PERMET DE FAIRE PLUSIEURS MODIFS D'UN COUP //
            { multi: true },
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
    .delete()

// ROUTE EDITION //

app.route("/:id")
    .get(function(req, res) {
        Product.findOne({ _id: req.params.id },
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


.put()

app.listen(4000, function() {
    console.log("écoute le port 4000");

})