/*************************************************************************
 * 2014-03-18 Begin working with a new database and updated              *
 * CaptionsEnglish.txt source file.                                      *
 * This content is a NODE.JS SCRIPT TO POPULATE CAPTIONENG DATABASE      *
 * Collection                                                            *
 * Read the English glosses or tags as a readable stream, break on       *
 * newline terminators and print each line to the console such that      *
 * the gloss plus the corresponding English text is printed. Then insert *
 * the gloss and English fields into the captioneng document collection. *
 *-----------------------------------------------------------------------*
 * Target database engine: MONGODB 2.4.9                                 *
 * Required node.js module: mongodb                                      *
 * It can take time for this script to complete all the inserts for the  *
 * captioneng table. Give node and mongodb a few minutes to complete.    *
 * It could take up to 10 minutes. If you abort the script by pressing   *
 * CTRL-D or CTRL-C the database inserts will most likely not complete.  *
 ************************************************************************/
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

var totalLines = 0
var cdcnt = 0


var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

console.log("Connecting to " + host + ":" + port);
MongoClient.connect(format("mongodb://%s:%s/sgtypdb2?journal=true", host, port), function(err, db) {

        if (err) {
            throw err
            return
        }

        var collection = db.collection('captioneng')

        var input = fs.createReadStream('/Users/bobc/Documents/sgntyp_renamed_files_2014-03-08/converted_New_Captions_English_2014-03-08_.txt');
        readLines(input, func);

    function readLines(input, func) {
      var remaining = '';

      input.on('data', function(data) {
      remaining += data;
      var index1 = remaining.indexOf('\n');
      while (index1 > -1) {
          topindexprt(index1)
          var line = remaining.substring(0, index1);
          remaining = remaining.substring(index1 + 1);
          totalLines += 1
          if (totalLines === 1) {
             index1 = remaining.indexOf('\n')
             continue
          }

          index1 = remaining.indexOf('\n');       // recompute value of index1
          bottomindexprt(index1)
          var tbbl = line.indexOf('\t')           // find the index of the tab characgter
          var tg1 = line.slice(0,tbbl)            // save the string up to the tab character
          tbbl += 1                               // bump past tab character
          var tg2 = line.slice(tbbl)              // capture the slice
        /**************************************************************************
         * the String variable tg2 will contain all the characters up to and      *
         * including the end of line character or hex '0d'. Unless you trim this  *
         * nonprinting character out of the slice, it will end up in the en_ctext *
         * column, and then 'where' clauses won't match the en_ctext string       *
         * because the cell contains string plus x'0d'. So the String variable    *
         * tg3 is a new string that trims out the nonprinting character.          *
         *------------------------------------------------------------------------*
         * 2014-03-18 the variable tg3 should not be needed if the input file has *
         * been processed with a dos2unix or similar utility program that creates *
         * Unix-style newline characters. Due to this, the code creating tg3 is   *
         * commented out.                                                         *
         *************************************************************************/
          //var tg3 = tg2.slice(0,(tg2.length-1))
        /**************************************************************************
         * If you don't want to see the data, comment out the console.log lines   *
         *************************************************************************/
      console.log('\nTag 1 ' + tg1 + ' Tag 2 ' + tg2 + '\n')    // print tags 1 and 2
      collection.insert([{ 'cgloss':tg1, 'cpage': 0, 'en_ctext': tg2 }], function(err, result) {
          if (err) {
              throw err
          }
          cdcnt++
      });
    
  }
})
//TODO Improve end of input code
  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
    // Try a 10 second timer before writing to the console
    setTimeout(function () {
        console.log('\nTotal number of lines including header row: ' + totalLines + '\n')
        for(var pj = 0; pj < 1300000; pj++) {
            var pk = 0
            pk++
        }
    }, 10000)

//TODO If you don't have a header row it just closes the database without console messages
      
      if (cdcnt === totalLines) {
          db.close()
      } else {
          console.log('Total documents committed to database is ' + cdcnt)
          console.log('Setting a 180-second 3 minute timer up to close connection ')
          setTimeout(function () {
           //   console.log('Count of documents ' + collection.count())
              db.close()
          }, 180000)
      }

  })
    }
    }
)

function func(data) {
  console.log('Line: ' + totalLines + ' ' + data);
 
}

/**************************************************************************
 * This function prints the string data called "remaining"                *
**************************************************************************/
function whatsleft(data) {
  console.log('The data left in string remaining ' + data)

}

/*************************************************************************
 * This function prints the value of index1 at the top of the while      *
 * loop                                                                  *
 ************************************************************************/

function topindexprt(data2) {
   console.log('The content of index index1 at the top of the while loop is ' + data2)

}

/*************************************************************************
 * This function prints the value of index1 at the bottom of the while   *
 * loop when it is modified                                              *
 ************************************************************************/

function bottomindexprt(data3) {
   console.log('The content of index index1 at the bottom of the while loop is ' + data3)

    }

