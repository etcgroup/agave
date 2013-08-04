import os
import sys
import simplejson, csv
from datetime import datetime
import calendar
import argparse
import re

DATETIME_FORMAT = "%Y%m%d %H:%M:%S +0000"

termRX = r"(?P<term>[\w ]+)"
durationRX = r"(?P<duration>\d+)"
dateTimeRX = r"\d+ \d\d:\d\d:\d\d \+\d+"
fpRX = r"\d*\.\d*"
aggregatesRX = r"(?P<termCountDelta>\d+),(?P<arrivalRateDelta>" + fpRX + "),(?P<countPercentDelta>" + fpRX + "),(?P<ratePercentDelta>" + fpRX + ")"
binOneRX = r"\[(?P<dateTimeOne>" + dateTimeRX + r"),(?P<termCountOne>\d+),(?P<arrivalRateOne>" + fpRX + ")\]"
binTwoRX = r"\[(?P<dateTimeTwo>" + dateTimeRX + r"),(?P<termCountTwo>\d+),(?P<arrivalRateTwo>" + fpRX + ")\]"
lineRX = termRX + "\t" + r"\{" + durationRX + "," + binOneRX + binTwoRX + "," + aggregatesRX + r"\}\s+\d"
lineParse = re.compile(lineRX)

class Burst(object):
    
    def __init__(self, match):
        self.term = match.group('term')
        self.windowSize = match.group('duration')
        # match.group('dateTimeOne')
        self.midPoint = self._parseTime(match.group('dateTimeTwo'))
        
        self.beforeCount = match.group('termCountOne')
        self.afterCount = match.group('termCountTwo')
        self.countDelta = match.group('termCountDelta')
        self.countPercentDelta = match.group('countPercentDelta')
        
        self.beforeArrivalRate = match.group('arrivalRateOne')
        self.afterArrivalRate = match.group('arrivalRateTwo')
        self.arrivalRateDelta = match.group('arrivalRateDelta')
        self.ratePercentDelta = match.group('ratePercentDelta')

    def _parseTime(self, dateTime):
        # Parses a date in 20130203 00:20:00 +0000 format
        return datetime.strptime(dateTime, DATETIME_FORMAT)
    
    def _formatTime(self, dateTime):
        # creates a Unix timestamp from the given datetime
        return calendar.timegm(dateTime.utctimetuple())
    
    @staticmethod
    def csvHeader(writer):
        writer.writerow([
            'mid_point', 
            'window_size',
            'term',
            'before_count',
            'after_count', 
            'count_delta',
            'count_percent_delta', 
            'before_rate', 
            'after_rate', 
            'rate_delta'
            'rate_percent_delta'
        ])
        
    def csv(self, writer):
        writer.writerow([
            self._formatTime(self.midPoint),
            self.windowSize,
            self.term,
            self.beforeCount, 
            self.afterCount, 
            self.countDelta,
            self.countPercentDelta, 
            self.beforeArrivalRate, 
            self.afterArrivalRate, 
            self.arrivalRateDelta,
            self.ratePercentDelta
        ])
        
def read_bursts(file, numLines):
    printout("Processing %s" %(file.name))
    # something like this:
    # watt	{1200,[20130203 00:20:00 +0000,5,0.0042][20130203 00:40:00 +0000,821,0.6842],816,0.68,16320.0,16320.0}	1
    lineNumber = 0
    
    bursts = []
    for line in file:
        lineNumber += 1
        
        if lineNumber > numLines:
            break;
        
        match = lineParse.match(line)
        if not match:
            printout("No match on line %s"%(lineNumber))
            printout(">>>%s" %(line))
            continue
        
        burst = Burst(match)
        bursts.append(burst)
    
    return bursts
       
def printout(message):
    print >> sys.stderr, message
    
if __name__ == '__main__':
    
    parser = argparse.ArgumentParser()
    parser.add_argument("dir", type=str, help="directory containing burst window files")
    parser.add_argument("out", type=str, help="output csv file")
    parser.add_argument('-N', help="top N terms from each file will be collected", default=10)
    args = parser.parse_args()
    
    printout('Searching for files in %s...' %(args.dir))
    files = list()
    for file in os.listdir(args.dir):
        path = os.path.join(args.dir, file)
        if os.path.isfile(path):
            files.append(path)
            
    printout('Found %s files.' %(len(files)))
        
    with open(args.out, 'wb') as outfile:
        writer = csv.writer(outfile)
        Burst.csvHeader(writer)
    
        for file in files:
            with open(file, "rU") as infile:
                bursts = read_bursts(infile, args.N)
                for burst in bursts:
                    burst.csv(writer)
                    