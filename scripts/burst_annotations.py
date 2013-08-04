from datetime import datetime
import calendar
import csv
from cStringIO import StringIO
from ConfigParser import ConfigParser
import MySQLdb
import argparse
from hgext.mq import series

EXPECTED_HEADER = ['Timestamp', 'LABEL', 'RANK']
DATETIME_FORMAT = "%Y%m%d %H:%M:%S +0000"

def read_bursts(bursts_file_path, delimiter="\t"):
    with open(bursts_file_path, 'rbU') as csv_file:
        reader = csv.reader(csv_file, delimiter=delimiter)
        # read the header row
        headers = reader.next()
        if not headers == EXPECTED_HEADER:
            raise Exception("Headers do not match %s" %(str(EXPECTED_HEADER)))

        rows = []
        for row in reader:
            time = row[0]
            label = row[1]
            rank = int(row[2])
            rows.append({
                'time': formatTime(parseTime(time)),
                'label': label,
                'rank': rank
            })

        print "Read %d bursts from %s" %(len(rows), bursts_file_path)
        return rows

def insert_bursts(db, bursts, series_name, public, corpus):

    INSERT_ANNOTATION = """INSERT INTO annotations
                            (created, user, label, time, public, corpus, series, value)
                            VALUES
                            (NOW(), 'burst_annotations.py',
                            %s, FROM_UNIXTIME(%s), %s, %s, %s, %s)
                        """

    cursor = db.cursor()

    print "Deleting existing annotations in series %s" %(series_name)
    cursor.execute("DELETE FROM annotations WHERE series=%s", (series_name,));
    print "Removed %d rows" %(cursor.rowcount)

    print "Inserting %d bursts" %(len(bursts))

    for b in bursts:
        norm_rank = float(b['rank']) / len(bursts)

        cursor.execute(INSERT_ANNOTATION, (
            b['label'],
            b['time'],
            public,
            corpus,
            series_name,
            norm_rank
        ))

    print "Checking..."

    cursor.execute("SELECT COUNT(*) FROM annotations WHERE series=%s", (series_name,))
    count = cursor.fetchone()[0]
    print "%d annotations in series %s" %(count, series_name)

    cursor.close()


def read_config(ini_file_path):

    with open(ini_file_path, 'r') as ini_file:
        # add a default section header to trick the python ini file parser
        ini_str = '[root]\n' + ini_file.read()
        fp = StringIO(ini_str)

        config = ConfigParser()
        config.readfp(fp)

        if not config.has_section('db'):
            raise Exception("No db section in ini file")

        print "Database configuration from %s" %(ini_file_path)
        return dict(config._sections['db']), config.getint('root', 'public')

def connect(db_config):

    db = MySQLdb.connect(host=db_config['host'],
            port=int(db_config['port']),
            user=db_config['user'],
            passwd=db_config['password'],
            db=db_config['schema'],
            charset='utf8', use_unicode=True)

    # set to UTC
    db.cursor().execute("SET time_zone = '+00:00'")

    return db

def parseTime(dateTime):
    # Parses a date in 20130203 00:20:00 +0000 format
    return datetime.strptime(dateTime, DATETIME_FORMAT)

def formatTime(dateTime):
    # creates a Unix timestamp from the given datetime
    return calendar.timegm(dateTime.utctimetuple())

if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument("csv", type=str, help="input csv file containing timestamp, label, and rank")
    parser.add_argument("series_name", type=str, help="unique name for the annotation series")
    parser.add_argument("ini_file", nargs="?", type=str, default="../app.ini",
                        help=".ini file containing db configuration (default ../app.ini)")
    parser.add_argument("--delimiter", "-d", default="\t",
                        help="delimiter for csv files (default TAB)")

    args = parser.parse_args()

    db_config, public = read_config(args.ini_file)

    bursts = read_bursts(args.csv, delimiter=args.delimiter)

    db = connect(db_config)

    insert_bursts(db, bursts, args.series_name, public, db_config['corpus'])

    db.close()