var express = require('express');
var ParseServer = require('parse-server').ParseServer
var app = express();


var api = new ParseServer({
  databaseURI: 'mongodb://useradmin:useradmin@ds237770.mlab.com:37770/agiledirtybit',
  appId: 'APP_ID_DIRTYBIT',
  masterKey: 'MY_MASTER_KEY',

  emailAdapter: {
    module: 'parse-server-mailjet-adapter',
    options: {
      apiKey: 'a2659f20a805f6794f7604eb5d578ea1',
      apiSecret: 'a2659f20a805f6794f7604eb5d578ea1',
      apiErrorEmail:'edcarril@ucsd.edu',
      fromEmail: 'edcarril@ucsd.edu',
      fromName: 'Agile By DirtyBit',

      //Params for resetting the password emails

      passwordResetSubject: '[PASSWORD RESET]',
      passwordResetTemplateId: 'Hi, \n\nYou requested to reset your password for click here. {{var: link}}',

    }
  }
});


app.use('/parse', api);

app.listen(1337, function(){
  console.log('Agile-DirtyBit Custom Parse server running on port 1337.');
})
