// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var _ = require('lodash')
var bodyparser = require('body-parser')
var cors = require('cors')



var publicMailjetAPIKey = process.env.MJ_APIKEY_PUBLIC
var privateMailjetAPIKey = process.env.MJ_APIKEY_PRIVATE
var mailjet = require('node-mailjet').connect(publicMailjetAPIKey, privateMailjetAPIKey)
var MAILJET_SIGNUP = 410213








var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({

  // Your apps name. This will appear in the subject and body of the emails that are sent.
  appName: "Agility",
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  appId: process.env.APP_ID || "myAppId",
  masterKey: process.env.MASTER_KEY || '',
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',

  // The options for the email adapter
  emailAdapter: {
    module: "parse-server-mailjet-adapter",
    options: {
      // The API key from your Mailjet account
      apiKey: publicMailjetAPIKey,
      // The API secret from your Mailjet account
      apiSecret: privateMailjetAPIKey,
      // The email to send Mailjet templates bug reports to
      apiErrorEmail: "edcarril@ucsd.edu",
      // The email address that your emails come from
      fromEmail: "edcarril@ucsd.edu",
      // The name do display as the sender (optional)
      fromName: "Agility",
      //
      // Parameters for the reset password emails
      //
      // The subject of the email to reset the password
      passwordResetSubject: "Reset My Password",
      // Set it to use a template with your Mailjet account.
      // This is the id of the template to use.
    //  passwordResetTemplateId: 12345,
      // If you do not use template, you can set the plain text part here
      passwordResetTextPart: "Hi,\n\nYou requested to reset your password for {{var:appName}}.\n\nPlease, click here to set a new password: {{var:link}}",
      // If you do not use template, you can set the html part here
    //  passwordResetHtmlPart: "Hi,<p>You requested to reset your password for <b>{{var:appName}}</b>.</p><p>Please, click here to set a new password: {{var:link}}</p>",
      //
      // Parameters for the email verification emails
      //
      // The subject of the email to reset the password
      verificationEmailSubject: "Verify your email",
      // Set it to use a template with your Mailjet account.
      // This is the id of the template to use.
    //  verificationEmailTemplateId: 67890,
      // If you do not use template, you can set the plain text part here
      verificationEmailTextPart: "Hi,\n\nYou are being asked to confirm the e-mail address {{var:email}} with {{var:appName}}\n\nClick here to confirm it: {{var:link}}",
      // If you do not use template, you can set the html part here
  //    verificationEmailHtmlPart: "Hi,<p>You are being asked to confirm the e-mail address {{var:email}} with <b>{{var:appName}}</b></p><p>Click here to confirm it: {{var:link}}</p>",

      // Optional: A callback function that returns the options used for sending
      // verification and password reset emails. The returned options are merged
      // with this options object.
      // If needed, this function can also return a promise for an options object.
      getIndividualOptions: function(targetOpts) {
        var toMail = targetOpts.to || (targetOpts.user && targetOpts.user.get("email"));
        if (toMail === "queen@buckingham.palace") {
          return {
            passwordResetSubject: "Please reset your password your Highness"
          }
        }
        return {}
      }
    }
  },
  publicServerURL:process.env.SERVER_URL || 'http://localhost:1337/parse'

});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

app.use(bodyparser.json())
app.use(cors())

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
       "To": _.map(req.body.recipients, function(to){
         return {Email: to, name: req.body.user.username || "New User" }
       }),
       "TemplateID": 410213,
       "TemplateLanguage": true,
       "Subject": "Agile Welcome",
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
