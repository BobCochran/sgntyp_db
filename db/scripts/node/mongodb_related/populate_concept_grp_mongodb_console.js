/*************************************************************************
 * NODE.JS SCRIPT TO POPULATE CONCEPT GROUP 'congrp' collection          *
 * Read the FileNamesandCaptionKeys file as a readable stream. Extract   *
 * the final tab-separated field from each line of this file. The field  *
 * looks like this:                                                      *
 *                                                                       *
 * 0300body&health&clothing&bodycare                                     *
 *                                                                       *
 * Extract the 4 numeric digits which begin the field and treat the text *
 * which runs after the fourth digit, to the end of the line, as a       *
 * separate field. Insert these two fields as a new document to the      *
 * 'congrp' collection in the MongoDB database named 'sgntypdb'. The     *
 * numeric field is indexed and we should get an error on duplicates.    *
 *-----------------------------------------------------------------------*
 * 2014-03-21 This script is specifically designed to echo data elements *
 * to the console so they can be inspected prior to actual database      *
 * inserts. The revised, renamed FileNamesand CaptionKeys.txt input file *
 * is a great deal larger in size than the original file. This collection*
 * is going to be indexed on the first field "cgrp_num_int" as a unique  *
 * index with duplicate dropping turned on.                              *
 * db.congrp.ensureIndex({cgrp_num_int:1}, {unique:true, dropDups:true}) *
 *-----------------------------------------------------------------------*
 * Target database engine: MONGODB 2.4.9                                 *
 * Required node.js module: mongodb                                      *
 * It can take time for this script to complete all the inserts for the  *
 * congrp collection. If you abort the script by pressing CTRL-D or      *
 * CTRL-C the database inserts will most likely not complete.            *
 ************************************************************************/
var fs = require('fs');
var totalLines = 0            //Number of lines found in input file
var cdcnt = 0                 //Number of rows committed to collection
var errorcnt = 0;             //Error lines found with an NaN condition

//var input = fs.createReadStream('./FileNamesandCaptionKeys_test_sample.txt');
//var input = fs.createReadStream('/Volumes/pictures/Signtyp/PromptinfoFiles/FileNamesandCaptionKeys.txt')
var input = fs.createReadStream('/Users/bobc/Documents/sgntyp_renamed_files_2014-03-08/converted_New_Names_2014-03-08_FileNamesandCaptionKeys.txt')

readLines(input, func);

    function readLines(input, func) {
      var remaining = '';

      input.on('data', function(data) {
      remaining += data;
      var index1 = remaining.indexOf('\n')
      while (index1 > -1) {
          var line = remaining.slice(0, index1);
          remaining = remaining.slice(index1 + 1);
          totalLines += 1
          if (totalLines === 1) {
             index1 = remaining.indexOf('\n')
             continue
          }

          index1 = remaining.indexOf('\n')        // recompute value of index1
          var tbbl = line.indexOf('\t')           // find the index of the tab character
          var fn1 = line.slice(0, tbbl)           // save the file name string up to the tab character
          console.log('File name extracted is ' + fn1)
          tbbl += 1                               // bump past tab character
          /* tbbl now points to the web page number field */
          var tbbl2 = line.indexOf('\t',tbbl)     // find the second tab at end of web page number
          var wp1_lgn = tbbl2 - tbbl              // compute the length of the web page number
          var wp1_lgn = wp1_lgn + tbbl            // start at index tbbl, end at index wp1_lgn
          /* Save the web page number */
          var wp1 = line.slice(tbbl,wp1_lgn)      // capture the slice
          console.log('Web page Number = ' + wp1)
          tbbl = tbbl2 + 1                        // bump past the tab, point to first character
          /* tbbl now points at the web page sequence number field */
          var tbbl2 = line.indexOf('\t', tbbl)    //find the third tab
          var wp1_lgn = tbbl2 - tbbl              //compute length of sequence value
          var wp1_lgn = wp1_lgn + tbbl            // start at index tbbl, end at index wp1_lgn
          var wp2 = line.slice(tbbl,wp1_lgn)      // capture the web page sequence number
          console.log('value of wp2 = ' + wp2)    // print the value

        /**************************************************************************
         * We would like to capture the Caption key field next.                   *
         *************************************************************************/
          tbbl = tbbl2 + 1                       //bump past the tab, point to first character
          var tbbl2 = line.indexOf('\t', tbbl)   //find the fourth tab
          var wp1_lgn = tbbl2 - tbbl             //length of caption key field in the line
          var wp1_lgn = wp1_lgn + tbbl           //start at index tbbl, end at index wp1_lgn
          var ckey = line.slice(tbbl, wp1_lgn)   //capture the caption key field
          console.log('Value of caption key = ' + ckey)  // print the caption key

        /* Capture the concept group numeric part (4 digits) */
          tbbl = tbbl2 + 1                       //bump past the tab, point to first character
          var wp1_lgn = tbbl + 4                 //find the first non-numeric character
          var cgrp_num = line.slice(tbbl, wp1_lgn) //First 4 positions is the number
          var cgrp_num_int                         //convert concept group to integer
          cgrp_num_int = parseInt(cgrp_num)        //capture it
          if (isNaN(cgrp_num_int)) {
              console.log('Not a number condition found at line number ' + totalLines)
              func(line)
              errorcnt++
          }

       /****************************************************************************
        * Capture the text of the concept group. The String variable cgrp_txt1     *
        * contains all the characters up to and including the end-of-line character*
        * or hex '0d'. Unless you trim this nonprinting character out of the       *
        * slice, it will end up in the database document.                          *
        ***************************************************************************/
          var cgrp_txt1 = line.slice(wp1_lgn)            //captures the rest of the concept group
          var cgrp_txt2 = cgrp_txt1.slice(0,(cgrp_txt1.length))
        /**************************************************************************
         * If you don't want to see the data, comment out the console.log lines   *
         *************************************************************************/
          console.log('cgrp_num ' + cgrp_num + ' cgrp_txt2 ' + cgrp_txt2 + '\n')    // concept group
          var index1 = remaining.indexOf('\n');                                       //let us update index1
          cdcnt++                                                                   //pretend this is committed


/*      collection.insert([{ 'cgrp_num_int' : cgrp_num_int, 'cgrp_text': cgrp_txt2 }], function(err, result) {
          if (err && err.name === "MongoError" && err.code === 11000) {
              return
          } else if (err) {
          throw err
          }
          cdcnt++
      });
*/
    
  }
})

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
      console.log('Setting a 60-second 1 minute timer to wait for event loop to finish ')
      setTimeout(function () {
          console.log('\nTotal number of lines in input file, including the header row: ' + totalLines + '\n')
          console.log('Total documents committed to database collection is ' + cdcnt + '\n')
          console.log('(Header row purposely omitted from commits...)\n')
          console.log('Total number of errors detected: ' + errorcnt + '\n')

      }, 60000)

  })
    }


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

