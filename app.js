const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);


//mongoose db & collections creation
mongoose.connect("mongodb://localhost:27017/BlogDb");
const contentSchema = new mongoose.Schema({
  name:String,
  context: String
});
const Default = mongoose.model("default",contentSchema);
const Post = mongoose.model("post",contentSchema);

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


const home = new Default({
  name:"home",
  context:homeStartingContent
});
const about =  new Default({
  name:"about",
  context:aboutContent
});
const contact = new Default({
  name:"contact",
  context:contactContent
});
//inserting default info to the db inside  Default moel
const defaultContents = [home,about,contact];
// Default.insertMany(defaultContents).then(
//   function(){
//      console.log("defaults are inserted");
//   }
// ).catch(
//   function(err){
//     console.log(err);
//   }
// );

const defaultPost = new Post({
  name: "morning",
  context: "everyaday is a good day so gooooooodyyyyyy mrnnnnnnnnnnnnnnnnnngggggggggggggggg !!!!!!"
});
//defaultPost.save();

app.get("/",function(req,res){
  //finding home content

  Post.find().then(
    function(posts){

      res.render("home",{start: homeStartingContent, posts: posts});
    }
  ).catch(function(err){console.log(err);});

});
app.get("/about",function(req,res){
  res.render("about",{about: aboutContent});
});

app.get("/contact",function(req,res){
  res.render("contact",{contact: contactContent});
});

app.get("/compose",function(req,res){
  res.render("compose");
});
app.get("/posts/:topic",function(req,res){
  var post_title = _.lowerCase(req.params.topic);
  console.log(post_title);

  Post.findOne({name:post_title}).then(
      function(post){
        res.render("post",{title:post.name,content:post.context});
      }
  ).catch(function(err){console.log("not found post");});

})
app.post("/compose", function(req,res){
  var title = _.lowerCase(req.body.composeTitle);
  var content = req.body.composeContent;
  //let seo_title="";
  // async function runCompletion () {
  //   try {
  //     const completion = await openai.createCompletion({
  //       model: "text-davinci-003",
  //       prompt: "give me sutiable title to enhance the seo for the blog:"+content,
  //     });
  //     var seo_title =completion.data.choices[0].text;
  //     console.log(seo_title);
  //     console.log("new title created");
  //     var composeDetails = new Post({
  //             name: _.lowerCase(seo_title),
  //             context: content
  //     });
  //     composeDetails.save();
  //     console.log("new post inserted");
  //   } catch (error) {
  //     if (error.response) {
  //       console.log(error.response.status);
  //       console.log(error.response.data);
  //     } else {
  //       console.log(error.message);
  //     }
  //   }
  //
  // }
  //
  // runCompletion();


  Post.findOne({name:title}).then(function(post){
    if(!post){
      let seo_title="";
      async function runCompletion () {
        try {
          const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: "give me sutiable title to enhance the seo for the blog of topic:"+title+content,
          });
          var seo_title =completion.data.choices[0].text;
          console.log(seo_title);
          console.log("new title created");
          var composeDetails = new Post({
                  name: _.lowerCase(seo_title),
                  context: content
          });
          composeDetails.save();
          console.log("new post inserted");
        } catch (error) {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
            var composeDetails = new Post({
                    name: title,
                    context: content
            });
            composeDetails.save();

          } else {
            console.log(error.message);
            var composeDetails = new Post({
                    name: title,
                    context: content
            });
            composeDetails.save();
          }
        }

      }

      runCompletion();
    }
    else {
      post.context = content;
      post.save();
      console.log("updated");
    }
  }
).catch(function(err){
  console.log(err);
});

  res.redirect("/");
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
