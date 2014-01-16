/*******************************************************************************
 * This node.js script will attempt to create an in-memory database,
 * populate it,
 * read from it a few times,
 * populate an array,
 * and then add missing rows to the table using the async.series
 * method of async.
 *
 *****************************************************************************/
var sqlite3 = require('sqlite3').verbose()
var async = require('async')
var myList = []
var db = new sqlite3.Database('./test0.db')
async.series([
// Create a table and populate it
    function (callback) {
        db.run("CREATE TABLE lorem (listnumb bigint, info TEXT)", function (err) {
            if (err) return callback(err)
            console.log('Table created. ')
            callback()
        });

    },
    function (callback) {
        stmt = db.prepare("INSERT INTO lorem VALUES (?, ?);", function (err) {
            if (err) return callback(err)
            for (var i = 0; i < 10; i++) {
                stmt.run(i, "Ipsum " + i)
            }
            stmt.finalize();
            console.log('Table populated. ')
            callback()
        })

    },
    function (callback) {
        db.each("SELECT listnumb as numb, info FROM lorem;",
            function (err, row) {
                if (err) return callback(err)
                console.log(' numb = ' + row.numb + ' info field = ' + row.info)

            },
            function (err, cntx) {
                if (err) return callback(err)
                console.log('Number of retrieved rows is ' + cntx)
                callback()
            }

        )

    }
    ],
    // This function gets called after the tasks above have completed
    function(err) {
        if (err) return new Error(err)
        console.log("\n\nLength of array after the function go runs " + myList.length)
        db.close()
    })
