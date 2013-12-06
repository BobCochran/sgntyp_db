/*************************************************************************
 * NODE.JS SCRIPT TO POPULATE CAPTIONS_ENG DATABASE TABLE                *
 * Read the English glosses or tags as a readable stream, break on       *
 * newline terminators and print each line to the console such that      *
 * the gloss plus the corresponding English text is printed. Then insert *
 * the gloss and English fields into the captions_eng table.             *
 *-----------------------------------------------------------------------*
 * Target database engine: SQLITE 3.8.1                                  *
 * Required node.js module: sqlite3                                      *
 * It can take time for this script to complete all the inserts for the  *
 * captions_eng table. Give node and sqlite3 a few minutes to complete.  *
 * It could take up to 10 minutes. If you abort the script by pressing   *
 * CTRL-D or CTRL-C the database inserts will most likely not complete.  *
 ************************************************************************/
var fs = require('fs');
var sqlite3 = require('sqlite3')

var totalLines = 0

function readLines(input, func) {
  var remaining = '';

  input.on('data', function(data) {
    remaining += data;
    var index1 = remaining.indexOf('\n');
    while (index1 > -1) {
      topindexprt(index1)
      var line = remaining.substring(0, index1);
      remaining = remaining.substring(index1 + 1);
      func(line)
      whatsleft(remaining)
      totalLines += 1
      index1 = remaining.indexOf('\n');       // recompute value of index1
      bottomindexprt(index1)
      var tbbl = line.indexOf('\t')           // find the index of the tab characgter
      var tg1 = line.slice(0,tbbl)            // save the string up to the tab character
      tbbl += 1                               // bump past tab character
      var tg2 = line.slice(tbbl)       // capture the slice
      console.log('\nTag 1 ' + tg1 + ' Tag 2 ' + tg2 + '\n')    // print tags 1 and 2
      db.prepare("insert into captions_eng (cgloss, en_ctext) values(?, ?)").run(tg1, tg2).finalize();
    
  }
})

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
    console.log('\nTotal number of lines: ' + totalLines + '\n')
    db.close()
  });
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
 

var db = new sqlite3.Database('./imst_test3.db')
var input = fs.createReadStream('./signtyp english glosses.txt');
readLines(input, func);
