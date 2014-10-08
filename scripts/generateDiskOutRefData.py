
import argparse, os
from paraview import simple
from paraview import data_exploration as wx

try:
    simple.LoadDistributedPlugin('RGBZView', ns=globals())
except:
    print 'Unable to load RGBZView plugin'

def generateData(datasetPath, outputDir) :

    if not os.path.exists(outputDir):
        os.makedirs(outputDir)

    resolution = 500
    center_of_rotation = [0.0, 0.0, 0.0]
    rotation_axis = [0.0, 0.0, 1.0]
    distance = 45.0

    disk_out_refex2 = simple.ExodusIIReader(FileName=[datasetPath])
    disk_out_refex2.PointVariables = ['Temp', 'V', 'Pres', 'AsH3', 'GaMe3', 'CH4', 'H2']
    disk_out_refex2.NodeSetArrayStatus = []
    disk_out_refex2.SideSetArrayStatus = []
    disk_out_refex2.ElementBlocks = ['Unnamed block ID: 1 Type: HEX8']

    filters = []
    filters_description = []

    calculator1 = simple.Calculator(Input=disk_out_refex2)
    calculator1.ResultArrayName = 'Velocity'
    calculator1.Function = 'mag(V)'

    simple.UpdatePipeline()

    color_by = []

    #
    # COMPLAINT
    #
    # As a user of this system, I'd like not to have to specify that I need
    # 'nX', 'nY', and 'nZ' when I add a colorby of type "VALUE".  Instead,
    # I'd like it to figure out that I'm going to need normals for that kind
    # of rendering and add them for me.
    #
    color_type = [
        ('VALUE', "Velocity"),
        ('VALUE', "Pres"),
        ('VALUE', "Temp"),
        ('VALUE', "nX"),
        ('VALUE', "nY"),
        ('VALUE', "nZ")
    ]

    pdi = calculator1.GetPointDataInformation()

    #
    # COMPLAINT
    #
    # Ditto the above complaint here.
    #
    luts = {
        "Velocity": ["point", "Velocity", 0, pdi.GetArray("Velocity").GetRange()],
        "Pres": ["point", "Pres", 0, pdi.GetArray("Pres").GetRange()],
        "Temp": ["point", "Temp", 0, pdi.GetArray("Temp").GetRange()],
        "nX": ["point", "Normals", 0, (-1,1)],
        "nY": ["point", "Normals", 1, (-1,1)],
        "nZ": ["point", "Normals", 2, (-1,1)]
    }

    contour_values = [ 300.0, 600.0, 900.0 ]

    for iso_value in contour_values:
        contour = simple.Contour(
            Input=calculator1,
            PointMergeMethod="Uniform Binning",
            ContourBy = ['POINTS', 'Temp'],
            Isosurfaces = [iso_value],
            ComputeScalars = 1)

        # Add this isocontour to my list of filters
        filters.append( contour )
        color_by.append( color_type )
        filters_description.append( {'name': 'iso=%s' % str(iso_value), 'parent': "Contour by temperature"} )

    # create a new 'Stream Tracer'
    streamTracer1 = StreamTracer(Input=calculator1,
        SeedType='High Resolution Line Source')
    streamTracer1.Vectors = ['POINTS', 'V']
    streamTracer1.MaximumStreamlineLength = 20.15999984741211

    # init the 'High Resolution Line Source' selected for 'SeedType'
    streamTracer1.SeedType.Point1 = [-5.75, -5.75, -10.0]
    streamTracer1.SeedType.Point2 = [5.75, 5.75, 10.15999984741211]

    # create a new 'Tube'
    tube1 = Tube(Input=streamTracer1)
    tube1.Scalars = ['POINTS', 'Velocity']
    tube1.Vectors = ['POINTS', 'Normals']
    tube1.Radius = 0.10474160957336426

    #
    # COMPLAINT
    #
    # Here, because the "Normals" field of the tube filter is all funky
    # (directions seem to change at the seed points, when integration
    # proceeded in both directions), I actually needed to play around
    # with ParaView until I found a filter that would get me nice
    # looking normals.  Then, that filter didn't have a "Normals" field,
    # so I had to use a calculator to create it.  Not super nice from a
    # users perspective.
    #
    surfaceVectors1 = SurfaceVectors(Input=tube1)
    surfaceVectors1.SelectInputVectors = ['POINTS', 'TubeNormals']
    calculator2 = simple.Calculator(Input=surfaceVectors1)
    calculator2.ResultArrayName = 'Normals'
    calculator2.Function = 'TubeNormals'

    # Now add the stream tubes to the filters list
    filters.append(calculator2);
    color_by.append(color_type);
    filters_description.append({'name': 'Stream Tubes'})

    # create a new 'Clip'
    clip1 = Clip(Input=calculator1)
    clip1.ClipType = 'Plane'
    clip1.Value = 11.209410083552676
    clip1.InsideOut = 1

    # init the 'Plane' selected for 'ClipType'
    clip1.ClipType.Origin = [0.0, 0.0, 0.07999992370605469]
    clip1.ClipType.Normal = [0.7, 0.0, -0.4]

    #
    # COMPLAINT
    #
    # Here again, the output of the clip filter doesn't have a "Normals"
    # field on points, so I have to do some funky stuff to get what I
    # need.  It would be nice if this could be figured out for me
    # somehow.
    #
    extractSurface1 = ExtractSurface(Input=clip1)
    generateSurfaceNormals1 = GenerateSurfaceNormals(Input=extractSurface1)

    # Now add the first clip to the filters list
    filters.append(generateSurfaceNormals1);
    color_by.append(color_type);
    filters_description.append({'name': 'Clip One'})

    # create a new 'Clip'
    clip2 = Clip(Input=calculator1)
    clip2.ClipType = 'Plane'
    clip2.Value = 11.209410083552676
    clip2.InsideOut = 0

    # init the 'Plane' selected for 'ClipType'
    clip2.ClipType.Origin = [0.0, 0.0, 0.07999992370605469]
    clip2.ClipType.Normal = [0.7, 0.0, -0.4]

    #
    # COMPLAINT
    #
    # Ditto the above complaint here.
    #
    extractSurface2 = ExtractSurface(Input=clip2)
    generateSurfaceNormals2 = GenerateSurfaceNormals(Input=extractSurface2)

    # Now add the second clip to the filters list
    filters.append(generateSurfaceNormals2);
    color_by.append(color_type);
    filters_description.append({'name': 'Clip Two'})

    title = "Composite Dynamic Rendering - Disk Out Ref"
    description = "A sample dataset for dynamic rendering"
    analysis = wx.AnalysisManager(outputDir, title, description)

    id = 'composite'
    title = '3D composite'
    description = "contour set"
    analysis.register_analysis(id, title, description, '{theta}/{phi}/{filename}', wx.CompositeImageExporter.get_data_type()+"-light")
    fng = analysis.get_file_name_generator(id)

    camera_handler = wx.ThreeSixtyCameraHandler(
        fng,
        None,
        [ float(r) for r in range(0, 360, 30) ],
        [ float(r) for r in range(-60, 61, 60) ],
        center_of_rotation,
        rotation_axis,
        distance)

    exporter = wx.CompositeImageExporter(
        fng,
        filters,
        color_by,
        luts,
        camera_handler,
        [resolution,resolution],
        filters_description,
        0, 0, 'png')
    exporter.set_analysis(analysis)

    analysis.begin()
    exporter.UpdatePipeline(0)
    analysis.end()


if __name__ == "__main__":

    description = "Python script to generate a Cinema dataset from disk_out_ref.ex2"

    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("-i", "--inputfile", default=None,
                        help="Fully qualified path to disk_out_ref.ex2 data file")
    parser.add_argument("-o", "--outputdirectory", default=os.getcwd(),
                        help="Fully qualified path to output directory")
    args = parser.parse_args()

    generateData(args.inputfile, args.outputdirectory)
