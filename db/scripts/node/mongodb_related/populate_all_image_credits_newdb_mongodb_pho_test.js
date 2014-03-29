/*************************************************************************
 * NODE.JS SCRIPT TO POPULATE A MONGODB 'fnck' collection from a tab-    *
 * separated text file supplied by the customer.                         *
 * 2014-03-23                                                            *
 *                                                                       *
 * To start the script, use this command line in a shell window:         *
 * node populate_all_image_credits_newdb_mongodb_pho_test.js startline end
 *                                                                       *
 * for example                                                           *
 *                                                                       *
 * node populate_all_image_credits_newdb_mongodb_pho_test.js 1 200       *
 *                                                                       *
 * Tells the script to start processing at line 1 and terminate          *
 * processing at line 200. Depending on your system and available memory,*
 * 200 open file descriptors at one time may be too many to have, so     *
 * process fewer lines per pass.                                         *
 *                                                                       *
 * The script processes in small passes to account for system overhead in*
 * using up too many file descriptors.                                   *
 * ----------------------------------------------------------------------*
 * 2014-03-28                                                            *
 * CUSTOMER-SUPPLIED FILE MAY NEED REFORMATTING PRIOR TO USE             *
 * ----------------------------------------------------------------------*
 * Read the converted_New_Names_2014-03-08_FileNamesandCaptionKeys.txt   *
 * file as a readable stream.                                            *
 * The input file has been reformatted from a Microsoft Windows formatted*
 * file containing carriage returns and line feed characters '\r\n' to a *
 * Unix style file with only '\n' terminating each line. Also, empty tab-*
 * separated lines in the format '\t\t\t\t\n' appended to the end of the *
 * original source input file were removed.                              *
 * The goal in this script is to extract the filename contained in each  *
 * row of the source file and append the extension .txt (period,         *
 * character t, character x, character t) to this name. Then read this   *
 * *.txt file with fs.read. Parse this file and extract the              *
 * "Photographer" field within the file. Next, update the matching       *
 * document in the 'fnck' collection of the 'sgtypdb2' database          *
 * to add this new field to the document: 'photographer'.                *
 *-----------------------------------------------------------------------*
 * FOR TESTING PURPOSES, the 'fnck' collection has been copied to the    *
 * 'test' database using mongodump and then mongorestore.                *
 *-----------------------------------------------------------------------*
 * The ultimate reason for updating the fnck collection in this way is to*
 * allow one document to be used as the source data to populate most of  *
 * the eventual application web page.                                    *
 *                                                                       *
 *------------------------- S T E P S -----------------------------------*
 *                                                                       *
 * 1. Extract filename from the current input line of the                *
 *    'converted_New_Names_2014-03-08_FileNamesandCaptionKeys.txt' file. *
 *    Example: _8758450914_o                                             *
 * 2. Save this filename prefix to a multidimensional array.             *
 * 3. Append a '.txt' extension to the extracted filename.               *
 *    _8758450914_o.txt                                                  *
 * 4. Save the [filename].txt element to the same multimensional array as*
 *    in step 2. The array element now looks like                        *
 *    [["_8758450914_o", "_8758450914_o.txt",...]]                       *
 * 5. Iterate to the next line of the FilenamesandCaptionKeys input file *
 *    listed in Step 1. Repeat steps 1-4, building up the multi-         *
 *    dimensional array with the elements for the next line of the input *
 *    file. So element #1 will look like this:                           *
 *    [["_8758450914_o", "_8758450914_o.txt",...],                       *
 *     ["_9758450914_o", "_9758450914_o.txt",...]...]                    *
 *    Do this in passes of 25 to 200 files.                              *
 *                                                                       *
 * 6. Now, working from the very beginning of the multidimensional array *
 *    that we have built, attempt to open a file matching the            *
 *    Filename.txt string that is at that index in our array. Example:   *
 *    open '_8758450914_o.txt'                                           *
 * 7. Attempt to read the file if the open succeeds.                     *
 *    read '_8758450914_o.txt'                                           *
 * 8. Find the line that begins with the word "Photographer : "          *
 * 9. Extract the name of the photographer.                              *
 *    peter.clark                                                        *
 *10. Add the photographer name to the multidimensional array as in step *
 *    4. The array now looks like:                                       *
 *    [["_8758450914_o", "_8758450914_o.txt", "peter.clark"],            *
 *    ["_9758450914_o", "_9758450914_o.txt",...]...]                     *
 *11. Iterate through all the array elements that need the photographer  *
 *    name added to the associated filename.txt string.                  *
 *12. With 25 to 200 filenames ready in the array, open a MongoDB        *
 *    connection to the 'fnck' collection of either the 'test' or        *
 *    the 'sgtypdb2' databases. At first use the 'test' database when    *
 *    testing application logic.                                         *
 *13. This script will attempt to update each matching document within   *
 *    the 'fnck' collection of the 'sgtypdb2' database with the          *
 *    photographer information just extracted from the text files.       *
 *    It expects that these fields will be added to each matching        *
 *    document and that these fields will be new fields for each matching*
 *    document. That is, the script does not try to try to update these  *
 *    fields in the matching document because they do not exist yet.     *
 *-----------------------------------------------------------------------*
 * Target database engine: MONGODB 2.4.9                                 *
 * Required node.js module: mongodb                                      *
 * It can take time for this script to complete all the inserts for the  *
 * fnck collection. If you abort the script by pressing CTRL-D or        *
 * CTRL-C the database inserts will most likely not complete.            *
 ************************************************************************/
var fs = require('fs');
var totalLines = 0
var j1 = 0              // first dimenion of im_array
var j2 = 0              // second dimension of im_array
var stream              // for use in parsing for photographer name
var startLn = 0         // the starting line for this processing "pass"
var endLn = 0           // the ending line for this processing "pass"
var actLines = 0        // the actual number of text lines that readLines has found
var webRows = 0         // count of web page row numbers, starting from 1
var array_lines = 0     // the number of array iterations we need

/* Were any arguments passed in? Exit if none found */

if (process.argv.length < 3) {
    console.log('You must pass in the starting and ending line numbers as arguments to this script')
    console.log('The number of arguments found were ' + process.argv.length)
    console.log('Terminating processing')
    process.exit(1)
}

/* Get the command line arguments passed to this script */

process.argv.forEach(function(val, index, array) {
    console.log(index + ': ' + val);
    if (index === 2) {
        startLn = val
        webRows = val
    }
    if (index == 3) {
        endLn = val
    }
});

array_lines = endLn - startLn      //compute number of iterations

console.log('startLn is ' + startLn)
console.log('endLn is ' + endLn)
console.log('Number of iterations in the array will be ' + array_lines + '\n')

/* Set up an [lines being processed] x 3 array */

var im_array = new Array(array_lines)       // multidimensional array of image names, file names, photographer names
for(i = 0; i < im_array.length; i++) {
    im_array[i] = new Array(3);
}

var input = fs.createReadStream('/Users/bobc/Documents/sgntyp_renamed_files_2014-03-08/converted_New_Names_2014-03-08_FileNamesandCaptionKeys.txt');

readLines(input, func);
get_credits()
/*
 * Wait 46 seconds to let other processes complete, then build
 * the summary web page. We want to pass it the starting line number value.
 */
setTimeout(function () {
    do_array_print()
},46000)

function readLines(input, func) {
      var remaining = '';

      input.on('data', function(data) {
      remaining += data;
      var index1 = remaining.indexOf('\n');
      while (index1 > -1) {
          var line = remaining.slice(0, index1);
          remaining = remaining.slice(index1 + 1);
          totalLines += 1
          // Skip the header line.
          if (totalLines === 1) {
             index1 = remaining.indexOf('\n')
             continue
          }
          actLines += 1                           // actual number of content lines minus header line

          //discover if the line we are on is the line to start processing
          if (actLines < startLn) {
              index1 = remaining.indexOf('\n')
              continue
          }

          //discover if the line we are on is past the ending line number
          //that we want to process for this pass
          if (actLines > endLn) {
              index1 = remaining.indexOf('\n')
              continue
          }

          index1 = remaining.indexOf('\n')        // recompute value of index1
          var tbbl = line.indexOf('\t')           // find the index of the tab character
          if (line[0] === '\"') {                 // check to see if the filename string is quoted
              var fn1 = line.slice(1,(tbbl-1))    //skip the quotes
          } else {
              var fn1 = line.slice(0, tbbl)        // save the file name string up to the tab character
          }
          im_array[j1][j2].push(fn1)              // save the filename string without an extension
          fn1 = fn1 + '.txt'                      // append the .txt extension
          j2++                                    // bump to next element in j1
          im_array[j1][j2].push(fn1)              // push this onto the array
          j2 = 0                                  // reset j2
          j1++                                    // set up the next array

  }
})

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
    console.log('\nTotal number of lines processed including input header row: ' + totalLines + '\n')

  })
    }
/*
 * At this point, we have extracted all the filenames from the source TSV document and these
 * are waiting for us in the array im_array. The array now looks like this:
 *
 * [["_8758450914_o", "_8758450914_o.txt", ...],["_9758450914_o", "_9758450914_o.txt",...]...]
 *
 * For each file name in the array[j1][j2], we want to call a function that will
 * create a readstream of that file's contents, and parse out the
 * photographer's name. The photographer name would be put into im_array[j1][2].
 *
 * After all the file names are processed, we can update the 'fnck' collection documents with
 * corresponding photographer information.
 *
 */
function get_credits() {

    setTimeout(function () {
        process.stdout.write('\nProcessing files...\n')
        for(var pj = 0; pj < im_array.length; pj++) {
            process.stdout.write(im_array[pj][0] + '... ')
            get_photo_info(im_array[pj][0],pj)
            process.stdout.write('done!\n')
        }
    }, 35000)


}
/*
 This function accepts an input file name in the format filename.txt from function
 get_credits() and attempts to create a readstream of the file. Then it attempts to
 parse out the photographer's name and save that to im_array[pj][2].
 */
function get_photo_info(fname,idx) {

    stream = fs.createReadStream('/Volumes/pictures/Signtyp/promptsnormalizedOnefolder/' + fname)
    stream.on("error", function(err) {

        return console.error("open file error " + err.message)

    })
    stream.on("open", function(fd) {
        fs.fstat(fd, function(err, stats) {
            var size
            if (err) {
                return console.error("fstat error: " + err.message)

            } else {
                size = stats.size


            }
        })
    })
    stream.on("data", function(data1) {
        var chunk
        var phline
        var photog
        var name_end
        var the_url
        var url_end

        chunk += data1
        phline = chunk.indexOf('Photographer : ')
        if (phline > -1) {
            name_end = chunk.indexOf('\n',phline)
            photog = chunk.slice(phline+15,name_end)
            im_array[idx][2].push(photog)

        } else {
            process.stdout.write('Photographer not found')
        }


    })
}

function func(data) {
  console.log('Line: ' + totalLines + ' ' + data);
 
}
function do_array_print() {
    console.log('Image name\tFilename\tPhotographer name\n')
    for (var i = 0; i < im_array.length; i++) {
        console.log(im_array[i][0] + '\t' + im_array[i][1] + '\t' + im_array[i][2])
    }
}