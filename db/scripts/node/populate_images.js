/*************************************************************************
 * Created by Bob Cochran on 2013-12-14.                                 *
 *************************************************************************
 * NODE.JS SCRIPT TO POPULATE IMAGES DATABASE TABLE                      *
 * Read the FileNamesandCaptionKeys.txt file as a readable stream, break *
 * on tab and newline terminators to parse out information about each    *
 * image in the Signtyp Imaging Project. Fetch the required files over   *
 * the network and begin populating the images table with the data.      *
 *-----------------------------------------------------------------------*
 * Target database engine: SQLITE 3.8.2                                  *
 * Required node.js module: sqlite3                                      *
 * It can take time for this script to complete all the inserts for the  *
 * captions_eng table. Give node and sqlite3 a few minutes to complete.  *
 * It could take up to 10 minutes. If you abort the script by pressing   *
 * CTRL-D or CTRL-C the database inserts will most likely not complete.  *
 *-----------------------------------------------------------------------*
 * STRUCTURE (RECORD LAYOUT) OF THE FileNamesandCaptionKeys.txt file     *
 * This is a tab-delimited file.                                         *
 *                                                                       *
 * Element Name         Location              Explanation                *
 * ------------         --------              -----------                *
 * File name            Start of new line     File name of the image and *
 *                                            associated text file con-  *
 *                                            taining image credit URL.  *
 *                                                                       *
 * Web page number      immediately after     integer value showing the  *
 *                      the first tab in      numeric web page this image*
 *                      the line              will appear in. Example:   *
 *                                            if value is 1, this image  *
 *                                            appears on the first web   *
 *                                            page; if 298, this image   *
 *                                            appears on the 298th web   *
 *                                            page.                      *
 *                                                                       *
 * Sequence in page     immediately after     Integer value 1 to 4 show- *
 *                      the second tab in     ing the sequence of the    *
 *                      the line              image layout within the    *
 *                                            target web page            *
 *                                                                       *
 * Caption Key          Immediately after     Used to find caption text  *
 *                      the third tab in the  in the captions table.     *
 *                      line                                             *
 *                                                                       *
 * Concept Group        Immediately after     Consists of 4 numeric      *
 *                      the fourth tab in     digits followed by a string*
 *                      the line              of English text characters.*
 *                                                                       *
 * End of line          last character        hex '0a', a standard end-  *
 *                                            of-line and carriage return*
 *-----------------------------------------------------------------------*
 * TABLE CREATION STRATEGY                                               *
 *                                                                       *
 * This program will use the following strategy to create the images     *
 * and the concepts group (congrp) tables.                               *
 *                                                                       *
 * 1. Open the database file.                                            *
 * 2. Open and read the FileNameandCaptionKeys.txt file as a stream.     *
 * 3. Parse out the name of the image file.                              *
 * 4. Open and read the image file as a stream using base64 encoding.    *
 * 5. Open and read the associated text file as a stream.                *
 * 6. Insert the image itself plus the file name into a new row in the   *
 *    images table.                                                      *
 * 7. Parse out the web page number, sequence in web page, and caption   *
 *    key fields and update the associated table row in the images table.*
 * 8. Parse out the Concept Group field. Split this into two subfields:  *
 *    the first 4 numeric digits and the concept group textual           *
 *    information.                                                       *
 * 9. Search an array to determine if the numeric digits just parsed out *
 *    are already in the array. If they are, then this concept group has *
 *    already been added to the congrp table and we are done with the    *
 *    line. We can go to step 11.                                        *
 * 10. Insert the two concept group fields into the congrp table. There  *
 *     is a potential for error here, so a callback is probably needed to*
 *     throw an error.                                                   *
 * 11. Search the text file opened in step 5 to obtain the image credit  *
 *     URL information.                                                  *
 * 12. Update the associated table row in the images table with the      *
 *     image credit text.                                                *
 * 13. Close the text file just opened.                                  *
 * 14. Processing of this line of the FileNameandCaptionKeys.txt file    *
 *     has been completed. Process the next line, repeating steps 3-13.  *
 * 15. When there is no more input left to process in the                *
 *     FileNameandCaptionKeys.txt file, close the file and close the     *
 *     database.                                                         *
 * 16. Exit.                                                             *
 ************************************************************************/
var fs = require('fs');
var sqlite3 = require('sqlite3')
var path = require('path')

var totalLines = 0

function readLines(input, func) {
    var remaining = '';

    input.on('data', function(data) {
        remaining += data;
        var index1 = remaining.indexOf('\n');
        while (index1 > -1) {
            totalLines += 1                               // count the line
            topindexprt(index1)
            var line = remaining.slice(0, index1);        // Capture the line
            remaining = remaining.slice(index1 + 1);      // Points to the next line
            /*************************************************************************
             *                                                                       *
             * The next two lines will produce a lot of output to the console if you *
             * uncomment them. The purpose is to let you see the actual data as it is*
             * being worked, but in a large input file, this can mean a heck of a lot*
             * of console output.                                                    *
             ************************************************************************/
//            func(line)
//            whatsleft(remaining)
            index1 = remaining.indexOf('\n');       // recompute value of index1
            bottomindexprt(index1)
            if (totalLines == 1) {
                continue
            }
            var tbbl = line.indexOf('\t')           // find the index of the tab character

            /* Save the file name of the image and the credits file. */
            var fn1 = line.slice(0,tbbl)            // save the File name string up to the tab character
            tbbl += 1                               // bump past tab character.
            var tbbl2 = line.indexOf('\t',tbbl)     // find the second tab
            var wp1_lgn = tbbl2 - tbbl              // compute length of web page number
            var wp1_lgn = wp1_lgn + tbbl            // start at index tbbl, end at index wp1_lgn
            /* Save the web page number                             */
            var wp1 = line.slice(tbbl,wp1_lgn)      // capture the slice

            // Capture the sequence on the web page field

            tbbl = tbbl2 + 1                        //bump past the tab, point to first char
            var tbbl2 = line.indexOf('\t',tbbl)     //find the third tab
            var wp1_lgn = tbbl2 - tbbl              //compute length of sequence value
            var wp1_lgn = wp1_lgn + tbbl            //start at index tbbl, end at index wp1_lgn
            var wp2 = line.slice(tbbl,wp1_lgn)      //capture the slice

            // Capture the caption key field

            tbbl = tbbl2 + 1                       //bump past the tab, point to first char
            var tbbl2 = line.indexOf('\t',tbbl)    //find the fourth tab
            var wp1_lgn = tbbl2 - tbbl             //compute length of caption key data
            var wp1_lgn = wp1_lgn + tbbl           //start at index tbbl, end at index wp1_lgn
            var ckey = line.slice(tbbl,wp1_lgn)    //capture the slice

            // Capture the concept group numeric part

            tbbl = tbbl2 + 1                       //bump past the tab, point to first char
            var wp1_lgn = tbbl + 4                 //find the first non-numeric character
            var cgrp_num = line.slice(tbbl,wp1_lgn)      //First 4 positions is the number

            // Capture the text of the concept group

            var cgrp_txt1 = line.slice(wp1_lgn)     //This should capture the rest of

            /**************************************************************************
             * the String variable cgrp_txt1 will contain all the characters up to and*
             * including the end of line character or hex '0d'. Unless you trim this  *
             * nonprinting character out of the slice, it will end up in the cgrp     *
             * column, and then 'where' clauses won't match the cgrp string           *
             * because the cell contains string plus x'0d'. So the String variable    *
             * cgrp_txt2 is a new string that trims out the nonprinting character.    *
             *                                                                        *
             *************************************************************************/
              var cgrp_txt2 = cgrp_txt1.slice(0,(cgrp_txt1.length-1))
            /**************************************************************************
             * If you don't want to see the data, comment out the console.log lines   *
             *************************************************************************/
              console.log('Filename = ' + fn1 + ' Web page number = ' + wp1 + ' tbbl2 = ' + tbbl2 + ' tbbl = ' + tbbl +
                ' wp1_lgn = ' + wp1_lgn)
              console.log('Sequence on web page = ' + wp2 + ' caption key = ' + ckey + ' Concept group num = '
                  + cgrp_num)
              console.log('Text of concept group = ' + cgrp_txt1 + ' Trimmed text of concept group = ' + cgrp_txt2)

          // Find out of the concept group table congrp already has this concept group.
          // If not, check to see whether the concept group number is numeric.
          // If it is numeric, add it to the concept group table.

              db.all("select rowid as id, cid as cid, cgrp as cgrp from congrp where cid = ?", cgrp_num,
                  function(err, rows) {
                      if (err) throw err
                      if (rows[0] == null) {
                          if (isFinite(cgrp_num))
                          {
                          console.log('Hello, the row returned is null because cgrp numeric is not in the table '
                              + cgrp_num)
                          do_congrp_add(cgrp_num, cgrp_txt1)
                          }
                      }
                      })

/*          At this point, add the data that we have already into the images table. Then get the image
            itself and the text files, and update the row of interest.
*/
            db.prepare("insert into images (gloss, im_ty, im_pg, im_pg_sq, im_fn, im_cp) " +
                "values(?, ?, ?, ?, ?, ?)").run(ckey, 'p', wp1, wp2, fn1, cgrp_num).finalize();

/*
            Read in the actual image as a base64 object and insert it into the images table.
 */
            do_image_add(fn1)

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

/*************************************************************************
 * This function adds a row to the congrp table.                         *
 ************************************************************************/
function do_congrp_add(data4, data5) {
    db.prepare("insert into congrp (cid, cgrp) values(?, ?)").run(data4, data5).finalize();
}
/**************************************************************************
 *  This function adds an image to the images table.                      *
 *************************************************************************/
function do_image_add(data6) {
    var data7 = data6.replace(/ /g,"\\ ")
    var wherePhotosAre = '../../../../Volumes/pictures/Signtyp/SigntypFromLightroom/'
    var thePath = path.join(wherePhotosAre, data6)
    console.log('The value of dirname = ' + __dirname)
    var myPhoto = ''
    var input2 = fs.createReadStream(thePath + '.JPG', {encoding: 'base64'});
    input2.on('data', function(chunk) {
        myPhoto += chunk
    })
    input2.on('end', function() {
        db.prepare("update images set image = ? where im_fn = ?").run(myPhoto, data6).finalize()
    })
}
/********************************************************************************
 * Edit the database name and the path of the source file to your requirements. *
 *                                                                              *
 *******************************************************************************/

var db = new sqlite3.Database('./imst.db')
var input = fs.createReadStream('./FileNamesandCaptionKeys_test_sample.txt');
readLines(input, func);

