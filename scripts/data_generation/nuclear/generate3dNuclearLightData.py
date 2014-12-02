
###
### Run this script with pvpython so python can find paraview imports.
###

# -----------------------------------------------------------------------------
# ParaView Python - Path setup
# -----------------------------------------------------------------------------

import sys, os, argparse

from paraview.simple import *
from paraview import data_exploration as wx

LoadDistributedPlugin('RGBZView', ns=globals())

###############################################################################
# Helper method to calculate global ranges of array data
###############################################################################
def updateGlobalRange(nextRange, globalRange):
    newGlobal = [ globalRange[0], globalRange[1] ]

    if nextRange[0] < globalRange[0]:
        newGlobal[0] = nextRange[0]

    if nextRange[1] > globalRange[1]:
        newGlobal[1] = nextRange[1]

    return newGlobal


###############################################################################
# This method does all the processing, given a few required configuration
# parameters.
###############################################################################
def doProcessing(inputDir, outputDir, sizeOption):

    # -----------------------------------------------------------------------------
    # Configuration
    # -----------------------------------------------------------------------------

    data_to_process = {
        "velMagnitude": {
            "scalarRange": [0.0, 6.0],
            "contours": [5, 7, 8],
        },
        "helicity": {
            "scalarRange": [-10000, 10000],
            "contours": [ -5000, 5000 ]
        }
    }

    resolution = 500

    #phis = [ float(r) for r in range(0, 360, 90)]
    #thetas = [ 0.0, 55.0 ]
    phis = [ float(r) for r in range(0, 360, 20)]
    thetas = [-80.0, -60.0, -30.0, 0.0, 30.0, 60.0, 80.0]

    centerOfRotation = {
        'shortFat': [0.03210659957176176, 0.03210659957176176, 2.08050000667572],
        'longFat': [0.1284263964244019, 0.1284263964244019, 2.2200000286102295],
        'longSkinny': [0.0064213199143523525, 0.0064213199143523525, 2.097312331199646]
    }

    rotation_axis = [0.0, 0.0, 1.0]

    distance = {
        'shortFat': 0.25,
        'longFat': 1.16,
        'longSkinny': 0.26
    }

    transformDims = {
        'shortFat': [5, 5, 1],
        'longFat': [20, 20, 1],
        'longSkinny': [1, 1, 1]
    }

    streamRes = {
        'shortFat': 30,
        'longFat': 30,
        'longSkinny': 30
    }

    streamLength = {
        'shortFat': 0.15,
        'longFat': 1.5,
        'longSkinny': 0.099899
    }

    tubeRadius = {
        'shortFat': 0.006,
        'longFat': 0.03,
        'longSkinny': 0.0025
    }

    seedLinePoints = {
        'shortFat': {
            'point1': [0.024308765645997044, 0.0047357203659974655, 2.083430515514084],
            'point2': [0.03917303628210819, 0.05936205001834852, 2.083314811121571]
        },
        'longFat': {
            'point1': [0.09957288686644243, 0.01765718560781814, 2.103601091698531],
            'point2': [0.16402243492110558, 0.24191479837166693, 2.090316776204166]
        },
        'longSkinny': {
            'point1': [0.004460199538914286, -1.9721305484628665e-05, 2.0837601391639593],
            'point2': [0.0084706015358675, 0.012500996772009757, 2.084043910210548]
        }
    }

    # -----------------------------------------------------------------------------
    # Input data definition
    # -----------------------------------------------------------------------------

    rodPaths = {
        'shortFat': 'rodShortest.vtk',
        'longFat': 'rodLong.vtk',
        'longSkinny': 'rodShorter.vtk'
    }

    rodPath = os.path.join(inputDir, rodPaths[sizeOption])
    blockFinsPath = os.path.join(inputDir, 'firstBlockFin.vtk')

    filePattern = {
        'shortFat': 'singlepin_shortest_%d.vtk',
        'longFat': 'singlepin_%d.vtk',
        'longSkinny': 'singlepin_clipped_%d.vtk'
    }

    fileTimes = range(13) # all timesteps
    #fileTimes = [ 12 ]

    fileNames = [ os.path.join(inputDir, (filePattern[sizeOption] % time)) for time in fileTimes ]

    # -----------------------------------------------------------------------------
    # Pipeline definition
    # -----------------------------------------------------------------------------

    # Rod Core
    rodCore = LegacyVTKReader(FileNames=[rodPath])

    # create a new 'Transform'
    rodTransform = Transform(Input=rodCore)
    rodTransform.Transform = 'Transform'
    rodTransform.Transform.Scale = transformDims[sizeOption]

    # Phony calculator to give a "value" to render by
    rodSolidCalc = Calculator(Input=rodTransform)
    rodSolidCalc.ResultArrayName = 'rodSolid'
    rodSolidCalc.Function = '1'

    extractRodSurface = ExtractSurface( Input = rodSolidCalc )
    rodSurfaceNormals = GenerateSurfaceNormals( Input = extractRodSurface )

    # Block Fins
    blockFins = LegacyVTKReader(FileNames=[blockFinsPath])

    # create a new 'Transform'
    blockTransform = Transform(Input=blockFins)
    blockTransform.Transform = 'Transform'
    blockTransform.Transform.Scale = transformDims[sizeOption]

    # Another phony calculator
    blockSolidCalc = Calculator(Input=blockTransform)
    blockSolidCalc.ResultArrayName = 'blockSolid'
    blockSolidCalc.Function = '2'

    extractBlockSurface = ExtractSurface(Input=blockSolidCalc)
    blockFinsSurfaceNormals = GenerateSurfaceNormals(Input=extractBlockSurface)

    # Data pipeline
    reader = LegacyVTKReader(FileNames=fileNames)

    # create a new 'Transform'
    readerTransform = Transform(Input=reader)
    readerTransform.Transform = 'Transform'
    readerTransform.Transform.Scale = transformDims[sizeOption]

    # create a new 'Calculator'
    calculator1 = Calculator(Input=readerTransform)
    calculator1.ResultArrayName = 'velMagnitude'
    calculator1.Function = 'mag(vel)'

    # Generate iso contours
    contours = {}
    for field in data_to_process:
        contours[field] = []
        for isoValue in data_to_process[field]['contours']:
            contours[field].append(Contour(Input = calculator1,
                                           PointMergeMethod = "Uniform Binning",
                                           ContourBy = field,
                                           Isosurfaces = [isoValue],
                                           ComputeScalars = 1))



    # -----------------------------------------------------------------------------
    # Pre-calculate ranges
    # -----------------------------------------------------------------------------
    globalRanges = {
        'helicity': [ 10000000, -10000000 ],
        'vel': [ 10000000, -10000000 ],
        'vorticity': [ 10000000, -10000000 ]
    }

    for time in fileTimes:
        t = int(time)
        print '  timestep ',t
        reader.UpdatePipeline(t)
        pdi = reader.GetPointDataInformation()

        for key in globalRanges.keys():
            globalRanges[key] = updateGlobalRange(pdi.GetArray(key).GetRange(), globalRanges[key])

    print 'Discovered global ranges:'
    print globalRanges

    # -----------------------------------------------------------------------------
    # Composite generator
    # -----------------------------------------------------------------------------

    fng = wx.FileNameGenerator(outputDir, '{time}/{theta}/{phi}/{filename}')

    camera_handler = wx.ThreeSixtyCameraHandler(fng,
                                                None,
                                                phis,
                                                thetas,
                                                centerOfRotation[sizeOption],
                                                rotation_axis,
                                                distance[sizeOption])

    iso_color_array = [
        ('VALUE', 'helicity'),
        ('VALUE', 'vel'),
        ('VALUE', 'vorticity'),
        ('VALUE', 'nX'),
        ('VALUE', 'nY'),
        ('VALUE', 'nZ')
    ]

    luts = {
        "helicity": ["point", "helicity", 0, globalRanges['helicity']],
        "vel": ["point", "vel", -1, globalRanges['vel']],
        "vorticity": ["point", "vorticity", -1, globalRanges['vorticity']],
        "rodSolid": ["point", "rodSolid", 0, [1.0, 1.0]],
        "blockSolid": ["point", "blockSolid", 0, [2.0, 2.0]],
        'nX': ['point', 'Normals', 0, (-1,1)],
        'nY': ['point', 'Normals', 1, (-1,1)],
        'nZ': ['point', 'Normals', 2, (-1,1)]
    }

    filters = []
    filters_description = []
    color_by = []

    filters.append(rodSurfaceNormals)
    filters_description.append({'name': 'Rod'})
    color_by.append([
        ('VALUE', 'rodSolid'),
        ('VALUE', 'nX'),
        ('VALUE', 'nY'),
        ('VALUE', 'nZ')
    ])

    filters.append(blockFinsSurfaceNormals)
    filters_description.append({'name': 'Block/Fins'})
    color_by.append([
        ('VALUE', 'blockSolid'),
        ('VALUE', 'nX'),
        ('VALUE', 'nY'),
        ('VALUE', 'nZ')
    ])

    for field in contours:
        for iso in contours[field]:
            filters_description.append({'name': field[0] + "=" + str(iso.Isosurfaces[0]), 'parent': "Contour by %s" % field})
            filters.append(iso)
            color_by.append(iso_color_array)

    groupNumber = 1

    ### Create streamlines

    # create a new 'Calculator'
    velScaler = Calculator(Input=readerTransform)
    velScaler.ResultArrayName = 'scaledVel'
    functionString = '(%d*vel_X*iHat)+(%d*vel_Y*jHat)+(vel_Z*kHat)' % (transformDims[sizeOption][0], transformDims[sizeOption][1])
    velScaler.Function = functionString

    # create a new 'Stream Tracer'
    pointPair = seedLinePoints[sizeOption]
    streamTracer = StreamTracer(Input=velScaler,
                                SeedType='High Resolution Line Source')
    streamTracer.Vectors = ['POINTS', 'scaledVel']
    streamTracer.MaximumStreamlineLength = streamLength[sizeOption]

    # init the 'High Resolution Line Source' selected for 'SeedType'
    streamTracer.SeedType.Point1 = pointPair['point1']
    streamTracer.SeedType.Point2 = pointPair['point2']
    streamTracer.SeedType.Resolution = streamRes[sizeOption]

    # create a new 'Tube'
    tube = Tube(Input=streamTracer)
    tube.Scalars = ['POINTS', 'AngularVelocity']
    tube.Vectors = ['POINTS', 'Normals']
    tube.Radius = tubeRadius[sizeOption]
    tube.VaryRadius = 'By Vector'
    tube.RadiusFactor = 0.1

    # create a new 'Extract Surface'
    extractTubeSurface = ExtractSurface(Input=tube)

    # create a new 'Calculator'
    calculator = Calculator(Input=extractTubeSurface)
    calculator.ResultArrayName = 'Normals'
    calculator.Function = 'TubeNormals'

    filters.append(calculator)
    filters_description.append({'name': 'Streamlines'})
    color_by.append(iso_color_array)


    # Create the image exporter
    exporter = wx.CompositeImageExporter(fng,
                                         filters,
                                         color_by,
                                         luts,
                                         camera_handler,
                                         [resolution,resolution],
                                         filters_description,
                                         format='png') #, 0, 0)

    # Customize some view properties
    exporter.view.Background = [1.0, 1.0, 1.0]
    exporter.view.OrientationAxesVisibility = 0
    exporter.view.CenterAxesVisibility = 0

    # -----------------------------------------------------------------------------
    # Perform analysis
    # -----------------------------------------------------------------------------

    for t in fileTimes:
        time = int(t)
        GetAnimationScene().TimeKeeper.Time = float(time)
        fng.update_active_arguments(time=time)
        exporter.UpdatePipeline(time)


###############################################################################
# Main script entry point
###############################################################################
if __name__ == "__main__":
    description = "Python script to generate dynamic lighting cinema dataset for DOE NE"

    parser = argparse.ArgumentParser(description=description)

    parser.add_argument("--inputdir", type=str, default="", help="Path to directory where input data files exist")
    parser.add_argument("--outputdir", type=str, default="", help="Path to directory where cinema dataset should be written")
    parser.add_argument("--sizeopt", type=str, default="", help="One of 'shortFat', 'longFat', or 'longSkinny'")

    args = parser.parse_args()

    doProcessing(args.inputdir, args.outputdir, args.sizeopt)
