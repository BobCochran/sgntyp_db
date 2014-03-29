# README for Signtyp Imaging Project

This project contains all the data definition language files and other documentation needed to
create an SQLite version 3.8.x database named imst.db. This is the database to be deployed
with the Signtyp Imaging Project.

The project also contains optional scripts written in node.js which can populate the 
database tables.

# MongoDB Database Support

After experimentation, MongoDB is being used to provide all database support
for this project. A database named "sgtypdb2" exists and associated collections 
are being progressively created and tested as time goes on. MongoDB version 2.4.9 and Node.js 
version 0.10.26 is being used. A nonrelational database choice greatly speeds
development time for the database. Scripts which successfully populate a collection are 
added to the db/scripts/node/mongodb_related directory. A given collection may be updated 
by more than one script. This is especially true of the 'fnck' collection. 
Some scripts may be broken. Others may only print data to the terminal.  

The folder structure is as follows:

```
db----------------------
    |                  |
    ddl---             scripts-------------------------
         |                      |                     |
         sqlite3                node                  python3
                                   |
                                   mongodb_related
```

Three trees exist:

db/ddl/sqlite -- under which you will find the actual data definition language files
for each table in imst.db.

db/scripts/node -- under which you will find various node.js scripts for populating 
the databases of interest (SQLite3 or MongoDB) with data.

db/scripts/python3 -- under which you will find various python (version 3.x) scripts for 
populating the database tables with data.

# MongoDB database details:

The officially supported database name will be  'sgtypdb2'. Some scripts may be writing to
the 'test' database, since the developer maintains this for testing program logic.

The database itself is expected to be quite small, about 8 Gb.

The collections associated with the database are:

 |Collection|Content|
 |----------|:-----:|
 |congrp    |Concept groups|
 |fnck      |File names and caption keys|
 |captioneng|English caption texts|

14 additional collections are being planned.

As of this writing, the database is about 60% complete. All collections contain data
provided to the developer by the Project's Principal Investigators.

# Software Requirements

Minimum SQLITE version: 3.8.1; download from http://www.sqlite.org/
    Considerable work is being done with Sqlite version 3.8.2 dated 
    December 6, 2013.

For MongoDB support, install MongoDB from http://www.mongodb.org/. 
MongoDB minimum version for this project is 2.4.9.

Minimum Node.js version: 0.10.22, download from http://www.nodejs.org/

Minimum Python version: 3.3.

Required non-native Node.js modules:
 
   'sqlite3'. Install with `npm install sqlite3'
   'mongodb'. Install with `npm install mongodb'

Scripts are tested on at least a CentOS 6.5 server.

We gratefully acknowledge Python scripts contributed by Marissa Collins to this Project.

Date of last update of this README.md file: 2014-03-29

Contact: for support, please contact Bob Cochran, R2COCHRAN2@GMAIL.COM. You may also
open an issue on http://github.com/BobCochran/sgntyp_db.git


