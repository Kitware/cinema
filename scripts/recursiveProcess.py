import os, sys, re, argparse
from collections import deque

import processComposite
from processComposite import CompositeHandler

def recurse(infoJsonPath, directory):
    # regular expression to allow removing base path for Girder storage
    rpRegex = re.compile('composite\.json')

    # Using a queue gives a depth-first search of the filesystem below the root path.
    dirQueue = deque([directory])

    while True :
        try :
            nextPath = dirQueue.popleft()
            try :
                nextList = [ os.path.join(nextPath, f) for f in os.listdir(nextPath) ]
            except OSError as osErr :
                # The current path was not a folder, but rather a file
                matcher = rpRegex.search(nextPath)
                if matcher:
                    print 'Going to process ',nextPath
                    compositeHandler = CompositeHandler(infoJsonPath, nextPath)
                    compositeHandler.process_all()

                continue

            for f in nextList :
                dirQueue.append(f)
        except IndexError as indErr :
            print 'No more items in the queue, done.'
            break


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Recursively process composites in a list of directories")
    parser.add_argument("--infojson", type=str, default="", help="path to info.json file at level of the dataset")
    parser.add_argument("--dirlist", type=str, default="", help="semi-colon separated list of top level directories to recurse through")
    args = parser.parse_args()

    directoryList = args.dirlist.split(';')
    for d in directoryList:
        print 'Processing directory: ',d
        recurse(args.infojson, d)
        print
