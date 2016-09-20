var Mailgun = require('mailgun-js');
var router = require('express').Router();
var Order = require('../../db').model('order');

var api_key = 'key-41db0dce35d2a82ef5ccdfc02c59f7d1';
var domain = 'sandbox2a9bc24475174d6bab636084b47af603.mailgun.org';
var from_who = 'z1660218@gmail.com';


// Send a message to the specified email address when you navigate to /submit/someaddr@email.com
// The index redirects here
router.get('/submit/:mail', function(req, res) {

    //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
    var mailgun = new Mailgun({apiKey: api_key, domain: domain});

    var data = {
    //Specify email data
      from: 'z1660218@gmail.com', 
      to: req.params.mail,   
      subject: 'Your Code Friends order',
      html: 'Thank you  <a href="http://0.0.0.0:3030/validate?' + req.params.mail + '">Click here to add your email address to a mailing list</a>'
    }

    //Invokes the method to send emails given the above data with the helper library
    mailgun.messages().send(data, function (err, body) {
        //If there is an error, render the error page
        if (err) {
            //res.render('error', { error : err});
            console.log("got an error: ", err);
        }
        //Else we can greet    and leave
        else {
            //Here "submitted.jade" is the view file for this landing page 
            //We pass the variable "email" from the url parameter in an object rendered by Jade
            //res.render('submitted', { email : req.params.mail });
            console.log(body);
        }
    });

});

module.exports = router;
