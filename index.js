require('dotenv').config()
var jsforce = require("jsforce");
var bodyParser = require('body-parser');
var conn = new jsforce.Connection();
var loggedIn = false;


//For username / password flow
var username = process.env.SALEFORCE_ACCOUNT_NAME || null;
var password = process.env.SALEFORCE_ACCOUNT_PASSWORD || null;
var token = process.env.SALEFORCE_ACCOUNT_TOKEN || null;
var production = process.env.SALEFORCE_ACCOUNT_PRODUCTION || true;
var api_version = process.env.SALEFORCE_ACCOUNT_VERSION || '45.0';
var deployToWeb = process.env.deployToWeb || true; 

if(deployToWeb) {
    var port = process.env.PORT || 3030;
    var express = require('express');
    var app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json())

    app.get('/', function(req, res) {
        res.json({"status":"online"});
    });

    app.get('/contacts/', function(req, res) {
        conn.query("SELECT Id, Name, FIELDS(CUSTOM) FROM Contact limit 200", function(err, result) {
            if (err) { res.json(err); }
            res.json(result);
        });
    });

    app.put('/contacts/', function(req, res) {
        try {
            const {data} = req.body;
            conn.sobject("Contact").update(data, function(err, ret) {
                if (err || !ret.success) { res.json({status: 'fail', data: err});}
                else{
                    res.json({status: 'success', data: data});
                }
            });
        } catch (error) {
            res.json({status: 'fail', data: error});
        }

    }) ;

    //setup actual server
    app.listen(port, function () {
        consoleLogBoxMessage('Server run on port: '+ port);
    });
}

function login(callback) {
    if(!production) { conn.loginUrl = 'https://test.salesforce.com'; }
    if(username && password && token) {
        conn.version = api_version;
        conn.login(username, password+token, function(err, res) {
            if (err) { return console.error(err); }
            else { 
                loggedIn = true; 
                consoleLogBoxMessage("Succcessfully logged into Salesforce");
                if(callback){callback();}
            }
          });
    }
    else {
        console.log("Username and password not setup.")
    }
}


//find contacts using plain SOQL
//More on SOQL here: https://trailhead.salesforce.com/en/content/learn/modules/apex_database
// function displayContactsSOQL() {
//     conn.query("SELECT Id, Name, CreatedDate FROM Contact", function(err, result) {
//         if (err) { return console.error(err); }
//         console.log("total : " + result.totalSize);
//         for (var i=0; i<result.records.length; i++) {
//             var record = result.records[i];
//             console.log("Name: " + record.Name);
//             console.log("Created Date: " + record.CreatedDate);
//         }
//       });
// }


//find contacts by listening to events
// function displayContactsEventMethod() {
//     console.log('event');
    
//     var records = [];
//     var query = conn.query("SELECT Id, Name FROM Contact")
//     .on("record", function(record) {
//         records.push(record);
//         console.log(record);
//     })
//     .on("end", function() {
//         console.log("total fetched : " + query.totalFetched);
//     })
//     .on("error", function(err) {
//         console.error(err);
//     })
//     .run({ autoFetch : true }); // synonym of Query#execute();
// }

//find contacts by constructing the query in a method chain
// function displayContactsMethodChain() {
//     //
//     // Following query is equivalent to this SOQL
//     //
//     // "SELECT Id, Name, CreatedDate FROM Contact
//     //  WHERE LastName LIKE 'A%' 
//     //  ORDER BY CreatedDate DESC, Name ASC
//     //  LIMIT 5"
//     //
//     console.log('method');
//     conn.sobject("Contact")
//         .find({
//         FirstName : { $like : 'Demo%' }
//         },
//         'Id, Name, CreatedDate' // fields can be string of comma-separated field names
//                                 // or array of field names (e.g. [ 'Id', 'Name', 'CreatedDate' ])
//         )
//         .sort('-CreatedDate Name') // if "-" is prefixed to field name, considered as descending.
//         .limit(5)
//         .execute(function(err, records) {
//         if (err) { return console.error(err); }
//         console.log("record length = " + records.length);
//         for (var i=0; i<records.length; i++) {
//             var record = records[i];
//             console.log("Name: " + record.Name);
//             console.log("Created Date: " + record.CreatedDate);
//         }
//     });
// }

// function createContact() {
//     console.log('create');
//     conn.sobject("Contact").create({FirstName: 'APIDemo', LastName: 'User'}, function(err, ret) {
//         if (err || !ret.success) { return console.error(err, ret); }
//         else {
//             console.log("Created record id : " + ret.id);
//         }
//       });
// }

// function updateContact() {
//     // Single record update.  For multiple records, provide update() with an array
//     // Always include record id in fields for update
//     // You can also update and insert from the same array.
//     conn.query("SELECT Id, Name FROM Contact WHERE FirstName = 'APIDemo'")
//     .on("record", function(record) {
//         conn.sobject("Contact").update({Id: record.Id, LastName: 'Smith'}, function(err, ret) {
//             if (err || !ret.success) { return console.error(err, ret); }
//             console.log('Updated Successfully : ' + ret.id);
//         });
//     });
    
// }

// function deleteContact() {
//     conn.query("SELECT Id, Name FROM Contact WHERE FirstName = 'APIDemo'")
//     .on("record", function(record) {
//         conn.sobject("Contact").delete(record.Id, function(err, ret) {
//             if (err || !ret.success) { return console.error(err, ret); }
//             console.log('Deleted Successfully : ' + ret.id);
//           });
//     });
// }


//to test out the above code on the command line:
//node index.js {command}
//
//where command is one of the case statements below
var callback = null;
// if (process.argv[2]) { 
//     console.log(process.argv[2]);
//     switch(process.argv[2]) {
//         case 'displayContactsSOQL': 
//             console.log('1');
//             callback = displayContactsSOQL; 
//             break;
//         case 'displayContactsEventMethod': 
//             console.log('2');
//             callback = displayContactsEventMethod; 
//             break;
//         case 'displayContactsMethodChain': 
//             console.log('3');
//             callback = displayContactsMethodChain; 
//             break;
//         case 'createContact': 
//             callback = createContact; 
//             break;
//         case 'updateContact': 
//             callback = updateContact; 
//             break;
//         case 'deleteContact': 
//             callback = deleteContact; 
//             break;
//     }
// }

function consoleLogMessage(mess){
    var odd = mess.length % 2;
    var len = 50;
    var str = mess.length ? ' ' + mess + ' ' : '**';
    for(var i = 1 ; i < (len - mess.length/2) ; i++)
        str = '*' + str;
    if(odd) str += ' ';
    for(var i = 1 ; i < (len - mess.length/2) ; i++)
        str += '*';
    console.log(str);
}

function consoleLogBoxMessage(mess){
    consoleLogMessage('');
    consoleLogMessage(mess);
    consoleLogMessage('');
}

login(callback);