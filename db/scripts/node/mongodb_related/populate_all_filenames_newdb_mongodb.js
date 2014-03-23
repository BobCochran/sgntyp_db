/*************************************************************************
 * NODE.JS SCRIPT TO POPULATE A MONGODB 'fnck' collection from a tab-    *
 * separated text file supplied by the customer.                         *
 * ----------------------------------------------------------------------*
 * CUSTOMER-SUPPLIED FILE MAY NEED REFORMATTING PRIOR TO USE             *
 * ----------------------------------------------------------------------*
 * Read the convertedFileNamesandCaptionKeys file as a readable stream.  *
 * The input file has been reformatted from a Microsoft Windows formatted*
 * file containing carriage returns and line feed characters '\r\n' to a *
 * Unix style file with only '\n' terminating each line. Also, empty tab-*
 * separated lines in the format '\t\t\t\t\n' appended to the end of the *
 * original source input file were removed.                              *
 * The goal in this script is to extract all the fields in each row of   *
 * the source file and add them to a MongoDB database named 'sgntypdb' as*
 * a collection named 'fnck'.                                            *
 *                                                                       *
 *-----------------------------------------------------------------------*
 * Target database engine: MONGODB 2.4.9                                 *
 * Required node.js module: mongodb                                      *
 * It can take time for this script to complete all the inserts for the  *
 * congrp collection. If you abort the script by pressing CTRL-D or      *
 * CTRL-C the database inserts will most likely not complete.            *
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

        var collection = db.collection('fnck')

        var input = fs.createReadStream('/Users/bobc/Documents/sgntyp_renamed_files_2014-03-08/converted_New_Captions_English_2014-03-08_.txt');

        readLines(input, func);

    function readLines(input, func) {
      var remaining = '';

      input.on('data', function(data) {
      remaining += data;
      var index1 = remaining.indexOf('\n');
      while (index1 > -1) {
          var line = remaining.slice(0, index1);
          remaining = remaining.slice(index1 + 1);
          totalLines += 1
          if (totalLines === 1) {
             index1 = remaining.indexOf('\n')
             continue
          }

          index1 = remaining.indexOf('\n')        // recompute value of index1
          var tbbl = line.indexOf('\t')           // find the index of the tab characgter
          var fn1 = line.slice(0, tbbl)           // save the file name string up to the tab character
          tbbl += 1                               // bump past tab character
          /* tbbl now points to the web page number field */
          var tbbl2 = line.indexOf('\t',tbbl)     // find the second tab at end of web page number
          var wp1_lgn = tbbl2 - tbbl              // compute the length of the web page number
          var wp1_lgn = wp1_lgn + tbbl            // start at index tbbl, end at index wp1_lgn
          /* Save the web page number */
          var wp1 = line.slice(tbbl,wp1_lgn)      // capture the slice
          tbbl = tbbl2 + 1                        // bump past the tab, point to first character
          /* tbbl now points at the web page sequence number field */
          var tbbl2 = line.indexOf('\t', tbbl)    //find the third tab
          var wp1_lgn = tbbl2 - tbbl              //compute length of sequence value
          var wp1_lgn = wp1_lgn + tbbl            // start at index tbbl, end at index wp1_lgn
          var wp2 = line.slice(tbbl,wp1_lgn)      // capture the web page sequence number

        /**************************************************************************
         * We would like to capture the Caption key field next.                   *
         *************************************************************************/
          tbbl = tbbl2 + 1                       //bump past the tab, point to first character
          var tbbl2 = line.indexOf('\t', tbbl)   //find the fourth tab
          var wp1_lgn = tbbl2 - tbbl             //length of caption key field in the line
          var wp1_lgn = wp1_lgn + tbbl           //start at index tbbl, end at index wp1_lgn
          var ckey = line.slice(tbbl, wp1_lgn)   //capture the caption key field

        /* Capture the concept group numeric part (4 digits) */
          tbbl = tbbl2 + 1                       //bump past the tab, point to first character
          var wp1_lgn = tbbl + 4                 //find the first non-numeric character
          var cgrp_num = line.slice(tbbl, wp1_lgn) //First 4 positions is the number
          var cgrp_num_int                         //convert concept group to integer
          cgrp_num_int = parseInt(cgrp_num)        //capture it

       /****************************************************************************
        * Capture the text of the concept group. The String variable cgrp_txt1     *
        * contains all the characters up to and including the end-of-line character*
        * or hex '0d'. Unless you trim this nonprinting character out of the       *
        * slice, it will end up in the database document.                          *
        ***************************************************************************/
          var cgrp_txt1 = line.slice(wp1_lgn)     //captures the rest of the concept group
          var cgrp_txt2 = cgrp_txt1.slice(0,(cgrp_txt1.length))
        /**************************************************************************
         * If you don't want to see the data, comment out the console.log lines   *
         *************************************************************************/
      console.log('\nfile name ' + fn1 + ' cgrp_num ' + cgrp_num + ' cgrp_txt2 ' + cgrp_txt2 + '\n')    // concept group

      collection.insert([{ 'fn' : fn1,
                           'wpn' : wp1,
                           'wps' : wp2,
                           'capkey' : ckey,
                           'cgrp_num' : cgrp_num,
                           'cgrp_num_int' : cgrp_num_int,
                           'cgrp_text': cgrp_txt2 }], function(err, result) {
          if (err && err.name === "MongoError" && err.code === 11000) {
              return
          } else if (err) {
          throw err
          }
          cdcnt++
      });
    
  }
})

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
    console.log('\nTotal number of lines: ' + totalLines + '\n')
      for(var pj = 0; pj < 300000; pj++) {
          var pk = 0
          pk++
      }
      if (cdcnt === totalLines) {
          console.log('Total documents committed to database collection fnck is ' + cdcnt)
          db.close()
      } else {
          console.log('Setting up a 180 second 3 minute timer up to close connection, please be patient... ')
          setTimeout(function () {
              console.log('Total documents committed to database collection fnck is ' + cdcnt)
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

