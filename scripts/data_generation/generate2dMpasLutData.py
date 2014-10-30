
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
# ParaView Python - Path setup
# -----------------------------------------------------------------------------


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
#
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
#flat_file_times = range(50, 5151, 50) # range(50, 5901, 50)
flat_file_times = range(50, 351, 50)
#flat_file_times = [ 50 ]
flat_filenames = [ os.path.join(data_base_path, (flat_file_pattern % time)) for time in flat_file_times]

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
analysis.register_analysis(id, title, description, '{time}/{slice}/{theta}/{phi}/{filename}', 'composite-image-stack-light')
fng = analysis.get_file_name_generator(id)

# -----------------------------------------------------------------------------
# Pipeline configuration
# -----------------------------------------------------------------------------

nb_slices = 10

function_pattern = '%s_%d'

# Processing pipeline
flat_reader = XMLUnstructuredGridReader(FileName = flat_filenames) #
flat_reader.CellArrayStatus = [ "salinity", "temperature", "density", "pressure" ]

tFunc = function_pattern % ('temperature', 0)
print 'tFunc: ' + tFunc
scalar_temp_extract = Calculator(Input = flat_reader, ResultArrayName = 'scalartemp', AttributeMode = 'Cell Data', Function = tFunc)

sFunc = function_pattern % ('salinity', 0)
print 'sFunc: ' + sFunc
scalar_sali_extract = Calculator(Input = scalar_temp_extract, ResultArrayName = 'scalarsalinity', AttributeMode = 'Cell Data', Function = sFunc)

dFunc = function_pattern % ('density', 0)
print 'dFunc: ' + dFunc
scalar_dens_extract = Calculator(Input = scalar_sali_extract, ResultArrayName = 'scalardensity', AttributeMode = 'Cell Data', Function = dFunc)

pFunc = function_pattern % ('pressure', 0)
print 'pFunc: ' + pFunc
scalar_pres_extract = Calculator(Input = scalar_dens_extract, ResultArrayName = 'scalarpressure', AttributeMode = 'Cell Data', Function = pFunc)

globalRanges = {
    'temperature': [ 10000000, -10000000 ],
    'salinity': [ 10000000, -10000000 ],
    'density': [ 10000000, -10000000 ],
    'pressure': [ 10000000, -10000000 ]
}

print 'Precalculating ranges...'
for t in range(len(flat_file_times)):
    print '  timestep ',t
    for l in range(nb_slices):
        print '    slice ',l
        scalar_temp_extract.Function = function_pattern % ('temperature', l)
        scalar_sali_extract.Function = function_pattern % ('salinity', l)
        scalar_dens_extract.Function = function_pattern % ('density', l)
        scalar_pres_extract.Function = function_pattern % ('pressure', l)

        scalar_pres_extract.UpdatePipeline(t)

        cdi = scalar_pres_extract.GetCellDataInformation()

        globalRanges['temperature'] = updateGlobalRange(cdi.GetArray("scalartemp").GetRange(), globalRanges['temperature'])
        globalRanges['salinity'] = updateGlobalRange(cdi.GetArray("scalarsalinity").GetRange(), globalRanges['salinity'])
        globalRanges['pressure'] = updateGlobalRange(cdi.GetArray("scalarpressure").GetRange(), globalRanges['pressure'])
        globalRanges['density'] = updateGlobalRange(cdi.GetArray("scalardensity").GetRange(), globalRanges['density'])

print 'Global array ranges:'
print globalRanges

# Rendering pipeline
#flat_rep = Show(flat_reader)
#flat_rep.EdgeColor = [0.0, 0.0, 0.0]
#flat_rep.Representation = 'Surface With Edges'

filters = []
filters_description = []
color_by = []

color_type = [
    ('VALUE', "scalartemp"),
    ('VALUE', "scalarsalinity"),
    ('VALUE', "scalarpressure"),
    ('VALUE', "scalardensity")
]

#cdi = scalar_pres_extract.GetCellDataInformation()

luts = {
    "scalartemp": ["cell", "scalartemp", 0, globalRanges['temperature']],
    "scalarsalinity": ["cell", "scalarsalinity", 0, globalRanges['salinity']],
    "scalarpressure": ["cell", "scalarpressure", 0, globalRanges['pressure']],
    "scalardensity": ["cell", "scalardensity", 0, globalRanges['density']]
}

filters.append( scalar_pres_extract )
color_by.append( color_type )
filters_description.append( {'name': 'Grid'} )


# -----------------------------------------------------------------------------
# Rendering configuration
# -----------------------------------------------------------------------------

view_size = [1000, 1000]
center_of_rotation = [0.0, 0.0, 0.0]

camera_handler = wx.ThreeSixtyCameraHandler(
    fng,
    None,
    [ 180 ],
    [ 0 ],
    center_of_rotation,
    [ 0, 1, 0 ],
    6.8)

exporter = wx.CompositeImageExporter(
    fng,
    filters,
    color_by,
    luts,
    camera_handler,
    view_size,
    filters_description,
    0, 0, 'png')

#exporter.view.ViewSize = view_size
exporter.view.Background = [1.0, 1.0, 1.0]
exporter.view.OrientationAxesVisibility = 0
exporter.view.CenterAxesVisibility = 0

#exporter.view.CameraParallelScale = 1.55

#exporter.view.CameraParallelProjection = 1
#exporter.view.InteractionMode = '2D'
#exporter.view.CenterOfRotation = [-0.540230751037598, 0.09185272455215454, 0.0]
#exporter.view.CameraPosition = [0.0, 0.1, 10.0]
#exporter.view.CameraFocalPoint = [0.0, 0.1, 0.0]

print "CRAM IT!"

exporter.set_analysis(analysis)

# -----------------------------------------------------------------------------
# Batch processing
# -----------------------------------------------------------------------------

scalar_temp_extract.Function = function_pattern % ('temperature', 0)
scalar_sali_extract.Function = function_pattern % ('salinity', 0)
scalar_dens_extract.Function = function_pattern % ('density', 0)
scalar_pres_extract.Function = function_pattern % ('pressure', 0)

UpdatePipeline(0)

analysis.begin()

for time in range(len(flat_file_times)):
    fng.update_active_arguments(time=time)
    GetAnimationScene().TimeKeeper.Time = float(time)

    for layer in range(nb_slices):
        fng.update_active_arguments(slice=layer)

        scalar_temp_extract.Function = function_pattern % ('temperature', layer)
        scalar_sali_extract.Function = function_pattern % ('salinity', layer)
        scalar_dens_extract.Function = function_pattern % ('density', layer)
        scalar_pres_extract.Function = function_pattern % ('pressure', layer)

        exporter.UpdatePipeline(time)

analysis.end()
