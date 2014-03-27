/*************************************************************************
 * NODE.JS SCRIPT TO POPULATE A MONGODB 'fnck' collection from a tab-    *
 * separated text file supplied by the customer.                         *
 * 2014-03-23                                                            *
 *                                                                       *
 * To start the script, use this command line in a shell window:         *
 * node populate_all_image_credits_newdb_mongodb_test.js startline end   *
 *                                                                       *
 * for example                                                           *
 *                                                                       *
 * node populate_all_image_credits_newdb_mongodb_test.js 1 200           *
 *                                                                       *
 * Tells the script to start processing at line 1 and terminate          *
 * processing at line 200. Depending on your system and available memory,*
 * 200 open file descriptors at one time may be too many, so process     *
 * fewer lines per pass.                                                 *
 *                                                                       *
 * The script processes in small passes to account for system overhead in*
 * using up too many file descriptors.                                   *
 * ----------------------------------------------------------------------*
 * 2014-03-23                                                            *
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
 * "Photographer" and "Photo URL" fields within the file. Next, update   *
 * the document in the 'fnck' collection of the 'sgtypdb2' database      *
 * to add these two new fields to the document: 'photographer' and 'url'.*
 * This will allow one document to be used to populate most of the       *
 * eventual application web page.                                        *
 *                                                                       *
 *------------------------- S T E P S -----------------------------------*
 *                                                                       *
 * 1. Extract filename from the current input line of the                *
 *    'converted_New_Names_2014-03-08_FileNamesandCaptionKeys.txt' file. *
 *    Example: _8758450914_o                                             *
 * 2. Append a '.txt' extension to the extracted filename.               *
 *    _8758450914_o.txt                                                  *
 * 3. Attempt to open a file matching that string.                       *
 *    open '_8758450914_o.txt'                                           *
 * 4. Attempt to read the file if the open succeeds.                     *
 *    read '_8758450914_o.txt'                                           *
 * 5. Find the line that begins with the word "Photographer : "          *
 * 6. Extract the name of the photographer.                              *
 *    peter.clark                                                        *
 * 7. Find the line that begins with "Photo URL : "                      *
 * 8. Extract the url provided.                                          *
 *    http://www.flickr.com/photos/clarkzip/8758450914/                  *
 * 9. This script will attempt to update each matching document within   *
 *    the 'fnck' collection of the 'sgntypdb' database with the          *
 *    photographer and url information just extracted from the text file.*
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
var im_array = []       // an array of image names without the dot extension (no *.txt or *.jpg)
var fn_array = []       // an array of file names
var pho_array = []      // an array of all the photographer names
var url_array = []      // an array of all the photo credit urls
var strean              // for use in parsing for photographer name
var startLn = 0         // the starting line for this processing "pass"
var endLn = 0           // the ending line for this processing "pass"
var actLines = 0        // the actual number of text lines that readLines has found
var webRows = 0         // count of web page row numbers, starting from 1
var webPageNumb = 7     // the number of the web page for this processing "pass"

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

console.log('startLn is ' + startLn)
console.log('endLn is ' + endLn + '\n')

var input = fs.createReadStream('/Users/bobc/Documents/sgntyp_renamed_files_2014-03-08/converted_New_Names_2014-03-08_FileNamesandCaptionKeys.txt');

readLines(input, func);
get_credits()
/*
 * Wait 46 seconds to let other processes complete, then build
 * the summary web page. We want to pass it the starting line number value.
 */
setTimeout(function () {
    build_summary_web_page(startLn)
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
          im_array.push(fn1)                      // save the filename string without an extension
          fn1 = fn1 + '.txt'                      // append the .txt extension
          fn_array.push(fn1)                      // push this onto the array

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
 * are waiting for us in the array fn_array. For each file name in the array, we want to call
 * a function that will create a readstream of that file's contents, and parse out the
 * photographer's name and photo URL. These fields would be put into separate arrays. After
 * all the file names are processed, we can update the 'fnck' collection documents with the
 * corresponding information.
 *
 */
function get_credits() {

    setTimeout(function () {
        process.stdout.write('\nProcessing files...\n')
        for(var pj = 0; pj < fn_array.length; pj++) {
            process.stdout.write(fn_array[pj] + '... ')
            get_photo_info(fn_array[pj])
            process.stdout.write('done!\n')
        }
    }, 35000)


}
/*
 This function accepts an input file name in the format filename.txt from function
 get_credits() and attempts to create a readstream of the file. Then it attempts to
 parse out the photographer's name and the photo url.
 */
function get_photo_info(fname) {
//    stream = fs.createReadStream('./' + fname)
    stream = fs.createReadStream('/Volumes/pictures/Signtyp/promptsnormalizedOnefolder/' + fname)
    stream.on("error", function(err) {
     //   pho_array.push("not found")
     //   url_array.push("do not click not found")
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
            console.log('Photographer is ' + photog + '\, and File name is ' + stream.filename)
            pho_array.push(photog)

        } else {
            process.stdout.write('Photographer not found')
        }
        phline = chunk.indexOf('Photo URL    : ')
        if (phline > -1) {
            url_end = chunk.indexOf('\n',phline)
            the_url = chunk.slice(phline+15,url_end)
            console.log(the_url)
            url_array.push(the_url)
        } else {
            console.log('Photo URL not found')
        }

    })
}
/***************************************************************************
 * This function will create a writeable stream as output, and build a web *
 * page on the fly with the contents of the arrays fn_array, pho_array and *
 * url_array as the input to the function. Each item in these arrays will  *
 * be formatted as one row of a web page table. This way the project       *
 * can have the name of the image file, the photographer, and a clickable  *
 * link to that image all on one web page.                                 *
 **************************************************************************/
function build_summary_web_page(wr) {

    debugger
    var wr1 = parseInt(wr, 10)
    var stream2 = fs.createWriteStream(__dirname + '/photographer_table' + webPageNumb + '.html')

    stream2.write("<!DOCTYPE html><html lang=\"EN\"><head><meta charset=\"utf-8\" />" +
        "<title>Table of Image Names, Photograhers, and Links</title><link rel=\"stylesheet\" href=\"sgntyp_table.css\" /></head><body>")
    stream2.write("<h1>Table of Image File Names, Photographers, and Links</h1><h2>Page 1 of 7</h2><p>Links will open a new browser window or browser tab, depending on your browser settings.</p>")
    stream2.write("<table><thead><tr><th scope=\"col\">Row Number</th><th scope=\"col\">Image name without extension</th><th scope=\"col\">Photographer Name</th>" +
        "<th scope=\"col\">Photo Located At</th></tr></thead><tbody>")
    for (var k = 0; k < im_array.length; k++) {

        stream2.write("<tr><td>" + wr1 + "</td><td>" + im_array[k] + "</td><td>" + pho_array[k] + "</td><td>" + "<a href=\"" + url_array[k] + "\"" + " target=\"_blank\">" + url_array[k] + "</a></td></tr>")
        wr1++
    }
    stream2.end("</tbody></table><p>Programming proudly done by Bob Cochran r2cochran2 at gmail dot com</p></body></html>")
    stream2.on("finish", function() {
        console.log('\nNumber of bytes written ' + stream2.bytesWritten)
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
