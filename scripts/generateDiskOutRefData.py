

from paraview import simple, data_exploration

def generateData(datasetPath) :
    resolution = 500
    center_of_rotation = [0.0, 0.0, 0.0]
    rotation_axis = [0.0, 0.0, 1.0]
    distance = 150.0

    disk_out_refex2 = ExodusIIReader(FileName=[datasetPath])
    disk_out_refex2.PointVariables = ['Temp', 'V', 'Pres', 'AsH3', 'GaMe3', 'CH4', 'H2']
    disk_out_refex2.NodeSetArrayStatus = []
    disk_out_refex2.SideSetArrayStatus = []
    disk_out_refex2.ElementBlocks = ['Unnamed block ID: 1 Type: HEX8']

    filters = [ disk_out_refex2 ]
    filters_description = [ {'name': 'disk_out_ref'} ]

    calculator1 = Calculator(Input=disk_out_refex2)
    calculator1.ResultArrayName = 'VMagnitude'
    calculator1.Function = 'mag(V)'

    simple.UpdatePipeline()

    color_type = [
        ('SOLID_COLOR', [0.8,0.8,0.8])
        ]
    color_by = [ color_type ]

    color_type = [
        ('VALUE', "VMagnitude"),
        ('VALUE', "Pres"),
        ('VALUE', "Temp"),
        ('VALUE', "vnX"),
        ('VALUE', "vnY"),
        ('VALUE', "vnZ")
    ]

    pdi = calculator1.GetPointDataInformation()

    luts = {
        "VMagnitude": ["point", "VMagnitude", 0, pdi.GetArray("VMagnitude").GetRange()],
        "Pres": ["point", "Pres", 0, pdi.GetArray("Pres").GetRange()],
        "Temp": ["point", "Temp", 0, pdi.GetArray("Temp").GetRange()],
        "vnX": ["point", "Normals", 0, (-1,1)],
        "vnY": ["point", "Normals", 1, (-1,1)],
        "vnZ": ["point", "Normals", 2, (-1,1)]
    }

    contour_values = [ 300.0, 600.0, 900.0 ]

    for iso_value in contour_values:
        contour = simple.Contour(
            Input=calculator1,
            PointMergeMethod="Uniform Binning",
            ContourBy = ['POINTS', 'Temp'],
            Isosurfaces = [iso_value],
            ComputeScalars = 1)
        #just to get cell aligned normals for testing
        filters.append( contour )
        color_by.append( color_type )
        filters_description.append( {'name': 'iso=%s' % str(iso_value), 'parent': "Contour by temperature"} )

    title = "Composite Dynamic Rendering - Disk Out Ref"
    description = "A sample dataset for dynamic rendering"
    analysis = AnalysisManager( '/tmp/wavelet', title, description)

    id = 'composite'
    title = '3D composite'
    description = "contour set"
    analysis.register_analysis(id, title, description, '{theta}/{phi}/{filename}', CompositeImageExporter.get_data_type()+"-light")
    fng = analysis.get_file_name_generator(id)

    camera_handler = ThreeSixtyCameraHandler(
        fng,
        None,
        [ float(r) for r in range(0, 360, 30) ],
        [ float(r) for r in range(-60, 61, 30) ],
        center_of_rotation,
        rotation_axis,
        distance)

    exporter = CompositeImageExporter(
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

    """
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
    tube1.Scalars = ['POINTS', 'VMagnitude']
    tube1.Vectors = ['POINTS', 'Normals']
    tube1.Radius = 0.10474160957336426

    # create a new 'Clip'
    clip1 = Clip(Input=calculator1)
    clip1.ClipType = 'Plane'
    clip1.Scalars = ['POINTS', 'VMagnitude']
    clip1.Value = 11.209410083552676
    clip1.InsideOut = 1

    # init the 'Plane' selected for 'ClipType'
    clip1.ClipType.Origin = [0.0, 0.0, 0.07999992370605469]
    clip1.ClipType.Normal = [0.7, 0.0, -0.4]

    # create a new 'Contour'
    contour1 = Contour(Input=calculator1)
    contour1.ContourBy = ['POINTS', 'Temp']
    contour1.ComputeScalars = 1
    contour1.Isosurfaces = [300.0, 600.0, 900.0]
    contour1.PointMergeMethod = 'Uniform Binning'
    """


if __name__ == "__main__":

    description = "Python script to generate a Cinema dataset from disk_out_ref.ex2"

    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("-i", "--inputfile", default=None,
                        help="Fully qualified path to disk_out_ref.ex2 data file")
    parser.add_argument("-o", "--outputdirectory", default=os.getcwd(),
                        help="Fully qualified path to output directory")
    args = parser.parse_args()

    generateCanDataset(args.inputfile)
