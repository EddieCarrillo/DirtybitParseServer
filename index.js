// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var _ = require('lodash')
var bodyparser = require('body-parser')


var publicMailjetAPIKey = process.env.MJ_APIKEY_PUBLIC ||
var privateMailjetAPIKey = process.env.MJ_APIKEY_PRIVATE ||
var mailjet = require('node-mailjet').connect(publicMailjetAPIKey, privateMailjetAPIKey)
var MAILJET_SIGNUP = 410213








var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  // cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  appName: 'Agile',
  masterKey: process.env.MASTER_KEY || 'MASTER_KEY', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  emailAdapter: {
  module: 'parse-server-mailjet-adapter',
  options: {
    apiKey: 'a2659f20a805f6794f7604eb5d578ea1',
    apiSecret: 'a2659f20a805f6794f7604eb5d578ea1',
    apiErrorEmail:'edcarril@ucsd.edu',
    fromEmail: 'edcarril@ucsd.edu',
    fromName: 'Agile By DirtyBit',

    verificationEmailSubject: 'Verify your email',
    verificationEmailTextPart: 'Hi, \n\n\ You are being asked to confirm you email!\n{{var:link}}',

    //Params for resetting the password emails


    passwordResetSubject: '[PASSWORD RESET]',
    passwordResetTemplateId: 'Hi, \n\nYou requested to reset your password for click here. {{var: link}}',

  }
},
publicServerURL: process.env.SERVER_URL || 'http://localhost:1337/parse'
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

app.use(bodyparser.json())

// Serve static assets from the /public folder
// app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});


function createTemplateBody(variables,templateId, emailData){
  return _.merge(emailData, {
    TemplateLanguage: true,
    Variables: variables,
    TemplateID: templateId
  })
}

app.post('/email', function(req, res){

  var type = req.body.type
  console.log("type: ", type)
  if (type == "signup"){
    mailjet
 .post("send", {'version': 'v3.1'})
 .request({
   "Messages":[
     {
       "From": {
         "Email": "edcarril@ucsd.edu",
         "Name": "Agility"
       },
       "To": [
         {
           "Email": "edcarril@ucsd.edu",
           "Name": "eddie"
         }
       ],
       "TemplateID": 410213,
       "TemplateLanguage": true,
       "Subject": "Signup",
       "Variables": {
     "username": req.body.user.username ||  "New User"
   }
     }
   ]
 })
 .then((result) => {
  return res.send({ok: "ok"})
 })
 .catch((err) => {
   return res.status(500).send({error: err})
 })

}else {
  var to = req.body.recipients
  console.log("to: ", to)

    const request = mailjet.post("send")
    .request({
      FromEmail: "edcarril@ucsd.edu",
      FromName: "Agility",
      Subject: req.body.subject,
      "Text-part": req.body.message,
      Recipients: _.map(req.body.recipients, function(to){
        return {Email: to}
      })
    })
    .then(function(result){
      console.log("Good!")
      res.json({ok: "ok"})
    })
    .catch(function(reason){
        res.status(500).send({error: "Failed to send mail b/c.... ", reason})
    })
  }

})








// // There will be a test page available on the /test path of your server url
// // Remove this before launching your app
// app.get('/test', function(req, res) {
//   res.sendFile(path.join(__dirname, '/node_modules/parse-server/public/test.html'));
// });

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
