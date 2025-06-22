const fs = require('fs');

/*fs.writeFile("hello.txt","hey welcome to vs code",function(err){
    if(err) console.log(err);
    else console.log("done");
})

fs.appendFile("hello.txt"," nhope you enjoyed here.",function(err){
    if(err) console.log(err);
    else console.log("done2");
})*/

fs.unlink("hello.txt",function(err){
    if(err) console.log(err);
    else console.log("unlinked");
})

//NPM understanding

//install -> npm i pkgname
//uninstall -> npm uninstall pkgname
//install particular versions -> npm i pkgname@version

//Express.js framework 

const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3000);
