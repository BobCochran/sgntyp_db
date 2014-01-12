# README for Signtyp Imaging Project

This project contains all the data definition language files and other documentation needed to
create an SQLite version 3.8.x database named imst.db. This is the database to be deployed
with the Signtyp Imaging Project.

The project also contains optional scripts written in node.js which can populate the 
database tables.

The folder structure is as follows:

```
db----------------------
    |                  |
    ddl---             scripts----------
         |                      |      |
         sqlite3                node   python3

```

Three trees exist:

db/ddl/sqlite -- under which you will find the actual data definition language files
for each table in imst.db.

db/scripts/node -- under which you will find various node.js scripts for populating 
the database tables with data.

db/scripts/python3 -- under which you will find various python (version 3.x) scripts for 
populating the database tables with data.

# Software Requirements

Minimum SQLITE version: 3.8.1; download from http://www.sqlite.org/
    Considerable work is being done with Sqlite version 3.8.2 dated 
    December 6, 2013.

Minimum Node.js version: 0.10.22, download from http://www.nodejs.org/

Minimum python version: 3.1.

Required Node.js modules: 'sqlite3'. Install with `npm install sqlite3'

Scripts are tested on at least a CentOS 6.5 server.

We gratefully acknowledge Python scripts contributed by Marissa Collins to this Project.

Date of last update of this README.md file: 2014-01-11

Contact: for support, please contact Bob Cochran, R2COCHRAN2@GMAIL.COM


