#!/usr/bin/env python3

'''
populate_db.py
(within the SignTyp project)
Read project manager's project folders and populate
SQLite3 database tables with data needed for
SignTyp website.
'''

import argparse
import csv
import logging
import os
import sqlite3
import sys
from os.path import join as pathjoin

# For Windows compatibility
try:
    import msvcrt
except ImportError:
    pass

logging.basicConfig(filename='populate_db.log', level=logging.DEBUG)

def pause_for_input():
    '''
    OS-agnostic way to pause until the user presses a key.
    Necessary so that the user can see error messages before
    the terminal disappears.
    '''
    print("Press any key to continue.", file=sys.stderr)
    try:
        msvcrt.getch()
    except NameError:
        input()

def row_into_images_table(row, dbconn, topdir):
    '''
    Take row dictionary (returned by csv.DictReader) and use it
    to push a row to the images table in the database.
    '''
    base = ("insert into images "
            "(gloss, image, im_ty, im_credit) values "
            "(?, ?, ?, ?)")

    image_loc = pathjoin(topdir, 'SignTypFromLightroom', row['File name']+'.jpg')
    with open(image_loc, mode='rb') as f:
        image = sqlite3.Binary(f.read())

    credit_loc = pathjoin(topdir, 'SignTypFromLightroom', row['File name']+'.txt')
    credit = None
    with open(credit_loc) as f:
        for line in f:
            if line.startswith('Photo URL'):
                header, tail = line.split(':', 1)
                credit = tail.strip()

    try:
        with dbconn:
            # J = JPG here -- have to ask Bob what he meant by im_ty
            dbconn.execute(base, (row['CaptionKey'], image, 'J', credit))
    except sqlite3.Error as e:
        logging.error(e.args[0])


def row_into_pages_table(row, dbconn, topdir):
    '''
    Take row dictionary (returned by csv.DictReader) and use it
    to push a row to the pages table in the database.
    '''
    base = ("insert into pages "
            "(pgloss, page, npic, cline) values "
            "(?, ?, ?, ?)")
    # TO DO


def main():
    '''
    Main functionality.  A few basic checks are run up front to catch basic user
    errors.  Once we determine, though, that we have a good enough version of
    Python, and that we've been given the right directory, subsequent errors will
    simply be logged, and the program will not terminate.
    '''
    if sys.hexversion < 0x3030000:
        print("Expecting Python 3.3 or higher.  "
              "Please install an up-to-date version of Python.", file=sys.stderr)
        pause_for_input()
        exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument('locationSignTyp', help="Path to SignTyp parent folder.")

    argNS = parser.parse_args()
    STdir = argNS.locationSignTyp

    # Check for all the following:
    # All of the files needed are on the network drive in the folder called SignTyp.
    # The captionsX and  filenamesandcaptionkeys are in the PromptInfoFiles
    # folder.  The matching pictures and txt files are in SignTypFromLightroom.
    # This folder may have additional txt files that do not match a jpg file,
    # and are not listed in the FileNameandCaptionKeys.txt.  Such files can be ignored.
    # The audio files are in PromptAudioFiles. This documentation [original file]
    # itself is in PromptDocumentation.

    expected_contents = {
        STdir:
            ('PromptInfoFiles', 'SignTypFromLightroom', 'PromptAudioFiles'),
        pathjoin(STdir, 'PromptInfoFiles'):
            ('FileNamesAndCaptionKeys.txt',)
    }

    for dirname, contents in expected_contents.items():
        for filename in contents:
            if filename not in os.listdir(dirname):
                print("Expecting {} within the {} directory.".format(filename, dirname),
                      file=sys.stderr)
                pause_for_input()
                exit(1)

    # temporarily, read DB definitions from git project and write DB to memory
    # TO DO: where should this DB really be written?
    with open('/home/mrkc/SignTyp/sgntyp_db/db/ddl/sqlite3/create_images') as f:
        image_table_def = f.read()
    with open('/home/mrkc/SignTyp/sgntyp_db/db/ddl/sqlite3/create_pages') as f:
        page_table_def = f.read()
    connection = sqlite3.connect(":memory:")
    connection.execute(image_table_def)
    connection.execute(page_table_def)
    with open(pathjoin(STdir, 'PromptInfoFiles', 'FileNamesAndCaptionKeys.txt')) as tsvfile:
        this_reader = csv.DictReader(tsvfile, delimiter='\t')
        for row in this_reader:
            row_into_images_table(row, connection, STdir)
            row_into_pages_table(row, connection, STdir)

    # TO DO: all language-specific caption file stuff




if __name__ == '__main__':
    main()