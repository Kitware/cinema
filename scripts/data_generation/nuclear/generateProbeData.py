#!/Users/seb/Work/code/ParaView/build/bin/pvpython

import sys, os
from vtk import vtkMetaImageReader, vtkProgrammableFilter, vtkUnsignedCharArray, vtkJPEGWriter, vtkPNGWriter, vtkXMLImageDataReader

# User data
basePath = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/nuclear-input/single-pin'
outputDir = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/nuclear/probe'

fileTimes = range(13)
#fileTimes = [ 11, 12 ]

fileNames = [ 'singlepin_shortest_rs_%d.vti' % time for time in fileTimes ]

fieldsRange = {
    'helicity': [ -693261, 1226094 ],
    'vel': [ -17, 17 ],
    'vorticity': [ -180793, 187012 ],
    'pressure': [ -199873, 46508.1 ]
}


# RequestData of programmable filter
def unfoldData():
   inputDS = filter.GetInputDataObject(0, 0)
   outputDS = filter.GetImageDataOutput()

   dims = inputDS.GetDimensions()

   # dims[1] * dims[2]
   nbSlices = (dims[1] * dims[2]) / 2048
   outputDS.SetDimensions(dims[0], dims[1] * dims[2] / nbSlices, nbSlices)
   outputDS.SetOrigin(0,0,0)
   outputDS.SetSpacing(1,1,1)

   for arrayIdx in range(inputDS.GetPointData().GetNumberOfArrays()):
      array = inputDS.GetPointData().GetArray(arrayIdx)

      size = dims[0] * dims[1] * dims[2]

      if not array.GetName() in fieldsRange:
         continue

      dataRangeToUser = fieldsRange[array.GetName()]
      print "Process array: ", array.GetName()

      rescale = 256.0 * 256.0 * 256.0 / (dataRangeToUser[1] - dataRangeToUser[0])

      newArray = vtkUnsignedCharArray()
      newArray.SetName(array.GetName())
      newArray.SetNumberOfComponents(3)
      newArray.SetNumberOfTuples(size)
      outputDS.GetPointData().AddArray(newArray)

      progress = int(size / 100)
      count = 0
      for idx in range(size):
         value = array.GetValue(idx)
         if value < dataRangeToUser[0]:
            newArray.SetValue(idx * 3, 0)
            newArray.SetValue(idx * 3 + 1, 0)
            newArray.SetValue(idx * 3 + 2, 0)
         elif value > dataRangeToUser[1]:
            newArray.SetValue(idx * 3, 255)
            newArray.SetValue(idx * 3 + 1, 255)
            newArray.SetValue(idx * 3 + 2, 255)
         else:
            value = (value - dataRangeToUser[0]) * rescale
            newArray.SetValue(idx * 3, int(value%256))
            newArray.SetValue(idx * 3 + 1, int(value/256%256))
            newArray.SetValue(idx * 3 + 2, int(value/256/256))

         # if idx % progress == 0:
         #    count = count + 1
         #    print count
         #    # sys.stdout.write('.')
         #    # sys.stdout.flush()
         #    #sys. "\rProcessing %s: %d     %s" % (array.GetName(), count, "/-\\|"[count%4])

      print


# Pipeline
writer = vtkPNGWriter()
reader = vtkXMLImageDataReader()
filter = vtkProgrammableFilter()
filter.SetExecuteMethod(unfoldData)

# Loop over files to process
idx = 0
for fileName in fileNames:
   directory = outputDir + ('/%d/' % idx)

   # Make sure the destination directory exist
   if not os.path.exists(directory):
      os.makedirs(directory)

   reader.SetFileName(basePath + '/' + fileName)
   reader.Update()

   filter.SetInputData(reader.GetOutput())
   filter.Update()

   dsToEncode = filter.GetOutput()

   for arrayIdx in range(dsToEncode.GetPointData().GetNumberOfArrays()):
      array = dsToEncode.GetPointData().GetArray(arrayIdx)
      dsToEncode.GetPointData().SetActiveScalars(array.GetName())

      writer.SetFilePattern( directory + array.GetName() + '_%d.png')
      writer.SetFileDimensionality(2)
      writer.SetInputData(dsToEncode)
      writer.Write()

   idx = idx + 1
