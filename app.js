//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-srividya:Test123@cluster0.mfhoq.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

const item1 = new Item ({
  name: "Buy Food"
});

const item2 = new Item ({
  name: "Cook Food"
});

const item3 = new Item ({
  name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted items");
        }
        res.redirect("/");
      });
    } else if (err) {
      console.log(err);
    } else {
      const day = date.getDate();
      res.render("list", {listTitle: day, newListItems: items});
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName
  });

  if (listName === date.getDate()) {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function(err, item) {
      item.items.push(newItem);
      item.save();
      res.redirect("/" + listName);
    })
  }

});

app.get("/:listType", function(req,res){
  const listName = _.capitalize(req.params.listType);
  List.findOne({ name: listName}, function(err, item) {
    if (!err) {
      if(!item) {
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save(() => {
          res.redirect("/" + listName);
        });
      } else {
        res.render("list", {listTitle: item.name, newListItems: item.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully deleted the item");
        res.redirect("/");
      }
    });
  } else {
   List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
     if (!err) {
       res.redirect("/" + listName);
     }
   }); 
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3002;
}

app.listen(port, function() {
  console.log("Server started");
});
