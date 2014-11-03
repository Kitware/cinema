
###
### Run this script with pvpython so python can find paraview imports.
###
### Purpose:
###
###     This script generates flat earth images of the unstructured
### grid used in the simulation.  In contrast to the similarly named file in
### this directory, this script renders data rather than colors to the images
### so that they can be rendered in the browser using a lookup table.
###

# -----------------------------------------------------------------------------
# ParaView Python - Module imports
# -----------------------------------------------------------------------------

import sys, os

from paraview.simple import *
from paraview import data_exploration as wx


LoadDistributedPlugin('RGBZView', ns=globals())


def updateGlobalRange(nextRange, globalRange):
    newGlobal = [ globalRange[0], globalRange[1] ]

    if nextRange[0] < globalRange[0]:
        newGlobal[0] = nextRange[0]

    if nextRange[1] > globalRange[1]:
        newGlobal[1] = nextRange[1]

    return newGlobal


# -----------------------------------------------------------------------------
# Input data to process
# -----------------------------------------------------------------------------

#path_root = '/Users/kitware/Desktop'
path_root = '/media/scott/CINEMA FAT/DataExploration'

data_base_path = os.path.join(path_root, 'Data/MPAS/data')

output_working_dir = '/home/scott/Documents/cinemaDemo/simpleCinemaWebGL/mpas-data/2d_data_primal'

flat_file_pattern = 'flat_1_primal/LON_LAT_1LAYER-primal_%d_0.vtu'
flat_file_times = range(50, 5151, 50) # range(50, 5901, 50)
#flat_file_times = range(50, 351, 50)
#flat_file_times = [ 50 ]
flat_filenames = [ os.path.join(data_base_path, (flat_file_pattern % time)) for time in flat_file_times]

# -----------------------------------------------------------------------------
# Programmable Filter
# -----------------------------------------------------------------------------

ppf = """
layer = %d
inputDs = self.GetUnstructuredGridInput()
outputDs = self.GetUnstructuredGridOutput()
outputDs.ShallowCopy(inputDs)

inputCellData = inputDs.GetCellData()
outputCellData = outputDs.GetCellData()

nbArrays = inputCellData.GetNumberOfArrays()

for i in range(nbArrays):
    array = inputCellData.GetArray(i)
    newArray = array.NewInstance()
    newArray.SetName(array.GetName())
    newArray.SetNumberOfComponents(1)
    newArray.SetNumberOfTuples(array.GetNumberOfTuples())
    tupleSize = array.GetNumberOfComponents()
    outputCellData.AddArray(newArray)

    for idx in range(array.GetNumberOfTuples()):
        newArray.SetValue(idx, array.GetValue(idx*tupleSize + layer))
"""

# -----------------------------------------------------------------------------
# Output configuration
# -----------------------------------------------------------------------------

title       = "MPAS - World Ocean - 120km"
description = """
              The following data anaylisis try to simulate the evolution
              of the ocean in term of temperature and salinity distribution accross
              20 years.
              """

analysis = wx.AnalysisManager(output_working_dir, title, description)

id = 'flat-time'
title = 'Earth slice'
description = '''
              Show the computational mesh with temperature and salinity
              iso-lines for the 40 layers and 120 time steps.
              '''

### The following line (in tandem with the line "fng.update_active_arguments(slice=layer)"),
### causes the UI not to show the layer/slice manipulation widget in the current
### version of Cinema.  It seems that if you use the word "layer" as an argument,
### the UI won't show it.   So I changed "layer" to "slice", and it allows the
### UI to be properly generated.  The same thing seems to go for "field", so I
### had to change that to something else, I chose "colorby".
###
### Note that you can still have the labels in the UI show up however you want,
### you just need to use the file name generator "update_label_arguments" method
### to set the label each time the argument changes.

#analysis.register_analysis(id, title, description, '{time}/{field}/{layer}.jpg', 'parametric-image-stack')
analysis.register_analysis(id, title, description, '{time}/{slice}/{filename}', 'composite-image-stack-light')
fng = analysis.get_file_name_generator(id)

# -----------------------------------------------------------------------------
# Pipeline configuration
# -----------------------------------------------------------------------------

nb_slices = 40

function_pattern = '%s_%d'

# Processing pipeline
flat_reader = XMLUnstructuredGridReader(FileName = flat_filenames) #
flat_reader.CellArrayStatus = [ "salinity", "temperature", "density", "pressure" ]

prog_filter = ProgrammableFilter( Input = flat_reader )
prog_filter.RequestInformationScript = ''
prog_filter.RequestUpdateExtentScript = ''
prog_filter.PythonPath = ''

nan_threshold = Threshold( Input = prog_filter )
nan_threshold.Scalars = ['CELLS', 'temperature']
nan_threshold.ThresholdRange = [-500.0, 500.0]

cellToPoint = CellDatatoPointData( Input = nan_threshold )

globalRanges = {
    'temperature': [ 10000000, -10000000 ],
    'salinity': [ 10000000, -10000000 ],
    'density': [ 10000000, -10000000 ],
    'pressure': [ 10000000, -10000000 ]
}

print 'Precalculating data ranges...'
for t in range(len(flat_file_times)):
    print '  timestep ',t
    for l in range(nb_slices):
        prog_filter.Script = ppf % l
        nan_threshold.UpdatePipeline(t)
        cdi = nan_threshold.GetCellDataInformation()

        for key in globalRanges.keys():
            globalRanges[key] = updateGlobalRange(cdi.GetArray(key).GetRange(), globalRanges[key])

"""
prog_filter.Script = ppf % 0
nan_threshold.UpdatePipeline(0)
cdi = nan_threshold.GetCellDataInformation()

globalRanges = {
    'temperature': cdi.GetArray('temperature').GetRange(),
    'salinity': cdi.GetArray('salinity').GetRange(),
    'density': cdi.GetArray('pressure').GetRange(),
    'pressure': cdi.GetArray('density').GetRange()
}
"""

print 'Global array ranges:'
print globalRanges
print

luts = {
    "temperature": ["point", "temperature", 0, globalRanges['temperature']],
    "salinity": ["point", "salinity", 0, globalRanges['salinity']],
    "pressure": ["point", "pressure", 0, globalRanges['pressure']],
    "density": ["point", "density", 0, globalRanges['density']]
}

filters = []
filters_description = []
color_by = []

color_type = [
    ('VALUE', "temperature"),
    ('VALUE', "salinity"),
    ('VALUE', "pressure"),
    ('VALUE', "density")
]

filters.append(flat_reader)
color_by.append( [ ('SOLID_COLOR', [0.5,0.5,0.5]) ] )
filters_description.append( { 'name': 'Cells Mask'})

filters.append(cellToPoint)
color_by.append(color_type)
filters_description.append( {'name': 'Computation Grid'} )


# -----------------------------------------------------------------------------
# Rendering configuration
# -----------------------------------------------------------------------------

view_size = [1500, 750]
center_of_rotation = [0.0, 0.0, 0.0]

camera_handler = wx.ThreeSixtyCameraHandler(
    fng,
    None,
    [ 180 ],
    [ 0 ],
    center_of_rotation,
    [ 0, 1, 0 ],
    6)

exporter = wx.CompositeImageExporter(
    fng,
    filters,
    color_by,
    luts,
    camera_handler,
    view_size,
    filters_description,
    0, 0, 'png')

exporter.view.Background = [1.0, 1.0, 1.0]
exporter.view.OrientationAxesVisibility = 0
exporter.view.CenterAxesVisibility = 0

# Customize the look of the cells mask
readerRepr = Show(flat_reader, exporter.view)
readerRepr.Representation = 'Wireframe'
readerRepr.AmbientColor = [0.0, 0.0, 0.0]
readerRepr.ColorArrayName = [None, '']
readerRepr.ScalarOpacityUnitDistance = 0.30336485436433686

print "Begin processing"

exporter.set_analysis(analysis)

# -----------------------------------------------------------------------------
# Batch processing
# -----------------------------------------------------------------------------

analysis.begin()

for time in range(len(flat_file_times)):
    print "Processing slices for timestep, ",time

    fng.update_active_arguments(time=time)
    GetAnimationScene().TimeKeeper.Time = float(time)

    for layer in range(nb_slices):
        fng.update_active_arguments(slice=layer)

        prog_filter.Script = ppf % layer

        exporter.UpdatePipeline(time)

analysis.end()
