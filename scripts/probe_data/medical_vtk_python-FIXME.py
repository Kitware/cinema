#!/Users/seb/Work/code/ParaView/build/bin/pvpython

import sys
from vtk import vtkMetaImageReader, vtkProgrammableFilter, vtkUnsignedCharArray, vtkJPEGWriter, vtkPNGWriter

basePath = '/Users/seb/Work/projects/NE-Phase2/'

reader = vtkMetaImageReader()
reader.SetFileName("/Users/seb/Work/projects/NE-Phase2/Patient05.mha")
reader.Update()

writer = vtkJPEGWriter() # vtkJPEGWriter()

filter = vtkProgrammableFilter()

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
      print size, array.GetNumberOfTuples()

      newArray = vtkUnsignedCharArray()
      newArray.SetName(array.GetName())
      newArray.SetNumberOfComponents(3)
      newArray.SetNumberOfTuples(size)
      outputDS.GetPointData().AddArray(newArray)

      progress = int(size / 100)
      count = 0
      for idx in range(size):
         value = array.GetValue(idx)
         newArray.SetValue(idx * 3, int(value%256))
         newArray.SetValue(idx * 3 + 1, int(value/256%256))
         newArray.SetValue(idx * 3 + 2, int(value/256/256))
         if idx % progress == 0:
            count = count + 1
            print count
            # sys.stdout.write('.')
            # sys.stdout.flush()
            #sys. "\rProcessing %s: %d     %s" % (array.GetName(), count, "/-\\|"[count%4])

      print

filter.SetInputData(reader.GetOutput())
filter.SetExecuteMethod(unfoldData)
filter.Update()

dsToEncode = filter.GetOutput()

for arrayIdx in range(dsToEncode.GetPointData().GetNumberOfArrays()):
   array = dsToEncode.GetPointData().GetArray(arrayIdx)
   dsToEncode.GetPointData().SetActiveScalars(array.GetName())

   writer.SetFilePattern(basePath + array.GetName() + '_%d.jpg')
   writer.SetFileDimensionality(2)
   writer.SetInputData(dsToEncode)
   writer.Write()
