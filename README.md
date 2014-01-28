# README for Signtyp Imaging Project

This project contains all the data definition language files and other documentation needed to
create an SQLite version 3.8.x database named imst.db. This is the database to be deployed
with the Signtyp Imaging Project.

The project also contains optional scripts written in node.js which can populate the 
database tables.

# Experimental NoSQL Database Support

An experiment is added, in which a database named "sgntypdb" and associated collections 
are created in MongoDB version 2.4.9 to see if this can help speed up development 
time. Scripts which successfully populate a MongoDB database and collection are added 
to the scripts/node/mongodb_related directory. 

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

# Software Requirements

Minimum SQLITE version: 3.8.1; download from http://www.sqlite.org/
    Considerable work is being done with Sqlite version 3.8.2 dated 
    December 6, 2013.

For experimental MongoDB support, install MongoDB from http://www.mongodb.org/. 
MongoDB minimum version for this project is 2.4.9.

Minimum Node.js version: 0.10.22, download from http://www.nodejs.org/

Minimum Python version: 3.3.

Required non-native Node.js modules:
 
   'sqlite3'. Install with `npm install sqlite3'
   'mongodb'. Install with `npm install mongodb'

Scripts are tested on at least a CentOS 6.5 server.

We gratefully acknowledge Python scripts contributed by Marissa Collins to this Project.

Date of last update of this README.md file: 2014-01-28

Contact: for support, please contact Bob Cochran, R2COCHRAN2@GMAIL.COM


