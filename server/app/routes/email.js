var Mailgun = require('mailgun-js');
var router = require('express').Router();

var api_key = 'key-41db0dce35d2a82ef5ccdfc02c59f7d1';
var domain = 'sandbox2a9bc24475174d6bab636084b47af603.mailgun.org';

router.get('/submit/:mail', function(req, res) {

    //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
    var mailgun = new Mailgun({apiKey: api_key, domain: domain});

    var data = {
    //Specify email data
      from: 'z1660218@gmail.com', 
      to: req.params.mail,   
      subject: 'Your Code Friends order',
      html: 'Thank you for your order' 
    }

    //Invokes the method to send emails given the above data with the helper library
    mailgun.messages().send(data, function (err, body) {
        if (err) {
            //res.render('error', { error : err});
            console.log("got an error: ", err);
        }
        else {
            console.log(body);
        }
    });

});

module.exports = router;
